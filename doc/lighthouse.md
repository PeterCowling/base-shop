# Lighthouse Audits

This project uses the `lighthouse` CLI to verify performance on the checkout flow.

## Installation

Install Lighthouse as a dev dependency:

```bash
pnpm add -D lighthouse
```

## Running the audit

1. Build and start the app in production mode:

   ```bash
   pnpm build && pnpm start
   ```

   The app will be served on <http://localhost:3000>.

2. In another terminal run:

   ```bash
   pnpm run lh:checkout
   ```

   This command runs Lighthouse against `/en/checkout` using headless Chrome and opens the report in your browser.

The resulting performance score should be **90 or higher** to satisfy milestone **M6**.
