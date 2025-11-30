# Load Tests

This directory contains k6 scripts for exercising the shop service.

## Environment variables

- `SHOP_BASE_URL` – base URL of the shop service (e.g., `http://localhost:3004`).

## Session IDs

Session IDs used in the tests follow the pattern `vu-<VU>-iter-<ITER>`. Examples:

- `vu-1-iter-0`
- `vu-5-iter-3`

## Usage

Run a script with:

```sh
SHOP_BASE_URL=http://localhost:3004 k6 run rental-return.k6.js
```
