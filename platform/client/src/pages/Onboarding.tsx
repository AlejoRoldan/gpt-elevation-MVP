import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Sparkles, Check, ChevronRight, Heart, Shield, BarChart2, Bell, BookOpen } from "lucide-react";
import { toast } from "sonner";

const CONSENT_ITEMS = [
  {
    id: "privacy_policy",
    icon: <Shield className="w-5 h-5" />,
    title: "Política de privacidad",
    description: "He leído y acepto cómo se manejan mis datos personales. Entiendo que mis conversaciones se guardan de forma segura y que puedo borrarlas en cualquier momento.",
    required: true,
  },
  {
    id: "ai_interaction",
    icon: <Sparkles className="w-5 h-5" />,
    title: "Interacción con IA",
    description: "Entiendo que Elevation usa inteligencia artificial para acompañarme. Sé que no es un terapeuta y que mis mensajes se procesan de forma anonimizada antes de llegar al modelo de IA.",
    required: true,
  },
  {
    id: "session_data",
    icon: <Heart className="w-5 h-5" />,
    title: "Guardar mis sesiones",
    description: "Acepto que mis conversaciones se guarden para poder revisarlas y para que Elevation pueda recordar el contexto de sesiones anteriores. Puedo desactivar esto en cualquier momento.",
    required: false,
  },
  {
    id: "insights",
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Análisis de bienestar",
    description: "Acepto que se generen estadísticas anónimas sobre mis patrones de bienestar (estado de ánimo, frecuencia de sesiones) para mostrarme insights personales.",
    required: false,
  },
  {
    id: "notifications",
    icon: <Bell className="w-5 h-5" />,
    title: "Recordatorios de bienestar",
    description: "Acepto recibir recordatorios opcionales para mantener mi práctica de reflexión. Puedo desactivarlos en cualquier momento desde mi perfil.",
    required: false,
  },
];

const COMMUNICATION_STYLES = [
  { id: "empathetic", label: "Empático y cálido", desc: "Valida mis emociones antes de explorarlas" },
  { id: "direct", label: "Claro y directo", desc: "Va al punto con amabilidad" },
  { id: "analytical", label: "Reflexivo y estructurado", desc: "Analiza patrones y conexiones" },
  { id: "creative", label: "Imaginativo y metafórico", desc: "Usa imágenes y analogías" },
];

const slideVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export default function Onboarding() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [consents, setConsents] = useState<Record<string, boolean>>({
    privacy_policy: false,
    ai_interaction: false,
    session_data: true,
    insights: true,
    notifications: false,
  });
  const [communicationStyle, setCommunicationStyle] = useState("empathetic");
  const [personalGoals, setPersonalGoals] = useState("");

  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      toast.success("¡Bienvenido/a a Elevation!");
      navigate("/chat");
    },
    onError: () => toast.error("Algo salió mal. Por favor intenta de nuevo."),
  });

  if (loading) return null;
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const requiredConsentsGranted = CONSENT_ITEMS
    .filter((c) => c.required)
    .every((c) => consents[c.id]);

  const handleComplete = () => {
    completeMutation.mutate({ consents, communicationStyle: communicationStyle as any, personalGoals });
  };

  const steps = [
    // Step 0: Welcome
    <motion.div key="welcome" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }} className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h1 className="font-display text-4xl font-medium mb-4">
        Hola, {user?.name?.split(" ")[0] || "bienvenido/a"}
      </h1>
      <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md mx-auto">
        Antes de comenzar, queremos ser completamente transparentes sobre cómo funciona Elevation y cómo cuidamos tu información.
      </p>
      <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
        Este proceso toma menos de 2 minutos y puedes cambiar tus preferencias en cualquier momento.
      </p>
    </motion.div>,

    // Step 1: Consents
    <motion.div key="consents" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
      <h2 className="font-display text-3xl font-medium mb-2 text-center">Tus preferencias de privacidad</h2>
      <p className="text-muted-foreground text-center mb-8 text-sm">
        Los marcados con <span className="text-primary">*</span> son necesarios para usar Elevation.
      </p>
      <div className="space-y-3">
        {CONSENT_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.required && consents[item.id]) return; // Can't uncheck required
              setConsents((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
            }}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
              consents[item.id]
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                consents[item.id] ? "bg-primary text-primary-foreground" : "border border-border"
              }`}>
                {consents[item.id] && <Check className="w-3 h-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-primary/70">{item.icon}</span>
                  <span className="font-medium text-sm">
                    {item.title}
                    {item.required && <span className="text-primary ml-1">*</span>}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {!requiredConsentsGranted && (
        <p className="text-xs text-muted-foreground/60 text-center mt-4">
          Acepta los elementos marcados con * para continuar.
        </p>
      )}
    </motion.div>,

    // Step 2: Communication style
    <motion.div key="style" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
      <h2 className="font-display text-3xl font-medium mb-2 text-center">¿Cómo prefieres que te acompañe?</h2>
      <p className="text-muted-foreground text-center mb-8 text-sm">
        Puedes cambiar esto en cualquier momento desde tu perfil.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMMUNICATION_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => setCommunicationStyle(style.id)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              communicationStyle === style.id
                ? "border-primary/50 bg-primary/8 glow-gold-sm"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {communicationStyle === style.id && (
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
              <span className="font-medium text-sm">{style.label}</span>
            </div>
            <p className="text-muted-foreground text-xs">{style.desc}</p>
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 3: Personal goals (optional)
    <motion.div key="goals" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
      <div className="text-center mb-8">
        <BookOpen className="w-10 h-10 text-primary mx-auto mb-4 opacity-80" />
        <h2 className="font-display text-3xl font-medium mb-2">¿Qué te trae por aquí?</h2>
        <p className="text-muted-foreground text-sm">
          Opcional. Compartir tus intenciones ayuda a Elevation a acompañarte mejor.
        </p>
      </div>
      <textarea
        value={personalGoals}
        onChange={(e) => setPersonalGoals(e.target.value)}
        placeholder="Ej: Quiero aprender a manejar el estrés laboral, explorar mis emociones, o simplemente tener un espacio de reflexión..."
        maxLength={500}
        rows={5}
        className="w-full bg-card border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
      />
      <p className="text-xs text-muted-foreground/50 text-right mt-1">{personalGoals.length}/500</p>
    </motion.div>,
  ];

  const isLastStep = step === steps.length - 1;
  const canProceed = step === 1 ? requiredConsentsGranted : true;

  return (
    <div className="min-h-screen bg-sanctuary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-primary w-8" : "bg-border w-4"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 md:p-10">
          <AnimatePresence mode="wait">
            {steps[step]}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-muted-foreground"
            >
              Atrás
            </Button>
            {isLastStep ? (
              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 glow-gold-sm hover:glow-gold transition-all"
              >
                {completeMutation.isPending ? "Guardando..." : "Comenzar mi camino"}
                <Sparkles className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
              >
                Continuar
                <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Elevation nunca vende tus datos ni los usa para entrenar modelos de IA externos.
        </p>
      </div>
    </div>
  );
}
