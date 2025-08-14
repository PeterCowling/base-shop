# Migrating bcrypt hashes to argon2

Existing users have passwords stored with bcrypt. After upgrading to argon2 all bcrypt hashes must be rehashed.

1. Detect bcrypt hashes: bcrypt hashes start with `$2`.
2. On next successful login:
   - Verify the bcrypt hash using a one-off bcrypt check.
   - Re-hash the plain password with `argon2.hash` and store the result.
3. Users who never log in can be migrated in bulk by verifying their bcrypt hash and writing back an argon2 hash.
4. Once all hashes begin with `$argon2`, remove any bcrypt fallback logic.
