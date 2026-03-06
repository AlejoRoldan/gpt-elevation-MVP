import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sparkles, Shield, Heart, BookOpen, BarChart2, ArrowRight } from "lucide-react";

import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleEnter = () => {
    if (isAuthenticated) {
      navigate("/chat");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const features = [
    {
      icon: <Heart className="w-5 h-5" />,
      title: "Acompañamiento empático",
      desc: "Una IA entrenada con principios de psicología humanista que te escucha sin juicio y te invita a explorar tu mundo interior.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Privacidad por diseño",
      desc: "Tus datos nunca llegan sin anonimizar a servicios externos. Tú controlas qué se guarda y puedes borrar todo en cualquier momento.",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Reflexiones guardadas",
      desc: "Captura los momentos de claridad con etiquetas temáticas. Tu diario de crecimiento personal, siempre contigo.",
    },
    {
      icon: <BarChart2 className="w-5 h-5" />,
      title: "Insights emocionales",
      desc: "Visualiza tu evolución a lo largo del tiempo. Patrones de bienestar que te ayudan a conocerte mejor.",
    },
  ];

  return (
    <div className="min-h-screen bg-sanctuary text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-display text-lg font-medium text-primary">Elevation</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button onClick={() => navigate("/chat")} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Ir al espacio
            </Button>
          ) : (
            <Button onClick={handleEnter} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Entrar
            </Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.78 0.15 75), transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.14 265), transparent)" }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-muted-foreground mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Bienestar emocional con IA ética
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-display text-5xl md:text-7xl font-medium leading-tight mb-6"
          >
            Un espacio para{" "}
            <span className="text-gold-gradient italic">encontrarte</span>
            <br />contigo mismo
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Elevation es un acompañante de bienestar emocional que combina la profundidad de la psicología humanista
            con la disponibilidad de la inteligencia artificial, siempre desde la ética y el respeto a tu privacidad.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={handleEnter}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base rounded-full glow-gold-sm transition-all duration-300 hover:glow-gold"
            >
              Comenzar mi camino
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="text-muted-foreground hover:text-foreground px-8 py-6 text-base rounded-full"
            >
              Conocer más
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-muted-foreground/50" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-medium mb-4">
              Diseñado con <span className="text-gold-gradient">cuidado</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Cada decisión de diseño y tecnología está guiada por principios de trauma-informed care y ética de datos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.5}
                className="glass rounded-2xl p-6 hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-display text-xl font-medium mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ethics section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Shield className="w-12 h-12 text-primary mx-auto mb-6 opacity-80" />
            <h2 className="font-display text-4xl font-medium mb-6">
              Tu privacidad es <span className="text-gold-gradient">sagrada</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
              {[
                { label: "Consentimiento granular", desc: "Tú decides qué datos se guardan, punto por punto." },
                { label: "Derecho al olvido", desc: "Borra tu cuenta y todos tus datos en cualquier momento." },
                { label: "Sin venta de datos", desc: "Tus conversaciones nunca se usan para entrenar modelos externos." },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.3}
                  className="glass-light rounded-xl p-5 text-left"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mb-3" />
                  <p className="font-medium text-sm mb-1">{item.label}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center glass rounded-3xl p-12"
        >
          <h2 className="font-display text-4xl font-medium mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            El primer paso es el más importante. Elevation te acompaña con respeto, sin prisa y sin juicio.
          </p>
          <Button
            onClick={handleEnter}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-base rounded-full glow-gold-sm hover:glow-gold transition-all duration-300"
          >
            Comenzar ahora
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary/60" />
          <span className="font-display text-primary/60">Elevation</span>
        </div>
        <p className="text-xs">Diseñado con ética, privacidad y cuidado humano.</p>
      </footer>
    </div>
  );
}
