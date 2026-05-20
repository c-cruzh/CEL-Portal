# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.auth.spec.ts >> auth + test-mode bypass >> anonymous request to /me returns 401
- Location: tests/api.auth.spec.ts:5:3

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:8080
Call log:
  - → GET http://localhost:8080/api/me
    - user-agent: Playwright/1.60.0 (x64; ubuntu 24.04) node/24.13
    - accept: application/json
    - accept-encoding: gzip,deflate,br

```