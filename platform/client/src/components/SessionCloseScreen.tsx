import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, BookOpen, RotateCcw, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SessionCloseScreenProps {
  sessionId: number;
  moodPre: number | null;
  messageCount: number;
  topThemes?: string[];
  onSaveReflection: (closingPhrase: string) => void;
  onNewSession: () => void;
  onDismiss: () => void;
}

// ─── Mood config ──────────────────────────────────────────────────────────────
const MOOD_CONFIG = [
  { value: 1, emoji: "🌑", label: "Muy pesado", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/30" },
  { value: 2, emoji: "🌒", label: "Cargado", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  { value: 3, emoji: "🌓", label: "En proceso", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  { value: 4, emoji: "🌔", label: "Con ligereza", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  { value: 5, emoji: "🌕", label: "Pleno", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
];

// ─── Mood delta messages ──────────────────────────────────────────────────────
function getMoodDeltaMessage(delta: number | null): { text: string; color: string } {
  if (delta === null) return { text: "", color: "" };
  if (delta >= 2) return { text: "Hubo un cambio notable hacia la ligereza", color: "text-emerald-400" };
  if (delta === 1) return { text: "Algo se movió en la dirección correcta", color: "text-emerald-400/80" };
  if (delta === 0) return { text: "Te mantuviste presente a lo largo de la sesión", color: "text-amber-400" };
  if (delta === -1) return { text: "Contactaste con algo difícil. Eso también es valentía", color: "text-blue-400" };
  return { text: "Fuiste a un lugar profundo. Eso merece reconocimiento", color: "text-blue-400/80" };
}

// ─── Animated particles ───────────────────────────────────────────────────────
function FloatingParticles() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    delay: i * 0.3,
    duration: 4 + Math.random() * 3,
    size: 2 + Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{ left: `${p.x}%`, bottom: "10%", width: p.size, height: p.size }}
          animate={{ y: [-20, -120], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─── Mood Arc Visualization ───────────────────────────────────────────────────
function MoodArc({ moodPre, moodPost }: { moodPre: number | null; moodPost: number }) {
  const preConfig = moodPre != null ? MOOD_CONFIG[moodPre - 1] : null;
  const postConfig = MOOD_CONFIG[moodPost - 1];
  const delta = moodPre != null ? moodPost - moodPre : null;
  const deltaMsg = getMoodDeltaMessage(delta);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        {/* Pre mood */}
        {preConfig ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border ${preConfig.border} ${preConfig.bg}`}
          >
            <span className="text-2xl">{preConfig.emoji}</span>
            <span className={`text-xs font-medium ${preConfig.color}`}>{preConfig.label}</span>
            <span className="text-xs text-muted-foreground/60">Al inicio</span>
          </motion.div>
        ) : (
          <div className="w-24" />
        )}

        {/* Arrow with delta */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-1">
            <div className="w-8 h-px bg-border" />
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </div>
          {delta !== null && (
            <span className={`text-xs font-bold ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-blue-400" : "text-amber-400"}`}>
              {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
            </span>
          )}
        </motion.div>

        {/* Post mood */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border ${postConfig.border} ${postConfig.bg}`}
        >
          <span className="text-2xl">{postConfig.emoji}</span>
          <span className={`text-xs font-medium ${postConfig.color}`}>{postConfig.label}</span>
          <span className="text-xs text-muted-foreground/60">Al cierre</span>
        </motion.div>
      </div>

      {/* Delta message */}
      {deltaMsg.text && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className={`text-xs text-center ${deltaMsg.color}`}
        >
          {deltaMsg.text}
        </motion.p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SessionCloseScreen({
  sessionId,
  moodPre,
  messageCount,
  topThemes = [],
  onSaveReflection,
  onNewSession,
  onDismiss,
}: SessionCloseScreenProps) {
  const [step, setStep] = useState<"mood" | "closing">("mood");
  const [moodPost, setMoodPost] = useState<number | null>(null);
  const [closingData, setClosingData] = useState<{
    closingPhrase: string;
    moodPre: number | null;
    moodPost: number;
    moodDelta: number | null;
    messageCount: number;
  } | null>(null);

  const closeMutation = trpc.sessionClose.close.useMutation({
    onSuccess: (data) => {
      setClosingData(data);
      setStep("closing");
    },
    onError: () => {
      toast.error("No se pudo generar el cierre. Intenta de nuevo.");
    },
  });

  const handleMoodSelect = (value: number) => {
    setMoodPost(value);
    closeMutation.mutate({
      sessionId,
      moodPost: value,
      moodPre: moodPre ?? undefined,
      messageCount,
      topThemes,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <FloatingParticles />

      <div className="relative w-full max-w-sm mx-4">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Mood Post ── */}
          {step === "mood" && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              {/* Header */}
              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto"
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-xl font-medium"
                >
                  Momento de cierre
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-muted-foreground"
                >
                  Antes de cerrar, ¿cómo estás ahora mismo?
                </motion.p>
              </div>

              {/* Mood selector */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center gap-2"
              >
                {MOOD_CONFIG.map((m, idx) => (
                  <motion.button
                    key={m.value}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + idx * 0.07 }}
                    onClick={() => !closeMutation.isPending && handleMoodSelect(m.value)}
                    disabled={closeMutation.isPending}
                    className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
                      moodPost === m.value
                        ? `${m.border} ${m.bg} scale-105`
                        : "border-border/40 hover:border-border"
                    } ${closeMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                  </motion.button>
                ))}
              </motion.div>

              {/* Loading state */}
              {closeMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Elevation está reflexionando...</span>
                </motion.div>
              )}

              {/* Skip */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                onClick={onDismiss}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                Cerrar sin registrar
              </motion.button>
            </motion.div>
          )}

          {/* ── Step 2: Closing Screen ── */}
          {step === "closing" && closingData && (
            <motion.div
              key="closing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Mood arc */}
              <MoodArc moodPre={closingData.moodPre} moodPost={closingData.moodPost} />

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/30" />
                <Sparkles className="w-3 h-3 text-primary/40" />
                <div className="flex-1 h-px bg-border/30" />
              </div>

              {/* Closing phrase */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center px-2"
              >
                <p className="font-display text-base leading-relaxed text-foreground/90 italic">
                  "{closingData.closingPhrase}"
                </p>
                <p className="text-xs text-muted-foreground/40 mt-2">— Elevation</p>
              </motion.div>

              {/* Session stats */}
              {closingData.messageCount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center gap-4 text-center"
                >
                  <div>
                    <p className="text-lg font-semibold text-primary">{closingData.messageCount}</p>
                    <p className="text-xs text-muted-foreground">intercambios</p>
                  </div>
                  {topThemes.length > 0 && (
                    <div>
                      <p className="text-lg font-semibold text-primary">{topThemes.length}</p>
                      <p className="text-xs text-muted-foreground">temas</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tags */}
              {topThemes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap justify-center gap-1.5"
                >
                  {topThemes.map((theme) => (
                    <span key={theme} className="text-xs px-2.5 py-1 rounded-full bg-primary/8 text-primary/70 border border-primary/15">
                      {theme}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col gap-2"
              >
                <Button
                  onClick={() => onSaveReflection(closingData.closingPhrase)}
                  className="w-full gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Guardar una reflexión
                </Button>
                <Button
                  variant="outline"
                  onClick={onNewSession}
                  className="w-full gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nueva sesión
                </Button>
              </motion.div>

              {/* Dismiss */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                onClick={onDismiss}
                className="w-full text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors py-1"
              >
                Cerrar
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
