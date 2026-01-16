import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

import Root from "@/root/Root";
import type { LinkDescriptor, MetaDescriptor } from "react-router";

import { RouteDataProvider } from "./router-state";
import type { ResolvedMatch } from "./route-runtime";
import type { RouteModule } from "./route-module-types";
import { routeModules } from "./route-modules";

type HeadProps = {
  meta: MetaDescriptor[];
  links: LinkDescriptor[];
};

export type RouteRendererProps = {
  matches: ResolvedMatch[];
  head: HeadProps;
};

const componentCache = new Map<string, React.ComponentType<Record<string, unknown>>>();

const getRouteComponent = (file: string): React.ComponentType<Record<string, unknown>> => {
  const cached = componentCache.get(file);
  if (cached) return cached;

  const loader = routeModules[file];
  if (!loader) {
    const Missing = () => null;
    componentCache.set(file, Missing);
    return Missing;
  }

  const Component = dynamic(
    () =>
      loader().then((mod) => {
        const routeModule = mod as RouteModule;
        return routeModule.default ?? (() => null);
      }),
    { ssr: true },
  );
  componentCache.set(file, Component);
  return Component;
};

const renderMeta = (descriptors: MetaDescriptor[]): React.ReactNode[] =>
  descriptors.map((descriptor, index) => {
    if ("title" in descriptor && typeof descriptor.title === "string") {
      return <title key={`title-${index}`}>{descriptor.title}</title>;
    }

    if ("tagName" in descriptor && descriptor.tagName === "link") {
      const { tagName: _tag, key: _key, ...rest } = descriptor as Record<string, string | undefined> & {
        tagName: string;
        key?: string;
      };
      return <link key={`link-meta-${index}`} {...rest} />;
    }

    const { tagName: _ignored, key: _key, ...rest } = descriptor as Record<string, string | undefined> & {
      tagName?: string;
      key?: string;
    };

    if ("charSet" in rest) {
      return <meta key={`meta-${index}`} charSet={rest["charSet"]} />;
    }

    return <meta key={`meta-${index}`} {...rest} />;
  });

const renderLinks = (links: LinkDescriptor[]): React.ReactNode[] =>
  links.map((link, index) => {
    const { rel, href, hrefLang } = link;
    const key = `${rel ?? "link"}-${href ?? ""}-${hrefLang ?? ""}-${index}`;
    const { key: _key, tagName: _tagName, ...rest } = link as Record<string, string | undefined> & {
      key?: string;
      tagName?: string;
    };
    return <link key={key} {...rest} />;
  });

const buildRouteTree = (matches: ResolvedMatch[]): React.ReactNode => {
  let outlet: React.ReactNode = null;
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const match = matches[i];
    if (!match) continue;
    const Component = getRouteComponent(match.file);
    outlet = (
      <RouteDataProvider key={match.id} id={match.id} data={match.data} outlet={outlet}>
        <Component />
      </RouteDataProvider>
    );
  }
  return outlet;
};

const RouteRenderer = ({ matches, head }: RouteRendererProps): React.ReactElement => {
  const content = useMemo(() => buildRouteTree(matches), [matches]);

  return (
    <>
      <Head>
        {renderMeta(head.meta)}
        {renderLinks(head.links)}
      </Head>
      <RouteDataProvider id="root" outlet={content}>
        <Root />
      </RouteDataProvider>
    </>
  );
};

export default RouteRenderer;
