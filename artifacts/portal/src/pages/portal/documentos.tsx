import { useState, useMemo, useEffect } from "react";
import {
  useListDocuments,
  useListDocumentFolders,
  useCreateDocument,
  useDeleteDocument,
  getDocumentDownloadUrl,
  useListTeamMembers,
  useGetMe,
  useRequestUploadUrl,
  getListDocumentsQueryKey,
  type Document,
  type DocumentFolder,
} from "@workspace/api-client-react";
import { PHASES } from "@/lib/projectContent";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const PM_ROLE_IDS = ["pm_lead", "pm_cel"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documentos() {
  const { data: me } = useGetMe();
  const { data: folders, isLoading: foldersLoading } = useListDocumentFolders();
  const { data: members } = useListTeamMembers();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<string>("");
  const [uploaderFilter, setUploaderFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      ...(selectedFolder ? { folder: selectedFolder } : {}),
      ...(phaseFilter ? { phaseId: phaseFilter } : {}),
      ...(uploaderFilter ? { uploadedBy: uploaderFilter } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [selectedFolder, phaseFilter, uploaderFilter, search],
  );

  const { data: documents, isLoading: documentsLoading } =
    useListDocuments(queryParams);

  const isPM =
    me?.roles?.some((r: string) => PM_ROLE_IDS.includes(r)) ?? false;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Documentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Repositorio compartido del piloto. Single source of truth para POE,
            informes, datasheets, actas y presentaciones.
          </p>
        </div>
        {folders && folders.length > 0 && (
          <UploadDialog folders={folders} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              <FolderRow
                label="Todas las carpetas"
                count={documents?.length ?? 0}
                active={selectedFolder === null}
                onClick={() => setSelectedFolder(null)}
              />
              {foldersLoading && (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                </div>
              )}
              {folders?.map((f) => (
                <FolderRow
                  key={f.key}
                  label={f.label}
                  active={selectedFolder === f.key}
                  onClick={() => setSelectedFolder(f.key)}
                />
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Buscar por nombre o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={phaseFilter || "__all__"}
              onValueChange={(v) => setPhaseFilter(v === "__all__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fase (todas)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Fase (todas)</SelectItem>
                {PHASES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id} — {p.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={uploaderFilter || "__all__"}
              onValueChange={(v) =>
                setUploaderFilter(v === "__all__" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Subido por (todos)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Subido por (todos)</SelectItem>
                {members?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {documentsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground border border-dashed rounded-xl">
              No hay documentos en esta vista. Sube el primero.
            </div>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Carpeta</TableHead>
                      <TableHead>Fase</TableHead>
                      <TableHead>Versión</TableHead>
                      <TableHead>Subido por</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <DocumentRow
                        key={doc.id}
                        doc={doc}
                        folders={folders ?? []}
                        canDelete={isPM || doc.uploadedBy === me?.id}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function FolderRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-center justify-between text-sm transition-colors ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "hover:bg-muted/50 text-foreground"
      }`}
    >
      <span>{label}</span>
      {typeof count === "number" && active && (
        <Badge variant="secondary">{count}</Badge>
      )}
    </button>
  );
}

function DocumentRow({
  doc,
  folders,
  canDelete,
}: {
  doc: Document;
  folders: DocumentFolder[];
  canDelete: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const deleteMutation = useDeleteDocument();
  const folderLabel =
    folders.find((f) => f.key === doc.folder)?.label ?? doc.folder;
  const phase = PHASES.find((p) => p.id === doc.phaseId);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await getDocumentDownloadUrl(doc.id);
      if (!result?.url) throw new Error("No se pudo obtener el enlace.");
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({
        title: "No se pudo descargar",
        description:
          err instanceof Error ? err.message : "Intenta de nuevo en un momento.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `¿Eliminar "${doc.name}" (v${doc.version})? Esta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      await deleteMutation.mutateAsync({ id: doc.id });
      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      toast({ title: "Documento eliminado" });
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description:
          err instanceof Error ? err.message : "Intenta de nuevo en un momento.",
        variant: "destructive",
      });
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{doc.name}</span>
          {doc.description && (
            <span className="text-xs text-muted-foreground">
              {doc.description}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm">{folderLabel}</TableCell>
      <TableCell className="text-sm">
        {phase ? (
          <Badge variant="outline" className="text-[10px]">
            {phase.id} — {phase.shortName}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge>v{doc.version}</Badge>
      </TableCell>
      <TableCell className="text-sm">{doc.uploadedByName}</TableCell>
      <TableCell className="text-sm whitespace-nowrap">
        {new Date(doc.uploadedAt).toLocaleDateString("es-SV")}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap">
        {formatBytes(doc.sizeBytes)}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
        >
          Ver
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="ml-2"
          onClick={handleDownload}
          disabled={downloading}
        >
          Descargar
        </Button>
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-2 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Eliminar
          </Button>
        )}
        <PreviewDialog
          doc={doc}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onDownload={handleDownload}
          downloading={downloading}
        />
      </TableCell>
    </TableRow>
  );
}

function PreviewDialog({
  doc,
  open,
  onOpenChange,
  onDownload,
  downloading,
}: {
  doc: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  const { toast } = useToast();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mime = (doc.mimeType || "").toLowerCase();
  const name = doc.name.toLowerCase();
  const isPdf = mime === "application/pdf" || name.endsWith(".pdf");
  const isImage =
    mime.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(doc.name);
  const canPreview = isPdf || isImage;

  useEffect(() => {
    if (!open || !canPreview) return;
    setLoading(true);
    setError(null);
    setUrl(null);
    getDocumentDownloadUrl(doc.id)
      .then((result) => {
        if (!result?.url) throw new Error("No se pudo obtener el enlace.");
        setUrl(result.url);
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : "Intenta de nuevo en un momento.";
        setError(msg);
        toast({
          title: "No se pudo cargar la vista previa",
          description: msg,
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [open, canPreview, doc.id, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{doc.name}</DialogTitle>
        </DialogHeader>
        <div className="min-h-[60vh] flex items-center justify-center bg-muted/30 rounded-md overflow-hidden">
          {!canPreview ? (
            <div className="text-center p-8 space-y-2">
              <p className="text-foreground font-medium">
                Vista previa no disponible para este tipo de archivo
              </p>
              <p className="text-sm text-muted-foreground">
                Solo se puede previsualizar PDFs e imágenes. Usa Descargar para
                abrirlo en tu equipo.
              </p>
            </div>
          ) : loading ? (
            <div className="w-full h-[60vh] p-4 space-y-2">
              <Skeleton className="h-full w-full" />
            </div>
          ) : error ? (
            <div className="text-center p-8 text-sm text-destructive">
              {error}
            </div>
          ) : url && isPdf ? (
            <iframe
              src={url}
              title={doc.name}
              className="w-full h-[75vh] border-0 bg-white"
            />
          ) : url && isImage ? (
            <img
              src={url}
              alt={doc.name}
              className="max-h-[75vh] max-w-full object-contain"
            />
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onDownload}
            disabled={downloading}
          >
            Descargar
          </Button>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ folders }: { folders: DocumentFolder[] }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folder, setFolder] = useState<string>(folders[0]?.key ?? "");
  const [phaseId, setPhaseId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const requestUrl = useRequestUploadUrl();
  const createDoc = useCreateDocument();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reset = () => {
    setFile(null);
    setName("");
    setDescription("");
    setFolder(folders[0]?.key ?? "");
    setPhaseId("");
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: "Selecciona un archivo", variant: "destructive" });
      return;
    }
    const finalName = name.trim() || file.name;
    if (!folder) {
      toast({ title: "Selecciona una carpeta", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El máximo permitido es 50 MB.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const { uploadURL, objectPath } = await requestUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          prefix: "documents",
        },
      });

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });
      if (!uploadRes.ok) {
        throw new Error("No se pudo subir el archivo al almacenamiento.");
      }

      await createDoc.mutateAsync({
        data: {
          name: finalName,
          description: description.trim() ? description.trim() : null,
          folder,
          phaseId: phaseId || null,
          objectPath,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        },
      });

      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      toast({
        title: "Documento subido",
        description: `${finalName} se agregó al repositorio.`,
      });
      reset();
      setOpen(false);
    } catch (err) {
      toast({
        title: "Error al subir",
        description:
          err instanceof Error ? err.message : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Subir documento</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir documento al repositorio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Archivo (máx 50 MB)</Label>
            <Input
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !name.trim()) setName(f.name);
              }}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. POE de operación v1"
            />
            <p className="text-xs text-muted-foreground">
              Si subes otro archivo con el mismo nombre y carpeta, se creará una
              nueva versión.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Carpeta</Label>
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fase (opcional)</Label>
              <Select
                value={phaseId || "__none__"}
                onValueChange={(v) => setPhaseId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguna</SelectItem>
                  {PHASES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.id} — {p.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? "Subiendo…" : "Subir documento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
