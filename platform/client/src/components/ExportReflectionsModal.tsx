import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, FileSpreadsheet, Download, Calendar, Tag, Loader2, CheckCircle2, X } from "lucide-react";
import jsPDF from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExportReflectionsModalProps {
  open: boolean;
  onClose: () => void;
  totalCount: number;
}

type ExportFormat = "csv" | "pdf";

// ─── PDF generation helper ────────────────────────────────────────────────────
function generatePDF(payload: {
  userName: string;
  exportedAt: string;
  reflections: Array<{
    id: number;
    title: string;
    content: string;
    tags: string[];
    isPinned: boolean;
    createdAt: string;
  }>;
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;

  // ── Colores Elevation ──
  const navy = [10, 15, 40] as [number, number, number];
  const gold = [212, 160, 23] as [number, number, number];
  const lightGray = [240, 240, 245] as [number, number, number];
  const textDark = [30, 30, 50] as [number, number, number];
  const textMuted = [120, 120, 140] as [number, number, number];

  // ── Portada ──
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, pageH, "F");

  // Logo / título
  doc.setTextColor(...gold);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("✦ Elevation", pageW / 2, 60, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("Mis Reflexiones", pageW / 2, 75, { align: "center" });

  doc.setTextColor(...textMuted);
  doc.setFontSize(10);
  doc.text(`${payload.userName}`, pageW / 2, 90, { align: "center" });
  doc.text(
    `Exportado el ${new Date(payload.exportedAt).toLocaleDateString("es-ES", {
      year: "numeric", month: "long", day: "numeric",
    })}`,
    pageW / 2, 98, { align: "center" }
  );

  // Línea decorativa dorada
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, 108, pageW - margin - 20, 108);

  doc.setTextColor(...textMuted);
  doc.setFontSize(9);
  doc.text(`${payload.reflections.length} reflexión${payload.reflections.length !== 1 ? "es" : ""}`, pageW / 2, 116, { align: "center" });

  // ── Páginas de contenido ──
  payload.reflections.forEach((reflection, idx) => {
    doc.addPage();

    // Fondo claro
    doc.setFillColor(...lightGray);
    doc.rect(0, 0, pageW, pageH, "F");

    // Header de página
    doc.setFillColor(...navy);
    doc.rect(0, 0, pageW, 18, "F");
    doc.setTextColor(...gold);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("✦ ELEVATION", margin, 11);
    doc.setTextColor(200, 200, 220);
    doc.setFont("helvetica", "normal");
    doc.text(`Reflexión ${idx + 1} de ${payload.reflections.length}`, pageW - margin, 11, { align: "right" });

    let y = 30;

    // Fecha
    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.text(reflection.createdAt, margin, y);
    if (reflection.isPinned) {
      doc.setTextColor(...gold);
      doc.text("★ Destacada", pageW - margin, y, { align: "right" });
    }
    y += 8;

    // Título
    doc.setTextColor(...textDark);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(reflection.title, contentW);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 7 + 4;

    // Línea separadora
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 30, y);
    y += 8;

    // Contenido
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...textDark);
    const contentLines = doc.splitTextToSize(reflection.content, contentW);
    contentLines.forEach((line: string) => {
      if (y > pageH - 30) {
        doc.addPage();
        doc.setFillColor(...lightGray);
        doc.rect(0, 0, pageW, pageH, "F");
        doc.setFillColor(...navy);
        doc.rect(0, 0, pageW, 18, "F");
        y = 28;
      }
      doc.text(line, margin, y);
      y += 6;
    });

    // Etiquetas
    if (reflection.tags.length > 0) {
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(...textMuted);
      doc.text("Etiquetas:", margin, y);
      y += 5;
      let tagX = margin;
      reflection.tags.forEach((tag) => {
        const tagW = doc.getTextWidth(`#${tag}`) + 6;
        if (tagX + tagW > pageW - margin) { tagX = margin; y += 7; }
        doc.setFillColor(...navy);
        doc.roundedRect(tagX, y - 4, tagW, 6, 1, 1, "F");
        doc.setTextColor(...gold);
        doc.text(`#${tag}`, tagX + 3, y);
        tagX += tagW + 3;
      });
    }

    // Footer
    doc.setFillColor(...navy);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setTextColor(100, 100, 130);
    doc.setFontSize(7);
    doc.text("Elevation · Bienestar emocional con IA ética", pageW / 2, pageH - 4, { align: "center" });
  });

  return doc;
}

