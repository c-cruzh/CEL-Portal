# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.admin.spec.ts >> admin allowlist >> invalid domain shape is rejected with structured error
- Location: tests/api.admin.spec.ts:35:3

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:8080
Call log:
  - → POST http://localhost:8080/api/admin/allowed-domains
    - user-agent: Playwright/1.60.0 (x64; ubuntu 24.04) node/24.13
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - x-e2e-user-email: camila@c2labs.ai
    - x-e2e-user-name: camila
    - x-e2e-secret: e7bfe377bb0ce6cf6d80eb2140fb2db3e99ed871e1a17a788bbf6df00a26fa3f
    - x-e2e-admin: 1
    - content-type: application/json
    - content-length: 28

```