# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.documents.spec.ts >> documents repository >> document folders endpoint returns the project tree
- Location: tests/api.documents.spec.ts:22:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { adminApi, uniqueTag } from "./helpers";
  3   | 
  4   | test.describe("documents repository", () => {
  5   |   test("Paquete Maestro is present after seed", async () => {
  6   |     const api = await adminApi();
  7   |     const res = await api.get("/api/documents");
  8   |     expect(res.ok()).toBeTruthy();
  9   |     const docs = await res.json();
  10  |     expect(Array.isArray(docs)).toBe(true);
  11  |     const names = docs.map((d: { name: string }) => d.name);
  12  |     expect(names).toContain("Paquete_Maestro_Piloto_CEL.zip");
  13  |     expect(
  14  |       names.some((n: string) => n.startsWith("Anexo_Complementario_BOM")),
  15  |     ).toBe(true);
  16  |     expect(
  17  |       names.some((n: string) => n.startsWith("Alineacion_Tecnica_Contractual")),
  18  |     ).toBe(true);
  19  |     await api.dispose();
  20  |   });
  21  | 
  22  |   test("document folders endpoint returns the project tree", async () => {
  23  |     const api = await adminApi();
  24  |     const res = await api.get("/api/documents/folders");
> 25  |     expect(res.ok()).toBeTruthy();
      |                      ^ Error: expect(received).toBeTruthy()
  26  |     const folders = await res.json();
  27  |     expect(Array.isArray(folders)).toBe(true);
  28  |     expect(folders.length).toBeGreaterThanOrEqual(3);
  29  |     await api.dispose();
  30  |   });
  31  | 
  32  |   test("folder lifecycle: PM can create a folder (admin allowlist also covered)", async () => {
  33  |     const api = await adminApi();
  34  |     const tag = uniqueTag();
  35  |     const label = `Carpeta E2E ${tag}`;
  36  |     const createRes = await api.post("/api/documents/folders", {
  37  |       data: { label },
  38  |     });
  39  |     expect(createRes.status(), await createRes.text()).toBe(201);
  40  |     const created = await createRes.json();
  41  |     expect(created.label).toBe(label);
  42  |     expect(created.key).toBeTruthy();
  43  | 
  44  |     const listRes = await api.get("/api/documents/folders");
  45  |     expect(listRes.ok()).toBeTruthy();
  46  |     const folders = await listRes.json();
  47  |     expect(
  48  |       folders.some((f: { key: string }) => f.key === created.key),
  49  |     ).toBe(true);
  50  | 
  51  |     // Duplicate key rejected with structured 409.
  52  |     const dupRes = await api.post("/api/documents/folders", {
  53  |       data: { label, key: created.key },
  54  |     });
  55  |     expect(dupRes.status()).toBe(409);
  56  |     await api.dispose();
  57  |   });
  58  | 
  59  |   test("metadata edit + preview URL: PM can rename and previews resolve to a signed URL", async () => {
  60  |     const api = await adminApi();
  61  |     const listRes = await api.get("/api/documents");
  62  |     expect(listRes.ok()).toBeTruthy();
  63  |     const docs = await listRes.json();
  64  |     const target = docs.find(
  65  |       (d: { name: string }) => d.name === "Paquete_Maestro_Piloto_CEL.zip",
  66  |     );
  67  |     expect(target, "Paquete Maestro must be present").toBeTruthy();
  68  | 
  69  |     const tag = uniqueTag();
  70  |     const newDesc = `E2E rename probe ${tag}`;
  71  |     const originalDesc = target.description ?? "";
  72  | 
  73  |     // Edit metadata (description-only — safe revert below).
  74  |     const putRes = await api.put(`/api/documents/${target.id}`, {
  75  |       data: { description: newDesc },
  76  |     });
  77  |     expect(putRes.status(), await putRes.text()).toBe(200);
  78  |     const updated = await putRes.json();
  79  |     expect(updated.description).toBe(newDesc);
  80  | 
  81  |     // Preview (signed download URL) without actually downloading the file.
  82  |     const dlRes = await api.get(`/api/documents/${target.id}/download`);
  83  |     expect(dlRes.ok()).toBeTruthy();
  84  |     const dl = await dlRes.json();
  85  |     expect(typeof dl.url).toBe("string");
  86  |     expect(dl.url.length).toBeGreaterThan(10);
  87  |     expect(dl.expiresAt).toBeTruthy();
  88  | 
  89  |     // Revert so seed data is unchanged for subsequent runs.
  90  |     const revertRes = await api.put(`/api/documents/${target.id}`, {
  91  |       data: { description: originalDesc },
  92  |     });
  93  |     expect(revertRes.ok()).toBeTruthy();
  94  |     await api.dispose();
  95  |   });
  96  | 
  97  |   test("upload validation: POST /documents rejects an invalid objectPath", async () => {
  98  |     const api = await adminApi();
  99  |     const res = await api.post("/api/documents", {
  100 |       data: {
  101 |         name: `e2e-${uniqueTag()}.pdf`,
  102 |         folder: "general",
  103 |         objectPath: "/not/a/valid/path",
  104 |         mimeType: "application/pdf",
  105 |         sizeBytes: 10,
  106 |       },
  107 |     });
  108 |     expect(res.status()).toBe(400);
  109 |     await api.dispose();
  110 |   });
  111 | });
  112 | 
```