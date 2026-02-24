# XA Uploader E2E Fixtures

E2E tests generate deterministic temporary fixtures at runtime from
`apps/xa-uploader/e2e/helpers/uploaderHarness.ts`:

- temp CSV path bound via `XA_UPLOADER_PRODUCTS_CSV_PATH`
- temp PNG fixture written under `<tmp>/fixtures/sample.png`

No persistent test data is required in the repository.
