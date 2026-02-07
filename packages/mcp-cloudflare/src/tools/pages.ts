import { z } from "zod";

import { cfFetch, cfFetchWithInfo, getAccountId } from "../client.js";
import {
  errorResult,
  formatError,
  jsonResult,
  paginationSchema,
  projectNameSchema,
} from "../utils/validation.js";

interface PagesProject {
  id: string;
  name: string;
  subdomain: string;
  domains: string[];
  created_on: string;
  production_branch: string;
  latest_deployment?: {
    id: string;
    url: string;
    created_on: string;
    environment: string;
  };
}

interface Deployment {
  id: string;
  url: string;
  environment: string;
  created_on: string;
  modified_on: string;
  deployment_trigger: {
    type: string;
    metadata: {
      branch: string;
      commit_hash: string;
      commit_message: string;
    };
  };
  stages: Array<{
    name: string;
    status: string;
    started_on: string;
    ended_on: string;
  }>;
}

const listProjectsSchema = paginationSchema;
const getProjectSchema = projectNameSchema;
const listDeploymentsSchema = projectNameSchema.merge(paginationSchema);
const getDeploymentSchema = projectNameSchema.extend({
  deploymentId: z.string().min(1),
});
const triggerDeploySchema = projectNameSchema.extend({
  branch: z.string().optional(),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});
const rollbackSchema = projectNameSchema.extend({
  deploymentId: z.string().min(1),
  confirm: z.boolean().optional().describe("Set to true to execute the operation"),
});

export const pagesTools = [
  {
    name: "pages_list_projects",
    description: "List all Cloudflare Pages projects in the account",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "Page number", default: 1 },
        perPage: { type: "number", description: "Results per page", default: 25 },
      },
    },
  },
  {
    name: "pages_get_project",
    description: "Get details for a specific Pages project",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "The project name" },
      },
      required: ["projectName"],
    },
  },
  {
    name: "pages_list_deployments",
    description: "List deployments for a Pages project",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "The project name" },
        page: { type: "number", description: "Page number", default: 1 },
        perPage: { type: "number", description: "Results per page", default: 25 },
      },
      required: ["projectName"],
    },
  },
  {
    name: "pages_get_deployment",
    description: "Get details for a specific deployment",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "The project name" },
        deploymentId: { type: "string", description: "The deployment ID" },
      },
      required: ["projectName", "deploymentId"],
    },
  },
  {
    name: "pages_trigger_deploy",
    description: "Trigger a new deployment for a Pages project. Requires confirm: true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "The project name" },
        branch: { type: "string", description: "Branch to deploy (optional)" },
        confirm: { type: "boolean", description: "⚠️ Set to true to trigger deployment" },
      },
      required: ["projectName"],
    },
  },
  {
    name: "pages_rollback",
    description: "Rollback to a previous deployment. Requires confirm: true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "The project name" },
        deploymentId: { type: "string", description: "The deployment ID to rollback to" },
        confirm: { type: "boolean", description: "⚠️ Set to true to execute rollback" },
      },
      required: ["projectName", "deploymentId"],
    },
  },
] as const;

