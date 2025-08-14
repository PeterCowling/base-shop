# Inventory validation

The `validateInventoryItems` helper normalizes inventory entries and checks
that they conform to the shared `inventoryItemSchema` rules:

- `sku` and `productId` must be non-empty strings.
- `quantity` is a required integer greater than or equal to 0.
- `lowStockThreshold` is an optional integer greater than or equal to 0.
- `variantAttributes` is a map of strings.

Use the `useInventoryValidation` hook to access the validator inside React
components.

```
const validate = useInventoryValidation();
const result = validate(items);
if (!result.success) {
  console.error(result.error);
}
```

The validation logic is tested independently from the form UI to ensure
consistency regardless of presentation.

