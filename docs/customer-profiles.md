Type: Contract
Status: Canonical
Domain: Customers
Last-reviewed: 2025-12-02

Primary code entrypoints:
- packages/platform-core/src/customerProfiles.ts

# Customer Profiles

## Purpose
Store and manage each customer's contact information for a shop.

## Prisma model
`CustomerProfile` includes:
- `customerId` – primary key.
- `name` – display name.
- `email` – contact address, unique per shop.

## API
```ts
import { getCustomerProfile, updateCustomerProfile } from "@acme/platform-core/customerProfiles";
```

### getCustomerProfile(customerId)
Returns the profile for the given customer. Throws **404** if the profile is missing.

### updateCustomerProfile(customerId, data)
Creates or updates a profile. Throws **409** if another profile already uses the email.

## Example requests

### Fetch a profile
```http
GET /api/account/profile
```
**200**
```json
{
  "customerId": "cust-1",
  "name": "Jane",
  "email": "jane@example.com"
}
```
**404**
```json
{ "error": "Customer profile not found" }
```

### Update a profile
```http
PATCH /api/account/profile
Content-Type: application/json

{ "name": "Jane", "email": "jane@example.com" }
```
**200**
```json
{
  "customerId": "cust-1",
  "name": "Jane",
  "email": "jane@example.com"
}
```
**409**
```json
{ "error": "Conflict: email already in use" }
```
