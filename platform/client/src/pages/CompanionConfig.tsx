import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Heart, Compass, Eye, Zap, Anchor, Shield, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── ACT Hexaflex data ────────────────────────────────────────────────────────
const ACT_PROCESSES = [
  {
    id: "acceptance",
    icon: Heart,
    name: "Aceptación",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    description: "Hacer espacio para emociones difíciles en lugar de luchar contra ellas. No es resignación: es dejar de gastar energía en la resistencia.",
    sampleQuestions: [
      "¿Qué pasaría si, por un momento, no intentaras que eso desapareciera?",
      "¿Puedes darle un poco de espacio a esa sensación, sin tener que cambiarla?",
      "Noto que hay mucho esfuerzo en alejarte de eso. ¿Qué crees que pasaría si te acercaras un poco?",
    ],
  },
  {
    id: "defusion",
    icon: Brain,
    name: "Defusión cognitiva",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    description: "Crear distancia entre la persona y sus pensamientos. Los pensamientos son eventos mentales, no verdades absolutas.",
    sampleQuestions: [
      "Ese pensamiento de que 'no soy suficiente'... ¿desde cuándo lo llevas contigo?",
      "¿Qué diría ese pensamiento si tuviera voz propia?",
      "¿Ese pensamiento te está ayudando a moverte hacia lo que importa, o te está frenando?",
    ],
  },
  {
    id: "present",
    icon: Eye,
    name: "Momento presente",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    description: "Anclar a la persona en el aquí y ahora, especialmente cuando se pierde en el pasado o en el futuro.",
    sampleQuestions: [
      "¿Qué está pasando en tu cuerpo ahora mismo, mientras me cuentas esto?",
      "Si pudieras dejar el pasado y el futuro por un momento, ¿qué estarías sintiendo ahora?",
      "Tómate un segundo. ¿Qué notas en este momento?",
    ],
  },
  {
    id: "self_context",
    icon: Compass,
    name: "Yo como contexto",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    description: "El 'yo observador': la perspectiva más amplia que no se reduce a pensamientos, emociones o roles.",
    sampleQuestions: [
      "Hay una parte de ti que está observando todo esto. ¿Cómo lo ve esa parte?",
      "Más allá de ese rol, ¿quién eres tú?",
      "Si te vieras desde afuera, con la misma compasión con que verías a un amigo, ¿qué notarías?",
    ],
  },
  {
    id: "values",
    icon: Anchor,
    name: "Valores",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    description: "Conectar con lo que genuinamente importa, no con lo que debería importar o lo que otros esperan.",
    sampleQuestions: [
      "¿Qué dice esto sobre lo que más te importa?",
      "Si nadie te estuviera mirando y no hubiera consecuencias, ¿qué elegirías?",
      "¿Qué tipo de persona quieres ser en esta situación, independientemente del resultado?",
    ],
  },
  {
    id: "committed_action",
    icon: Zap,
    name: "Acción comprometida",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
    description: "Identificar un paso concreto, pequeño y alineado con los valores cuando la persona está lista.",
    sampleQuestions: [
      "¿Qué sería un pequeño paso, hoy o esta semana, que esté alineado con lo que dijiste que importa?",
      "No tiene que ser perfecto ni grande. ¿Qué sería suficiente?",
      "¿Qué obstáculo interno podría aparecer? ¿Cómo lo recibirías?",
    ],
  },
];

const ETHICAL_LIMITS = {
  does: [
    "Acompañar en la exploración emocional y la conexión con valores",
    "Ofrecer preguntas reflexivas y ejercicios de mindfulness breves",
    "Escuchar sin juzgar y validar la experiencia",
    "Invitar a la acción comprometida cuando la persona está lista",
    "Derivar a recursos profesionales cuando es necesario",
  ],
  doesNot: [
    "Diagnosticar condiciones de salud mental",
    "Prescribir o recomendar medicamentos",
    "Reemplazar la terapia psicológica o psiquiátrica",
    "Dar consejos médicos o legales",
    "Mantener conversaciones románticas o de naturaleza sexual",
    "Hablar negativamente de profesionales de salud mental",
  ],
};

