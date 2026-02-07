Type: Contract
Status: Canonical
Domain: Deploy
Last-reviewed: 2025-12-02

Primary code entrypoints:
- packages/platform-core/src/createShop/*
- packages/platform-core/src/deploy/*

# Deployment adapters

`ShopDeploymentAdapter` abstracts how shop applications are scaffolded and
deployed.  The core `createShop` logic delegates to an adapter, allowing
different environments to provide their own deployment pipelines.

## Interface

Adapters implement three methods:

```ts
interface ShopDeploymentAdapter {
  scaffold(appPath: string): void;
  deploy(id: string, domain?: string): DeployShopResult;
  writeDeployInfo(id: string, info: DeployShopResult): void;
}
```

The default `CloudflareDeploymentAdapter` reproduces the existing behaviour by
invoking `npx create-cloudflare` and writing `deploy.json` in the shop data
directory.  Custom adapters can override these steps to target different hosts
or deployment workflows without touching `createShop` itself.

## Usage

`createShop` and `deployShop` accept an optional adapter parameter.  When no
adapter is provided, the Cloudflare implementation is used:

```ts
import { createShop, CloudflareDeploymentAdapter } from "@acme/platform-core/createShop";

await createShop("my-shop", options, { deploy: true }, new CloudflareDeploymentAdapter());
```

To provide an alternative deployment pipeline, implement the interface and pass
your adapter instance to `createShop`/`deployShop`.
