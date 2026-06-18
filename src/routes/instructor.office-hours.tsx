import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Calendar, Clock, Video, X, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context";
import i18n from "@/lib/i18n";
import {
  useOfficeHourSlots,
  useCreateOfficeHourSlot,
  useDeleteOfficeHourSlot,
  useCancelBooking,
  type OfficeHourSlotRecord,
} from "@/lib/office-hours-api";

export const Route = createFileRoute("/instructor/office-hours")({
  head: () => ({
    meta: [
      {
        title: i18n.t("instructorOfficeHours.metaTitle", {
          appName: i18n.t("app.name"),
          defaultValue: "{{appName}} — Office Hours",
        }),
      },
    ],
  }),
  component: OfficeHoursPage,
});

type ProtoSlot = { id: string; day: string; date: string; start: string; end: string; bookedBy?: string; topic?: string };

const PROTO_INITIAL: ProtoSlot[] = [
  { id: "1", day: "Mon", date: "Jun 9",  start: "15:00", end: "15:30", bookedBy: "Mia Chen",  topic: "Essay feedback" },
  { id: "2", day: "Mon", date: "Jun 9",  start: "15:30", end: "16:00" },
  { id: "3", day: "Wed", date: "Jun 11", start: "10:00", end: "10:30", bookedBy: "A. Murat",  topic: "Extension request" },
  { id: "4", day: "Wed", date: "Jun 11", start: "10:30", end: "11:00" },
  { id: "5", day: "Fri", date: "Jun 13", start: "14:00", end: "14:30" },
  { id: "6", day: "Fri", date: "Jun 13", start: "14:30", end: "15:00", bookedBy: "B. Tilek",  topic: "Quiz #3 review" },
];

