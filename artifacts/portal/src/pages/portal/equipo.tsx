import { useGetTeamSummary, useListTeamMembers, useGetMe, useUpdateMyDisplayName, useSetMyRoles, useSetMyCv, getGetMeQueryKey, getListTeamMembersQueryKey, getGetTeamSummaryQueryKey, useRequestUploadUrl, useUpdateMyNotificationPrefs } from "@workspace/api-client-react";
import { ROLES } from "@/lib/projectContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Equipo() {
  const { data: me, isLoading: isLoadingMe } = useGetMe();
  const { data: members, isLoading: isLoadingMembers } = useListTeamMembers();
  const { data: summary, isLoading: isLoadingSummary } = useGetTeamSummary();

  if (isLoadingMe || isLoadingMembers || isLoadingSummary) {
    return <EquipoSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Equipo del Piloto</h1>
          <p className="text-muted-foreground mt-1">Directorio de personal y asignación de roles para el proyecto de pronóstico.</p>
        </div>
        <div className="flex items-center gap-3">
          {me && <MyProfileDialog me={me} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{summary?.memberCount || 0}</CardTitle>
            <CardDescription>Miembros Registrados</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{summary?.cvCount || 0}</CardTitle>
            <CardDescription>CVs Subidos</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{summary?.rolesFilled || 0}</CardTitle>
            <CardDescription>Roles Asignados</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{ROLES.length}</CardTitle>
            <CardDescription>Roles Totales</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Directorio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members?.map(member => (
              <MemberCard key={member.id} member={member} />
            ))}
            {members?.length === 0 && (
              <div className="col-span-2 p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                No hay miembros registrados aún.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Roles del proyecto</h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Vista inversa del directorio: cada rol con las personas que lo asumen. Un mismo rol puede ser compartido por más de una persona. Los roles con co‑liderazgo se resaltan.
          </p>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {ROLES.map(role => {
                const coverage = summary?.coverage?.find(c => c.roleId === role.id);
                const assignees = coverage?.assignees ?? [];
                const count = assignees.length;
                const shared = count > 1;
                const holders = assignees.map((name) => {
                  const m = members?.find((mm) => mm.displayName === name);
                  return { name, email: m?.email };
                });
                return (
                  <div
                    key={role.id}
                    className={`p-4 flex flex-col gap-2 ${shared ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{role.label}</span>
                      <Badge variant={count > 0 ? (shared ? "default" : "secondary") : "outline"}>
                        {count === 0
                          ? "Sin asignar"
                          : shared
                            ? `Compartido · ${count}`
                            : "1 persona"}
                      </Badge>
                    </div>
                    {count > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {holders.map((h, idx) => (
                          <div
                            key={`${role.id}-${idx}-${h.name}`}
                            className="flex items-center gap-1.5 bg-background border border-border rounded-full pl-1 pr-2.5 py-0.5"
                            title={h.email}
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-medium">
                                {h.name ? h.name.substring(0, 2).toUpperCase() : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{h.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Sin asignar</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import type { Member, MemberMe } from "@workspace/api-client-react";

function MemberCard({ member }: { member: Member }) {
  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : "?";
  
  return (
    <Card className="hover-elevate transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary">{getInitials(member.displayName || member.email)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{member.displayName || "Usuario sin nombre"}</p>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {member.roles?.map((roleId: string) => {
                const roleDef = ROLES.find(r => r.id === roleId);
                return (
                  <Badge key={roleId} variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/50 font-normal">
                    {roleDef?.label || roleId}
                  </Badge>
                );
              })}
            </div>
            {member.hasCv && member.cv?.objectPath && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <a 
                  href={`/api/storage${member.cv.objectPath}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 w-fit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/><path d="M18 21v-8a2 2 0 0 0-2-2h-4"/></svg>
                  Ver CV ({member.cv.fileName})
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MyProfileDialog({ me }: { me: MemberMe }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(me?.displayName || "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(me?.roles || []);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const updateName = useUpdateMyDisplayName();
  const setRoles = useSetMyRoles();
  const setCv = useSetMyCv();
  const requestUrl = useRequestUploadUrl();
  const updateNotificationPrefs = useUpdateMyNotificationPrefs();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const emailNotificationsEnabled = !(me?.emailNotificationsOptOut ?? false);

  const handleToggleNotifications = async (enabled: boolean) => {
    const previous = me;
    queryClient.setQueryData(getGetMeQueryKey(), (old: MemberMe | undefined) =>
      old ? { ...old, emailNotificationsOptOut: !enabled } : old
    );
    try {
      await updateNotificationPrefs.mutateAsync({ data: { emailNotificationsOptOut: !enabled } });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({
        title: enabled ? "Avisos activados" : "Avisos desactivados",
        description: enabled
          ? "Recibirás los avisos por correo del equipo."
          : "Ya no recibirás avisos por correo del equipo.",
      });
    } catch (err) {
      queryClient.setQueryData(getGetMeQueryKey(), previous);
      toast({
        title: "No se pudo actualizar",
        description: err instanceof Error ? err.message : "Intenta de nuevo en un momento.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      if (name !== me?.displayName) {
        await updateName.mutateAsync({ data: { displayName: name } });
      }
      
      const rolesChanged = selectedRoles.length !== (me?.roles?.length || 0) || 
        !selectedRoles.every(r => me?.roles?.includes(r));
        
      if (rolesChanged) {
        await setRoles.mutateAsync({ data: { roles: selectedRoles } });
      }

      if (file) {
        setIsUploading(true);
        if (file.size > 20 * 1024 * 1024) {
          throw new Error("El archivo excede los 20MB.");
        }
        if (file.type !== "application/pdf" && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          throw new Error("Solo se permiten archivos PDF o DOCX.");
        }

        const { uploadURL, objectPath } = await requestUrl.mutateAsync({
          data: { name: file.name, size: file.size, contentType: file.type }
        });

        const uploadRes = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        });
        if (!uploadRes.ok) {
          throw new Error("No se pudo subir el archivo al almacenamiento.");
        }

        await setCv.mutateAsync({
          data: {
            fileName: file.name,
            contentType: file.type,
            objectPath,
            sizeBytes: file.size
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListTeamMembersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTeamSummaryQueryKey() });
      
      toast({ title: "Perfil actualizado", description: "Tus datos se han guardado correctamente." });
      setOpen(false);
    } catch (err) {
      toast({ 
        title: "Error al guardar", 
        description: err instanceof Error ? err.message : "Ocurrió un error inesperado.", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Mi Perfil y Roles</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar mi perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Nombre a mostrar</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Carlos Martínez" />
          </div>

          <div className="space-y-3">
            <Label>Roles en el Piloto</Label>
            <p className="text-sm text-muted-foreground mb-4">Selecciona las responsabilidades que asumirás durante estas 28 semanas.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROLES.map(role => (
                <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <Checkbox 
                    id={`role-${role.id}`} 
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label htmlFor={`role-${role.id}`} className="font-medium cursor-pointer">{role.label}</Label>
                    <p className="text-xs text-muted-foreground leading-snug">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Avisos por correo</Label>
            <div className="flex items-start justify-between gap-4 p-3 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="email-notifications" className="font-medium cursor-pointer">
                  Recibir avisos por correo del equipo
                </Label>
                <p className="text-xs text-muted-foreground leading-snug">
                  Activa esta opción para recibir notificaciones por correo sobre actualizaciones del Piloto.
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotificationsEnabled}
                onCheckedChange={handleToggleNotifications}
                disabled={updateNotificationPrefs.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Currículum Vitae (PDF o DOCX, máx 20MB)</Label>
            <Input 
              type="file" 
              accept=".pdf,.docx" 
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {me?.hasCv && !file && (
              <p className="text-sm text-muted-foreground mt-1">Ya tienes un CV subido: {me.cv?.fileName}. Sube uno nuevo para reemplazarlo.</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isUploading}>
            {isUploading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EquipoSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
