import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Bell, Plus, ArrowLeft, Trash2, X, Check,
  Clock, Calendar, Sparkles, Edit2, BellOff, BellRing
} from "lucide-react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = [
  { value: 1, short: "L", long: "Lunes" },
  { value: 2, short: "M", long: "Martes" },
  { value: 3, short: "X", long: "Miércoles" },
  { value: 4, short: "J", long: "Jueves" },
  { value: 5, short: "V", long: "Viernes" },
  { value: 6, short: "S", long: "Sábado" },
  { value: 0, short: "D", long: "Domingo" },
];

const MOTIVATIONAL_MESSAGES = [
  "Es un buen momento para hacer una pausa y respirar. 🌿",
  "Tu bienestar importa. Dedica unos minutos a ti hoy.",
  "¿Cómo te sientes en este momento? Elevation está aquí.",
  "Un pequeño momento de reflexión puede cambiar el día.",
  "Recuerda: el crecimiento personal es un viaje, no una carrera.",
  "Hoy es un buen día para explorar cómo estás por dentro.",
  "Tu práctica de reflexión te espera. Sin prisa, sin presión.",
  "Cada sesión es un regalo que te haces a ti mismo/a.",
];

const PRESET_SCHEDULES = [
  { label: "Mañana (8:00)", time: "08:00", days: [1, 2, 3, 4, 5] },
  { label: "Mediodía (13:00)", time: "13:00", days: [1, 2, 3, 4, 5] },
  { label: "Tarde (18:00)", time: "18:00", days: [1, 2, 3, 4, 5] },
  { label: "Noche (21:00)", time: "21:00", days: [1, 2, 3, 4, 5, 6, 0] },
  { label: "Fin de semana (10:00)", time: "10:00", days: [6, 0] },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type ReminderForm = {
  label: string;
  message: string;
  timeOfDay: string;
  daysOfWeek: number[];
  timezone: string;
};

const DEFAULT_FORM: ReminderForm = {
  label: "Momento de reflexión",
  message: "",
  timeOfDay: "08:00",
  daysOfWeek: [1, 3, 5],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function DaySelector({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
}) {
  const toggle = (day: number) => {
    if (selected.includes(day)) {
      if (selected.length === 1) return; // At least one day required
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  };

  return (
    <div className="flex gap-1.5">
      {DAYS.map((d) => (
        <button
          key={d.value}
          type="button"
          onClick={() => toggle(d.value)}
          title={d.long}
          className={`w-9 h-9 rounded-full text-xs font-medium transition-all duration-200 ${
            selected.includes(d.value)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-accent text-muted-foreground hover:text-foreground"
          }`}
        >
          {d.short}
        </button>
      ))}
    </div>
  );
}

function ReminderCard({
  reminder,
  onToggle,
  onEdit,
  onDelete,
}: {
  reminder: {
    id: number;
    label: string;
    message: string | null;
    timeOfDay: string;
    daysOfWeek: number[];
    isActive: boolean;
    timezone: string | null;
  };
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const activeDays = DAYS.filter((d) => reminder.daysOfWeek.includes(d.value));
  const [time12, period] = formatTime12(reminder.timeOfDay);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`glass-light rounded-xl p-4 transition-all duration-200 ${
        !reminder.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{reminder.label}</span>
            {!reminder.isActive && (
              <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                Pausado
              </span>
            )}
          </div>
          {reminder.message && (
            <p className="text-xs text-muted-foreground/70 mb-2 line-clamp-1 italic">
              "{reminder.message}"
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="font-mono">
                {time12}
                <span className="text-muted-foreground/60 ml-0.5">{period}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {activeDays.length === 7
                  ? "Todos los días"
                  : activeDays.length === 5 && !activeDays.some((d) => d.value === 0 || d.value === 6)
                  ? "Lun–Vie"
                  : activeDays.map((d) => d.short).join(", ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggle}
            title={reminder.isActive ? "Pausar" : "Activar"}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            {reminder.isActive ? <BellRing className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime12(time24: string): [string, string] {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return [`${h12}:${String(m).padStart(2, "0")}`, period];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reminders() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ReminderForm>(DEFAULT_FORM);
  const [showPresets, setShowPresets] = useState(false);

  const utils = trpc.useUtils();
  const { data: reminders = [], isLoading } = trpc.reminders.list.useQuery();

  const createMutation = trpc.reminders.create.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      setShowForm(false);
      setForm(DEFAULT_FORM);
      toast.success("Recordatorio creado");
    },
    onError: () => toast.error("No se pudo crear el recordatorio"),
  });

  const updateMutation = trpc.reminders.update.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      setShowForm(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
      toast.success("Recordatorio actualizado");
    },
    onError: () => toast.error("No se pudo actualizar"),
  });

  const deleteMutation = trpc.reminders.delete.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      toast.success("Recordatorio eliminado");
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  if (loading) return null;
  if (!isAuthenticated) { navigate("/"); return null; }

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
    setShowPresets(true);
  };

  const handleEdit = (r: typeof reminders[0]) => {
    setEditingId(r.id);
    setForm({
      label: r.label,
      message: r.message ?? "",
      timeOfDay: r.timeOfDay,
      daysOfWeek: r.daysOfWeek as number[],
      timezone: r.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setShowForm(true);
    setShowPresets(false);
  };

  const handleSubmit = () => {
    const payload = {
      label: form.label.trim() || "Momento de reflexión",
      message: form.message.trim() || undefined,
      timeOfDay: form.timeOfDay,
      daysOfWeek: form.daysOfWeek,
      timezone: form.timezone,
    };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggle = (id: number, current: boolean) => {
    updateMutation.mutate({ id, isActive: !current });
  };

  const applyPreset = (preset: typeof PRESET_SCHEDULES[0]) => {
    setForm((f) => ({ ...f, timeOfDay: preset.time, daysOfWeek: preset.days }));
    setShowPresets(false);
  };

  const activeCount = reminders.filter((r) => r.isActive).length;

  return (
    <div className="min-h-screen bg-sanctuary text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-display font-medium">Recordatorios</span>
          </div>
          {activeCount > 0 && (
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
              {activeCount} activo{activeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleOpenNew}
          className="bg-primary text-primary-foreground rounded-full px-4"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Intro card */}
        {reminders.length === 0 && !showForm && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 text-center mb-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-xl font-medium mb-2">
              Crea tu práctica diaria
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              Los recordatorios te invitan suavemente a hacer una pausa y conectar contigo mismo/a.
              Sin presión, solo una invitación.
            </p>
            <Button
              onClick={handleOpenNew}
              className="bg-primary text-primary-foreground rounded-full px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear primer recordatorio
            </Button>
          </motion.div>
        )}

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass rounded-2xl p-5 mb-5"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-medium">
                  {editingId ? "Editar recordatorio" : "Nuevo recordatorio"}
                </h3>
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(DEFAULT_FORM); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Presets */}
              <AnimatePresence>
                {showPresets && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground mb-2">Elige una plantilla rápida:</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_SCHEDULES.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => applyPreset(p)}
                          className="text-xs px-3 py-1.5 rounded-full bg-accent hover:bg-primary/15 hover:text-primary transition-colors"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowPresets(false)}
                      className="text-xs text-muted-foreground/50 hover:text-muted-foreground mt-2 transition-colors"
                    >
                      Configurar manualmente
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Label */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1.5 block">Nombre del recordatorio</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Ej: Pausa de mediodía"
                  maxLength={100}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Time */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1.5 block">Hora</label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={form.timeOfDay}
                    onChange={(e) => setForm((f) => ({ ...f, timeOfDay: e.target.value }))}
                    className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                  />
                  <span className="text-sm text-muted-foreground">
                    {(() => {
                      const [t, p] = formatTime12(form.timeOfDay);
                      return `${t} ${p}`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Days */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-2 block">Días de la semana</label>
                <DaySelector
                  selected={form.daysOfWeek}
                  onChange={(days) => setForm((f) => ({ ...f, daysOfWeek: days }))}
                />
                <p className="text-xs text-muted-foreground/50 mt-1.5">
                  {form.daysOfWeek.length === 7
                    ? "Todos los días"
                    : DAYS.filter((d) => form.daysOfWeek.includes(d.value)).map((d) => d.long).join(", ")}
                </p>
              </div>

              {/* Message */}
              <div className="mb-5">
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Mensaje motivacional
                  <span className="text-muted-foreground/50 ml-1">(opcional)</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Ej: Es un buen momento para hacer una pausa..."
                  maxLength={300}
                  rows={2}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground/40">{form.message.length}/300</p>
                  <button
                    type="button"
                    onClick={() => {
                      const random = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
                      setForm((f) => ({ ...f, message: random }));
                    }}
                    className="text-xs text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Sugerir mensaje
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || form.daysOfWeek.length === 0}
                className="w-full bg-primary text-primary-foreground rounded-xl"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : editingId
                  ? "Guardar cambios"
                  : "Crear recordatorio"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reminders list */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
        ) : reminders.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {reminders.map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={{
                    ...r,
                    daysOfWeek: r.daysOfWeek as number[],
                  }}
                  onToggle={() => handleToggle(r.id, r.isActive)}
                  onEdit={() => handleEdit(r)}
                  onDelete={() => deleteMutation.mutate({ id: r.id })}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : null}

        {/* Footer note */}
        {reminders.length > 0 && (
          <p className="text-center text-xs text-muted-foreground/40 mt-6 leading-relaxed">
            Los recordatorios son una invitación, no una obligación.
            <br />
            Puedes pausarlos o eliminarlos en cualquier momento.
          </p>
        )}
      </div>
    </div>
  );
}
