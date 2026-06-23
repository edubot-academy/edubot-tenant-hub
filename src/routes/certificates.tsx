import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Expand,
  ExternalLink,
  Loader2,
  Mail,
  Pen,
  Plus,
  RefreshCw,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";
import { normalizeSignatureUpload } from "@/lib/certificate-signature";
import {
  useTenantCourses,
  useCourseStudentsWorkspace,
  type CourseStudentWorkspaceRecord,
  type TenantCourseRecord,
} from "@/lib/lms-core-api";
import {
  useCourseCertificateSettings,
  useUpdateCourseCertificateSettings,
  useCourseCertificates,
  useIssueCertificate,
  useApproveCertificate,
  useRejectCertificate,
  useRevokeCertificate,
  useRegenerateCertificates,
  useUploadCertificateSignature,
  useUploadCertificateSecondaryLogo,
  fetchCertificatePreviewHtml,
  type CertificateRecord,
  type CertificateStatus,
} from "@/lib/certificates-api";

export const Route = createFileRoute("/certificates")({
  head: () => ({ meta: [{ title: "Certificate Management" }] }),
  component: CertificatesPage,
});

type CourseTab = "settings" | "certificates";
type StatusFilter = "all" | CertificateStatus;
const STATUS_FILTERS: StatusFilter[] = ["all", "pending_approval", "issued", "rejected", "revoked"];

const DEFAULT_PRIMARY = "#122144";
const DEFAULT_ACCENT = "#F17E22";
const DEFAULT_LANG = "en";

const COLOR_PRESETS = [
  { label: "EduBot", primary: "#122144", accent: "#F17E22" },
  { label: "Forest", primary: "#1F4D3D", accent: "#D6A85F" },
  { label: "Royal", primary: "#1E3A8A", accent: "#F59E0B" },
  { label: "Graphite", primary: "#1F2937", accent: "#14B8A6" },
] as const;

/* ─── Preview HTML utilities ────────────────────────────────────────────────── */

function normalizeExactPreviewHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  const fitStyles = `
    <style id="edubot-preview-fit">
      html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: #ffffff !important; overflow: hidden !important; }
      body > * { margin-left: auto !important; margin-right: auto !important; max-width: none !important; flex: 0 0 auto !important; }
    </style>`;

  const fitScript = `
    <script id="edubot-preview-fit-script">
      (function () {
        function getRootNode() {
          if (!document.body) return null;
          var children = document.body.children || [];
          for (var i = 0; i < children.length; i++) {
            if (!/^(STYLE|SCRIPT|META|LINK)$/i.test(children[i].tagName)) return children[i];
          }
          return null;
        }
        function fitPreview() {
          var root = getRootNode();
          if (!root) return;
          root.style.transform = 'none';
          root.style.transformOrigin = 'top center';
          root.style.position = 'absolute';
          root.style.left = '50%';
          root.style.top = '0';
          root.style.margin = '0';
          var baseWidth = root.scrollWidth || root.offsetWidth;
          var baseHeight = root.scrollHeight || root.offsetHeight;
          var availableWidth = Math.max(window.innerWidth - 24, 260);
          var availableHeight = Math.max(window.innerHeight - 24, 260);
          if (!baseWidth || !baseHeight) return;
          var isModal = window.frameElement && window.frameElement.dataset.previewSurface === 'modal';
          var fitHeight = isModal ? Math.max(window.innerHeight - 24, 260) : availableHeight;
          var scale = Math.min(availableWidth / baseWidth, fitHeight / baseHeight, 1);
          var scaledHeight = baseHeight * scale;
          var topOffset = isModal ? Math.max((window.innerHeight - scaledHeight) / 2, 0) : 0;
          root.style.top = topOffset + 'px';
          root.style.transform = 'translateX(-50%) scale(' + scale + ')';
          document.documentElement.style.height = Math.ceil(isModal ? window.innerHeight : scaledHeight) + 'px';
          document.body.style.height = Math.ceil(isModal ? window.innerHeight : scaledHeight) + 'px';
        }
        window.addEventListener('load', fitPreview);
        window.addEventListener('resize', fitPreview);
        setTimeout(fitPreview, 0);
        setTimeout(fitPreview, 120);
      })();
    <\/script>`;

  const withViewport = html.includes('name="viewport"')
    ? html
    : html.replace(/<head([^>]*)>/i, '<head$1><meta name="viewport" content="width=device-width, initial-scale=1" />');

  if (/<head[^>]*>/i.test(withViewport)) {
    return withViewport.replace(/<\/head>/i, `${fitStyles}${fitScript}</head>`);
  }
  return `${fitStyles}${fitScript}${withViewport}`;
}

type CleanupFn = () => void;

function fitExactPreviewFrame(iframe: HTMLIFrameElement): CleanupFn {
  const fit = () => {
    const doc = iframe?.contentDocument;
    if (!doc?.body) return;
    const children = Array.from(doc.body.children);
    const root = children.find((c) => !["STYLE", "SCRIPT", "META", "LINK"].includes(c.tagName)) as HTMLElement | undefined;
    if (!iframe || !doc || !root) return;

    const availableWidth = Math.max(iframe.clientWidth - 24, 260);
    const availableHeight = Math.max(iframe.clientHeight - 24, 260);

    Object.assign(doc.documentElement.style, { margin: "0", padding: "0", width: "100%", overflow: "hidden" });
    Object.assign(doc.body.style, { margin: "0", padding: "0", width: "100%", overflow: "hidden", background: "#ffffff" });
    Object.assign(root.style, { transform: "none", transformOrigin: "top left", position: "absolute", left: "0", top: "0", margin: "0", maxWidth: "none" });

    const rect = root.getBoundingClientRect();
    const baseWidth = Math.max(root.scrollWidth, root.offsetWidth, rect.width);
    const baseHeight = Math.max(root.scrollHeight, root.offsetHeight, rect.height);
    if (!baseWidth || !baseHeight) return;

    const scale = Math.min(availableWidth / baseWidth, availableHeight / baseHeight, 1);
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;
    const leftOffset = Math.max((iframe.clientWidth - scaledWidth) / 2, 0);
    const topOffset = Math.max((iframe.clientHeight - scaledHeight) / 2, 0);

    root.style.left = `${leftOffset}px`;
    root.style.top = `${topOffset}px`;
    root.style.transform = `scale(${scale})`;
    doc.documentElement.style.height = `${iframe.clientHeight}px`;
    doc.body.style.height = `${iframe.clientHeight}px`;
  };

  const scheduleFit = () => window.requestAnimationFrame(fit);
  const timeouts = [0, 80, 240].map((d) => window.setTimeout(scheduleFit, d));
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleFit) : null;
  ro?.observe(iframe);
  if (iframe.parentElement) ro?.observe(iframe.parentElement);
  window.addEventListener("resize", scheduleFit);
  iframe.contentWindow?.addEventListener("resize", scheduleFit);

  return () => {
    timeouts.forEach(clearTimeout);
    ro?.disconnect();
    window.removeEventListener("resize", scheduleFit);
    iframe.contentWindow?.removeEventListener("resize", scheduleFit);
  };
}

/* ─── Certificate Preview Canvas ────────────────────────────────────────────── */

type TemplateForm = {
  certificateTitle: string;
  certificateLanguage: string;
  secondaryBrandName: string;
  secondaryBrandLogoUrl: string;
  issuerDisplayName: string;
  issuerTitle: string;
  signatureAssetUrl: string;
  pageOrientation: "landscape" | "portrait";
  primaryColor: string;
  accentColor: string;
};

