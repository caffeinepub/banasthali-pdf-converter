import { Toaster } from "@/components/ui/sonner";
import jsPDF from "jspdf";
import {
  AlignLeft,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  Download,
  FileImage,
  FileText,
  Globe,
  Loader2,
  Menu,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type FileStatus = "queued" | "converting" | "done" | "error";

interface FileItem {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  pdfUrl?: string;
  error?: string;
}

const ACCEPTED_TYPES = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".txt",
  ".html",
];
const FILE_BADGES: Record<string, { label: string; color: string }> = {
  docx: { label: "DOCX", color: "#4472C4" },
  xlsx: { label: "XLSX", color: "#217346" },
  pptx: { label: "PPTX", color: "#D04423" },
  jpg: { label: "JPG", color: "#E8A838" },
  png: { label: "PNG", color: "#38A8E8" },
  txt: { label: "TXT", color: "#6B8E6B" },
  html: { label: "HTML", color: "#E86438" },
  gif: { label: "GIF", color: "#9B38E8" },
  webp: { label: "WEBP", color: "#38E8B5" },
};

function getFileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function getFileIcon(ext: string) {
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return <FileImage className="w-5 h-5" />;
  if (ext === "txt") return <AlignLeft className="w-5 h-5" />;
  if (ext === "html") return <Globe className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function convertFileToPdf(
  file: File,
  onProgress: (p: number) => void,
): Promise<string> {
  const ext = getFileExt(file.name);
  const doc = new jsPDF();

  onProgress(10);
  await new Promise((r) => setTimeout(r, 200));
  onProgress(30);

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    onProgress(60);
    await new Promise((r) => setTimeout(r, 150));

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const imgRatio = img.width / img.height;

    let drawW = pageW - 20;
    let drawH = drawW / imgRatio;
    if (drawH > pageH - 20) {
      drawH = pageH - 20;
      drawW = drawH * imgRatio;
    }

    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;
    const fmt = ext === "jpg" || ext === "jpeg" ? "JPEG" : "PNG";
    doc.addImage(dataUrl, fmt, x, y, drawW, drawH);
  } else if (ext === "txt" || ext === "html") {
    const text = await file.text();
    onProgress(50);
    const content =
      ext === "html"
        ? text
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        : text;
    const lines = content.split("\n");
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin + 10;
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    for (const line of lines) {
      if (y > pageH - margin) {
        doc.addPage();
        y = margin + 10;
      }
      const wrapped = doc.splitTextToSize(line || " ", 180);
      for (const wline of wrapped) {
        if (y > pageH - margin) {
          doc.addPage();
          y = margin + 10;
        }
        doc.text(wline, margin, y);
        y += 6;
      }
    }
  }

  onProgress(90);
  await new Promise((r) => setTimeout(r, 150));
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  onProgress(100);
  return url;
}

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/logo-icon-transparent.dim_64x64.png"
              alt="Banasthali PDF Converter Logo"
              className="w-9 h-9 rounded-lg"
            />
            <span
              className="font-display font-bold text-lg"
              style={{ color: "#F5F7FF" }}
            >
              Banasthali <span className="gradient-text">PDF</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Home", "Features", "How it Works", "Contact"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                data-ocid={`nav.${link.toLowerCase().replace(/ /g, "_")}.link`}
                className="text-sm transition-colors duration-200 hover:text-white"
                style={{ color: "#B7B9D3" }}
              >
                {link}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <a
              href="#converter"
              data-ocid="nav.start_converting.button"
              className="gradient-btn text-white text-sm font-semibold px-5 py-2.5 rounded-full inline-block"
            >
              Start Converting
            </a>
          </div>

          <button
            type="button"
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen((v) => !v)}
            data-ocid="nav.menu.toggle"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden glass-card px-4 pb-4"
          >
            {["Home", "Features", "How it Works", "Contact"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm"
                style={{ color: "#B7B9D3" }}
              >
                {link}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                document
                  .getElementById("converter")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="gradient-btn text-white text-sm font-semibold px-5 py-2.5 rounded-full inline-block mt-2"
            >
              Start Converting
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ paddingTop: "64px" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(109,91,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.12) 0%, transparent 50%), linear-gradient(135deg, #0b0b18 0%, #14142a 60%, #0f0f22 100%)",
        }}
      />
      <div
        className="absolute top-1/4 left-10 w-64 h-64 rounded-full opacity-10 animate-float"
        style={{
          background: "radial-gradient(circle, #6d5bff 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-10 w-80 h-80 rounded-full opacity-8 animate-float"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          filter: "blur(50px)",
          animationDelay: "1.5s",
        }}
      />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span
            className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
            style={{
              background: "rgba(109,91,255,0.2)",
              border: "1px solid rgba(109,91,255,0.4)",
              color: "#a78bfa",
            }}
          >
            ✦ Professional File Conversion
          </span>

          <h1
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ color: "#F5F7FF" }}
          >
            Convert Any File to{" "}
            <span className="gradient-text">PDF Instantly</span>
          </h1>

          <p
            className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: "#B7B9D3" }}
          >
            Banasthali PDF Converter — Transform images, documents, and text
            files into high-quality PDFs right in your browser. Fast, secure,
            free.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#converter"
              data-ocid="hero.start_converting.button"
              className="gradient-btn text-white font-bold px-8 py-4 rounded-full text-base glow-purple"
            >
              Start Converting Now
            </a>
            <a
              href="#features"
              data-ocid="hero.features.link"
              className="text-sm font-medium flex items-center gap-2 transition-colors hover:text-white"
              style={{ color: "#B7B9D3" }}
            >
              See Features <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mt-16"
        >
          {Object.entries(FILE_BADGES)
            .slice(0, 7)
            .map(([ext, { label, color }]) => (
              <span
                key={ext}
                className="file-badge text-white"
                style={{ background: color }}
              >
                {label}
              </span>
            ))}
        </motion.div>
      </div>

      <motion.a
        href="#converter"
        aria-label="Scroll to converter"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ color: "rgba(183,185,211,0.5)" }}
      >
        <ChevronDown className="w-6 h-6" />
      </motion.a>
    </section>
  );
}

