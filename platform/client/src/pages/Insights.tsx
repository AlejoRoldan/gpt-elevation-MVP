import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import { BarChart2, ArrowLeft, Sparkles, BookOpen, User, TrendingUp, Clock, MessageSquare, Heart } from "lucide-react";

const MOOD_LABELS: Record<number, string> = { 1: "😔", 2: "😕", 3: "😐", 4: "🙂", 5: "😊" };
const MOOD_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-display font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function Insights() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.insights.get.useQuery();

  if (loading) return null;
  if (!isAuthenticated) { navigate("/"); return null; }

  const sessions = data?.sessions ?? [];
  const reflections = data?.reflections ?? [];

  // Mood evolution data
  const moodData = sessions
    .filter((s) => s.moodPre || s.moodPost)
    .slice(0, 14)
    .reverse()
    .map((s, i) => ({
      day: new Date(s.startedAt).toLocaleDateString("es", { day: "numeric", month: "short" }),
      pre: s.moodPre ?? null,
      post: s.moodPost ?? null,
      index: i,
    }));

  // Tag frequency
  const tagCounts: Record<string, number> = {};
  reflections.forEach((r) => {
    (r.tags as string[])?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Stats
  const totalSessions = sessions.length;
  const totalReflections = reflections.length;
  const avgDuration = sessions.filter((s) => s.durationSeconds).reduce((acc, s) => acc + (s.durationSeconds ?? 0), 0) / (sessions.filter((s) => s.durationSeconds).length || 1);
  const avgMoodPre = sessions.filter((s) => s.moodPre).reduce((acc, s) => acc + (s.moodPre ?? 0), 0) / (sessions.filter((s) => s.moodPre).length || 1);
  const avgMoodPost = sessions.filter((s) => s.moodPost).reduce((acc, s) => acc + (s.moodPost ?? 0), 0) / (sessions.filter((s) => s.moodPost).length || 1);
  const moodImprovement = avgMoodPost - avgMoodPre;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-lg p-3 text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name === "pre" ? "Antes" : "Después"}: {MOOD_LABELS[Math.round(p.value)]} ({p.value?.toFixed(1)})
          </p>
        ))}
      </div>
    );
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
            <BarChart2 className="w-4 h-4 text-primary" />
            <span className="font-display font-medium">Insights</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/reflections")} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent">
            <BookOpen className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent">
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
        ) : totalSessions === 0 ? (
          <div className="text-center py-20">
            <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-2">Aún no hay datos suficientes.</p>
            <p className="text-xs text-muted-foreground/50">Completa algunas sesiones para ver tu evolución.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Sesiones totales" value={totalSessions} />
              <StatCard icon={<BookOpen className="w-4 h-4" />} label="Reflexiones" value={totalReflections} />
              <StatCard
                icon={<Clock className="w-4 h-4" />}
                label="Duración media"
                value={avgDuration > 0 ? `${Math.round(avgDuration / 60)} min` : "—"}
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Cambio de ánimo"
                value={moodImprovement > 0 ? `+${moodImprovement.toFixed(1)}` : moodImprovement !== 0 ? moodImprovement.toFixed(1) : "—"}
                sub={moodImprovement > 0 ? "Mejora promedio por sesión" : undefined}
              />
            </div>

            {/* Mood evolution chart */}
            {moodData.length > 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-primary" />
                  <h3 className="font-display font-medium">Evolución del ánimo</h3>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={moodData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="gradPre" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.78 0.15 75)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.78 0.15 75)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradPost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.14 165)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.55 0.14 165)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "oklch(0.58 0.02 265)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: "oklch(0.58 0.02 265)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="pre" stroke="oklch(0.78 0.15 75)" strokeWidth={2} fill="url(#gradPre)" connectNulls name="pre" />
                    <Area type="monotone" dataKey="post" stroke="oklch(0.55 0.14 165)" strokeWidth={2} fill="url(#gradPost)" connectNulls name="post" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded" style={{ background: "oklch(0.78 0.15 75)" }} />
                    <span className="text-xs text-muted-foreground">Antes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded" style={{ background: "oklch(0.55 0.14 165)" }} />
                    <span className="text-xs text-muted-foreground">Después</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top tags */}
            {topTags.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="font-display font-medium">Temas más explorados</h3>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={topTags.map(([name, count]) => ({ name, count }))} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.58 0.02 265)" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="glass rounded-lg p-2 text-xs">{payload[0].value} reflexiones</div>
                        ) : null
                      }
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {topTags.map((_, i) => (
                        <Cell key={i} fill={`oklch(${0.78 - i * 0.04} ${0.15 - i * 0.01} 75)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Recent sessions */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
              <h3 className="font-display font-medium mb-4">Sesiones recientes</h3>
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm">{new Date(s.startedAt).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" })}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.messageCount} mensajes
                        {s.durationSeconds ? ` · ${Math.round(s.durationSeconds / 60)} min` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-lg">
                      {s.moodPre && <span title="Antes">{MOOD_LABELS[s.moodPre]}</span>}
                      {s.moodPre && s.moodPost && <span className="text-xs text-muted-foreground">→</span>}
                      {s.moodPost && <span title="Después">{MOOD_LABELS[s.moodPost]}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
