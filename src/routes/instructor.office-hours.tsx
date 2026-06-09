import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Calendar, Clock, Video, X, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppContext } from "@/lib/app-context";
import {
  useOfficeHourSlots,
  useCreateOfficeHourSlot,
  useDeleteOfficeHourSlot,
  useCancelBooking,
  type OfficeHourSlotRecord,
} from "@/lib/office-hours-api";

export const Route = createFileRoute("/instructor/office-hours")({
  head: () => ({ meta: [{ title: "QuestLMS — Office Hours" }] }),
  component: OfficeHoursPage,
});

// ─── Prototype page ───────────────────────────────────────────────────────────

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
  const [slots, setSlots] = useState(PROTO_INITIAL);
  const grouped = slots.reduce<Record<string, ProtoSlot[]>>((acc, s) => {
    const k = `${s.day} · ${s.date}`;
    (acc[k] ||= []).push(s);
    return acc;
  }, {});

  const addSlot = () => {
    setSlots((s) => [...s, { id: crypto.randomUUID(), day: "Tue", date: "Jun 10", start: "13:00", end: "13:30" }]);
    toast.success("Slot added to Tue Jun 10");
  };

  const cancel = (id: string) => {
    setSlots((s) => s.map((x) => (x.id === id ? { ...x, bookedBy: undefined, topic: undefined } : x)));
    toast("Booking cancelled");
  };

  return (
    <DashboardShell>
      <TopBar title="Office Hours" subtitle="Schedulable 1:1 slots for your students" showStreak={false} />
      <KpiRow total={slots.length} booked={slots.filter((s) => s.bookedBy).length} open={slots.filter((s) => !s.bookedBy).length}>
        <button onClick={addSlot} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow">
          <Plus className="size-4" strokeWidth={3} /> New slot
        </button>
      </KpiRow>
      <div className="space-y-4 mt-5">
        {Object.entries(grouped).map(([day, list]) => (
          <section key={day} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-base flex items-center gap-2 mb-3">
              <Calendar className="size-4 text-primary" strokeWidth={2.5} />{day}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map((s) => (
                <ProtoSlotCard key={s.id} slot={s} onCancel={() => cancel(s.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}

function ProtoSlotCard({ slot, onCancel }: { slot: ProtoSlot; onCancel: () => void }) {
  return (
    <div className={`rounded-2xl p-3 border-2 ${slot.bookedBy ? "bg-primary/10 border-primary/40" : "bg-muted/40 border-dashed border-border"}`}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-black"><Clock className="size-3.5" />{slot.start}–{slot.end}</span>
        {slot.bookedBy && <button onClick={onCancel} className="size-6 grid place-items-center rounded-md hover:bg-foreground/10"><X className="size-3.5" /></button>}
      </div>
      {slot.bookedBy ? (
        <>
          <p className="text-sm font-black mt-2">{slot.bookedBy}</p>
          <p className="text-[11px] font-bold text-foreground/60">{slot.topic}</p>
          <button className="mt-2 w-full inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-black border border-foreground">
            <Video className="size-3" strokeWidth={3} /> Join
          </button>
        </>
      ) : (
        <p className="text-[11px] font-bold text-foreground/40 mt-2">Open for booking</p>
      )}
    </div>
  );
}

// ─── Backend page ─────────────────────────────────────────────────────────────

function BackendOfficeHoursPage() {
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("15:00");
  const [formEnd, setFormEnd] = useState("15:30");
  const [formMeetLink, setFormMeetLink] = useState("");

  // Week window: Mon–Sun of the current week
  const { weekFrom, weekTo, weekLabel } = currentWeekRange();
  const slotsQuery = useOfficeHourSlots(weekFrom, weekTo);
  const createSlot = useCreateOfficeHourSlot();
  const deleteSlot = useDeleteOfficeHourSlot();
  const cancelBooking = useCancelBooking();

  const slots = slotsQuery.data ?? [];
  const grouped = groupByDay(slots);
  const booked = slots.filter((s) => s.status === "booked").length;
  const open = slots.filter((s) => s.status === "open").length;

  const handleCreate = async () => {
    if (!formDate || !formStart || !formEnd) {
      toast.error("Please fill in date, start, and end time.");
      return;
    }
    const startsAt = new Date(`${formDate}T${formStart}:00`).toISOString();
    const endsAt = new Date(`${formDate}T${formEnd}:00`).toISOString();
    try {
      await createSlot.mutateAsync({ startsAt, endsAt, meetLink: formMeetLink || undefined });
      toast.success("Slot created.");
      setShowForm(false);
      setFormDate("");
      setFormMeetLink("");
    } catch {
      toast.error("Failed to create slot.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSlot.mutateAsync(id);
      toast("Slot deleted.");
    } catch {
      toast.error("Failed to delete slot.");
    }
  };

  const handleCancelBooking = async (id: number) => {
    try {
      await cancelBooking.mutateAsync(id);
      toast("Booking cancelled — slot is open again.");
    } catch {
      toast.error("Failed to cancel booking.");
    }
  };

  return (
    <DashboardShell>
      <TopBar title="Office Hours" subtitle={`Week of ${weekLabel}`} showStreak={false} />

      <KpiRow total={slots.length} booked={booked} open={open}>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow"
        >
          <Plus className="size-4" strokeWidth={3} /> New slot
        </button>
      </KpiRow>

      {/* Slot creation form */}
      {showForm && (
        <div className="mt-4 bg-card border-2 border-border rounded-3xl p-5 chunky-shadow space-y-4">
          <h3 className="font-black">Create a new slot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Date</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Start</label>
              <input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)}
                className="w-full px-3 py-2 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">End</label>
              <input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)}
                className="w-full px-3 py-2 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Meet link (optional)</label>
              <input type="url" value={formMeetLink} onChange={(e) => setFormMeetLink(e.target.value)}
                placeholder="https://meet.google.com/…"
                className="w-full px-3 py-2 bg-muted border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border-2 border-border font-bold text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={createSlot.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
              {createSlot.isPending && <Loader2 className="size-4 animate-spin" />}
              Create slot
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-5">
        {slotsQuery.isLoading ? (
          <div className="flex items-center justify-center h-32 text-foreground/40">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-card border-2 border-border rounded-3xl p-10 chunky-shadow text-center">
            <Calendar className="size-10 mx-auto text-foreground/25 mb-2" strokeWidth={1.5} />
            <p className="font-black text-base">No slots this week</p>
            <p className="text-sm font-medium text-foreground/50 mt-1">
              Click "New slot" to add your first available time.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, list]) => (
            <section key={day} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
              <h3 className="font-black text-base flex items-center gap-2 mb-3">
                <Calendar className="size-4 text-primary" strokeWidth={2.5} />{day}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {list.map((s) => (
                  <BackendSlotCard
                    key={s.id}
                    slot={s}
                    onDelete={() => handleDelete(s.id)}
                    onCancelBooking={() => handleCancelBooking(s.id)}
                    deleting={deleteSlot.isPending && deleteSlot.variables === s.id}
                    cancelling={cancelBooking.isPending && cancelBooking.variables === s.id}
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
  const start = new Date(slot.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const end = new Date(slot.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isBooked = slot.status === "booked";

  return (
    <div className={`rounded-2xl p-3 border-2 ${isBooked ? "bg-primary/10 border-primary/40" : "bg-muted/40 border-dashed border-border"}`}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-black">
          <Clock className="size-3.5" />{start}–{end}
        </span>
        {isBooked ? (
          <button onClick={onCancelBooking} disabled={cancelling}
            className="size-6 grid place-items-center rounded-md hover:bg-foreground/10 disabled:opacity-50" title="Cancel booking">
            {cancelling ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
          </button>
        ) : (
          <button onClick={onDelete} disabled={deleting}
            className="size-6 grid place-items-center rounded-md hover:bg-destructive/10 text-destructive/70 disabled:opacity-50" title="Delete slot">
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        )}
      </div>

      {isBooked ? (
        <>
          <p className="text-sm font-black mt-2">{slot.bookedByName ?? "Student"}</p>
          {slot.bookingTopic && <p className="text-[11px] font-bold text-foreground/60">{slot.bookingTopic}</p>}
          {slot.meetLink ? (
            <a href={slot.meetLink} target="_blank" rel="noreferrer"
              className="mt-2 w-full inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-black border border-foreground">
              <Video className="size-3" strokeWidth={3} /> Join
            </a>
          ) : (
            <p className="text-[11px] font-bold text-foreground/40 mt-2">No meeting link set</p>
          )}
        </>
      ) : (
        <>
          <p className="text-[11px] font-bold text-foreground/40 mt-2">Open for booking</p>
          {slot.meetLink && (
            <p className="text-[10px] text-foreground/30 mt-0.5 truncate">{slot.meetLink}</p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function KpiRow({ total, booked, open, children }: { total: number; booked: number; open: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
        {[{ l: "Slots this week", v: total }, { l: "Booked", v: booked }, { l: "Open", v: open }].map((s) => (
          <div key={s.l} className="bg-card border-2 border-border rounded-2xl p-3 chunky-shadow">
            <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.l}</p>
            <p className="text-xl font-black font-mono mt-1">{s.v}</p>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const label = mon.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { weekFrom: mon.toISOString(), weekTo: sun.toISOString(), weekLabel: label };
}

function groupByDay(slots: OfficeHourSlotRecord[]): Record<string, OfficeHourSlotRecord[]> {
  const grouped: Record<string, OfficeHourSlotRecord[]> = {};
  for (const s of slots) {
    const d = new Date(s.startsAt);
    const key = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    (grouped[key] ||= []).push(s);
  }
  return grouped;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function OfficeHoursPage() {
  const { context } = useAppContext();
  return context.mode === "backend" ? <BackendOfficeHoursPage /> : <PrototypeOfficeHoursPage />;
}