function CertificatePreviewCanvas({
  tmpl,
  previewStudentName,
  previewCourseTitle,
  previewIssuerName,
  previewIssuerTitle,
  previewDate,
  compact = false,
}: {
  tmpl: TemplateForm;
  previewStudentName: string;
  previewCourseTitle: string;
  previewIssuerName: string;
  previewIssuerTitle: string;
  previewDate: string;
  compact?: boolean;
}) {
  const isPortrait = tmpl.pageOrientation === "portrait";
  const sizeClass = compact
    ? isPortrait
      ? "max-w-[260px] min-h-[370px] p-4"
      : "max-w-[360px] min-h-[240px] p-4"
    : isPortrait
      ? "max-w-[380px] min-h-[560px] p-6"
      : "w-full min-h-[380px] p-6";

  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-2xl bg-[#fffaf0] ${sizeClass}`}
      style={{
        border: `2px solid ${tmpl.primaryColor}`,
        boxShadow: `0 8px 32px ${tmpl.accentColor}22, inset 0 0 0 5px #f8f2e5, inset 0 0 0 7px ${tmpl.accentColor}`,
      }}
    >
      {/* Top color bar */}
      <div
        className={`absolute inset-x-0 top-0 ${compact ? "h-12" : "h-16"}`}
        style={{ backgroundColor: tmpl.primaryColor }}
      />
      {/* Inner border */}
      <div
        className="absolute inset-3 rounded-xl pointer-events-none border-2"
        style={{ borderColor: tmpl.accentColor }}
      />
      {/* Diagonal pattern */}
      <div
        className="absolute inset-4 rounded-lg opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent 0 14px, ${tmpl.primaryColor} 14px 16px, transparent 16px 30px), repeating-linear-gradient(-45deg, transparent 0 14px, ${tmpl.accentColor} 14px 16px, transparent 16px 30px)`,
        }}
      />
      {/* Accent band top */}
      <div
        className={`absolute inset-x-8 pointer-events-none ${compact ? "top-12 h-2" : "top-16 h-3"}`}
        style={{ backgroundColor: tmpl.accentColor, opacity: 0.7 }}
      />
      {/* Accent band bottom */}
      <div
        className={`absolute inset-x-8 pointer-events-none ${compact ? "bottom-4 h-2" : "bottom-5 h-3"}`}
        style={{ backgroundColor: tmpl.accentColor, opacity: 0.7 }}
      />

      {/* Content */}
      <div className={`relative ${compact ? "mt-10" : "mt-14"}`}>
        <p className={`text-center font-semibold uppercase tracking-widest text-slate-900 ${compact ? "text-[9px]" : "text-[11px]"}`}>
          EduBot Learning
        </p>
        <div
          className={`rounded-2xl border border-slate-200 bg-white/90 text-slate-900 ${compact ? "mt-8 px-3 py-4" : "mt-10 px-5 py-6"}`}
        >
          <p className={`text-center font-semibold uppercase tracking-widest text-slate-500 ${compact ? "text-[8px]" : "text-[10px]"}`}>
            {tmpl.certificateTitle.trim() || "Certificate of Achievement"}
          </p>
          <h3 className={`mt-2 text-center font-bold uppercase text-slate-900 tracking-wide ${compact ? "text-sm" : isPortrait ? "text-xl" : "text-2xl"}`}>
            CERTIFICATE
          </h3>
          {/* Accent divider */}
          <div className={`mx-auto mt-2 ${compact ? "h-1 w-16" : "h-1.5 w-24"}`} style={{ backgroundColor: tmpl.accentColor }} />

          {tmpl.secondaryBrandName && (
            <p className={`mt-2 text-center text-slate-500 ${compact ? "text-[8px]" : "text-xs"}`}>
              in partnership with{" "}
              <span className="font-semibold text-slate-900">{tmpl.secondaryBrandName}</span>
            </p>
          )}

          <p className={`text-center text-slate-500 ${compact ? "mt-3 text-[9px]" : "mt-5 text-xs"}`}>
            this certifies that
          </p>
          <p className={`text-center font-bold text-slate-900 ${compact ? "mt-2 text-lg" : "mt-3 text-3xl"}`}>
            {previewStudentName}
          </p>
          <div
            className={`mx-auto mt-2 h-px ${compact ? "w-24" : "w-40"}`}
            style={{ backgroundColor: tmpl.primaryColor }}
          />
          <p className={`text-center text-slate-500 ${compact ? "mt-3 text-[9px]" : "mt-4 text-xs"}`}>
            has successfully completed
          </p>
          <p className={`text-center font-semibold text-slate-900 ${compact ? "mt-1 text-sm" : "mt-2 text-lg"}`}>
            {previewCourseTitle}
          </p>

          {/* Diamond separator */}
          <div className={`relative mx-auto ${compact ? "mt-3 h-4 w-32" : "mt-4 h-5 w-40"}`}>
            <div className="absolute left-0 top-1/2 h-px w-[42%] -translate-y-1/2" style={{ background: `linear-gradient(90deg, transparent, ${tmpl.accentColor})` }} />
            <div className="absolute right-0 top-1/2 h-px w-[42%] -translate-y-1/2 scale-x-[-1]" style={{ background: `linear-gradient(90deg, transparent, ${tmpl.accentColor})` }} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border bg-[#fffdf7]" style={{ borderColor: tmpl.accentColor, width: compact ? 8 : 10, height: compact ? 8 : 10 }} />
          </div>

          {/* Footer: date + issuer */}
          <div className={`grid gap-3 ${compact ? "mt-4" : "mt-6"} ${isPortrait ? "" : "grid-cols-2"}`}>
            <div>
              <p className={`font-semibold uppercase tracking-widest text-slate-500 ${compact ? "text-[8px]" : "text-[10px]"}`}>
                Issued
              </p>
              <p className={`font-semibold text-slate-900 ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}>
                {previewDate}
              </p>
            </div>
            <div className={isPortrait ? "" : "text-right"}>
              {tmpl.signatureAssetUrl && (
                <img
                  src={tmpl.signatureAssetUrl}
                  alt="Signature"
                  className={`object-contain ${compact ? "mb-1 max-h-6 max-w-[80px]" : "mb-2 ml-auto max-h-12 max-w-[160px]"}`}
                />
              )}
              <p className={`font-semibold text-slate-900 ${compact ? "text-xs" : "text-sm"}`}>{previewIssuerName}</p>
              <div className={`mt-1 h-px w-full`} style={{ backgroundColor: tmpl.accentColor }} />
              <p className={`mt-1 font-semibold uppercase tracking-widest text-slate-500 ${compact ? "text-[8px]" : "text-[10px]"}`}>
                {previewIssuerTitle}
              </p>
            </div>
          </div>

          {/* Seal */}
          <div className={`flex justify-center ${compact ? "mt-3" : "mt-5"}`}>
            <div
              className={`flex items-center justify-center rounded-full ${compact ? "h-10 w-10" : "h-14 w-14"}`}
              style={{ background: `radial-gradient(circle at 50% 45%, #fff4c8, ${tmpl.accentColor} 48%, #9f7220)` }}
            >
              <Award className={`text-white ${compact ? "size-4" : "size-6"}`} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Signature Pad ─────────────────────────────────────────────────────────── */

function SignaturePad({
  disabled = false,
  onSave,
}: {
  disabled?: boolean;
  onSave: (file: File) => Promise<void>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#1f2937";
  }, []);

  const getPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const clearPad = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setHasStroke(false);
  }, []);

  const beginStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const pt = getPoint(e);
      if (!canvas || !ctx || !pt) return;
      isDrawingRef.current = true;
      lastPointRef.current = pt;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + 0.01, pt.y + 0.01);
      ctx.stroke();
      setHasStroke(true);
      canvas.setPointerCapture(e.pointerId);
    },
    [disabled, getPoint],
  );

  const moveStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled || !isDrawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const pt = getPoint(e);
      if (!canvas || !ctx || !pt) return;
      const last = lastPointRef.current ?? pt;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      lastPointRef.current = pt;
    },
    [disabled, getPoint],
  );

  const endStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      isDrawingRef.current = false;
      lastPointRef.current = null;
      canvasRef.current?.releasePointerCapture(e.pointerId);
    },
    [disabled],
  );

  const savePad = useCallback(async () => {
    const canvas = canvasRef.current;
    if (disabled || !canvas || !hasStroke) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    await onSave(new File([blob], `signature-drawn-${Date.now()}.png`, { type: "image/png" }));
  }, [disabled, hasStroke, onSave]);

  return (
    <div className="mt-2 rounded-2xl border-2 border-dashed border-border p-4 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-sm font-black">Draw your signature</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border-2 border-border bg-background text-xs font-black hover:bg-muted disabled:opacity-40"
            onClick={clearPad}
            disabled={disabled || !hasStroke}
          >
            Clear
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border-2 border-foreground bg-foreground text-background text-xs font-black disabled:opacity-40"
            onClick={savePad}
            disabled={disabled || !hasStroke}
          >
            {disabled ? "Saving…" : "Save Signature"}
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={960}
        height={240}
        className={`w-full h-36 rounded-xl border-2 border-border bg-[#fffdf8] ${disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"} touch-none`}
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent calc(50% - 0.5px), rgba(148,163,184,0.3) calc(50% - 0.5px), rgba(148,163,184,0.3) calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
        }}
        onPointerDown={beginStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      />
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

function CertificatesPage() {
  const { context } = useAppContext();
  if (!isBackendApiEnabled() || context.mode !== "backend") return <PrototypePage />;
  return <BackendPage />;
}

function BackendPage() {
  const { t } = useTranslation();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseTab, setCourseTab] = useState<CourseTab>("settings");

  const coursesQuery = useTenantCourses();
  const courses: TenantCourseRecord[] = coursesQuery.data?.items ?? [];

  return (
    <DashboardShell>
      <TopBar title={t("adminCertPage.title")} subtitle={t("adminCertPage.subtitle")} showStreak={false} />

      <div className="mb-5">
        <select
          value={selectedCourseId ?? ""}
          onChange={(e) => { setSelectedCourseId(e.target.value ? Number(e.target.value) : null); setCourseTab("settings"); }}
          className="w-full sm:w-80 px-3 py-2.5 rounded-xl border-2 border-border bg-card text-sm font-bold focus:outline-none focus:border-primary"
        >
          <option value="">{t("adminCertPage.selectCourse")}</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      {!selectedCourseId ? (
        <div className="bg-card border-2 border-border rounded-2xl p-8 text-center chunky-shadow">
          <Award className="mx-auto mb-3 size-10 text-foreground/30" strokeWidth={2} />
          <p className="font-bold text-foreground/60">{t("adminCertPage.state.noCourse")}</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-5">
            {(["settings", "certificates"] as CourseTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setCourseTab(tab)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-black transition-all ${courseTab === tab ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"}`}
              >
                {t(`adminCertPage.tab.${tab}`)}
              </button>
            ))}
          </div>
          {courseTab === "settings" && <SettingsPanel courseId={selectedCourseId} />}
          {courseTab === "certificates" && <CertificatesPanel courseId={selectedCourseId} />}
        </>
      )}
    </DashboardShell>
  );
}

