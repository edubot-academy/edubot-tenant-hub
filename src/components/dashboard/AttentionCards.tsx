import { ClipboardCheck, MessageCircle, MessageSquare, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { useAppContext } from "@/lib/app-context";
import { useInstructorGradingQueue } from "@/lib/instructor/instructor-grading-api";
import { useInstructorConversations } from "@/lib/instructor/instructor-messages-api";
import { useDiscussionThreads } from "@/lib/discussions-api";
import { useInstructorAnalyticsOverview } from "@/lib/instructor/instructor-analytics-api";

type CardDef = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub: string;
  to: string;
  tone: "accent" | "primary" | "secondary" | "destructive";
  loading?: boolean;
};

const toneMap: Record<CardDef["tone"], { card: string; icon: string; badge: string }> = {
  accent:      { card: "hover:border-accent/40",      icon: "bg-accent/20 text-accent-foreground",   badge: "bg-accent/15 text-accent-foreground" },
  primary:     { card: "hover:border-primary/40",     icon: "bg-primary/10 text-primary",             badge: "bg-primary/10 text-primary" },
  secondary:   { card: "hover:border-secondary/40",   icon: "bg-secondary/10 text-secondary",         badge: "bg-secondary/10 text-secondary" },
  destructive: { card: "hover:border-destructive/40", icon: "bg-destructive/10 text-destructive",     badge: "bg-destructive/10 text-destructive" },
};

function Card({ icon: Icon, label, value, sub, to, tone, loading }: CardDef) {
  const t = toneMap[tone];
  const isEmpty = !loading && (value === 0 || value === "0");

  return (
    <Link
      to={to}
      className={`group col-span-6 lg:col-span-3 p-5 bg-card border-2 border-border rounded-[24px] chunky-shadow flex flex-col gap-4 transition-colors cursor-pointer ${t.card}`}
    >
      <div className="flex items-center justify-between">
        <div className={`size-10 rounded-xl grid place-items-center ${t.icon}`}>
          <Icon className="size-5" strokeWidth={2.5} />
        </div>
        {!isEmpty && !loading && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${t.badge}`}>
            {value}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-black tabular-nums leading-none">
          {loading ? <span className="inline-block w-10 h-7 rounded-lg bg-muted animate-pulse" /> : value}
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-foreground/60 mt-2">{label}</div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs font-semibold text-foreground/45">{sub}</div>
          <ArrowRight className="size-3.5 text-foreground/25 group-hover:text-foreground/60 transition-colors" strokeWidth={2.5} />
        </div>
      </div>
    </Link>
  );
}

function BackendAttentionCards() {
  const gradingQuery = useInstructorGradingQueue({ status: "submitted", limit: 1 });
  const messagesQuery = useInstructorConversations();
  const discussionsQuery = useDiscussionThreads({ status: "open" });
  const analyticsQuery = useInstructorAnalyticsOverview();

  const pendingCount = gradingQuery.data?.total ?? 0;

  const unreadCount =
    messagesQuery.data?.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0) ?? 0;

  const openDiscussions =
    (discussionsQuery.data ?? []).filter((t) => t.repliesCount === 0 && !t.isResolved).length;

  const atRiskCount = analyticsQuery.data?.charts.atRiskStudents.length ?? 0;

  const cards: CardDef[] = [
    {
      icon: ClipboardCheck,
      label: "Pending grading",
      value: pendingCount,
      sub: pendingCount === 0 ? "All clear" : "Need review",
      to: "/grading",
      tone: "accent",
      loading: gradingQuery.isLoading,
    },
    {
      icon: MessageCircle,
      label: "Unread messages",
      value: unreadCount,
      sub: unreadCount === 0 ? "No new messages" : "From students",
      to: "/instructor/messages",
      tone: "primary",
      loading: messagesQuery.isLoading,
    },
    {
      icon: MessageSquare,
      label: "Open discussions",
      value: openDiscussions,
      sub: openDiscussions === 0 ? "All answered" : "No instructor reply",
      to: "/instructor/discussions",
      tone: "secondary",
      loading: discussionsQuery.isLoading,
    },
    {
      icon: AlertTriangle,
      label: "At-risk students",
      value: atRiskCount,
      sub: atRiskCount === 0 ? "Everyone on track" : "Falling behind",
      to: "/instructor/analytics",
      tone: "destructive",
      loading: analyticsQuery.isLoading,
    },
  ];

  return (
    <section className="col-span-12 grid grid-cols-12 gap-4">
      {cards.map((card) => <Card key={card.label} {...card} />)}
    </section>
  );
}

export function AttentionCards() {
  const { context } = useAppContext();

  if (context.mode === "backend") return <BackendAttentionCards />;

  const cards: CardDef[] = [
    {
      icon: ClipboardCheck,
      label: "Pending grading",
      value: 24,
      sub: "5 overdue",
      to: "/grading",
      tone: "accent",
    },
    {
      icon: MessageCircle,
      label: "Unread messages",
      value: 3,
      sub: "From students",
      to: "/instructor/messages",
      tone: "primary",
    },
    {
      icon: MessageSquare,
      label: "Open discussions",
      value: 7,
      sub: "No instructor reply",
      to: "/instructor/discussions",
      tone: "secondary",
    },
    {
      icon: AlertTriangle,
      label: "At-risk students",
      value: 3,
      sub: "Falling behind",
      to: "/instructor/analytics",
      tone: "destructive",
    },
  ];

  return (
    <section className="col-span-12 grid grid-cols-12 gap-4">
      {cards.map((card) => <Card key={card.label} {...card} />)}
    </section>
  );
}