// ─── CSV download helper ──────────────────────────────────────────────────────
function downloadCSV(csvData: string, filename: string) {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvData], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExportReflectionsModal({ open, onClose, totalCount }: ExportReflectionsModalProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [includeTags, setIncludeTags] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [done, setDone] = useState(false);

  const exportMutation = trpc.export.reflections.useMutation({
    onSuccess: (result) => {
      if (result.format === "csv" && result.data) {
        const filename = `elevation-reflexiones-${new Date().toISOString().split("T")[0]}.csv`;
        downloadCSV(result.data, filename);
        setDone(true);
        toast.success(`${result.count} reflexión${result.count !== 1 ? "es" : ""} exportada${result.count !== 1 ? "s" : ""} en CSV`);
      } else if (result.format === "pdf" && result.pdfPayload) {
        const doc = generatePDF(result.pdfPayload);
        const filename = `elevation-reflexiones-${new Date().toISOString().split("T")[0]}.pdf`;
        doc.save(filename);
        setDone(true);
        toast.success(`${result.count} reflexión${result.count !== 1 ? "es" : ""} exportada${result.count !== 1 ? "s" : ""} en PDF`);
      }
    },
    onError: () => {
      toast.error("No se pudo exportar. Intenta de nuevo.");
    },
  });

  function handleExport() {
    setDone(false);
    exportMutation.mutate({
      format,
      includeTags,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }

  function handleClose() {
    setDone(false);
    exportMutation.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Exportar reflexiones
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Descarga tu historial de reflexiones en el formato que prefieras.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <p className="text-center font-medium">¡Exportación completada!</p>
              <p className="text-center text-sm text-muted-foreground">
                Tu archivo se ha descargado automáticamente.
              </p>
              <Button variant="outline" onClick={handleClose} className="mt-2">
                Cerrar
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5 pt-2"
            >
              {/* Formato */}
              <div>
                <p className="text-sm font-medium mb-3">Formato de exportación</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["pdf", "csv"] as ExportFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        format === f
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      {f === "pdf" ? (
                        <FileText className={`w-7 h-7 ${format === f ? "text-primary" : "text-muted-foreground"}`} />
                      ) : (
                        <FileSpreadsheet className={`w-7 h-7 ${format === f ? "text-primary" : "text-muted-foreground"}`} />
                      )}
                      <span className={`text-sm font-medium uppercase tracking-wide ${format === f ? "text-primary" : "text-muted-foreground"}`}>
                        {f.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground text-center leading-tight">
                        {f === "pdf" ? "Documento con diseño" : "Tabla para Excel"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rango de fechas */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Rango de fechas <span className="text-muted-foreground font-normal">(opcional)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full text-sm rounded-lg border border-border/50 bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full text-sm rounded-lg border border-border/50 bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>

              {/* Opciones */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  Opciones
                </p>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setIncludeTags(!includeTags)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${includeTags ? "bg-primary" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${includeTags ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Incluir etiquetas temáticas
                  </span>
                </label>
              </div>

              {/* Resumen */}
              <div className="rounded-xl bg-muted/30 border border-border/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Se exportarán{" "}
                  <span className="font-semibold text-foreground">{totalCount} reflexión{totalCount !== 1 ? "es" : ""}</span>
                  {(dateFrom || dateTo) && " en el rango seleccionado"} en formato{" "}
                  <span className="font-semibold text-foreground uppercase">{format}</span>.
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={handleClose} className="flex-1" disabled={exportMutation.isPending}>
                  <X className="w-4 h-4 mr-1.5" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={exportMutation.isPending || totalCount === 0}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {exportMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1.5" />
                      Descargar {format.toUpperCase()}
                    </>
                  )}
                </Button>
              </div>

              {totalCount === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Aún no tienes reflexiones guardadas para exportar.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