export async function handlePagesTool(name: string, args: unknown) {
  try {
    const accountId = getAccountId();

    switch (name) {
      case "pages_list_projects": {
        const { page, perPage } = listProjectsSchema.parse(args);
        const { result, resultInfo } = await cfFetchWithInfo<PagesProject[]>(
          `/accounts/${accountId}/pages/projects?page=${page}&per_page=${perPage}`
        );
        return jsonResult({
          projects: result.map((p) => ({
            name: p.name,
            subdomain: p.subdomain,
            domains: p.domains,
            productionBranch: p.production_branch,
            latestDeployment: p.latest_deployment,
          })),
          pagination: resultInfo,
        });
      }

      case "pages_get_project": {
        const { projectName } = getProjectSchema.parse(args);
        const project = await cfFetch<PagesProject>(
          `/accounts/${accountId}/pages/projects/${projectName}`
        );
        return jsonResult(project);
      }

      case "pages_list_deployments": {
        const { projectName, page, perPage } = listDeploymentsSchema.parse(args);
        const { result, resultInfo } = await cfFetchWithInfo<Deployment[]>(
          `/accounts/${accountId}/pages/projects/${projectName}/deployments?page=${page}&per_page=${perPage}`
        );
        return jsonResult({
          deployments: result.map((d) => ({
            id: d.id,
            url: d.url,
            environment: d.environment,
            createdOn: d.created_on,
            branch: d.deployment_trigger?.metadata?.branch,
            commitHash: d.deployment_trigger?.metadata?.commit_hash,
            commitMessage: d.deployment_trigger?.metadata?.commit_message,
            stages: d.stages,
          })),
          pagination: resultInfo,
        });
      }

      case "pages_get_deployment": {
        const { projectName, deploymentId } = getDeploymentSchema.parse(args);
        const deployment = await cfFetch<Deployment>(
          `/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}`
        );
        return jsonResult(deployment);
      }

      case "pages_trigger_deploy": {
        const { projectName, branch, confirm } = triggerDeploySchema.parse(args);

        // Get project info for preview
        const project = await cfFetch<PagesProject>(
          `/accounts/${accountId}/pages/projects/${projectName}`
        );

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "⚠️ This will trigger a NEW DEPLOYMENT. Review and call again with confirm: true to execute.",
            preview: {
              action: "TRIGGER DEPLOYMENT",
              project: projectName,
              branch: branch || project.production_branch,
              domains: project.domains,
              subdomain: project.subdomain,
              currentDeployment: project.latest_deployment
                ? {
                    id: project.latest_deployment.id,
                    url: project.latest_deployment.url,
                    createdOn: project.latest_deployment.created_on,
                  }
                : null,
            },
            toExecute: { projectName, branch, confirm: true },
          });
        }

        const body = branch ? { branch } : {};
        const deployment = await cfFetch<Deployment>(
          `/accounts/${accountId}/pages/projects/${projectName}/deployments`,
          {
            method: "POST",
            body: JSON.stringify(body),
          }
        );
        return jsonResult({
          message: "✅ Deployment triggered successfully",
          deployment: {
            id: deployment.id,
            url: deployment.url,
            environment: deployment.environment,
          },
        });
      }

      case "pages_rollback": {
        const { projectName, deploymentId, confirm } = rollbackSchema.parse(args);

        // Get project and target deployment info for preview
        const project = await cfFetch<PagesProject>(
          `/accounts/${accountId}/pages/projects/${projectName}`
        );
        const targetDeployment = await cfFetch<Deployment>(
          `/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}`
        );

        if (!confirm) {
          return jsonResult({
            status: "CONFIRMATION_REQUIRED",
            message: "⚠️ This will ROLLBACK to a previous deployment. Review and call again with confirm: true to execute.",
            preview: {
              action: "ROLLBACK DEPLOYMENT",
              project: projectName,
              domains: project.domains,
              currentDeployment: project.latest_deployment
                ? {
                    id: project.latest_deployment.id,
                    url: project.latest_deployment.url,
                    createdOn: project.latest_deployment.created_on,
                  }
                : null,
              rollbackTarget: {
                id: targetDeployment.id,
                url: targetDeployment.url,
                createdOn: targetDeployment.created_on,
                branch: targetDeployment.deployment_trigger?.metadata?.branch,
                commitHash: targetDeployment.deployment_trigger?.metadata?.commit_hash,
                commitMessage: targetDeployment.deployment_trigger?.metadata?.commit_message,
              },
            },
            toExecute: { projectName, deploymentId, confirm: true },
          });
        }

        const deployment = await cfFetch<Deployment>(
          `/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}/rollback`,
          { method: "POST" }
        );
        return jsonResult({
          message: "✅ Rollback initiated successfully",
          deployment: {
            id: deployment.id,
            url: deployment.url,
            environment: deployment.environment,
          },
        });
      }

      default:
        return errorResult(`Unknown pages tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