function PrototypeOfficeHoursPage() {
  const { t } = useTranslation();
  const [slots, setSlots] = useState(PROTO_INITIAL);
  const grouped = slots.reduce<Record<string, ProtoSlot[]>>((acc, slot) => {
    const key = `${slot.day} · ${slot.date}`;
    (acc[key] ||= []).push(slot);
    return acc;
  }, {});

  const addSlot = () => {
    setSlots((current) => [...current, { id: crypto.randomUUID(), day: "Tue", date: "Jun 10", start: "13:00", end: "13:30" }]);
    toast.success(t("instructorOfficeHours.toast.prototypeSlotAdded", { defaultValue: "Slot added to Tue Jun 10" }));
  };

  const cancel = (id: string) => {
    setSlots((current) => current.map((slot) => (slot.id === id ? { ...slot, bookedBy: undefined, topic: undefined } : slot)));
    toast(t("instructorOfficeHours.toast.bookingCancelled", { defaultValue: "Booking cancelled" }));
  };

  return (
    <DashboardShell>
      <TopBar
        title={t("instructorOfficeHours.topbar.title", { defaultValue: "Office Hours" })}
        subtitle={t("instructorOfficeHours.topbar.subtitlePrototype", { defaultValue: "Schedulable 1:1 slots for your students" })}
        showStreak={false}
      />
      <KpiRow total={slots.length} booked={slots.filter((slot) => slot.bookedBy).length} open={slots.filter((slot) => !slot.bookedBy).length}>
        <button onClick={addSlot} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow">
          <Plus className="size-4" strokeWidth={3} /> {t("instructorOfficeHours.actions.newSlot", { defaultValue: "New slot" })}
        </button>
      </KpiRow>
      <div className="space-y-4 mt-5">
        {Object.entries(grouped).map(([day, list]) => (
          <section key={day} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-base flex items-center gap-2 mb-3">
              <Calendar className="size-4 text-primary" strokeWidth={2.5} />{day}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map((slot) => (
                <ProtoSlotCard key={slot.id} slot={slot} onCancel={() => cancel(slot.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}

function ProtoSlotCard({ slot, onCancel }: { slot: ProtoSlot; onCancel: () => void }) {
  const { t } = useTranslation();
  return (
    <div className={`rounded-2xl p-3 border-2 ${slot.bookedBy ? "bg-primary/10 border-primary/40" : "bg-muted/40 border-dashed border-border"}`}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-black"><Clock className="size-3.5" />{slot.start}–{slot.end}</span>
        {slot.bookedBy && <button onClick={onCancel} className="size-6 grid place-items-center rounded-md hover:bg-foreground/10" title={t("instructorOfficeHours.actions.cancelBooking", { defaultValue: "Cancel booking" })}><X className="size-3.5" /></button>}
      </div>
      {slot.bookedBy ? (
        <>
          <p className="text-sm font-black mt-2">{slot.bookedBy}</p>
          <p className="text-[11px] font-bold text-foreground/60">{slot.topic}</p>
          <button className="mt-2 w-full inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-black border border-foreground">
            <Video className="size-3" strokeWidth={3} /> {t("instructorOfficeHours.actions.join", { defaultValue: "Join" })}
          </button>
        </>
      ) : (
        <p className="text-[11px] font-bold text-foreground/40 mt-2">{t("instructorOfficeHours.labels.openForBooking", { defaultValue: "Open for booking" })}</p>
      )}
    </div>
  );
}

function BackendOfficeHoursPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("15:00");
  const [formEnd, setFormEnd] = useState("15:30");
  const [formMeetLink, setFormMeetLink] = useState("");

  const { weekFrom, weekTo, weekLabel } = currentWeekRange(activeI18n.language);
  const slotsQuery = useOfficeHourSlots(weekFrom, weekTo);
  const createSlot = useCreateOfficeHourSlot();
  const deleteSlot = useDeleteOfficeHourSlot();
  const cancelBooking = useCancelBooking();

  const slots = slotsQuery.data ?? [];
  const grouped = groupByDay(slots, activeI18n.language);
  const booked = slots.filter((slot) => slot.status === "booked").length;
  const open = slots.filter((slot) => slot.status === "open").length;

  const handleCreate = async () => {
    if (!formDate || !formStart || !formEnd) {
      toast.error(t("instructorOfficeHours.toast.missingFields", { defaultValue: "Please fill in date, start, and end time." }));
      return;
    }
    const startsAt = new Date(`${formDate}T${formStart}:00`).toISOString();
    const endsAt = new Date(`${formDate}T${formEnd}:00`).toISOString();
    try {
      await createSlot.mutateAsync({ startsAt, endsAt, meetLink: formMeetLink || undefined });
      toast.success(t("instructorOfficeHours.toast.created", { defaultValue: "Slot created." }));
      setShowForm(false);
      setFormDate("");
      setFormMeetLink("");
    } catch {
      toast.error(t("instructorOfficeHours.toast.createFailed", { defaultValue: "Failed to create slot." }));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSlot.mutateAsync(id);
      toast(t("instructorOfficeHours.toast.deleted", { defaultValue: "Slot deleted." }));
    } catch {
      toast.error(t("instructorOfficeHours.toast.deleteFailed", { defaultValue: "Failed to delete slot." }));
    }
  };

  const handleCancelBooking = async (id: number) => {
    try {
      await cancelBooking.mutateAsync(id);
      toast(t("instructorOfficeHours.toast.cancelledOpen", { defaultValue: "Booking cancelled — slot is open again." }));
    } catch {
      toast.error(t("instructorOfficeHours.toast.cancelFailed", { defaultValue: "Failed to cancel booking." }));
    }
  };

  return (
    <DashboardShell>
      <TopBar
        title={t("instructorOfficeHours.topbar.title", { defaultValue: "Office Hours" })}
        subtitle={t("instructorOfficeHours.topbar.weekOf", { week: weekLabel, defaultValue: "Week of {{week}}" })}
        showStreak={false}
      />

      <KpiRow total={slots.length} booked={booked} open={open}>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow"
        >
          <Plus className="size-4" strokeWidth={3} /> {t("instructorOfficeHours.actions.newSlot", { defaultValue: "New slot" })}
        </button>
      </KpiRow>

      {showForm && (
        <div className="mt-4 bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
          <h3 className="font-black">{t("instructorOfficeHours.form.title", { defaultValue: "Create a new slot" })}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{t("instructorOfficeHours.form.fields.date", { defaultValue: "Date" })}</label>
              <input type="date" value={formDate} onChange={(event) => setFormDate(event.target.value)}
                className="w-full px-3 py-2 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{t("instructorOfficeHours.form.fields.start", { defaultValue: "Start" })}</label>
              <input type="time" value={formStart} onChange={(event) => setFormStart(event.target.value)}
                className="w-full px-3 py-2 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{t("instructorOfficeHours.form.fields.end", { defaultValue: "End" })}</label>
              <input type="time" value={formEnd} onChange={(event) => setFormEnd(event.target.value)}
                className="w-full px-3 py-2 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{t("instructorOfficeHours.form.fields.meetLink", { defaultValue: "Meet link (optional)" })}</label>
              <input type="url" value={formMeetLink} onChange={(event) => setFormMeetLink(event.target.value)}
                placeholder="https://meet.google.com/…"
                className="w-full px-3 py-2 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border-2 border-border font-bold text-sm hover:bg-muted transition-colors">
              {t("instructorOfficeHours.actions.cancel", { defaultValue: "Cancel" })}
            </button>
            <button onClick={handleCreate} disabled={createSlot.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
              {createSlot.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("instructorOfficeHours.actions.createSlot", { defaultValue: "Create slot" })}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-5">
        {slotsQuery.isLoading ? (
          <div className="flex items-center justify-center h-32 text-foreground/40" aria-label={t("instructorOfficeHours.state.loading", { defaultValue: "Loading office hour slots…" })}>
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-card border-2 border-border rounded-3xl p-10 chunky-shadow text-center">
            <Calendar className="size-10 mx-auto text-foreground/25 mb-2" strokeWidth={1.5} />
            <p className="font-black text-base">{t("instructorOfficeHours.empty.title", { defaultValue: "No slots this week" })}</p>
            <p className="text-sm font-medium text-foreground/50 mt-1">
              {t("instructorOfficeHours.empty.body", { defaultValue: "Click New slot to add your first available time." })}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, list]) => (
            <section key={day} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
              <h3 className="font-black text-base flex items-center gap-2 mb-3">
                <Calendar className="size-4 text-primary" strokeWidth={2.5} />{day}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {list.map((slot) => (
                  <BackendSlotCard
                    key={slot.id}
                    slot={slot}
                    onDelete={() => handleDelete(slot.id)}
                    onCancelBooking={() => handleCancelBooking(slot.id)}
                    deleting={deleteSlot.isPending && deleteSlot.variables === slot.id}
                    cancelling={cancelBooking.isPending && cancelBooking.variables === slot.id}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </DashboardShell>
  );
}

function BackendSlotCard({
  slot,
  onDelete,
  onCancelBooking,
  deleting,
  cancelling,
}: {
  slot: OfficeHourSlotRecord;
  onDelete: () => void;
  onCancelBooking: () => void;
  deleting: boolean;
  cancelling: boolean;
}) {
  const { t, i18n: activeI18n } = useTranslation();
  const start = new Date(slot.startsAt).toLocaleTimeString(activeI18n.language, { hour: "2-digit", minute: "2-digit" });
  const end = new Date(slot.endsAt).toLocaleTimeString(activeI18n.language, { hour: "2-digit", minute: "2-digit" });
  const isBooked = slot.status === "booked";

  return (
    <div className={`rounded-2xl p-3 border-2 ${isBooked ? "bg-primary/10 border-primary/40" : "bg-muted/40 border-dashed border-border"}`}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-black">
          <Clock className="size-3.5" />{start}–{end}
        </span>
        {isBooked ? (
          <button onClick={onCancelBooking} disabled={cancelling}
            className="size-6 grid place-items-center rounded-md hover:bg-foreground/10 disabled:opacity-50" title={t("instructorOfficeHours.actions.cancelBooking", { defaultValue: "Cancel booking" })}>
            {cancelling ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
          </button>
        ) : (
          <button onClick={onDelete} disabled={deleting}
            className="size-6 grid place-items-center rounded-md hover:bg-destructive/10 text-destructive/70 disabled:opacity-50" title={t("instructorOfficeHours.actions.deleteSlot", { defaultValue: "Delete slot" })}>
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        )}
      </div>

      {isBooked ? (
        <>
          <p className="text-sm font-black mt-2">{slot.bookedByName ?? t("instructorOfficeHours.labels.student", { defaultValue: "Student" })}</p>
          {slot.bookingTopic && <p className="text-[11px] font-bold text-foreground/60">{slot.bookingTopic}</p>}
          {slot.meetLink ? (
            <a href={slot.meetLink} target="_blank" rel="noreferrer"
              className="mt-2 w-full inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-black border border-foreground">
              <Video className="size-3" strokeWidth={3} /> {t("instructorOfficeHours.actions.join", { defaultValue: "Join" })}
            </a>
          ) : (
            <p className="text-[11px] font-bold text-foreground/40 mt-2">{t("instructorOfficeHours.labels.noMeetingLink", { defaultValue: "No meeting link set" })}</p>
          )}
        </>
      ) : (
        <>
          <p className="text-[11px] font-bold text-foreground/40 mt-2">{t("instructorOfficeHours.labels.openForBooking", { defaultValue: "Open for booking" })}</p>
          {slot.meetLink && (
            <p className="text-[10px] text-foreground/30 mt-0.5 truncate">{slot.meetLink}</p>
          )}
        </>
      )}
    </div>
  );
}

function KpiRow({ total, booked, open, children }: { total: number; booked: number; open: number; children: React.ReactNode }) {
  const { t } = useTranslation();
  const stats = [
    { label: t("instructorOfficeHours.kpi.slotsThisWeek", { defaultValue: "Slots this week" }), value: total },
    { label: t("instructorOfficeHours.kpi.booked", { defaultValue: "Booked" }), value: booked },
    { label: t("instructorOfficeHours.kpi.open", { defaultValue: "Open" }), value: open },
  ];
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border-2 border-border rounded-2xl p-3 chunky-shadow">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{stat.label}</p>
            <p className="text-xl font-black font-mono mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

function currentWeekRange(language: string) {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);

  const label = mon.toLocaleDateString(language, { month: "short", day: "numeric" });
  return { weekFrom: mon.toISOString(), weekTo: sun.toISOString(), weekLabel: label };
}

function groupByDay(slots: OfficeHourSlotRecord[], language: string): Record<string, OfficeHourSlotRecord[]> {
  const grouped: Record<string, OfficeHourSlotRecord[]> = {};
  for (const slot of slots) {
    const date = new Date(slot.startsAt);
    const key = date.toLocaleDateString(language, { weekday: "short", month: "short", day: "numeric" });
    (grouped[key] ||= []).push(slot);
  }
  return grouped;
}

function OfficeHoursPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendOfficeHoursPage /> : <PrototypeOfficeHoursPage />;
}