function ConverterSection() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  const addFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter((f) => {
      const ext = `.${getFileExt(f.name)}`;
      return ACCEPTED_TYPES.includes(ext);
    });
    if (valid.length !== newFiles.length) {
      toast.error(
        "Some files are not supported. Accepted: JPG, PNG, GIF, WEBP, TXT, HTML",
      );
    }
    setFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        status: "queued" as FileStatus,
        progress: 0,
      })),
    ]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(Array.from(e.target.files));
      e.target.value = "";
    },
    [addFiles],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.pdfUrl) URL.revokeObjectURL(item.pdfUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const startConverting = useCallback(async () => {
    const queued = filesRef.current.filter((f) => f.status === "queued");
    if (!queued.length) {
      toast.error("No files to convert. Please add some files first.");
      return;
    }
    setIsConverting(true);

    for (const item of queued) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "converting", progress: 0 } : f,
        ),
      );
      try {
        const pdfUrl = await convertFileToPdf(item.file, (progress) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress } : f)),
          );
        });
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "done", progress: 100, pdfUrl }
              : f,
          ),
        );
        toast.success(`${item.file.name} converted successfully!`);
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error: "Conversion failed",
                }
              : f,
          ),
        );
        toast.error(`Failed to convert ${item.file.name}`);
      }
    }

    setIsConverting(false);
  }, []);

  useEffect(() => {
    return () => {
      for (const f of filesRef.current) {
        if (f.pdfUrl) URL.revokeObjectURL(f.pdfUrl);
      }
    };
  }, []);

  const handleDropZoneKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, []);

  return (
    <section id="converter" className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="glass-card rounded-2xl p-6 sm:p-8 glow-purple">
            <h2
              className="font-display text-2xl sm:text-3xl font-bold mb-2 text-center"
              style={{ color: "#F5F7FF" }}
            >
              File Upload &amp; Conversion
            </h2>
            <p
              className="text-center text-sm mb-6"
              style={{ color: "#B7B9D3" }}
            >
              Drop your files or click to upload — we'll handle the rest
            </p>

            {/* Drop zone */}
            <button
              type="button"
              aria-label="File upload drop zone. Click or drag files here."
              data-ocid="converter.dropzone"
              className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? "drop-zone-active" : ""}`}
              style={{
                borderColor: isDragging
                  ? "rgba(109,91,255,0.8)"
                  : "rgba(109,91,255,0.35)",
                background: isDragging
                  ? "rgba(109,91,255,0.1)"
                  : "rgba(20,20,42,0.5)",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={handleDropZoneKeyDown}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES.join(",")}
                onChange={onFileChange}
                className="hidden"
                data-ocid="converter.upload_button"
              />

              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(109,91,255,0.2)" }}
                >
                  <CloudUpload
                    className="w-7 h-7"
                    style={{ color: "#8b5cf6" }}
                  />
                </div>
                <div>
                  <p
                    className="font-semibold text-base"
                    style={{ color: "#F5F7FF" }}
                  >
                    DRAG &amp; DROP YOUR FILES
                  </p>
                  <p className="text-sm mt-1" style={{ color: "#B7B9D3" }}>
                    or click to browse files
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {Object.entries(FILE_BADGES)
                    .slice(3)
                    .map(([ext, { label, color }]) => (
                      <span
                        key={ext}
                        className="file-badge text-white"
                        style={{ background: color }}
                      >
                        {label}
                      </span>
                    ))}
                </div>
                <p
                  className="text-xs"
                  style={{ color: "rgba(183,185,211,0.6)" }}
                >
                  Supported: JPG, PNG, GIF, WEBP, TXT, HTML
                </p>
              </div>
            </button>

            {/* File list */}
            <AnimatePresence mode="popLayout">
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                  data-ocid="converter.list"
                >
                  {files.map((item, idx) => {
                    const ext = getFileExt(item.file.name);
                    const badge = FILE_BADGES[ext];
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        data-ocid={`converter.item.${idx + 1}`}
                        className="rounded-xl p-4 flex items-center gap-4"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(109,91,255,0.15)",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: badge
                              ? `${badge.color}33`
                              : "rgba(109,91,255,0.2)",
                          }}
                        >
                          <span style={{ color: badge?.color ?? "#8b5cf6" }}>
                            {getFileIcon(ext)}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "#F5F7FF" }}
                            >
                              {item.file.name}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span
                                className="text-xs"
                                style={{ color: "#B7B9D3" }}
                              >
                                {formatSize(item.file.size)}
                              </span>
                              {item.status === "queued" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(item.id);
                                  }}
                                  data-ocid={`converter.delete_button.${idx + 1}`}
                                  className="text-gray-500 hover:text-red-400 transition-colors"
                                  aria-label={`Remove ${item.file.name}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {(item.status === "converting" ||
                            item.status === "done") && (
                            <div className="space-y-1">
                              <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.1)" }}
                              >
                                <div
                                  className="h-full progress-bar-fill rounded-full"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-xs"
                                  style={{
                                    color:
                                      item.status === "done"
                                        ? "#4ade80"
                                        : "#B7B9D3",
                                  }}
                                >
                                  {item.status === "converting"
                                    ? "Converting…"
                                    : "Conversion complete"}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: "#B7B9D3" }}
                                >
                                  {item.progress}%
                                </span>
                              </div>
                            </div>
                          )}

                          {item.status === "error" && (
                            <p className="text-xs text-red-400 mt-1">
                              {item.error}
                            </p>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          {item.status === "converting" && (
                            <Loader2
                              className="w-5 h-5 animate-spin"
                              style={{ color: "#8b5cf6" }}
                            />
                          )}
                          {item.status === "done" && item.pdfUrl && (
                            <a
                              href={item.pdfUrl}
                              download={item.file.name.replace(
                                /\.[^.]+$/,
                                ".pdf",
                              )}
                              data-ocid={`converter.download.button.${idx + 1}`}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                              style={{
                                background: "rgba(74,222,128,0.15)",
                                border: "1px solid rgba(74,222,128,0.4)",
                                color: "#4ade80",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Download PDF
                            </a>
                          )}
                          {item.status === "queued" && (
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                background: "rgba(109,91,255,0.15)",
                                color: "#a78bfa",
                              }}
                            >
                              Queued
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              data-ocid="converter.start_converting.button"
              onClick={startConverting}
              disabled={
                isConverting ||
                files.filter((f) => f.status === "queued").length === 0
              }
              className="gradient-btn w-full mt-6 py-4 rounded-full text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Converting…
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Start Converting
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: <Zap className="w-7 h-7" />,
    title: "High Speed",
    desc: "Lightning-fast conversion powered entirely in your browser. No upload delays.",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.2)",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: "100% Secure",
    desc: "Your files never leave your device. All conversion happens locally.",
    color: "#10B981",
    glow: "rgba(16,185,129,0.2)",
  },
  {
    icon: <FileText className="w-7 h-7" />,
    title: "Multi-Format",
    desc: "Convert JPG, PNG, GIF, WEBP, TXT, and HTML files to PDF with ease.",
    color: "#6D5BFF",
    glow: "rgba(109,91,255,0.2)",
  },
  {
    icon: <Download className="w-7 h-7" />,
    title: "Easy Download",
    desc: "Instant download with one click. No accounts or subscriptions needed.",
    color: "#8B5CF6",
    glow: "rgba(139,92,246,0.2)",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className="font-display text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: "#F5F7FF" }}
          >
            Why Choose <span className="gradient-text">Banasthali PDF?</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#B7B9D3" }}>
            Professional-grade conversion tools, completely free
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              data-ocid={`features.item.${i + 1}`}
              className="glass-card rounded-2xl p-6 text-center transition-all duration-300"
              style={{ boxShadow: `0 8px 32px ${feat.glow}` }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: feat.glow, color: feat.color }}
              >
                {feat.icon}
              </div>
              <h3
                className="font-display font-bold text-lg mb-2"
                style={{ color: "#F5F7FF" }}
              >
                {feat.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#B7B9D3" }}
              >
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Upload Files",
      desc: "Drag and drop or click to select your files from your device.",
    },
    {
      num: "02",
      title: "Start Converting",
      desc: "Hit the button and watch your files convert in real time.",
    },
    {
      num: "03",
      title: "Download PDF",
      desc: "Download your converted PDFs instantly with a single click.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className="font-display text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: "#F5F7FF" }}
          >
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg" style={{ color: "#B7B9D3" }}>
            Three simple steps to your perfect PDF
          </p>
        </motion.div>

        <div className="relative">
          <div
            className="absolute top-8 left-1/2 -translate-x-1/2 w-2/3 h-0.5 hidden lg:block"
            style={{ background: "linear-gradient(90deg, #6d5bff, #8b5cf6)" }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                data-ocid={`how_it_works.item.${i + 1}`}
                className="text-center"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 font-display font-bold text-xl relative z-10"
                  style={{
                    background: "linear-gradient(135deg, #6d5bff, #8b5cf6)",
                    color: "white",
                    boxShadow: "0 0 30px rgba(109,91,255,0.4)",
                  }}
                >
                  {step.num}
                </div>
                <h3
                  className="font-display font-bold text-xl mb-2"
                  style={{ color: "#F5F7FF" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm" style={{ color: "#B7B9D3" }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  return (
    <footer
      id="contact"
      className="py-12 px-4"
      style={{
        background: "rgba(17,17,31,0.95)",
        borderTop: "1px solid rgba(109,91,255,0.15)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/logo-icon-transparent.dim_64x64.png"
              alt="Banasthali PDF Converter Logo"
              className="w-8 h-8 rounded-lg"
            />
            <span
              className="font-display font-bold text-lg"
              style={{ color: "#F5F7FF" }}
            >
              Banasthali <span className="gradient-text">PDF</span> Converter
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Home", "Features", "How it Works"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm transition-colors hover:text-white"
                style={{ color: "#B7B9D3" }}
              >
                {l}
              </a>
            ))}
          </div>
        </div>

        <div
          className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderColor: "rgba(109,91,255,0.1)" }}
        >
          <p className="text-xs" style={{ color: "rgba(183,185,211,0.5)" }}>
            © {year} Banasthali PDF Converter. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "rgba(183,185,211,0.5)" }}>
            Developed by{" "}
            <span style={{ color: "#8b5cf6", fontWeight: 600 }}>Pukhraj</span>
            {" · "}
            <a
              href="mailto:pukhraj@example.com"
              data-ocid="footer.contact.link"
              className="hover:text-white transition-colors"
              style={{ color: "#8b5cf6" }}
            >
              Contact
            </a>
          </p>
          <p className="text-xs" style={{ color: "rgba(183,185,211,0.5)" }}>
            Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
              style={{ color: "#8b5cf6" }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #0b0b18 0%, #14142a 60%, #0f0f22 100%)",
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(40,40,70,0.95)",
            border: "1px solid rgba(109,91,255,0.4)",
            color: "#F5F7FF",
          },
        }}
      />
      <NavBar />
      <main>
        <HeroSection />
        <ConverterSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}
