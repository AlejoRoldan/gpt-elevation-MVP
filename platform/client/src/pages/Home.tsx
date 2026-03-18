/**
 * Home — Landing page
 * Diseño: Minimalismo japonés (wabi-sabi, ma, shibui)
 * Paleta: Washi paper, tinta sumi, sakura, bambú
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Shield, Heart, BookOpen, BarChart2, ArrowRight } from "lucide-react";
import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.14, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.10, duration: 0.8, ease: "easeOut" },
  }),
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleEnter = () => {
    if (isAuthenticated) {
      navigate("/chat");
    } else {
      navigate("/login");
    }
  };

  const features = [
    {
      kanji: "心",
      reading: "kokoro",
      title: "Acompañamiento empático",
      desc: "Una IA entrenada con principios de psicología humanista que te escucha sin juicio y te invita a explorar tu mundo interior.",
    },
    {
      kanji: "間",
      reading: "ma",
      title: "Espacio de silencio",
      desc: "El silencio entre las palabras tiene tanto valor como las palabras mismas. Aquí, el ritmo es tuyo.",
    },
    {
      kanji: "省",
      reading: "hansei",
      title: "Reflexiones guardadas",
      desc: "Captura los momentos de claridad con etiquetas temáticas. Tu diario de crecimiento personal, siempre contigo.",
    },
    {
      kanji: "道",
      reading: "michi",
      title: "Insights del camino",
      desc: "Visualiza tu evolución a lo largo del tiempo. Patrones de bienestar que te ayudan a conocerte mejor.",
    },
  ];

  return (
    <div className="min-h-screen bg-sanctuary text-foreground overflow-hidden">

      {/* ─── Navegación ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 glass border-b border-border/40">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3"
        >
          <span className="font-display text-xl text-foreground/60 select-none">昇</span>
          <span className="font-display text-sm tracking-[0.2em] text-foreground/60 uppercase">Elevation</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {isAuthenticated ? (
            <Button
              onClick={() => navigate("/chat")}
              size="sm"
              variant="ghost"
              className="text-foreground/60 hover:text-foreground hover:bg-accent/50 tracking-wider text-xs uppercase"
            >
              Ir al espacio
            </Button>
          ) : (
            <Button
              onClick={handleEnter}
              size="sm"
              variant="ghost"
              className="text-foreground/60 hover:text-foreground hover:bg-accent/50 tracking-wider text-xs uppercase"
            >
              Entrar
            </Button>
          )}
        </motion.div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Manchas de tinta difuminadas */}
        <div
          className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[80px] pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.12 25), transparent)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[60px] pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.10 145), transparent)" }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Kanji decorativo de fondo */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={0}
            className="absolute -top-16 left-1/2 -translate-x-1/2 font-display text-[180px] leading-none text-foreground/[0.025] select-none pointer-events-none"
            aria-hidden
          >
            昇
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-10 font-body"
          >
            Bienestar emocional · IA ética · Privacidad total
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-display text-5xl md:text-6xl font-light leading-[1.25] mb-6 text-foreground"
          >
            Un espacio para{" "}
            <em className="not-italic text-sumi-gradient">encontrarte</em>
            <br />contigo mismo
          </motion.h1>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={2}
            className="divider-sumi max-w-[120px] mx-auto my-8"
          />

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-base text-muted-foreground leading-relaxed mb-12 max-w-lg mx-auto font-light"
          >
            Elevation es un compañero de reflexión basado en IA, guiado por los principios
            de la Terapia de Aceptación y Compromiso. Sin prisa. Sin juicio.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Button
              onClick={handleEnter}
              className="btn-sumi px-10 py-5 text-xs tracking-widest uppercase rounded-sm shadow-washi hover:shadow-washi-md transition-all duration-300"
            >
              Comenzar
              <ArrowRight className="ml-3 w-3 h-3" />
            </Button>
            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Conocer más
            </button>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />
        </motion.div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4 font-body">
              Principios
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
              Diseñado con intención
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/40">
            {features.map((f, i) => (
              <motion.div
                key={f.kanji}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.15}
                className="bg-background p-10 group hover:bg-accent/20 transition-colors duration-500"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 text-center">
                    <span className="font-display text-4xl text-foreground/20 group-hover:text-foreground/40 transition-colors duration-500 block leading-none">
                      {f.kanji}
                    </span>
                    <span className="text-[10px] tracking-widest text-muted-foreground/50 uppercase mt-1 block font-body">
                      {f.reading}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-medium text-foreground mb-2 tracking-wide">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-light">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Privacidad ─── */}
      <section className="py-32 px-6 bg-accent/10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4 font-body">
              Privacidad
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-6">
              Tu identidad es{" "}
              <em className="not-italic text-sumi-gradient">sagrada</em>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto font-light">
              Implementamos una bóveda de identidad de cero conocimiento. Tus datos personales
              nunca llegan a servicios externos de IA.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border/40">
            {[
              { icon: <Shield className="w-4 h-4" />, label: "Consentimiento granular", desc: "Tú decides qué datos se guardan, punto por punto." },
              { icon: <Heart className="w-4 h-4" />, label: "Derecho al olvido", desc: "Borra tu cuenta y todos tus datos en cualquier momento." },
              { icon: <BookOpen className="w-4 h-4" />, label: "Sin venta de datos", desc: "Tus conversaciones nunca se usan para entrenar modelos externos." },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.15}
                className="bg-background p-8 text-left"
              >
                <div className="text-muted-foreground/50 mb-4">{item.icon}</div>
                <p className="text-sm font-medium text-foreground mb-2 tracking-wide">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="py-40 px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center"
        >
          <div className="font-display text-8xl text-foreground/[0.04] mb-8 select-none" aria-hidden>
            始
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-4">
            ¿Listo para comenzar?
          </h2>
          <div className="divider-sumi max-w-[80px] mx-auto my-6" />
          <p className="text-sm text-muted-foreground mb-12 leading-relaxed font-light">
            El primer paso es el más importante. Elevation te acompaña con respeto, sin prisa y sin juicio.
          </p>
          <Button
            onClick={handleEnter}
            className="btn-sumi px-12 py-5 text-xs tracking-widest uppercase rounded-sm shadow-washi hover:shadow-washi-md transition-all duration-300"
          >
            Comenzar ahora
            <ArrowRight className="ml-3 w-3 h-3" />
          </Button>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="font-display text-lg text-foreground/25">昇</span>
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground/50 font-body">
            Elevation
          </span>
        </div>
        <p className="text-xs text-muted-foreground/40 font-light">
          Diseñado con ética, privacidad y cuidado humano.
        </p>
      </footer>
    </div>
  );
}
