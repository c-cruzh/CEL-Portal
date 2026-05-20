import { test, expect } from "@playwright/test";
import { adminApi, uniqueTag } from "./helpers";

test.describe("documents repository", () => {
  test("Paquete Maestro is present after seed", async () => {
    const api = await adminApi();
    const res = await api.get("/api/documents");
    expect(res.ok()).toBeTruthy();
    const docs = await res.json();
    expect(Array.isArray(docs)).toBe(true);
    const names = docs.map((d: { name: string }) => d.name);
    expect(names).toContain("Paquete_Maestro_Piloto_CEL.zip");
    expect(
      names.some((n: string) => n.startsWith("Anexo_Complementario_BOM")),
    ).toBe(true);
    expect(
      names.some((n: string) => n.startsWith("Alineacion_Tecnica_Contractual")),
    ).toBe(true);
    await api.dispose();
  });

  test("document folders endpoint returns the project tree", async () => {
    const api = await adminApi();
    const res = await api.get("/api/documents/folders");
    expect(res.ok()).toBeTruthy();
    const folders = await res.json();
    expect(Array.isArray(folders)).toBe(true);
    expect(folders.length).toBeGreaterThanOrEqual(3);
    await api.dispose();
  });

  test("folder lifecycle: PM can create a folder (admin allowlist also covered)", async () => {
    const api = await adminApi();
    const tag = uniqueTag();
    const label = `Carpeta E2E ${tag}`;
    const createRes = await api.post("/api/documents/folders", {
      data: { label },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = await createRes.json();
    expect(created.label).toBe(label);
    expect(created.key).toBeTruthy();

    const listRes = await api.get("/api/documents/folders");
    expect(listRes.ok()).toBeTruthy();
    const folders = await listRes.json();
    expect(
      folders.some((f: { key: string }) => f.key === created.key),
    ).toBe(true);

    // Duplicate key rejected with structured 409.
    const dupRes = await api.post("/api/documents/folders", {
      data: { label, key: created.key },
    });
    expect(dupRes.status()).toBe(409);
    await api.dispose();
  });

  test("metadata edit + preview URL: PM can rename and previews resolve to a signed URL", async () => {
    const api = await adminApi();
    const listRes = await api.get("/api/documents");
    expect(listRes.ok()).toBeTruthy();
    const docs = await listRes.json();
    const target = docs.find(
      (d: { name: string }) => d.name === "Paquete_Maestro_Piloto_CEL.zip",
    );
    expect(target, "Paquete Maestro must be present").toBeTruthy();

    const tag = uniqueTag();
    const newDesc = `E2E rename probe ${tag}`;
    const originalDesc = target.description ?? "";

    // Edit metadata (description-only — safe revert below).
    const putRes = await api.put(`/api/documents/${target.id}`, {
      data: { description: newDesc },
    });
    expect(putRes.status(), await putRes.text()).toBe(200);
    const updated = await putRes.json();
    expect(updated.description).toBe(newDesc);

    // Preview (signed download URL) without actually downloading the file.
    const dlRes = await api.get(`/api/documents/${target.id}/download`);
    expect(dlRes.ok()).toBeTruthy();
    const dl = await dlRes.json();
    expect(typeof dl.url).toBe("string");
    expect(dl.url.length).toBeGreaterThan(10);
    expect(dl.expiresAt).toBeTruthy();

    // Revert so seed data is unchanged for subsequent runs.
    const revertRes = await api.put(`/api/documents/${target.id}`, {
      data: { description: originalDesc },
    });
    expect(revertRes.ok()).toBeTruthy();
    await api.dispose();
  });

  test("upload validation: POST /documents rejects an invalid objectPath", async () => {
    const api = await adminApi();
    const res = await api.post("/api/documents", {
      data: {
        name: `e2e-${uniqueTag()}.pdf`,
        folder: "general",
        objectPath: "/not/a/valid/path",
        mimeType: "application/pdf",
        sizeBytes: 10,
      },
    });
    expect(res.status()).toBe(400);
    await api.dispose();
  });
});
