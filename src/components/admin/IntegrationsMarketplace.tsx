import { useTranslation } from "react-i18next";
import { Search, Plug, Check, X, ArrowRight, Shield, Video, BookOpen, MessageSquare, CreditCard, Webhook, Globe, Mail, Calendar, FileText } from "lucide-react";
import { useState } from "react";

export type IntegrationCategory = "all" | "video" | "lms" | "communication" | "payments" | "sso" | "webhooks" | "productivity";

export type IntegrationStatus = "connected" | "not_connected" | "coming_soon";

export interface IntegrationItem {
  id: string;
  key: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  icon: string;
}

const CATEGORY_META: Record<IntegrationCategory, { labelKey: string; icon: typeof Video }> = {
  all: { labelKey: "admin.integrations.categories.all", icon: Plug },
  video: { labelKey: "admin.integrations.categories.video", icon: Video },
  lms: { labelKey: "admin.integrations.categories.lms", icon: BookOpen },
  communication: { labelKey: "admin.integrations.categories.communication", icon: MessageSquare },
  payments: { labelKey: "admin.integrations.categories.payments", icon: CreditCard },
  sso: { labelKey: "admin.integrations.categories.sso", icon: Shield },
  webhooks: { labelKey: "admin.integrations.categories.webhooks", icon: Webhook },
  productivity: { labelKey: "admin.integrations.categories.productivity", icon: Calendar },
};

const INTEGRATIONS: IntegrationItem[] = [
  { id: "zoom", key: "zoom", name: "Zoom", description: "Sync live sessions, recordings, and attendance.", category: "video", status: "connected", icon: "Video" },
  { id: "google_classroom", key: "google_classroom", name: "Google Classroom", description: "Import classrooms, rosters, and assignments.", category: "lms", status: "connected", icon: "BookOpen" },
  { id: "slack", key: "slack", name: "Slack", description: "Send announcements and alerts to channels.", category: "communication", status: "not_connected", icon: "MessageSquare" },
  { id: "stripe", key: "stripe", name: "Stripe", description: "Accept tuition and subscription payments.", category: "payments", status: "not_connected", icon: "CreditCard" },
  { id: "saml", key: "saml", name: "SAML / SSO", description: "Single sign-on with your identity provider.", category: "sso", status: "coming_soon", icon: "Shield" },
  { id: "webhook", key: "webhook", name: "Webhooks", description: "Receive real-time events on your endpoints.", category: "webhooks", status: "not_connected", icon: "Webhook" },
  { id: "teams", key: "teams", name: "Microsoft Teams", description: "Host live classes and share content.", category: "video", status: "coming_soon", icon: "Video" },
  { id: "canvas", key: "canvas", name: "Canvas LMS", description: "Sync courses, grades, and enrollments.", category: "lms", status: "coming_soon", icon: "BookOpen" },
  { id: "moodle", key: "moodle", name: "Moodle", description: "Import courses and student data.", category: "lms", status: "coming_soon", icon: "BookOpen" },
  { id: "discord", key: "discord", name: "Discord", description: "Community channels and voice rooms.", category: "communication", status: "coming_soon", icon: "MessageSquare" },
  { id: "mailgun", key: "mailgun", name: "Mailgun", description: "Transactional and bulk email delivery.", category: "communication", status: "coming_soon", icon: "Mail" },
  { id: "google_calendar", key: "google_calendar", name: "Google Calendar", description: "Two-way sync for schedules and events.", category: "productivity", status: "not_connected", icon: "Calendar" },
  { id: "notion", key: "notion", name: "Notion", description: "Embed pages and sync knowledge bases.", category: "productivity", status: "coming_soon", icon: "FileText" },
  { id: "paypal", key: "paypal", name: "PayPal", description: "Alternative tuition payment option.", category: "payments", status: "coming_soon", icon: "CreditCard" },
  { id: "google_sso", key: "google_sso", name: "Google Workspace SSO", description: "Sign in with Google Workspace accounts.", category: "sso", status: "coming_soon", icon: "Globe" },
];

