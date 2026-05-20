import { useState, useMemo } from "react";
import {
  useGetMe,
  useListTeamMembers,
  useGetTeamSummary,
  useAdminUpdateMember,
  useListInvitations,
  useCreateInvitation,
  useRevokeInvitation,
  useResendInvitation,
  useListAdminAuditLog,
  useListAdminRoles,
  useUpdateRole,
  useListNotificationRecipients,
  useAddNotificationRecipient,
  useDeleteNotificationRecipient,
  useTestNotificationRecipients,
  useListNotificationLog,
  getListNotificationRecipientsQueryKey,
  getListNotificationLogQueryKey,
  getListInvitationsQueryKey,
  getListAdminAuditLogQueryKey,
  getListAdminRolesQueryKey,
  getListTeamMembersQueryKey,
  getGetTeamSummaryQueryKey,
  ApiError,
  type NotificationLogEntry,
  type Member,
  type Invitation,
  type AdminAuditLogEntry,
  type AdminRole,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ROLES } from "@/lib/projectContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DocsViewer } from "@/components/DocsViewer";

// Mapping uncertainty against the original RACI in the project PRD. The
// original document groups responsibilities by a smaller, broader set of
// archetypes (Consultora IA, Líder Hidrología/PM, DevOps, Data/Backend,
// SIG, Hidrólogo Operativo, Stakeholder). The 12 portal roles split some
// of those archetypes into finer-grained labels, so a human (Kevin) needs
// to confirm each split before we treat the mapping as authoritative.
const ROLES_REQUIRING_HUMAN_VALIDATION = new Set<string>([
  "ml_engineer",
  "data_engineer",
  "fullstack_dev",
  "qa_validation",
  "docs_training",
  "meteo_expert",
  "geospatial_expert_cel",
]);

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.data?.error || err.message;
  }
  if (err instanceof Error) return err.message;
  return "Error inesperado";
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleString("es-SV", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function Configuracion() {
  const { data: me, isLoading: isLoadingMe } = useGetMe();

  if (isLoadingMe) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const isAdmin = me?.isAdmin === true;

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-12 text-center space-y-2">
        <h1 className="text-2xl font-semibold">Acceso restringido</h1>
        <p className="text-muted-foreground">
          El Portal de Administración está disponible solo para los PM del
          piloto (actualmente Camila y Kevin). Si necesitas acceso, contacta
          a un PM.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Portal de Administración
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestión de miembros, invitaciones, roles, notificaciones y bitácora
          de auditoría. Reservado a los PM del piloto.
        </p>
      </div>

      <Tabs defaultValue="miembros" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="miembros">Miembros</TabsTrigger>
          <TabsTrigger value="invitaciones">Invitaciones</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
          <TabsTrigger value="documentacion">Documentación</TabsTrigger>
        </TabsList>

        <TabsContent value="miembros" className="space-y-6">
          <MembersSection />
        </TabsContent>
        <TabsContent value="invitaciones" className="space-y-6">
          <InvitationsSection />
        </TabsContent>
        <TabsContent value="roles" className="space-y-6">
          <RolesSection />
        </TabsContent>
        <TabsContent value="notificaciones" className="space-y-6">
          <NotificationRecipientsSection />
          <NotificationLogSection />
        </TabsContent>
        <TabsContent value="auditoria" className="space-y-6">
          <AuditLogSection />
        </TabsContent>
        <TabsContent value="documentacion" className="space-y-6">
          <DocsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Miembros
// ---------------------------------------------------------------------------

function MembersSection() {
  const { data: members, isLoading } = useListTeamMembers();
  const { data: summary } = useGetTeamSummary();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const domains = useMemo(() => {
    const set = new Set<string>();
    (members ?? []).forEach((m) => {
      const at = m.email.indexOf("@");
      if (at >= 0) set.add(m.email.slice(at + 1).toLowerCase());
    });
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (members ?? []).filter((m) => {
      if (roleFilter !== "all" && !(m.roles ?? []).includes(roleFilter)) {
        return false;
      }
      if (domainFilter !== "all") {
        const at = m.email.indexOf("@");
        const dom = at >= 0 ? m.email.slice(at + 1).toLowerCase() : "";
        if (dom !== domainFilter) return false;
      }
      if (
        q &&
        !m.email.toLowerCase().includes(q) &&
        !(m.displayName ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [members, roleFilter, domainFilter, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Miembros del piloto</CardTitle>
        <CardDescription>
          Único lugar donde se administran nombres, roles y CV de los miembros
          del equipo. La pestaña <strong>Equipo</strong> queda como directorio
          de solo lectura.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="text-xs text-muted-foreground">
            {summary.memberCount} miembros · {summary.rolesFilled}/
            {summary.totalRoles} roles cubiertos
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Buscar por nombre o correo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="all">Todos los roles</option>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="all">Todos los dominios</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                @{d}
              </option>
            ))}
          </select>
        </div>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
            No hay miembros que coincidan con los filtros.
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="border rounded-lg divide-y">
            {filtered.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {member.displayName || "Sin nombre"}
        </p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {(member.roles || []).map((roleId) => {
            const def = ROLES.find((r) => r.id === roleId);
            return (
              <Badge key={roleId} variant="secondary" className="text-[10px]">
                {def?.label || roleId}
              </Badge>
            );
          })}
          {(member.roles ?? []).length === 0 && (
            <span className="text-xs text-muted-foreground italic">
              Sin roles
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>Ingresó: {formatDateTime(member.joinedAt)}</span>
          <span>Última actividad: {formatDateTime(member.lastActivityAt)}</span>
          <span>
            CV:{" "}
            {member.hasCv && member.cv?.objectPath ? (
              <a
                href={`/api/storage${member.cv.objectPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {member.cv.fileName ?? "ver"}
              </a>
            ) : (
              "—"
            )}
          </span>
        </div>
      </div>
      <div className="shrink-0">
        <AdminEditMemberDialog member={member} />
      </div>
    </div>
  );
}

function AdminEditMemberDialog({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member.displayName || "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    member.roles || [],
  );
  const [clearCv, setClearCv] = useState(false);
  const adminUpdate = useAdminUpdateMember();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSave = async () => {
    try {
      await adminUpdate.mutateAsync({
        userId: member.id,
        data: {
          displayName: name,
          roles: selectedRoles,
          ...(clearCv ? { clearCv: true } : {}),
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getListTeamMembersQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetTeamSummaryQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getListAdminAuditLogQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getListAdminRolesQueryKey(),
        }),
      ]);
      toast({
        title: "Miembro actualizado",
        description: `Se guardaron los cambios de ${name}.`,
      });
      setOpen(false);
    } catch (err) {
      toast({
        title: "No se pudo guardar",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setName(member.displayName || "");
          setSelectedRoles(member.roles || []);
          setClearCv(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar miembro</DialogTitle>
          <DialogDescription>
            Ajusta nombre y roles asignados. Un mismo rol puede ser asumido
            por más de una persona.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Correo</Label>
            <Input value={member.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Nombre a mostrar</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-3">
            <Label>Roles asignados</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start space-x-3 p-3 border rounded-lg"
                >
                  <Checkbox
                    id={`edit-${member.id}-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={`edit-${member.id}-${role.id}`}
                      className="font-medium cursor-pointer flex items-center gap-2 flex-wrap"
                    >
                      {role.label}
                      {ROLES_REQUIRING_HUMAN_VALIDATION.has(role.id) && (
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 px-1.5 border-amber-500 text-amber-700"
                        >
                          requiere validación humana (Kevin)
                        </Badge>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>CV del miembro</Label>
            {member.hasCv && member.cv?.objectPath ? (
              <div className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                <div className="text-xs space-y-1 min-w-0">
                  <a
                    href={`/api/storage${member.cv.objectPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium block truncate"
                  >
                    {member.cv.fileName ?? "Ver CV"}
                  </a>
                  <p className="text-muted-foreground">
                    Subido el {formatDateTime(member.cv.uploadedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Checkbox
                    id={`clear-cv-${member.id}`}
                    checked={clearCv}
                    onCheckedChange={(v) => setClearCv(v === true)}
                  />
                  <Label
                    htmlFor={`clear-cv-${member.id}`}
                    className="text-xs cursor-pointer"
                  >
                    Eliminar CV al guardar
                  </Label>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Este miembro aún no ha subido su CV. La carga la hace el propio
                miembro desde su perfil.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={adminUpdate.isPending}>
            {adminUpdate.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Invitaciones
// ---------------------------------------------------------------------------

function InvitationsSection() {
  const { data: invitations, isLoading } = useListInvitations();
  const createMut = useCreateInvitation();
  const revokeMut = useRevokeInvitation();
  const resendMut = useResendInvitation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: getListInvitationsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getListAdminAuditLogQueryKey(),
      }),
    ]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    try {
      await createMut.mutateAsync({
        data: { email: trimmed, suggestedRoles: selectedRoles },
      });
      setEmail("");
      setSelectedRoles([]);
      await invalidate();
      toast({
        title: "Invitación enviada",
        description: `${trimmed} recibirá un correo con instrucciones para registrarse.`,
      });
    } catch (err) {
      toast({
        title: "No se pudo crear la invitación",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  const handleResend = async (inv: Invitation) => {
    try {
      await resendMut.mutateAsync({ id: inv.id });
      await invalidate();
      toast({ title: "Invitación reenviada", description: inv.email });
    } catch (err) {
      toast({
        title: "No se pudo reenviar",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async (inv: Invitation) => {
    try {
      await revokeMut.mutateAsync({ id: inv.id });
      await invalidate();
      toast({ title: "Invitación revocada", description: inv.email });
    } catch (err) {
      toast({
        title: "No se pudo revocar",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  const toggleRole = (id: string) =>
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invitar a un nuevo miembro</CardTitle>
          <CardDescription>
            Envía una invitación por correo. Al registrarse con ese correo, la
            persona quedará automáticamente con los roles sugeridos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Correo</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="persona@cel.gob.sv"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Roles sugeridos (se aplican al aceptar)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-start gap-2 text-sm border rounded-md p-2 cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selectedRoles.includes(r.id)}
                      onCheckedChange={() => toggleRole(r.id)}
                      className="mt-0.5"
                    />
                    <span className="flex-1">
                      <span className="font-medium">{r.label}</span>
                      {ROLES_REQUIRING_HUMAN_VALIDATION.has(r.id) && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-[9px] py-0 px-1.5 border-amber-500 text-amber-700"
                        >
                          validación humana (Kevin)
                        </Badge>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? "Enviando..." : "Enviar invitación"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitaciones existentes</CardTitle>
          <CardDescription>
            Estado de cada invitación. Al aceptarse, el sistema marca la
            invitación como <em>aceptada</em> y pre-asigna los roles
            sugeridos al nuevo miembro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {!isLoading && (!invitations || invitations.length === 0) && (
            <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
              Todavía no hay invitaciones registradas.
            </div>
          )}
          {!isLoading && invitations && invitations.length > 0 && (
            <div className="border rounded-lg divide-y">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">
                        {inv.email}
                      </p>
                      <InvitationStatusBadge status={inv.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Creada {formatDateTime(inv.createdAt)}
                      {inv.lastSentAt
                        ? ` · último envío ${formatDateTime(inv.lastSentAt)}`
                        : ""}
                      {inv.acceptedAt
                        ? ` · aceptada ${formatDateTime(inv.acceptedAt)}`
                        : ""}
                    </p>
                    {(inv.suggestedRoles ?? []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(inv.suggestedRoles ?? []).map((roleId) => {
                          const def = ROLES.find((r) => r.id === roleId);
                          return (
                            <Badge
                              key={roleId}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {def?.label || roleId}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {inv.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResend(inv)}
                        disabled={resendMut.isPending}
                      >
                        Reenviar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevoke(inv)}
                        disabled={revokeMut.isPending}
                      >
                        Revocar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function InvitationStatusBadge({ status }: { status: Invitation["status"] }) {
  if (status === "pending") return <Badge variant="secondary">Pendiente</Badge>;
  if (status === "accepted")
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
        Aceptada
      </Badge>
    );
  if (status === "revoked") return <Badge variant="destructive">Revocada</Badge>;
  return <Badge variant="outline">Expirada</Badge>;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

function RolesSection() {
  const { data: roles, isLoading } = useListAdminRoles();
  const sorted = useMemo(
    () => (roles ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [roles],
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Catálogo de roles</CardTitle>
        <CardDescription>
          12 roles del piloto, comparados con la matriz RACI original del
          PRD. Los roles marcados como <em>requiere validación humana
          (Kevin)</em> son splits del documento original que aún deben
          confirmarse. Usa las flechas para cambiar el orden de
          presentación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {!isLoading &&
          sorted.map((role, idx) => (
            <RoleRow
              key={role.id}
              role={role}
              prev={idx > 0 ? sorted[idx - 1] : undefined}
              next={idx < sorted.length - 1 ? sorted[idx + 1] : undefined}
            />
          ))}
      </CardContent>
    </Card>
  );
}

function RoleRow({
  role,
  prev,
  next,
}: {
  role: AdminRole;
  prev?: AdminRole;
  next?: AdminRole;
}) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(role.description);
  const updateMut = useUpdateRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const needsValidation = ROLES_REQUIRING_HUMAN_VALIDATION.has(role.id);

  const swapWith = async (other: AdminRole) => {
    try {
      await updateMut.mutateAsync({
        id: role.id,
        data: { sortOrder: other.sortOrder },
      });
      await updateMut.mutateAsync({
        id: other.id,
        data: { sortOrder: role.sortOrder },
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getListAdminRolesQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getListAdminAuditLogQueryKey(),
        }),
      ]);
    } catch (err) {
      toast({
        title: "No se pudo reordenar",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync({
        id: role.id,
        data: { description: desc },
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getListAdminRolesQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getListAdminAuditLogQueryKey(),
        }),
      ]);
      toast({ title: "Rol actualizado", description: role.label });
      setEditing(false);
    } catch (err) {
      toast({
        title: "No se pudo actualizar",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{role.label}</span>
            <Badge variant="secondary" className="text-[10px]">
              {role.memberCount} asignad{role.memberCount === 1 ? "o" : "os"}
            </Badge>
            {needsValidation && (
              <Badge
                variant="outline"
                className="text-[10px] border-amber-500 text-amber-700"
              >
                requiere validación humana (Kevin)
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">{role.id}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => prev && swapWith(prev)}
            disabled={!prev || updateMut.isPending}
            title="Subir"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => next && swapWith(next)}
            disabled={!next || updateMut.isPending}
            title="Bajar"
          >
            ↓
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing((v) => !v);
              setDesc(role.description);
            }}
          >
            {editing ? "Cancelar" : "Editar descripción"}
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
          />
          <Button size="sm" onClick={handleSave} disabled={updateMut.isPending}>
            {updateMut.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{role.description}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notificaciones (recipients + log)
// ---------------------------------------------------------------------------

function NotificationRecipientsSection() {
  const { data, isLoading } = useListNotificationRecipients();
  const queryClient = useQueryClient();
  const addMutation = useAddNotificationRecipient();
  const deleteMutation = useDeleteNotificationRecipient();
  const testMutation = useTestNotificationRecipients();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getListNotificationRecipientsQueryKey(),
    });
  const invalidateLog = () =>
    queryClient.invalidateQueries({
      queryKey: getListNotificationLogQueryKey(),
    });

  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync();
      void invalidateLog();
      const variant: "default" | "destructive" =
        result.status === "failed" ? "destructive" : "default";
      toast({
        title:
          result.status === "sent"
            ? "Correo de prueba enviado"
            : result.status === "no_provider"
              ? "Proveedor de correo no configurado"
              : result.status === "no_recipients"
                ? "Sin destinatarios"
                : "No se pudo enviar",
        description: `Destinatarios evaluados: ${result.recipientCount}. ${result.message}`,
        variant,
      });
    } catch (err) {
      toast({
        title: "No se pudo enviar el correo de prueba",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({
        title: "Correo inválido",
        description: "Ingresa una dirección de correo válida.",
        variant: "destructive",
      });
      return;
    }
    try {
      await addMutation.mutateAsync({ data: { email: trimmed } });
      setEmail("");
      await invalidate();
      toast({
        title: "Destinatario agregado",
        description: `${trimmed} recibirá los próximos avisos del equipo.`,
      });
    } catch (err) {
      toast({
        title: "No se pudo agregar",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (recipientEmail: string) => {
    try {
      await deleteMutation.mutateAsync({ email: recipientEmail });
      await invalidate();
      toast({
        title: "Destinatario eliminado",
        description: `${recipientEmail} dejará de recibir avisos.`,
      });
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: describeError(err),
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Destinatarios fijos de avisos</CardTitle>
            <CardDescription>
              Estos correos siempre reciben las notificaciones del equipo,
              además de los miembros registrados que no hayan desactivado los
              avisos.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testMutation.isPending}
            className="shrink-0"
          >
            {testMutation.isPending ? "Enviando..." : "Enviar prueba"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={handleAdd}
          className="flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="recipient-email">Agregar correo</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="persona@cel.gob.sv"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? "Agregando..." : "Agregar"}
          </Button>
        </form>

        <div className="border rounded-lg divide-y">
          {isLoading && (
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}
          {!isLoading && (!data || data.length === 0) && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No hay destinatarios fijos configurados.
            </div>
          )}
          {!isLoading &&
            data?.map((r) => (
              <div
                key={r.email}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{r.email}</p>
                  {r.addedBy && (
                    <p className="text-xs text-muted-foreground truncate">
                      Agregado por {r.addedBy}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(r.email)}
                  disabled={deleteMutation.isPending}
                >
                  Quitar
                </Button>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

const EVENT_LABELS: Record<string, string> = {
  member_joined: "Nuevo miembro",
  cv_uploaded: "CV actualizado",
  roles_changed: "Cambio de roles",
  invitation_sent: "Invitación enviada",
  test: "Correo de prueba",
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Enviado",
  no_provider: "Sin proveedor",
  no_recipients: "Sin destinatarios",
  failed: "Falló",
};

function StatusBadge({
  status,
}: {
  status: NotificationLogEntry["status"];
}) {
  const label = STATUS_LABELS[status] ?? status;
  if (status === "failed") return <Badge variant="destructive">{label}</Badge>;
  if (status === "sent")
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
        {label}
      </Badge>
    );
  return <Badge variant="secondary">{label}</Badge>;
}

function NotificationLogSection() {
  const { data, isLoading, refetch, isFetching } = useListNotificationLog({
    query: {
      queryKey: getListNotificationLogQueryKey(),
      refetchInterval: 30_000,
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Historial de avisos enviados</CardTitle>
            <CardDescription>
              Últimos 20 intentos de envío (eventos reales y pruebas).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0"
          >
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg divide-y">
          {isLoading && (
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          )}
          {!isLoading && (!data || data.length === 0) && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Todavía no hay envíos registrados.
            </div>
          )}
          {!isLoading &&
            data?.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 space-y-2 ${
                  entry.status === "failed" ? "bg-destructive/5" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm">
                      {EVENT_LABELS[entry.eventKind] ?? entry.eventKind}
                    </span>
                    <StatusBadge status={entry.status} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {entry.recipientCount} destinatario
                  {entry.recipientCount === 1 ? "" : "s"}
                  {entry.recipients.length > 0 && (
                    <>
                      {": "}
                      <span className="break-all">
                        {entry.recipients.slice(0, 5).join(", ")}
                        {entry.recipients.length > 5 &&
                          ` y ${entry.recipients.length - 5} más`}
                      </span>
                    </>
                  )}
                </p>
                {entry.triggeredBy && (
                  <p className="text-xs text-muted-foreground truncate">
                    Origen: {entry.triggeredBy}
                  </p>
                )}
                {entry.providerMessage && (
                  <p
                    className={`text-xs ${
                      entry.status === "failed"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {entry.providerMessage}
                  </p>
                )}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Auditoría
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, string> = {
  "member.update": "Miembro actualizado",
  "member.roles_changed": "Cambio de roles",
  "invitation.create": "Invitación creada",
  "invitation.resend": "Invitación reenviada",
  "invitation.revoke": "Invitación revocada",
  "invitation.accepted": "Invitación aceptada",
  "role.update": "Rol actualizado",
  "project_config.update": "Configuración del proyecto",
  "notification_recipient.add": "Destinatario agregado",
  "notification_recipient.remove": "Destinatario eliminado",
  "notification.test": "Correo de prueba",
};

function AuditLogSection() {
  const [actionFilter, setActionFilter] = useState<string>("");
  const [actorFilter, setActorFilter] = useState<string>("");
  const params = useMemo(
    () => ({
      ...(actionFilter ? { action: actionFilter } : {}),
      ...(actorFilter ? { actor: actorFilter } : {}),
    }),
    [actionFilter, actorFilter],
  );
  const { data, isLoading, refetch, isFetching } = useListAdminAuditLog(
    params,
    { query: { queryKey: [...getListAdminAuditLogQueryKey(), params] } },
  );

  const grouped = useMemo(
    () =>
      (data ?? []).slice().sort((a, b) => {
        const ta = new Date(a.at as unknown as string).getTime();
        const tb = new Date(b.at as unknown as string).getTime();
        return tb - ta;
      }),
    [data],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Bitácora de auditoría</CardTitle>
            <CardDescription>
              Últimas 200 acciones administrativas (alta/baja de miembros,
              invitaciones, ajustes de configuración y notificaciones).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0"
          >
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Input
            placeholder="Filtrar por correo del actor"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
          />
        </div>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {!isLoading && grouped.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
            No hay acciones que coincidan con los filtros.
          </div>
        )}
        {!isLoading && grouped.length > 0 && (
          <div className="border rounded-lg divide-y">
            {grouped.map((entry) => (
              <AuditEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AuditEntryRow({ entry }: { entry: AdminAuditLogEntry }) {
  return (
    <div className="p-3 space-y-1">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm">
            {ACTION_LABELS[entry.action] ?? entry.action}
          </span>
          {entry.actorEmail && (
            <span className="text-xs text-muted-foreground truncate">
              · {entry.actorEmail}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDateTime(entry.at)}
        </span>
      </div>
      {entry.targetId && (
        <p className="text-xs text-muted-foreground font-mono">
          {entry.targetType ?? "target"}: {entry.targetId}
        </p>
      )}
      {Object.keys(entry.payload ?? {}).length > 0 && (
        <pre className="text-[11px] bg-muted/40 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
{JSON.stringify(entry.payload, null, 2)}
        </pre>
      )}
    </div>
  );
}