/* ─── Settings Panel ────────────────────────────────────────────────────────── */

type FullForm = {
  enabled: boolean;
  issueMode: "manual" | "auto";
  approvalMode: "none" | "instructor" | "admin";
  allowReissue: boolean;
  eligibilityAttendanceRequired: boolean;
  eligibilityAttendancePercent: number;
  eligibilityHomeworkRequired: boolean;
  eligibilityHomeworkPercent: number;
  eligibilityActivitiesRequired: boolean;
  eligibilityActivitiesPercent: number;
} & TemplateForm;

const DEFAULT_FORM: FullForm = {
  enabled: false,
  issueMode: "manual",
  approvalMode: "none",
  allowReissue: false,
  certificateTitle: "",
  certificateLanguage: DEFAULT_LANG,
  secondaryBrandName: "",
  secondaryBrandLogoUrl: "",
  issuerDisplayName: "",
  issuerTitle: "",
  signatureAssetUrl: "",
  pageOrientation: "landscape",
  primaryColor: DEFAULT_PRIMARY,
  accentColor: DEFAULT_ACCENT,
  eligibilityAttendanceRequired: false,
  eligibilityAttendancePercent: 80,
  eligibilityHomeworkRequired: false,
  eligibilityHomeworkPercent: 70,
  eligibilityActivitiesRequired: false,
  eligibilityActivitiesPercent: 70,
};

function templateKey(f: FullForm) {
  return JSON.stringify({
    certificateTitle: f.certificateTitle,
    certificateLanguage: f.certificateLanguage,
    secondaryBrandName: f.secondaryBrandName,
    secondaryBrandLogoUrl: f.secondaryBrandLogoUrl,
    issuerDisplayName: f.issuerDisplayName,
    issuerTitle: f.issuerTitle,
    signatureAssetUrl: f.signatureAssetUrl,
    pageOrientation: f.pageOrientation,
    primaryColor: f.primaryColor,
    accentColor: f.accentColor,
  });
}

