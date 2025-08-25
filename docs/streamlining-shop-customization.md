# Opportunities to Streamline Shop Customization

Managing environment variables after scaffolding requires manual cleanup and a separate validation step. Users must replace placeholder secrets in `.env` and run `pnpm validate-env` to ensure the file is complete.

Several improvements could simplify this workflow:

- **Auto-generate provider templates** – generate starter `.env` snippets for each selected payment or shipping provider so required keys are clear.
- **Validate during the wizard** – check formats and presence of required variables as the wizard collects them instead of relying on a follow-up script.
- **Retrieve secrets from external vaults** – support fetching values from secret managers like 1Password or Vault to avoid pasting sensitive data.

Implementing these changes would reduce post-scaffold steps and make shop setup smoother for developers.