const ICON_MAP: Record<string, typeof Video> = {
  Video, BookOpen, MessageSquare, CreditCard, Shield, Webhook, Mail, Calendar, FileText, Globe,
};

function IntegrationCard({
  item,
  onToggle,
}: {
  item: IntegrationItem;
  onToggle: (id: string) => void;
}) {
  const { t } = useTranslation();
  const Icon = ICON_MAP[item.icon] ?? Plug;

  return (
    <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`size-10 rounded-xl grid place-items-center ${
              item.status === "connected"
                ? "bg-primary/15 text-primary"
                : item.status === "coming_soon"
                ? "bg-muted text-foreground/40"
                : "bg-muted text-foreground/70"
            }`}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm font-bold">{item.name}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
              {t(`admin.integrations.categories.${item.category}`)}
            </div>
          </div>
        </div>
        {item.status === "connected" && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider">
            <Check className="size-3" strokeWidth={3} />
            {t("admin.integrations.connected")}
          </span>
        )}
        {item.status === "coming_soon" && (
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-foreground/40 text-[10px] font-black uppercase tracking-wider">
            {t("admin.integrations.comingSoon")}
          </span>
        )}
      </div>

      <p className="text-xs text-foreground/60 font-medium leading-relaxed flex-1">{item.description}</p>

      {item.status === "connected" ? (
        <button
          onClick={() => onToggle(item.id)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30 text-destructive text-xs font-bold hover:bg-destructive/10 cursor-pointer transition-colors"
        >
          <X className="size-3.5" strokeWidth={2.5} />
          {t("admin.integrations.disconnect")}
        </button>
      ) : item.status === "not_connected" ? (
        <button
          onClick={() => onToggle(item.id)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 cursor-pointer transition-opacity"
        >
          <Plug className="size-3.5" strokeWidth={2.5} />
          {t("admin.integrations.connect")}
        </button>
      ) : (
        <button
          disabled
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground/40 text-xs font-bold cursor-not-allowed"
        >
          {t("admin.integrations.comingSoon")}
        </button>
      )}
    </div>
  );
}

export function IntegrationsMarketplace() {
  const { t } = useTranslation();
  const [items, setItems] = useState<IntegrationItem[]>(INTEGRATIONS);
  const [filter, setFilter] = useState<IntegrationCategory>("all");
  const [query, setQuery] = useState("");

  const filtered = items.filter((i) => {
    const matchesCategory = filter === "all" || i.category === filter;
    const matchesQuery =
      query.trim() === "" ||
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.description.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const connectedCount = items.filter((i) => i.status === "connected").length;

  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (i.status === "connected") return { ...i, status: "not_connected" };
        if (i.status === "not_connected") return { ...i, status: "connected" };
        return i;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">{t("admin.integrations.marketplace.title")}</h2>
          <p className="text-sm text-foreground/55 font-medium mt-0.5">
            {t("admin.integrations.marketplace.subtitle", { count: connectedCount })}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40" strokeWidth={2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.integrations.marketplace.search")}
            className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm font-medium placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_META) as IntegrationCategory[]).map((cat) => {
          const CatIcon = CATEGORY_META[cat].icon;
          const active = filter === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground/70 hover:bg-muted"
              }`}
            >
              <CatIcon className="size-3.5" strokeWidth={2.5} />
              {t(CATEGORY_META[cat].labelKey)}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Plug className="size-10 text-foreground/20 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-bold text-foreground/50">{t("admin.integrations.marketplace.noResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <IntegrationCard key={item.id} item={item} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {/* Webhooks config hint */}
      {filter === "all" || filter === "webhooks" ? (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="size-10 rounded-xl bg-streak/10 text-streak grid place-items-center shrink-0">
            <Webhook className="size-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold">{t("admin.integrations.webhooks.hintTitle")}</div>
            <div className="text-xs text-foreground/55 font-medium">{t("admin.integrations.webhooks.hintBody")}</div>
          </div>
          <button className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-xs font-bold hover:bg-muted cursor-pointer shrink-0">
            {t("admin.integrations.webhooks.configure")}
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
