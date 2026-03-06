import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";
import {
  Send, Sparkles, BookmarkPlus, LogOut, User, BarChart2,
  BookOpen, AlertTriangle, X, Menu, Heart
} from "lucide-react";
import { toast } from "sonner";
import SessionCloseScreen from "@/components/SessionCloseScreen";

const MOOD_OPTIONS = [
  { value: 1, emoji: "😔", label: "Muy bajo" },
  { value: 2, emoji: "😕", label: "Bajo" },
  { value: 3, emoji: "😐", label: "Neutro" },
  { value: 4, emoji: "🙂", label: "Bien" },
  { value: 5, emoji: "😊", label: "Muy bien" },
];

type Message = { role: "user" | "assistant"; content: string; id: string };

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-float-up">
      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="message-assistant rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function CrisisAlert({ resource, onDismiss }: { resource: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-4 mb-3 p-4 rounded-xl border border-destructive/40 bg-destructive/10"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive mb-1">Apoyo inmediato disponible</p>
          <p className="text-xs text-muted-foreground">{resource}</p>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [moodPre, setMoodPre] = useState<number | null>(null);
  const [showMoodPre, setShowMoodPre] = useState(true);
  const [showMoodPost, setShowMoodPost] = useState(false);
  const [crisisResource, setCrisisResource] = useState<string | null>(null);
  const [supportNote, setSupportNote] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCloseScreen, setShowCloseScreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startSession = trpc.chat.startSession.useMutation();
  const sendMessage = trpc.chat.sendMessage.useMutation();
  const endSession = trpc.chat.endSession.useMutation();
  const createReflection = trpc.reflections.create.useMutation({
    onSuccess: () => toast.success("Reflexión guardada"),
    onError: () => toast.error("No se pudo guardar"),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleStartSession = async (mood: number) => {
    setMoodPre(mood);
    setShowMoodPre(false);
    const result = await startSession.mutateAsync({ moodPre: mood });
    setSessionId(result.sessionId);
    setMessages([{
      role: "assistant",
      content: "Hola, estoy aquí contigo. Este es tu espacio, sin prisa y sin juicio. ¿Cómo te sientes hoy? ¿Qué te trae por aquí?",
      id: "welcome",
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isTyping) return;
    const userMessage = input.trim();
    setInput("");
    const msgId = Date.now().toString();
    setMessages((prev) => [...prev, { role: "user", content: userMessage, id: msgId }]);
    setIsTyping(true);
    setCrisisResource(null);
    setSupportNote(null);

    try {
      const result = await sendMessage.mutateAsync({ sessionId, message: userMessage });
      setMessages((prev) => [...prev, { role: "assistant", content: result.response, id: msgId + "_r" }]);
      if (result.crisis && result.crisisResource) {
        setCrisisResource(result.crisisResource);
      }
      if ("supportNote" in result && result.supportNote) {
        setSupportNote(result.supportNote as string);
      }
    } catch {
      toast.error("No pude procesar tu mensaje. Por favor intenta de nuevo.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Extract top themes from user messages (simple keyword matching)
  const getTopThemes = (): string[] => {
    const themeKeywords: Record<string, string[]> = {
      "ansiedad": ["ansied", "nervios", "preocup"],
      "tristeza": ["triste", "llorar", "dolor"],
      "trabajo": ["trabajo", "jefe", "laboral"],
      "familia": ["familia", "pap", "mam", "hijo", "pareja"],
      "identidad": ["propósito", "sentido", "valores"],
      "relaciones": ["relación", "amig", "solo", "soledad"],
      "cuerpo": ["cuerpo", "salud", "cansancio", "dormir"],
      "gratitud": ["agradec", "bien", "alegr"],
    };
    const userText = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase()).join(" ");
    return Object.entries(themeKeywords)
      .filter(([, kws]) => kws.some((kw) => userText.includes(kw)))
      .map(([theme]) => theme)
      .slice(0, 4);
  };

  const handleEndSession = async (moodPost: number) => {
    if (!sessionId) return;
    // Don't call endSession directly — SessionCloseScreen will call sessionClose.close
    // which internally calls endSession on the server
    setShowMoodPost(false);
    setShowCloseScreen(true);
    // Store moodPost temporarily so SessionCloseScreen can use it
    // We pass it as prop via the showCloseScreen state
    setMoodPre((prev) => { void moodPost; return prev; }); // keep moodPre unchanged
    // Pass moodPost via a ref-like approach: store in a dedicated state
    setPendingMoodPost(moodPost);
  };

  const [pendingMoodPost, setPendingMoodPost] = useState<number>(3);

  const handleCloseScreenSaveReflection = (closingPhrase: string) => {
    setShowCloseScreen(false);
    // Pre-fill reflection with the closing phrase and navigate
    navigate("/reflections?prefill=" + encodeURIComponent(closingPhrase));
  };

  const handleCloseScreenNewSession = () => {
    setShowCloseScreen(false);
    setSessionId(null);
    setMessages([]);
    setMoodPre(null);
    setShowMoodPre(true);
    setPendingMoodPost(3);
  };

  const handleSaveReflection = async (content: string) => {
    if (!sessionId) return;
    await createReflection.mutateAsync({ content, sessionId, tags: ["sesión"] });
  };

  if (loading) return null;

  return (
    <div className="h-screen bg-sanctuary flex overflow-hidden">
      {/* Session Close Ritual Screen */}
      <AnimatePresence>
        {showCloseScreen && sessionId && (
          <SessionCloseScreen
            sessionId={sessionId}
            moodPre={moodPre}
            messageCount={messages.filter((m) => m.role === "user").length}
            topThemes={getTopThemes()}
            onSaveReflection={handleCloseScreenSaveReflection}
            onNewSession={handleCloseScreenNewSession}
            onDismiss={() => { setShowCloseScreen(false); navigate("/insights"); }}
          />
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-40 w-64 glass border-r border-white/5 flex flex-col"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-display text-primary font-medium">Elevation</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {[
                { icon: <Sparkles className="w-4 h-4" />, label: "Chat", path: "/chat" },
                { icon: <BookOpen className="w-4 h-4" />, label: "Reflexiones", path: "/reflections" },
                { icon: <BarChart2 className="w-4 h-4" />, label: "Insights", path: "/insights" },
                { icon: <User className="w-4 h-4" />, label: "Mi perfil", path: "/profile" },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground truncate">{user?.name}</span>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setSidebarOpen(false)} />}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 glass border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-display text-sm font-medium">Elevation</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sessionId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCloseScreen(true)}
                className="text-xs text-muted-foreground"
              >
                Finalizar sesión
              </Button>
            )}
          </div>
        </div>

        {/* Crisis alert */}
        <AnimatePresence>
          {crisisResource && (
            <CrisisAlert resource={crisisResource} onDismiss={() => setCrisisResource(null)} />
          )}
        </AnimatePresence>

        {/* Mood pre-session */}
        <AnimatePresence>
          {showMoodPre && !sessionId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex items-center justify-center p-6"
            >
              <div className="text-center max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-medium mb-2">¿Cómo estás ahora?</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Tómate un momento para registrar cómo te sientes antes de comenzar.
                </p>
                <div className="flex justify-center gap-3">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => handleStartSession(mood.value)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-accent transition-colors group"
                      title={mood.label}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{mood.emoji}</span>
                      <span className="text-xs text-muted-foreground">{mood.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleStartSession(3)}
                  className="mt-4 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  Omitir
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mood post-session */}
        <AnimatePresence>
          {showMoodPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <div className="glass rounded-2xl p-8 text-center max-w-sm w-full">
                <h3 className="font-display text-2xl font-medium mb-2">Antes de irte...</h3>
                <p className="text-muted-foreground text-sm mb-6">¿Cómo te sientes ahora, al final de la sesión?</p>
                <div className="flex justify-center gap-3 mb-4">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => handleEndSession(mood.value)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-accent transition-colors group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{mood.emoji}</span>
                      <span className="text-xs text-muted-foreground">{mood.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleEndSession(3)}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground"
                >
                  Omitir y finalizar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        {sessionId && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[75%] group relative ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "message-user rounded-br-sm"
                        : "message-assistant rounded-bl-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        <Streamdown>{msg.content}</Streamdown>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleSaveReflection(msg.content)}
                        className="opacity-0 group-hover:opacity-100 mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-all"
                      >
                        <BookmarkPlus className="w-3 h-3" />
                        Guardar reflexión
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && <TypingIndicator />}
            {supportNote && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-2"
              >
                <p className="text-xs text-muted-foreground/60 bg-accent/30 rounded-full px-4 py-1.5 inline-block">
                  {supportNote}
                </p>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        {sessionId && (
          <div className="px-4 py-3 glass border-t border-white/5 flex-shrink-0">
            <div className="flex items-end gap-2 bg-card rounded-2xl border border-border px-4 py-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe lo que sientes..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none min-h-[24px] max-h-[120px] py-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="w-8 h-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0 disabled:opacity-30"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground/30 mt-2">
              Elevation no reemplaza la terapia profesional · Shift+Enter para nueva línea
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
