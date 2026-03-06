import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { BookOpen, Plus, Pin, Trash2, Tag, X, Sparkles, BarChart2, User, Search, ArrowLeft, Download } from "lucide-react";
import ExportReflectionsModal from "@/components/ExportReflectionsModal";
import { toast } from "sonner";

const SUGGESTED_TAGS = ["ansiedad", "trabajo", "relaciones", "crecimiento", "gratitud", "límites", "cuerpo", "sueños", "familia", "creatividad"];

export default function Reflections() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showNew, setShowNew] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const { data: reflections, refetch } = trpc.reflections.list.useQuery();
  const createMutation = trpc.reflections.create.useMutation({
    onSuccess: () => { refetch(); setShowNew(false); setNewContent(""); setNewTitle(""); setNewTags([]); toast.success("Reflexión guardada"); },
    onError: () => toast.error("No se pudo guardar"),
  });
  const deleteMutation = trpc.reflections.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Reflexión eliminada"); },
  });
  const pinMutation = trpc.reflections.update.useMutation({
    onSuccess: () => refetch(),
  });

  if (loading) return null;
  if (!isAuthenticated) { navigate("/"); return null; }

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (clean && !newTags.includes(clean) && newTags.length < 10) {
      setNewTags((prev) => [...prev, clean]);
    }
    setTagInput("");
  };

  const filtered = (reflections ?? []).filter((r) => {
    const matchSearch = !search || r.content.toLowerCase().includes(search.toLowerCase()) || r.title?.toLowerCase().includes(search.toLowerCase());
    const matchTag = !filterTag || (r.tags as string[])?.includes(filterTag);
    return matchSearch && matchTag;
  });

  const allTags = Array.from(new Set((reflections ?? []).flatMap((r) => r.tags as string[])));

  return (
    <div className="min-h-screen bg-sanctuary text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/chat")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-display font-medium">Reflexiones</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            title="Exportar reflexiones"
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/insights")} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent">
            <BarChart2 className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent">
            <User className="w-4 h-4" />
          </button>
          <Button size="sm" onClick={() => setShowNew(true)} className="bg-primary text-primary-foreground rounded-full px-4">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nueva
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search & filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar reflexiones..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {allTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  filterTag === tag ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* New reflection form */}
        <AnimatePresence>
          {showNew && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass rounded-2xl p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-medium">Nueva reflexión</h3>
                <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título (opcional)"
                className="w-full bg-transparent border-b border-border pb-2 mb-3 text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="¿Qué quieres guardar de este momento?"
                rows={4}
                className="w-full bg-transparent text-sm focus:outline-none resize-none placeholder:text-muted-foreground/50 mb-3"
              />
              {/* Tags */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {newTags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-0.5 bg-primary/15 text-primary text-xs rounded-full">
                      #{tag}
                      <button onClick={() => setNewTags((t) => t.filter((x) => x !== tag))}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                    placeholder="Agregar etiqueta..."
                    className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SUGGESTED_TAGS.filter((t) => !newTags.includes(t)).slice(0, 6).map((tag) => (
                    <button key={tag} onClick={() => addTag(tag)} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => createMutation.mutate({ content: newContent, title: newTitle || undefined, tags: newTags })}
                disabled={!newContent.trim() || createMutation.isPending}
                className="w-full bg-primary text-primary-foreground rounded-xl"
              >
                {createMutation.isPending ? "Guardando..." : "Guardar reflexión"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reflections list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search || filterTag ? "No hay reflexiones que coincidan." : "Aún no tienes reflexiones guardadas."}
            </p>
            {!showNew && (
              <Button variant="ghost" size="sm" onClick={() => setShowNew(true)} className="mt-3 text-primary">
                Crear la primera
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-light rounded-xl p-4 group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    {r.title && <p className="font-medium text-sm mb-1 truncate">{r.title}</p>}
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{r.content}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => pinMutation.mutate({ id: r.id, isPinned: !r.isPinned })}
                      className={`p-1.5 rounded-lg hover:bg-accent transition-colors ${r.isPinned ? "text-primary" : "text-muted-foreground"}`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: r.id })}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {(r.tags as string[])?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(r.tags as string[]).map((tag) => (
                      <span key={tag} className="text-xs text-muted-foreground/60 bg-accent/50 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground/40 mt-2">
                  {new Date(r.createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportReflectionsModal
        open={showExport}
        onClose={() => setShowExport(false)}
        totalCount={reflections?.length ?? 0}
      />
    </div>
  );
}