function certificateActivityTimestamp(cert: CertificateRecord) {
  const candidates = [
    cert.revokedAt,
    cert.rejectedAt,
    cert.approvedAt,
    cert.issuedAt,
  ]
    .map((value) => (value ? new Date(value).getTime() : 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  return candidates.length ? Math.max(...candidates) : 0;
}

function latestCertificateByStudent(certs: CertificateRecord[]) {
  const map = new Map<number, CertificateRecord>();
  certs.forEach((cert) => {
    const existing = map.get(cert.studentId);
    if (!existing || certificateActivityTimestamp(cert) >= certificateActivityTimestamp(existing)) {
      map.set(cert.studentId, cert);
    }
  });
  return map;
}

function SettingsPanel({ courseId }: { courseId: number }) {
  const { t, i18n } = useTranslation();
  const settingsQuery = useCourseCertificateSettings(courseId);
  const updateMutation = useUpdateCourseCertificateSettings();
  const regenerateMutation = useRegenerateCertificates();
  const sigUploadMutation = useUploadCertificateSignature();
  const logoUploadMutation = useUploadCertificateSecondaryLogo();

  const [form, setForm] = useState<FullForm>(DEFAULT_FORM);
  const [savedTemplateSnapshot, setSavedTemplateSnapshot] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [exactPreviewHtml, setExactPreviewHtml] = useState("");
  const [exactPreviewLoading, setExactPreviewLoading] = useState(false);
  const [exactPreviewError, setExactPreviewError] = useState("");
  const previewRequestIdRef = useRef(0);
  const previewFrameCleanupRef = useRef<Record<string, CleanupFn | undefined>>({});
  const sigFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!settingsQuery.data) return;
    const d = settingsQuery.data;
    const next: FullForm = {
      enabled: d.enabled ?? false,
      issueMode: d.issueMode ?? "manual",
      approvalMode: d.approvalMode ?? "none",
      allowReissue: d.allowReissue ?? false,
      certificateTitle: d.certificateTitle ?? "",
      certificateLanguage: d.certificateLanguage ?? DEFAULT_LANG,
      secondaryBrandName: d.secondaryBrandName ?? "",
      secondaryBrandLogoUrl: d.secondaryBrandLogoUrl ?? "",
      issuerDisplayName: d.issuerDisplayName ?? "",
      issuerTitle: d.issuerTitle ?? "",
      signatureAssetUrl: d.signatureAssetUrl ?? "",
      pageOrientation: (d.pageOrientation ?? "landscape") as "landscape" | "portrait",
      primaryColor: d.primaryColor ?? DEFAULT_PRIMARY,
      accentColor: d.accentColor ?? DEFAULT_ACCENT,
      eligibilityAttendanceRequired: d.eligibilityAttendanceRequired ?? false,
      eligibilityAttendancePercent: d.eligibilityAttendancePercent ?? 80,
      eligibilityHomeworkRequired: d.eligibilityHomeworkRequired ?? false,
      eligibilityHomeworkPercent: d.eligibilityHomeworkPercent ?? 70,
      eligibilityActivitiesRequired: d.eligibilityActivitiesRequired ?? false,
      eligibilityActivitiesPercent: d.eligibilityActivitiesPercent ?? 70,
    };
    setForm(next);
    setSavedTemplateSnapshot(templateKey(next));
  }, [settingsQuery.data]);

  useEffect(() => { setIsEditMode(false); setExactPreviewHtml(""); }, [courseId]);

  useEffect(() => {
    return () => { Object.values(previewFrameCleanupRef.current).forEach((fn) => fn?.()); };
  }, []);

  const previewStudentName = t("adminCertPage.previewCanvas.sampleStudentName");
  const previewCourseTitle = t("adminCertPage.previewCanvas.sampleCourseTitle");
  const previewIssuerName = form.issuerDisplayName.trim() || t("adminCertPage.previewCanvas.sampleIssuerName");
  const previewIssuerTitle = form.issuerTitle.trim() || t("adminCertPage.previewCanvas.issuerTitle");
  const previewDate = new Date().toLocaleDateString(
    form.certificateLanguage === "ru" ? "ru-RU" : form.certificateLanguage === "ky" ? "ky-KG" : "en-GB",
    { day: "2-digit", month: "long", year: "numeric" },
  );

  const loadExactPreview = useCallback(async () => {
    if (!courseId) return;
    const reqId = ++previewRequestIdRef.current;
    setExactPreviewLoading(true);
    setExactPreviewError("");
    try {
      const html = await fetchCertificatePreviewHtml(courseId, {
        certificateTitle: form.certificateTitle.trim() || null,
        secondaryBrandName: form.secondaryBrandName.trim() || null,
        issuerDisplayName: form.issuerDisplayName.trim() || null,
        issuerTitle: form.issuerTitle.trim() || null,
        certificateLanguage: form.certificateLanguage,
        pageOrientation: form.pageOrientation,
        primaryColor: form.primaryColor,
        accentColor: form.accentColor,
        previewStudentName,
        previewCourseTitle,
        previewIssuerName,
        previewIssuerTitle,
        previewIssuedAt: new Date().toISOString(),
      });
      if (reqId !== previewRequestIdRef.current) return;
      setExactPreviewHtml(normalizeExactPreviewHtml(html));
    } catch {
      if (reqId !== previewRequestIdRef.current) return;
      setExactPreviewError(t("adminCertPage.template.preview.unavailable"));
    } finally {
      if (reqId === previewRequestIdRef.current) setExactPreviewLoading(false);
    }
  }, [courseId, form.certificateTitle, form.secondaryBrandName, form.issuerDisplayName, form.issuerTitle, form.certificateLanguage, form.pageOrientation, form.primaryColor, form.accentColor, previewStudentName, previewCourseTitle, previewIssuerName, previewIssuerTitle, t]);

  useEffect(() => {
    if (!courseId) return;
    const id = window.setTimeout(() => { void loadExactPreview(); }, 300);
    return () => clearTimeout(id);
  }, [loadExactPreview, courseId]);

  const handlePreviewFrameLoad = useCallback((surface: string) => (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    previewFrameCleanupRef.current[surface]?.();
    previewFrameCleanupRef.current[surface] = fitExactPreviewFrame(e.currentTarget);
  }, []);

  async function handleSave() {
    if (!isEditMode) return;
    try {
      await updateMutation.mutateAsync({ courseId, patch: form });
      setSavedTemplateSnapshot(templateKey(form));
      setIsEditMode(false);
      toast.success(t("adminCertPage.toast.saved"));
    } catch {
      toast.error(t("adminCertPage.toast.saveError"));
    }
  }

  async function handleRegenerate() {
    try {
      await regenerateMutation.mutateAsync({ courseId });
      toast.success(t("adminCertPage.toast.regenerated"));
    } catch {
      toast.error(t("adminCertPage.toast.actionError"));
    }
  }

  async function handleSignatureSave(file: File) {
    const normalizedFile = await normalizeSignatureUpload(file);
    const result = await sigUploadMutation.mutateAsync({ courseId, file: normalizedFile });
    if (result?.signatureUrl) {
      setForm((f) => ({ ...f, signatureAssetUrl: result.signatureUrl }));
    }
    setIsSigModalOpen(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await logoUploadMutation.mutateAsync({ courseId, file });
      if (result?.secondaryBrandLogoUrl) {
        setForm((f) => ({ ...f, secondaryBrandLogoUrl: result.secondaryBrandLogoUrl }));
      }
    } catch {
      toast.error(t("adminCertPage.toast.actionError"));
    }
    e.target.value = "";
  }

  async function handleSigFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !courseId) return;
    try {
      const normalizedFile = await normalizeSignatureUpload(file);
      const result = await sigUploadMutation.mutateAsync({ courseId, file: normalizedFile });
      if (result?.signatureUrl) setForm((f) => ({ ...f, signatureAssetUrl: result.signatureUrl }));
      toast.success(t("adminCertPage.template.signer.signatureReady"));
    } catch {
      toast.error(t("adminCertPage.toast.actionError"));
    }
    e.target.value = "";
  }

  const set = <K extends keyof FullForm>(key: K, val: FullForm[K]) => setForm((f) => ({ ...f, [key]: val }));

  const hasTemplateChanges = templateKey(form) !== savedTemplateSnapshot;
  const fieldDisabled = !isEditMode;

  if (settingsQuery.isLoading) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}</div>;
  }
  if (settingsQuery.isError) {
    return (
      <div className="bg-card border-2 border-border rounded-2xl p-5 chunky-shadow flex items-center gap-3 text-destructive">
        <AlertCircle className="size-5 shrink-0" />
        <p className="font-bold text-sm">{t("adminCertPage.state.error")}</p>
      </div>
    );
  }

  const previewFrame = (surface: string, className: string) =>
    exactPreviewLoading ? (
      <div className={`flex items-center justify-center rounded-2xl border border-white/10 bg-zinc-800 text-zinc-400 text-xs font-medium ${className}`}>
        {t("adminCertPage.template.preview.loading")}
      </div>
    ) : exactPreviewError || !exactPreviewHtml ? (
      <CertificatePreviewCanvas
        tmpl={form}
        previewStudentName={previewStudentName}
        previewCourseTitle={previewCourseTitle}
        previewIssuerName={previewIssuerName}
        previewIssuerTitle={previewIssuerTitle}
        previewDate={previewDate}
        compact={surface === "inline"}
      />
    ) : (
      <iframe
        title={t("adminCertPage.template.preview.frameTitle")}
        srcDoc={exactPreviewHtml}
        data-preview-surface={surface}
        scrolling="no"
        onLoad={handlePreviewFrameLoad(surface)}
        className={`overflow-hidden rounded-2xl border border-white/10 bg-white ${className}`}
      />
    );

  return (
    <div className="space-y-5">
      {/* Basic settings */}
      <div className="bg-card border-2 border-border rounded-3xl chunky-shadow divide-y-2 divide-border">
        <div className="p-5">
          <h2 className="font-black text-sm uppercase tracking-wider text-foreground/50 mb-4">
            {t("adminCertPage.settings.header")}
          </h2>
          <ToggleRow label={t("adminCertPage.settings.enabled")} checked={form.enabled} onChange={(v) => set("enabled", v)} disabled={fieldDisabled} />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-1.5">{t("adminCertPage.settings.issueMode")}</label>
              <select value={form.issueMode} onChange={(e) => set("issueMode", e.target.value as "manual" | "auto")} disabled={fieldDisabled} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary disabled:opacity-60">
                <option value="manual">{t("adminCertPage.issueMode.manual")}</option>
                <option value="auto">{t("adminCertPage.issueMode.auto")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-1.5">{t("adminCertPage.settings.approvalMode")}</label>
              <select value={form.approvalMode} onChange={(e) => set("approvalMode", e.target.value as "none" | "instructor" | "admin")} disabled={fieldDisabled} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary disabled:opacity-60">
                <option value="none">{t("adminCertPage.approvalMode.none")}</option>
                <option value="instructor">{t("adminCertPage.approvalMode.instructor")}</option>
                <option value="admin">{t("adminCertPage.approvalMode.admin")}</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <ToggleRow label={t("adminCertPage.settings.allowReissue")} checked={form.allowReissue} onChange={(v) => set("allowReissue", v)} disabled={fieldDisabled} />
          </div>
        </div>

        {/* Eligibility */}
        <div className="p-5">
          <h3 className="font-black text-sm uppercase tracking-wider text-foreground/50 mb-4">{t("adminCertPage.settings.eligibility")}</h3>
          <div className="space-y-4">
            <EligibilityRow
              requiredLabel={t("adminCertPage.settings.attendanceRequired")}
              percentLabel={t("adminCertPage.settings.attendancePercent")}
              required={form.eligibilityAttendanceRequired}
              percent={form.eligibilityAttendancePercent}
              onRequiredChange={(v) => set("eligibilityAttendanceRequired", v)}
              onPercentChange={(v) => set("eligibilityAttendancePercent", v)}
              disabled={fieldDisabled}
            />
            <EligibilityRow
              requiredLabel={t("adminCertPage.settings.homeworkRequired")}
              percentLabel={t("adminCertPage.settings.homeworkPercent")}
              required={form.eligibilityHomeworkRequired}
              percent={form.eligibilityHomeworkPercent}
              onRequiredChange={(v) => set("eligibilityHomeworkRequired", v)}
              onPercentChange={(v) => set("eligibilityHomeworkPercent", v)}
              disabled={fieldDisabled}
            />
            <EligibilityRow
              requiredLabel={t("adminCertPage.settings.activitiesRequired")}
              percentLabel={t("adminCertPage.settings.activitiesPercent")}
              required={form.eligibilityActivitiesRequired}
              percent={form.eligibilityActivitiesPercent}
              onRequiredChange={(v) => set("eligibilityActivitiesRequired", v)}
              onPercentChange={(v) => set("eligibilityActivitiesPercent", v)}
              disabled={fieldDisabled}
            />
          </div>
        </div>
      </div>

      {/* Template section */}
      <div className="bg-card border-2 border-border rounded-3xl chunky-shadow">
        {/* Template header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b-2 border-border">
          <div>
            <h2 className="font-black text-sm uppercase tracking-wider">{t("adminCertPage.template.title")}</h2>
            <p className="mt-0.5 text-xs font-medium text-foreground/50">
              {isEditMode ? t("adminCertPage.template.editModeDescription") : t("adminCertPage.template.viewModeDescription")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEditMode && (
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending || !hasTemplateChanges}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:translate-y-0"
              >
                {updateMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                {updateMutation.isPending ? t("adminCertPage.template.saving") : t("adminCertPage.template.saveTemplate")}
              </button>
            )}
            <button
              onClick={() => setIsEditMode((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-border bg-card font-black text-sm hover:bg-muted transition-colors"
            >
              <Pen className="size-3.5" />
              {isEditMode ? t("adminCertPage.template.viewBtn") : t("adminCertPage.template.editBtn")}
            </button>
          </div>
        </div>

        {/* Template 2-column grid */}
        <div className="p-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
          {/* Left: form sections */}
          <div className="space-y-4">
            {/* Branding */}
            <div className="rounded-2xl border-2 border-border bg-background p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-black text-sm">{t("adminCertPage.template.branding.title")}</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground/50">{t("adminCertPage.template.branding.description")}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary uppercase tracking-wide">
                  Primary
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-1.5">{t("adminCertPage.template.branding.certTitle")}</label>
                  {fieldDisabled ? (
                    <div className="px-3 py-2 rounded-xl border-2 border-border bg-muted/40 text-sm font-bold">
                      {form.certificateTitle || <span className="text-foreground/40">{t("adminCertPage.template.notProvided")}</span>}
                    </div>
                  ) : (
                    <input type="text" value={form.certificateTitle} onChange={(e) => set("certificateTitle", e.target.value)} placeholder="Certificate of Achievement" className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-1.5">{t("adminCertPage.template.branding.secondaryBrand")}</label>
                  {fieldDisabled ? (
                    <div className="px-3 py-2 rounded-xl border-2 border-border bg-muted/40 text-sm font-bold">
                      {form.secondaryBrandName || <span className="text-foreground/40">{t("adminCertPage.template.notProvided")}</span>}
                    </div>
                  ) : (
                    <input type="text" value={form.secondaryBrandName} onChange={(e) => set("secondaryBrandName", e.target.value)} placeholder={t("adminCertPage.template.branding.secondaryBrandPlaceholder")} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary" />
                  )}
                </div>
                {/* Secondary logo */}
                <div className="rounded-xl border-2 border-border p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-black">{t("adminCertPage.template.branding.secondaryLogo")}</p>
                      <p className="text-[10px] font-medium text-foreground/50">{t("adminCertPage.template.branding.logoFormats")}</p>
                    </div>
                    {isEditMode && (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-border bg-card text-xs font-black hover:bg-muted cursor-pointer">
                        <Upload className="size-3.5" />
                        {form.secondaryBrandLogoUrl ? t("adminCertPage.template.replace") : t("adminCertPage.template.upload")}
                        <input ref={logoFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    )}
                  </div>
                  <div className="rounded-xl border-2 border-border bg-muted/40 px-3 py-3 min-h-12">
                    {form.secondaryBrandLogoUrl ? (
                      <img src={form.secondaryBrandLogoUrl} alt="Secondary brand" className="max-h-10 max-w-full object-contain" />
                    ) : (
                      <p className="text-[10px] font-medium text-foreground/40">{logoUploadMutation.isPending ? t("adminCertPage.template.branding.logoUploading") : t("adminCertPage.template.branding.logoEmpty")}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Signer & Format */}
            <div className="rounded-2xl border-2 border-border bg-background p-4">
              <div className="mb-4">
                <p className="font-black text-sm">{t("adminCertPage.template.signer.title")}</p>
                <p className="mt-0.5 text-xs font-medium text-foreground/50">{t("adminCertPage.template.signer.description")}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-1.5">{t("adminCertPage.template.signer.language")}</label>
                  <select value={form.certificateLanguage} onChange={(e) => set("certificateLanguage", e.target.value)} disabled={fieldDisabled} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary disabled:opacity-60">
                    <option value="en">{t("adminCertPage.template.languageOptions.en")}</option>
                    <option value="ru">{t("adminCertPage.template.languageOptions.ru")}</option>
                    <option value="ky">{t("adminCertPage.template.languageOptions.ky")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-1.5">{t("adminCertPage.template.signer.orientation")}</label>
                  <select value={form.pageOrientation} onChange={(e) => set("pageOrientation", e.target.value as "landscape" | "portrait")} disabled={fieldDisabled} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary disabled:opacity-60">
                    <option value="landscape">{t("adminCertPage.template.signer.landscape")}</option>
                    <option value="portrait">{t("adminCertPage.template.signer.portrait")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-1.5">{t("adminCertPage.template.signer.signerName")}</label>
                  {fieldDisabled ? (
                    <div className="px-3 py-2 rounded-xl border-2 border-border bg-muted/40 text-sm font-bold">
                      {form.issuerDisplayName || <span className="text-foreground/40">{t("adminCertPage.template.notProvided")}</span>}
                    </div>
                  ) : (
                    <input type="text" value={form.issuerDisplayName} onChange={(e) => set("issuerDisplayName", e.target.value)} placeholder={t("adminCertPage.template.signer.signerNamePlaceholder")} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-1.5">{t("adminCertPage.template.signer.signerRole")}</label>
                  {fieldDisabled ? (
                    <div className="px-3 py-2 rounded-xl border-2 border-border bg-muted/40 text-sm font-bold">
                      {form.issuerTitle || <span className="text-foreground/40">{t("adminCertPage.template.notProvided")}</span>}
                    </div>
                  ) : (
                    <input type="text" value={form.issuerTitle} onChange={(e) => set("issuerTitle", e.target.value)} placeholder={t("adminCertPage.template.signer.signerRolePlaceholder")} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary" />
                  )}
                </div>
              </div>

              {/* Signature */}
              <div className="mt-3 rounded-xl border-2 border-border p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-black">{t("adminCertPage.template.signer.signature")}</p>
                    <p className="text-[10px] font-medium text-foreground/50">{t("adminCertPage.template.signer.signatureDesc")}</p>
                  </div>
                  {isEditMode && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsSigModalOpen(true)}
                        disabled={sigUploadMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-border bg-card text-xs font-black hover:bg-muted disabled:opacity-50"
                      >
                        <Pen className="size-3.5" />
                        {t("adminCertPage.template.signer.drawOrUpdate")}
                      </button>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-border bg-card text-xs font-black hover:bg-muted cursor-pointer">
                        <Upload className="size-3.5" />
                        {t("adminCertPage.template.upload")}
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleSigFileUpload} />
                      </label>
                    </div>
                  )}
                </div>
                <div className="rounded-xl border-2 border-border bg-[#fffdf8] px-4 py-3 min-h-14">
                  {form.signatureAssetUrl ? (
                    <img src={form.signatureAssetUrl} alt="Signature" className="max-h-12 max-w-full object-contain" />
                  ) : (
                    <p className="text-[10px] font-medium text-foreground/40">
                      {sigUploadMutation.isPending ? t("adminCertPage.template.signer.signatureReady") : t("adminCertPage.template.signer.signatureEmpty")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="rounded-2xl border-2 border-border bg-background p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-black text-sm">{t("adminCertPage.template.appearance.title")}</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground/50">{t("adminCertPage.template.appearance.description")}</p>
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, primaryColor: DEFAULT_PRIMARY, accentColor: DEFAULT_ACCENT }))}
                    className="px-3 py-1.5 rounded-xl border-2 border-border bg-card text-xs font-black hover:bg-muted"
                  >
                    {t("adminCertPage.template.appearance.resetDefaults")}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Primary color */}
                <div className="rounded-xl border-2 border-border p-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-2">{t("adminCertPage.template.appearance.primaryColor")}</label>
                  <div className="h-10 w-full rounded-xl border-2 border-border mb-2" style={{ backgroundColor: form.primaryColor }} />
                  <div className="flex items-center gap-2">
                    {isEditMode && <input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="h-9 w-9 shrink-0 rounded-lg border-2 border-border bg-white p-1 cursor-pointer" />}
                    <div className="flex-1 rounded-lg border-2 border-border bg-muted/40 px-2 py-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Hex</p>
                      <p className="text-xs font-black uppercase">{form.primaryColor}</p>
                    </div>
                  </div>
                </div>
                {/* Accent color */}
                <div className="rounded-xl border-2 border-border p-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-foreground/50 mb-2">{t("adminCertPage.template.appearance.accentColor")}</label>
                  <div className="h-10 w-full rounded-xl border-2 border-border mb-2" style={{ backgroundColor: form.accentColor }} />
                  <div className="flex items-center gap-2">
                    {isEditMode && <input type="color" value={form.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="h-9 w-9 shrink-0 rounded-lg border-2 border-border bg-white p-1 cursor-pointer" />}
                    <div className="flex-1 rounded-lg border-2 border-border bg-muted/40 px-2 py-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Hex</p>
                      <p className="text-xs font-black uppercase">{form.accentColor}</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Color presets */}
              {isEditMode && (
                <div className="mt-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">{t("adminCertPage.template.appearance.presets")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, primaryColor: preset.primary, accentColor: preset.accent }))}
                        className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-left hover:border-primary hover:-translate-y-0.5 transition-all"
                      >
                        <span className="h-5 w-2 rounded-full border border-white/20" style={{ backgroundColor: preset.primary }} />
                        <span className="h-5 w-2 rounded-full border border-white/20" style={{ backgroundColor: preset.accent }} />
                        <span className="text-xs font-black">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: sticky preview sidebar */}
          <aside className="rounded-3xl bg-zinc-900 p-4 xl:sticky xl:top-6 xl:self-start">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-zinc-200">
                  {t("adminCertPage.template.preview.title")}
                </span>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black text-amber-300 uppercase">
                  {form.pageOrientation}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void loadExactPreview()}
                  disabled={exactPreviewLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-zinc-700 bg-zinc-800 text-zinc-100 text-xs font-black hover:bg-zinc-700 disabled:opacity-50"
                >
                  {exactPreviewLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  {t("adminCertPage.template.preview.refresh")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullPreviewOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-zinc-700 bg-zinc-800 text-zinc-100 text-xs font-black hover:bg-zinc-700"
                >
                  <Expand className="size-3.5" />
                  {t("adminCertPage.template.preview.fullPreview")}
                </button>
              </div>
            </div>
            {/* Preview frame */}
            <div className="mt-3 rounded-2xl border border-zinc-700 bg-white/95 p-2.5">
              {previewFrame("inline", form.pageOrientation === "portrait" ? "w-full h-[min(500px,70vw)] min-h-[280px]" : "w-full h-[min(360px,52vw)] min-h-[220px]")}
            </div>
            {/* Unsaved indicator */}
            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
              <p className={`text-xs font-medium ${hasTemplateChanges ? "text-amber-300" : "text-emerald-400"}`}>
                {hasTemplateChanges ? t("adminCertPage.template.preview.unsaved") : t("adminCertPage.template.preview.saved")}
              </p>
            </div>
          </aside>
        </div>

        {/* Footer: regenerate + save */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-t-2 border-border">
          <p className={`text-xs font-medium ${hasTemplateChanges ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {hasTemplateChanges ? t("adminCertPage.template.unsaved") : t("adminCertPage.template.saved")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRegenerate}
              disabled={regenerateMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-amber-300/60 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 font-black text-sm hover:border-amber-400 transition-colors disabled:opacity-50"
            >
              {regenerateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {regenerateMutation.isPending ? t("adminCertPage.template.footer.regenerating") : t("adminCertPage.actions.regenerate")}
            </button>
            <button
              onClick={handleSave}
              disabled={!isEditMode || updateMutation.isPending || !hasTemplateChanges}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:translate-y-0"
            >
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {updateMutation.isPending ? t("adminCertPage.template.saving") : t("adminCertPage.settings.save")}
            </button>
          </div>
        </div>
      </div>

      {/* Full preview modal */}
      <Dialog open={isFullPreviewOpen} onOpenChange={setIsFullPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[94vh] overflow-hidden rounded-3xl border-2 border-zinc-700 bg-zinc-900 p-0 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between gap-3 px-5 py-3 border-b border-zinc-800">
            <DialogTitle className="text-sm font-black text-zinc-200">{t("adminCertPage.template.preview.fullPreview")}</DialogTitle>
            <DialogDescription className="sr-only">Full-screen certificate preview</DialogDescription>
            <button onClick={() => setIsFullPreviewOpen(false)} className="rounded-full border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors">
              <X className="size-4" />
            </button>
          </DialogHeader>
          <div className="p-4 h-[82vh]">
            {previewFrame("modal", "w-full h-full")}
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature draw modal */}
      <Dialog open={isSigModalOpen} onOpenChange={setIsSigModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-2 border-border p-0 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 border-b-2 border-border">
            <div>
              <DialogTitle className="font-black">{t("adminCertPage.signatureModal.title")}</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs font-medium text-foreground/50">
                {t("adminCertPage.signatureModal.description")}
              </DialogDescription>
            </div>
            <button onClick={() => setIsSigModalOpen(false)} className="rounded-full border-2 border-border bg-card p-1.5 text-foreground/50 hover:text-foreground transition-colors">
              <X className="size-4" />
            </button>
          </DialogHeader>
          <div className="p-5">
            <SignaturePad disabled={sigUploadMutation.isPending} onSave={handleSignatureSave} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file inputs */}
      <input ref={sigFileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleSigFileUpload} />
    </div>
  );
}

/* ─── Certificates Panel ────────────────────────────────────────────────────── */

function CertificatesPanel({ courseId }: { courseId: number }) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [issueOverride, setIssueOverride] = useState(false);

  const allCertsQuery = useCourseCertificates(courseId, { limit: 500 });
  const filteredCertsQuery = useCourseCertificates(
    statusFilter === "all" ? null : courseId,
    statusFilter === "all" ? undefined : { status: statusFilter, limit: 100 },
  );
  const studentsQuery = useCourseStudentsWorkspace(courseId, { limit: 100 });

  const issueMutation = useIssueCertificate();
  const approveMutation = useApproveCertificate();
  const rejectMutation = useRejectCertificate();
  const revokeMutation = useRevokeCertificate();
  const regenerateMutation = useRegenerateCertificates();

  const allCerts = allCertsQuery.data?.items ?? [];
  const certs = statusFilter === "all" ? allCerts : (filteredCertsQuery.data?.items ?? []);
  const students = studentsQuery.data?.students ?? [];
  const certsByStudentId = latestCertificateByStudent(allCerts);
  const sortedStudents = students
    .slice()
    .sort((a, b) => {
      const aDate = a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0;
      const bDate = b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0;
      return bDate - aDate;
    });
  const visibleStudents = selectedStudentId
    ? sortedStudents.filter((student) => String(student.id) === selectedStudentId)
    : sortedStudents;
  const stats = {
    issued: allCerts.filter((item) => item.status === "issued").length,
    pending: allCerts.filter((item) => item.status === "pending_approval").length,
    rejected: allCerts.filter((item) => item.status === "rejected").length,
    revoked: allCerts.filter((item) => item.status === "revoked").length,
  };
  const activeCertsQuery = statusFilter === "all" ? allCertsQuery : filteredCertsQuery;

  async function handleIssue(studentId?: number, studentFullName?: string) {
    const targetStudentId = studentId ?? (selectedStudentId ? Number(selectedStudentId) : null);
    if (!targetStudentId) return;
    try {
      await issueMutation.mutateAsync({
        courseId,
        studentId: targetStudentId,
        allowEligibilityOverride: issueOverride,
        studentFullName,
      });
      toast.success(t("adminCertPage.toast.issued"));
      setIssueOverride(false);
    } catch {
      toast.error(t("adminCertPage.toast.issueError"));
    }
  }

  async function handleApprove(cert: CertificateRecord) {
    try { await approveMutation.mutateAsync({ certificateId: cert.id, courseId }); toast.success(t("adminCertPage.toast.approved")); }
    catch { toast.error(t("adminCertPage.toast.actionError")); }
  }

  async function handleReject(cert: CertificateRecord, reason?: string) {
    try { await rejectMutation.mutateAsync({ certificateId: cert.id, courseId, reason }); toast.success(t("adminCertPage.toast.rejected")); }
    catch { toast.error(t("adminCertPage.toast.actionError")); }
  }

  async function handleRevoke(cert: CertificateRecord, reason?: string) {
    try { await revokeMutation.mutateAsync({ certificateId: cert.id, courseId, reason }); toast.success(t("adminCertPage.toast.revoked")); }
    catch { toast.error(t("adminCertPage.toast.actionError")); }
  }

  async function handleRegenerate() {
    try { await regenerateMutation.mutateAsync({ courseId }); toast.success(t("adminCertPage.toast.regenerated")); }
    catch { toast.error(t("adminCertPage.toast.actionError")); }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: t("adminCertPage.metrics.issued"), value: stats.issued },
          { label: t("adminCertPage.metrics.pending"), value: stats.pending },
          { label: t("adminCertPage.metrics.rejected"), value: stats.rejected },
          { label: t("adminCertPage.metrics.revoked"), value: stats.revoked },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border-2 border-border bg-card p-4 chunky-shadow">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{metric.label}</p>
            <p className="mt-1 text-2xl font-black font-mono">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-xl border-2 px-3 py-1.5 text-xs font-black transition-all ${statusFilter === s ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"}`}>
              {t(`adminCertPage.filter.${s}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleRegenerate} disabled={regenerateMutation.isPending} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-border bg-card text-sm font-black hover:bg-muted transition-colors disabled:opacity-50">
            {regenerateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" strokeWidth={2.5} />}
            {t("adminCertPage.actions.regenerate")}
          </button>
        </div>
      </div>

      <div className="bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow">
        {activeCertsQuery.isLoading ? (
          <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : activeCertsQuery.isError ? (
          <div className="p-8 text-center"><AlertCircle className="mx-auto mb-3 size-8 text-destructive/60" /><p className="font-black text-destructive text-sm">{t("adminCertPage.state.error")}</p></div>
        ) : certs.length === 0 ? (
          <div className="p-8 text-center"><Award className="mx-auto mb-3 size-8 text-foreground/30" /><p className="font-black text-sm">{t("adminCertPage.state.empty")}</p></div>
        ) : (
          <ul className="divide-y-2 divide-border">
            {certs.map((cert) => (
              <CertificateRow key={cert.id} cert={cert} onApprove={() => handleApprove(cert)} onReject={(r) => handleReject(cert, r)} onRevoke={(r) => handleRevoke(cert, r)} />
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl border-2 border-border bg-card p-5 chunky-shadow">
        <div className="mb-4">
          <p className="font-black text-sm">{t("adminCertPage.students.title")}</p>
          <p className="text-xs font-medium text-foreground/60">{t("adminCertPage.students.description")}</p>
        </div>

        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-foreground/50">
              {t("adminCertPage.issueForm.student")}
            </label>
            {studentsQuery.isLoading ? (
              <div className="h-10 animate-pulse rounded-xl bg-muted" />
            ) : (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={!sortedStudents.length}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-bold focus:outline-none focus:border-primary disabled:opacity-60"
              >
                <option value="">{t("adminCertPage.students.allStudents")}</option>
                {sortedStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName ?? student.email ?? `Student #${student.id}`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-end">
            <ToggleRow label={t("adminCertPage.issueForm.override")} checked={issueOverride} onChange={setIssueOverride} />
          </div>
        </div>

        {studentsQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : visibleStudents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 px-4 py-6 text-sm font-medium text-foreground/60">
            {selectedStudentId ? t("adminCertPage.students.selectedNotFound", { defaultValue: "The selected student was not found." }) : t("adminCertPage.students.empty")}
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleStudents.map((student) => {
              const studentCert = certsByStudentId.get(student.id);
              const effectiveStatus = student.certificateStatus ?? studentCert?.status ?? null;
              return (
                <IssueStudentCard
                  key={student.id}
                  courseId={courseId}
                  student={student}
                  studentCert={studentCert}
                  effectiveStatus={effectiveStatus}
                  issuePending={issueMutation.isPending}
                  approvePending={approveMutation.isPending}
                  rejectPending={rejectMutation.isPending}
                  revokePending={revokeMutation.isPending}
                  onIssue={async (studentFullName) => {
                    setSelectedStudentId(String(student.id));
                    await handleIssue(student.id, studentFullName);
                  }}
                  onApprove={() => void (studentCert && handleApprove(studentCert))}
                  onReject={(reason) => void (studentCert && handleReject(studentCert, reason))}
                  onRevoke={() => void (studentCert && handleRevoke(studentCert))}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function IssueStudentCard({
  courseId,
  student,
  studentCert,
  effectiveStatus,
  issuePending,
  approvePending,
  rejectPending,
  revokePending,
  onIssue,
  onApprove,
  onReject,
  onRevoke,
}: {
  courseId: number;
  student: CourseStudentWorkspaceRecord;
  studentCert?: CertificateRecord;
  effectiveStatus: CertificateStatus | null;
  issuePending: boolean;
  approvePending: boolean;
  rejectPending: boolean;
  revokePending: boolean;
  onIssue: (studentFullName?: string) => Promise<void>;
  onApprove: () => void;
  onReject: (reason?: string) => void;
  onRevoke: () => void;
}) {
  const { t } = useTranslation();
  const [studentName, setStudentName] = useState(student.fullName ?? "");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const canIssue = !effectiveStatus || effectiveStatus === "rejected" || effectiveStatus === "revoked";
  const displayName = student.fullName ?? student.email ?? `Student #${student.id}`;
  const publicId = student.certificatePublicId ?? studentCert?.publicId;

  async function openPreview() {
    setPreviewLoading(true);
    try {
      const html = await fetchCertificatePreviewHtml(courseId, {
        previewStudentName: studentName.trim() || student.fullName || student.email || undefined,
      });
      setPreviewHtml(html);
    } catch {
      toast.error(t("adminCertPage.toast.previewError", { defaultValue: "Could not load preview" }));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleIssueAndPreview() {
    await onIssue(studentName.trim() || undefined);
    await openPreview();
  }

  return (
    <article className="rounded-2xl border-2 border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-black">{displayName}</h3>
          <div className="mt-2 inline-flex items-center gap-2 text-sm text-foreground/60">
            <Mail className="size-4" />
            <span className="truncate">{student.email}</span>
          </div>
        </div>
        <StatusBadge
          status={effectiveStatus ?? undefined}
          label={effectiveStatus ? t(`adminCertPage.status.${effectiveStatus}`) : t("adminCertPage.students.notIssued")}
        />
      </div>

      <div className="mt-3 rounded-xl bg-muted/40 px-3 py-2 text-[11px] font-mono text-foreground/60">
        {publicId ?? t("adminCertPage.students.noCertificateId")}
      </div>

      <div className="mt-4 space-y-3">
        {canIssue ? (
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-foreground/45">
              {t("adminCertPage.issueForm.studentName", { defaultValue: "Student name on certificate" })}
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={student.fullName ?? student.email ?? ""}
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void openPreview()}
            disabled={previewLoading || issuePending}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-card px-3.5 py-2 text-xs font-black hover:bg-muted disabled:opacity-50"
          >
            {previewLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
            {t("adminCertPage.actions.preview", { defaultValue: "Preview" })}
          </button>
          {canIssue ? (
            <button
              type="button"
              onClick={() => void handleIssueAndPreview()}
              disabled={issuePending}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-card px-3.5 py-2 text-xs font-black hover:bg-muted disabled:opacity-50"
            >
              {issuePending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              {t("adminCertPage.actions.issue")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {effectiveStatus === "pending_approval" && studentCert ? (
          <>
            <ActionBtn label={t("adminCertPage.actions.approve")} icon={<CheckCircle2 className="size-3.5" />} loading={false} disabled={approvePending} onClick={onApprove} className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10" />
            <ActionBtn label={t("adminCertPage.actions.reject")} icon={<XCircle className="size-3.5" />} loading={false} disabled={rejectPending} onClick={() => onReject()} className="border-destructive/30 text-destructive hover:bg-destructive/10" />
          </>
        ) : null}

        {effectiveStatus === "issued" ? (
          <>
            {publicId ? (
              <>
                <Link
                  to="/certificates/$publicId/download"
                  params={{ publicId: String(publicId) }}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border px-3.5 py-2 text-xs font-black hover:bg-muted"
                >
                  <Download className="size-3.5" />
                  {t("adminCertPage.actions.download")}
                </Link>
                <Link
                  to="/certificates/$publicId/verify"
                  params={{ publicId: String(publicId) }}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border px-3.5 py-2 text-xs font-black hover:bg-muted"
                >
                  <ExternalLink className="size-3.5" />
                  {t("adminCertPage.actions.verify")}
                </Link>
              </>
            ) : null}
            {studentCert ? <ActionBtn label={t("adminCertPage.actions.revoke")} icon={<XCircle className="size-3.5" />} loading={false} disabled={revokePending} onClick={onRevoke} className="border-destructive/30 text-destructive hover:bg-destructive/10" /> : null}
          </>
        ) : null}
      </div>

      <Dialog open={previewHtml !== null} onOpenChange={(open) => { if (!open) setPreviewHtml(null); }}>
        <DialogContent className="max-w-4xl w-full rounded-3xl border-2 border-border bg-card p-0 gap-0 [&>button]:hidden overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-border px-5 py-3">
            <p className="font-black text-sm">
              {t("adminCertPage.previewDialog.title", { defaultValue: "Certificate preview" })}
            </p>
            <button
              type="button"
              onClick={() => setPreviewHtml(null)}
              className="size-8 grid place-items-center rounded-xl hover:bg-muted text-foreground/60 cursor-pointer transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              title="Certificate preview"
              className="w-full border-0"
              style={{ height: "70vh" }}
              sandbox="allow-same-origin"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </article>
  );
}

function CertificateRow({ cert, onApprove, onReject, onRevoke }: { cert: CertificateRecord; onApprove: () => void; onReject: (r?: string) => void; onRevoke: (r?: string) => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<"approve" | "reject" | "revoke" | null>(null);

  async function act(type: "approve" | "reject" | "revoke") {
    setPending(type);
    try {
      if (type === "approve") await onApprove();
      else if (type === "reject") await onReject(reason.trim() || undefined);
      else await onRevoke(reason.trim() || undefined);
      setExpanded(false);
      setReason("");
    } finally { setPending(null); }
  }

  const canDownload = Boolean(cert.publicId);
  const canVerify = Boolean(cert.publicId);

  return (
    <li>
      <button onClick={() => setExpanded((v) => !v)} className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${expanded ? "bg-muted/40" : "hover:bg-muted/30"}`}>
        <StatusIcon status={cert.status} />
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate">{cert.studentName ?? cert.studentEmail ?? `Student #${cert.studentId}`}</p>
          <p className="text-xs font-mono text-foreground/40 truncate">{cert.publicId}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <StatusBadge status={cert.status} label={t(`adminCertPage.status.${cert.status}`)} />
          {cert.issuedAt && <span className="text-[11px] font-medium text-foreground/40">{new Date(cert.issuedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>}
        </div>
        <ChevronDown className={`size-4 text-foreground/40 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="border-t-2 border-border bg-muted/20 px-5 py-4 space-y-3">
          {(cert.status === "pending_approval" || cert.status === "issued") && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/45 mb-1.5">{t("adminCertPage.rejectForm.reason")}</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm font-medium focus:outline-none focus:border-primary" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {cert.status === "pending_approval" && (
              <>
                <ActionBtn label={t("adminCertPage.actions.approve")} icon={<CheckCircle2 className="size-3.5" />} loading={pending === "approve"} disabled={pending !== null} onClick={() => act("approve")} className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10" />
                <ActionBtn label={t("adminCertPage.actions.reject")} icon={<XCircle className="size-3.5" />} loading={pending === "reject"} disabled={pending !== null} onClick={() => act("reject")} className="border-destructive/30 text-destructive hover:bg-destructive/10" />
              </>
            )}
            {cert.status === "issued" && (
              <ActionBtn label={t("adminCertPage.actions.revoke")} icon={<XCircle className="size-3.5" />} loading={pending === "revoke"} disabled={pending !== null} onClick={() => act("revoke")} className="border-destructive/30 text-destructive hover:bg-destructive/10" />
            )}
            {canDownload && cert.publicId && (
              <Link to="/certificates/$publicId/download" params={{ publicId: cert.publicId }} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-border text-xs font-bold hover:bg-muted transition-colors">
                <Download className="size-3.5" />
                {t("adminCertPage.actions.download")}
              </Link>
            )}
            {canVerify && cert.publicId && (
              <Link to="/certificates/$publicId/verify" params={{ publicId: cert.publicId }} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-border text-xs font-bold hover:bg-muted transition-colors">
                <ExternalLink className="size-3.5" />
                {t("adminCertPage.actions.verify")}
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function ToggleRow({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-4 select-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <span className="text-sm font-bold">{label}</span>
      <div role="switch" aria-checked={checked} aria-disabled={disabled} onClick={() => { if (!disabled) onChange(!checked); }} className={`relative w-10 h-6 rounded-full border-2 transition-colors ${checked ? "bg-primary border-primary" : "bg-muted border-border"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </label>
  );
}

function EligibilityRow({ requiredLabel, percentLabel, required, percent, onRequiredChange, onPercentChange, disabled = false }: { requiredLabel: string; percentLabel: string; required: boolean; percent: number; onRequiredChange: (v: boolean) => void; onPercentChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1"><ToggleRow label={requiredLabel} checked={required} onChange={onRequiredChange} disabled={disabled} /></div>
      {required && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-foreground/60 whitespace-nowrap">{percentLabel}</label>
          <input type="number" min={0} max={100} value={percent} disabled={disabled} onChange={(e) => onPercentChange(Number(e.target.value))} className="w-20 px-2 py-1.5 rounded-lg border-2 border-border bg-background text-sm font-bold text-center focus:outline-none focus:border-primary disabled:opacity-60" />
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, icon, loading, disabled, onClick, className }: { label: string; icon: React.ReactNode; loading: boolean; disabled: boolean; onClick: () => void; className: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-colors disabled:opacity-50 ${className}`}>
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function StatusIcon({ status }: { status: CertificateStatus }) {
  if (status === "issued") return <CheckCircle2 className="size-5 shrink-0 text-emerald-500" strokeWidth={2.5} />;
  if (status === "rejected" || status === "revoked") return <XCircle className="size-5 shrink-0 text-destructive" strokeWidth={2.5} />;
  return <Award className="size-5 shrink-0 text-amber-500" strokeWidth={2.5} />;
}

function StatusBadge({ status, label }: { status?: CertificateStatus; label: string }) {
  const cls =
    status === "issued"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25"
      : status === "pending_approval"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25"
        : status === "rejected" || status === "revoked"
          ? "bg-destructive/15 text-destructive ring-1 ring-destructive/25"
          : "bg-slate-200 text-slate-700 ring-1 ring-slate-300";
  return <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${cls}`}>{label}</span>;
}

/* ─── Prototype ─────────────────────────────────────────────────────────────── */

const PROTO_CERTS = [
  { id: 1, publicId: "QL-7821-MEM", studentName: "Alice Johnson", status: "issued" as CertificateStatus, issuedAt: "2026-05-12T00:00:00Z" },
  { id: 2, publicId: "QL-4421-LAB", studentName: "Ben Ortiz", status: "pending_approval" as CertificateStatus, issuedAt: null },
  { id: 3, publicId: "QL-1109-STU", studentName: "Noor Said", status: "rejected" as CertificateStatus, issuedAt: null },
];

const PROTO_TMPL: TemplateForm = {
  certificateTitle: "Certificate of Achievement",
  certificateLanguage: "en",
  secondaryBrandName: "",
  secondaryBrandLogoUrl: "",
  issuerDisplayName: "Jane Smith",
  issuerTitle: "Academy Director",
  signatureAssetUrl: "",
  pageOrientation: "landscape",
  primaryColor: DEFAULT_PRIMARY,
  accentColor: DEFAULT_ACCENT,
};

function PrototypePage() {
  const { t } = useTranslation();
  const [courseTab, setCourseTab] = useState<CourseTab>("settings");

  return (
    <DashboardShell>
      <TopBar title={t("adminCertPage.title")} subtitle={t("adminCertPage.subtitle")} showStreak={false} />

      <div className="mb-5">
        <select className="w-full sm:w-80 px-3 py-2.5 rounded-xl border-2 border-border bg-card text-sm font-bold opacity-60" disabled>
          <option>Intro to Memory</option>
        </select>
      </div>
      <div className="flex gap-2 mb-5">
        {(["settings", "certificates"] as CourseTab[]).map((tab) => (
          <button key={tab} onClick={() => setCourseTab(tab)} className={`px-4 py-2 rounded-xl border-2 text-sm font-black transition-all ${courseTab === tab ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"}`}>
            {t(`adminCertPage.tab.${tab}`)}
          </button>
        ))}
      </div>

      {courseTab === "settings" && (
        <div className="space-y-5">
          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
            <p className="text-xs font-black uppercase tracking-wider text-foreground/50">{t("adminCertPage.settings.header")}</p>
            <ToggleRow label={t("adminCertPage.settings.enabled")} checked={true} onChange={() => {}} />
            <ToggleRow label={t("adminCertPage.settings.allowReissue")} checked={false} onChange={() => {}} />
          </div>
          {/* Preview canvas preview */}
          <div className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <p className="font-black text-sm mb-4">{t("adminCertPage.template.title")}</p>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
              <div className="space-y-3 opacity-60">
                <div className="h-10 rounded-xl border-2 border-border bg-muted" />
                <div className="h-10 rounded-xl border-2 border-border bg-muted" />
                <div className="h-10 rounded-xl border-2 border-border bg-muted" />
              </div>
              <div className="rounded-3xl bg-zinc-900 p-4">
                <p className="text-xs font-black text-zinc-400 mb-3">{t("adminCertPage.template.preview.title")}</p>
                <div className="rounded-2xl border border-zinc-700 bg-white/95 p-2.5">
                  <CertificatePreviewCanvas
                    tmpl={PROTO_TMPL}
                    previewStudentName="Student Name"
                    previewCourseTitle="Introduction to Memory"
                    previewIssuerName="Jane Smith"
                    previewIssuerTitle="Academy Director"
                    previewDate="15 June 2026"
                    compact
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {courseTab === "certificates" && (
        <div className="bg-card border-2 border-border rounded-3xl overflow-hidden chunky-shadow">
          <ul className="divide-y-2 divide-border">
            {PROTO_CERTS.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                <StatusIcon status={c.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">{c.studentName}</p>
                  <p className="text-xs font-mono text-foreground/40">{c.publicId}</p>
                </div>
                <StatusBadge status={c.status} label={t(`adminCertPage.status.${c.status}`)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardShell>
  );
}
