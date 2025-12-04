Type: Contract
Status: Canonical
Domain: Users
Last-reviewed: 2025-12-02

Primary code entrypoints:
- packages/auth/**
- packages/platform-core/src/users/*

# Users

## User Model
The `User` Prisma model defines:
- `id` – unique identifier.
- `email` – unique email address.
- `passwordHash` – hashed password.
- `role` – role string (`customer` by default).
- `resetToken` – optional token for password resets.
- `resetTokenExpiresAt` – expiry timestamp for the reset token.
- `emailVerified` – whether the email has been verified.

## Public API
### `createUser`
Creates a new user.
- **Params:** `id`, `email`, `passwordHash`, optional `role`, optional `emailVerified`.
- **Returns:** the created `User` record.

### `setResetToken`
Associates a password reset token with a user.
- **Params:** `id`, token string or `null`, expiry `Date` or `null`.
- **Returns:** `void`.

### `getUserByResetToken`
Fetches a user whose reset token matches and is not expired.
- **Params:** token string.
- **Returns:** the matching `User`.
- **Throws:** `Error` if no user found or token expired.

### `updatePassword`
Updates a user's password hash.
- **Params:** `id`, new `passwordHash`.
- **Returns:** `void`.

### `verifyEmail`
Marks a user's email as verified.
- **Params:** `id`.
- **Returns:** `void`.

## Error Cases
- Attempting to create a user with an existing email violates the unique constraint.
- `getUserByResetToken` throws if the token is missing or expired.
- Updates (`setResetToken`, `updatePassword`, `verifyEmail`) fail if the user `id` does not exist.

## Usage Example
```ts
import {
  createUser,
  setResetToken,
  getUserByResetToken,
  updatePassword,
  verifyEmail,
} from "@acme/platform-core/users";

// create a user
const user = await createUser({
  id: "user_1",
  email: "alice@example.com",
  passwordHash: "hash",
});

// set a reset token
await setResetToken(user.id, "token123", new Date(Date.now() + 3600_000));

// look up by reset token
const resetUser = await getUserByResetToken("token123");

// update password
await updatePassword(resetUser.id, "newhash");
await setResetToken(resetUser.id, null, null);

// verify email
await verifyEmail(resetUser.id);
```