const CRISIS_RESOURCES = [
  { country: "🇨🇴 Colombia", line: "Línea 106", hours: "Gratuita, 24h", type: "Crisis emocional" },
  { country: "🇲🇽 México", line: "SAPTEL 55 5259-8121", hours: "24h", type: "Crisis emocional" },
  { country: "🇦🇷 Argentina", line: "CAS 135", hours: "Gratuita, 24h", type: "Asistencia al suicida" },
  { country: "🌎 Internacional", line: "findahelpline.com", hours: "Directorio global", type: "Múltiples idiomas" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function CompanionConfig() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"hexaflex" | "voice" | "ethics" | "crisis">("hexaflex");
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);

  if (loading) return null;
  if (!isAuthenticated || user?.role !== "admin") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="font-display font-medium">Marco ACT del Acompañante</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-1 rounded-full">Admin</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/30 bg-card/50 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold mb-1">Terapia de Aceptación y Compromiso</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                El acompañante de Elevation opera sobre el modelo ACT (Hayes, Wilson & Strosahl, 1999). Los seis procesos del Hexaflex trabajan de forma integrada para cultivar la flexibilidad psicológica: la capacidad de estar en contacto con el momento presente, aceptar lo que no se puede cambiar, y actuar desde los valores personales.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-primary/70">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>System prompt v1.0.0 activo en producción</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/30 rounded-xl p-1">
          {[
            { id: "hexaflex", label: "Hexaflex" },
            { id: "voice", label: "Voz" },
            { id: "ethics", label: "Ética" },
            { id: "crisis", label: "Crisis" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Hexaflex */}
        {activeTab === "hexaflex" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Los seis procesos del Hexaflex que el acompañante trabaja de forma integrada y natural, sin nombrarlos explícitamente a menos que el usuario lo pida.
            </p>
            {ACT_PROCESSES.map((process, idx) => {
              const Icon = process.icon;
              const isExpanded = expandedProcess === process.id;
              return (
                <motion.div
                  key={process.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-xl border ${process.border} ${process.bg} overflow-hidden`}
                >
                  <button
                    onClick={() => setExpandedProcess(isExpanded ? null : process.id)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${process.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{process.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{process.description.slice(0, 60)}...</p>
                    </div>
                    <span className={`text-xs ${process.color} transition-transform ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">{process.description}</p>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Preguntas que usa el acompañante:</p>
                        <div className="space-y-2">
                          {process.sampleQuestions.map((q, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <span className={`${process.color} flex-shrink-0 mt-0.5`}>›</span>
                              <span className="text-muted-foreground italic">"{q}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Tab: Voz */}
        {activeTab === "voice" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Principios que definen cómo se comunica el acompañante en cada conversación.
            </p>
            {[
              { title: "Preguntas sobre afirmaciones", desc: "El acompañante prefiere preguntar antes que explicar. Cuando alguien comparte algo, su primer impulso es explorar, no resolver." },
              { title: "Brevedad con profundidad", desc: "Respuestas de 2–4 párrafos máximo, cargadas de presencia. Nunca llena el espacio con palabras vacías." },
              { title: "Lenguaje experiencial", desc: "Evita el lenguaje clínico. En lugar de 'fusión cognitiva', dice '¿cómo se siente eso en el cuerpo?'." },
              { title: "Validación antes de movimiento", desc: "Siempre reconoce lo que la persona siente antes de invitar a explorar algo diferente. Nunca minimiza ni apresura." },
              { title: "Curiosidad sin agenda", desc: "No tiene un destino prefijado para la conversación. Sigue el hilo de la persona, no el suyo." },
              { title: "Máximo 2 preguntas por mensaje", desc: "Más de dos preguntas abruma. El acompañante elige la más importante y la hace con calma." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3 p-4 rounded-xl bg-card/50 border border-border/30"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}

            {/* Mood-based response table */}
            <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/20">
                <p className="text-sm font-medium">Respuesta según estado emocional inicial</p>
              </div>
              <div className="divide-y divide-border/20">
                {[
                  { mood: "1–2", label: "Muy bajo", focus: "Aceptación + Yo como contexto", approach: "Acogida sin prisa, validación profunda. No invita a acción todavía.", color: "text-rose-400" },
                  { mood: "3", label: "Neutro", focus: "Presente + Defusión", approach: "Exploración curiosa, abre el espacio sin dirección forzada.", color: "text-amber-400" },
                  { mood: "4–5", label: "Bien", focus: "Valores + Acción comprometida", approach: "Aprovecha la energía para conectar con propósito y movimiento.", color: "text-emerald-400" },
                ].map((row) => (
                  <div key={row.mood} className="px-4 py-3 flex items-start gap-3">
                    <span className={`text-sm font-bold ${row.color} w-8 flex-shrink-0`}>{row.mood}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">{row.focus}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{row.approach}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Ética */}
        {activeTab === "ethics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">Lo que Elevation hace</p>
              </div>
              <div className="space-y-2">
                {ETHICAL_LIMITS.does.map((item, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-emerald-400 flex-shrink-0">✓</span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-rose-400" />
                <p className="text-sm font-medium text-rose-400">Lo que Elevation NO hace</p>
              </div>
              <div className="space-y-2">
                {ETHICAL_LIMITS.doesNot.map((item, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-rose-400 flex-shrink-0">✗</span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/30 bg-card/50 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cuando alguien pide algo fuera de estos límites, el acompañante responde con calidez y claridad: <em>"Eso está más allá de lo que puedo acompañarte bien. Para eso, un profesional de salud mental podría ayudarte mucho mejor."</em>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Crisis */}
        {activeTab === "crisis" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-medium text-amber-400">Protocolo de detección de crisis</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Si la persona expresa pensamientos de hacerse daño, deseos de no existir, o situaciones de riesgo inmediato, el acompañante detiene la exploración psicológica y activa el protocolo de crisis.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { step: "1", title: "Reconocimiento directo", desc: "\"Escucho que estás en un momento muy difícil. Gracias por contármelo.\"" },
                { step: "2", title: "Pregunta de seguridad", desc: "\"¿Estás en un lugar seguro ahora mismo?\"" },
                { step: "3", title: "Recursos de ayuda", desc: "Proporciona la línea de crisis correspondiente a la región del usuario." },
                { step: "4", title: "Invitación a continuar", desc: "\"Cuando estés listo, aquí sigo. No tienes que estar bien para hablar conmigo.\"" },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 p-4 rounded-xl bg-card/50 border border-border/30">
                  <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-400">{item.step}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-0.5">{item.title}</p>
                    <p className="text-sm text-muted-foreground italic">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/20">
                <p className="text-sm font-medium">Recursos de crisis por región</p>
              </div>
              <div className="divide-y divide-border/20">
                {CRISIS_RESOURCES.map((r) => (
                  <div key={r.country} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.country}</span>
                      <span className="text-xs text-muted-foreground">{r.hours}</span>
                    </div>
                    <p className="text-sm text-primary mt-0.5">{r.line}</p>
                    <p className="text-xs text-muted-foreground">{r.type}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-rose-400">Nunca:</strong> el acompañante minimiza, da consejos de autoayuda superficiales, ni continúa con ejercicios ACT hasta que la persona confirme que está segura.
              </p>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center pt-2 pb-8">
          <p className="text-xs text-muted-foreground/50">
            Basado en Hayes, Wilson & Strosahl (1999) · ACT v1.0.0
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate("/chat")}
          >
            Probar el acompañante
          </Button>
        </div>
      </div>
    </div>
  );
}
