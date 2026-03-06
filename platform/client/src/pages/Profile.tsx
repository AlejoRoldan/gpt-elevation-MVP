import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  User, Shield, Download, Trash2, ArrowLeft, Check, X,
  Sparkles, BookOpen, BarChart2, ChevronDown, ChevronUp, AlertTriangle, Bell, Brain
} from "lucide-react";
import { toast } from "sonner";

const CONSENT_LABELS: Record<string, { title: string; desc: string }> = {
  privacy_policy: { title: "Política de privacidad", desc: "Manejo de datos personales" },
  ai_interaction: { title: "Interacción con IA", desc: "Procesamiento anonimizado de mensajes" },
  session_data: { title: "Guardar sesiones", desc: "Historial de conversaciones" },
  insights: { title: "Análisis de bienestar", desc: "Estadísticas de bienestar personal" },
  notifications: { title: "Recordatorios", desc: "Notificaciones de práctica" },
};

const STYLE_LABELS: Record<string, string> = {
  empathetic: "Empático y cálido",
  direct: "Claro y directo",
  analytical: "Reflexivo y estructurado",
  creative: "Imaginativo y metafórico",
};

export default function Profile() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showConsents, setShowConsents] = useState(false);

  const { data: profileData, refetch } = trpc.profile.get.useQuery();
  const updateConsentMutation = trpc.profile.updateConsent.useMutation({
    onSuccess: () => { refetch(); toast.success("Preferencia actualizada"); },
  });
  const exportMutation = trpc.profile.exportData.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `elevation-mis-datos-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Datos exportados");
    },
  });
  const deleteAccountMutation = trpc.profile.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Tu cuenta y datos han sido eliminados.");
      logout();
      navigate("/");
    },
    onError: () => toast.error("No se pudo eliminar la cuenta."),
  });
  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Perfil actualizado"); },
  });

  if (loading) return null;
  if (!isAuthenticated) { navigate("/"); return null; }

  // Get latest consent state per type
  const latestConsents: Record<string, boolean> = {};
  (profileData?.consents ?? []).forEach((c) => {
    if (!(c.consentType in latestConsents)) {
      latestConsents[c.consentType] = c.granted;
    }
  });

  const handleToggleConsent = (type: string, current: boolean) => {
    if (type === "privacy_policy" || type === "ai_interaction") {
      toast.error("Este consentimiento es necesario para usar Elevation.");
      return;
    }
    updateConsentMutation.mutate({ consentType: type, granted: !current });
  };

  return (
    <div className="min-h-screen bg-sanctuary text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="font-display font-medium">Mi perfil</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/reflections")} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent">
            <BookOpen className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/insights")} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent">
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* User card */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{user?.name ?? "Usuario"}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
            </div>
          </div>
        </div>

        {/* Communication style */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-display font-medium">Estilo de acompañamiento</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STYLE_LABELS).map(([id, label]) => (
              <button
                key={id}
                onClick={() => updateProfileMutation.mutate({ communicationStyle: id as any })}
                className={`p-3 rounded-xl text-left text-sm transition-all ${
                  profileData?.profile?.communicationStyle === id
                    ? "border border-primary/40 bg-primary/8 text-foreground"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {profileData?.profile?.communicationStyle === id && (
                  <Check className="w-3 h-3 text-primary mb-1" />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Consents */}
        <div className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowConsents(!showConsents)}
            className="w-full flex items-center justify-between p-5 hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-display font-medium">Mis consentimientos</h3>
            </div>
            {showConsents ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {showConsents && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                  {Object.entries(CONSENT_LABELS).map(([type, { title, desc }]) => {
                    const granted = latestConsents[type] ?? false;
                    const required = type === "privacy_policy" || type === "ai_interaction";
                    return (
                      <div key={type} className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {title}
                            {required && <span className="text-primary ml-1 text-xs">*requerido</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <button
                          onClick={() => handleToggleConsent(type, granted)}
                          className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${granted ? "bg-primary" : "bg-border"}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${granted ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground/50 pt-2">
                    Historial de cambios guardado. Versión de consentimiento: {profileData?.user?.consentVersion ?? "—"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reminders shortcut */}
        <button
          onClick={() => navigate("/reminders")}
          className="w-full glass rounded-2xl p-5 text-left hover:border-primary/20 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Recordatorios de práctica</p>
                <p className="text-xs text-muted-foreground">Programa tus momentos de reflexión</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
          </div>
        </button>

        {/* Admin: Companion Config */}
        {user?.role === "admin" && (
          <button
            onClick={() => navigate("/companion-config")}
            className="w-full glass rounded-2xl p-5 text-left hover:border-primary/20 transition-all group border border-primary/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Marco ACT del Acompañante</p>
                  <p className="text-xs text-muted-foreground">Configuración del sistema · Solo admin</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
            </div>
          </button>
        )}

        {/* Data rights */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-display font-medium">Tus derechos sobre tus datos</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all text-left"
            >
              <Download className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Exportar mis datos</p>
                <p className="text-xs text-muted-foreground">Descarga todo lo que guardamos sobre ti en formato JSON.</p>
              </div>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-all text-left"
            >
              <Trash2 className="w-4 h-4 text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Eliminar mi cuenta</p>
                <p className="text-xs text-muted-foreground">Borra permanentemente tu cuenta y todos tus datos.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-display text-lg font-medium">Eliminar cuenta</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán todas tus conversaciones, reflexiones e insights.
              </p>
              <p className="text-sm mb-3">
                Escribe <span className="font-mono text-destructive">ELIMINAR</span> para confirmar:
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-destructive/50"
              />
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteConfirmText !== "ELIMINAR" || deleteAccountMutation.isPending}
                  onClick={() => deleteAccountMutation.mutate()}
                >
                  {deleteAccountMutation.isPending ? "Eliminando..." : "Eliminar todo"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
