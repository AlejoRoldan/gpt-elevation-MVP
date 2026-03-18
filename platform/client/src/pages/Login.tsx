/**
 * Login Page — Diseño minimalista japonés
 * Dos vías: OAuth (Google/Manus) y email + contraseña manual
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.10, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

type AuthMode = "choose" | "login" | "register";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, refresh } = useAuth();
  const [mode, setMode] = useState<AuthMode>("choose");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    navigate("/chat");
    return null;
  }

  const loginMutation = trpc.auth.manual.login.useMutation({
    onSuccess: async () => { await refresh(); navigate("/chat"); },
    onError: (err) => setError(err.message),
  });

  const registerMutation = trpc.auth.manual.register.useMutation({
    onSuccess: async () => { await refresh(); navigate("/onboarding"); },
    onError: (err) => setError(err.message),
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else if (mode === "register") {
      if (!name.trim()) { setError("El nombre es requerido."); return; }
      if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
      registerMutation.mutate({ name, email, password });
    }
  };

  return (
    <div className="min-h-screen bg-sanctuary flex">
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-foreground/[0.02] border-r border-border/40 flex-col items-center justify-center p-16">
        <div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.06] blur-[80px]"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.12 25), transparent)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-[0.04] blur-[60px]"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.10 145), transparent)" }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center"
        >
          <div className="font-display text-[200px] leading-none text-foreground/[0.06] select-none mb-8">昇</div>
          <div className="divider-sumi max-w-[60px] mx-auto mb-8" />
          <p className="font-display text-2xl font-light text-foreground/50 tracking-widest mb-3">Elevation</p>
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground/50 font-body">Acompañamiento emocional</p>
        </motion.div>
        <motion.blockquote
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="absolute bottom-16 left-16 right-16 text-center"
        >
          <p className="font-display text-sm font-light text-foreground/25 italic leading-relaxed">
            "El camino más largo comienza con un solo paso tranquilo."
          </p>
          <p className="text-xs tracking-widest text-muted-foreground/25 mt-2 font-body uppercase">— Lao Tzu</p>
        </motion.blockquote>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => mode === "choose" ? navigate("/") : setMode("choose")}
          className="absolute top-6 left-6 flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {mode === "choose" ? "Inicio" : "Volver"}
        </motion.button>

        <div className="w-full max-w-sm">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="lg:hidden text-center mb-10"
          >
            <span className="font-display text-5xl text-foreground/20">昇</span>
          </motion.div>

          <AnimatePresence mode="wait">
            {mode === "choose" && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-10">
                  <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3 font-body">Bienvenido</p>
                  <h1 className="font-display text-3xl font-light text-foreground leading-snug">Entra a tu espacio</h1>
                  <div className="divider-sumi max-w-[60px] mt-4" />
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => { window.location.href = getLoginUrl(); }}
                    className="w-full flex items-center justify-between px-5 py-4 bg-background border border-border hover:border-foreground/30 hover:bg-accent/20 transition-all duration-300 rounded-sm shadow-washi group"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors font-light tracking-wide">Continuar con Google</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
                  </button>
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 divider-sumi" />
                    <span className="text-xs text-muted-foreground/50 tracking-widest uppercase font-body">o</span>
                    <div className="flex-1 divider-sumi" />
                  </div>
                  <button
                    onClick={() => setMode("login")}
                    className="w-full flex items-center justify-between px-5 py-4 bg-background border border-border hover:border-foreground/30 hover:bg-accent/20 transition-all duration-300 rounded-sm shadow-washi group"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors font-light tracking-wide">Correo y contraseña</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
                  </button>
                  <p className="text-center pt-4">
                    <span className="text-xs text-muted-foreground font-light">¿Primera vez? </span>
                    <button
                      onClick={() => setMode("register")}
                      className="text-xs text-foreground/60 hover:text-foreground underline underline-offset-4 transition-colors"
                    >
                      Crear una cuenta
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {(mode === "login" || mode === "register") && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-10">
                  <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3 font-body">
                    {mode === "login" ? "Acceso" : "Registro"}
                  </p>
                  <h1 className="font-display text-3xl font-light text-foreground leading-snug">
                    {mode === "login" ? "Bienvenido de nuevo" : "Crea tu espacio"}
                  </h1>
                  <div className="divider-sumi max-w-[60px] mt-4" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {mode === "register" && (
                    <div>
                      <label className="text-xs tracking-widest uppercase text-muted-foreground/70 mb-2 block font-body">Nombre</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                        autoComplete="name"
                        className="chat-input w-full rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 font-light"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs tracking-widest uppercase text-muted-foreground/70 mb-2 block font-body">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        autoComplete="email"
                        className="chat-input w-full rounded-sm pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 font-light"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs tracking-widest uppercase text-muted-foreground/70 mb-2 block font-body">
                      Contraseña
                      {mode === "register" && <span className="ml-2 text-muted-foreground/40 normal-case tracking-normal">(mín. 8 caracteres)</span>}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={mode === "register" ? 8 : 1}
                        maxLength={128}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        className="chat-input w-full rounded-sm pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 font-light"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/60 transition-colors"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-start gap-2.5 p-3.5 rounded-sm bg-destructive/8 border border-destructive/20"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive font-light">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-sumi py-3.5 text-xs tracking-widest uppercase rounded-sm shadow-washi disabled:opacity-40 mt-2"
                  >
                    {isLoading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground/50 text-center mt-6 font-light">
                  {mode === "login" ? (
                    <>¿No tienes cuenta?{" "}
                      <button onClick={() => { setMode("register"); setError(null); }} className="text-foreground/50 hover:text-foreground underline underline-offset-4 transition-colors">Crear una</button>
                    </>
                  ) : (
                    <>¿Ya tienes cuenta?{" "}
                      <button onClick={() => { setMode("login"); setError(null); }} className="text-foreground/50 hover:text-foreground underline underline-offset-4 transition-colors">Iniciar sesión</button>
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-[11px] text-muted-foreground/40 text-center mt-8 leading-relaxed font-light"
          >
            Tu privacidad está protegida por diseño.
            <br />Tus mensajes nunca llegan sin anonimizar a terceros.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
