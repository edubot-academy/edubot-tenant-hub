import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plus, Calendar, Clock, Video, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/instructor/office-hours")({
  head: () => ({ meta: [{ title: "QuestLMS — Office Hours" }] }),
  component: OfficeHoursPage,
});

type Slot = { id: string; day: string; date: string; start: string; end: string; bookedBy?: string; topic?: string };

const initial: Slot[] = [
  { id: "1", day: "Mon", date: "Jun 9", start: "15:00", end: "15:30", bookedBy: "Mia Chen", topic: "Essay feedback" },
  { id: "2", day: "Mon", date: "Jun 9", start: "15:30", end: "16:00" },
  { id: "3", day: "Wed", date: "Jun 11", start: "10:00", end: "10:30", bookedBy: "A. Murat", topic: "Extension request" },
  { id: "4", day: "Wed", date: "Jun 11", start: "10:30", end: "11:00" },
  { id: "5", day: "Fri", date: "Jun 13", start: "14:00", end: "14:30" },
  { id: "6", day: "Fri", date: "Jun 13", start: "14:30", end: "15:00", bookedBy: "B. Tilek", topic: "Quiz #3 review" },
];

function OfficeHoursPage() {
  const [slots, setSlots] = useState(initial);
  const grouped = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    const k = `${s.day} · ${s.date}`;
    (acc[k] ||= []).push(s);
    return acc;
  }, {});

  const addSlot = () => {
    setSlots((s) => [...s, { id: crypto.randomUUID(), day: "Tue", date: "Jun 10", start: "13:00", end: "13:30" }]);
    toast.success("Slot added to Tue Jun 10");
  };

  const cancel = (id: string) => {
    setSlots((s) => s.map((x) => x.id === id ? { ...x, bookedBy: undefined, topic: undefined } : x));
    toast("Booking cancelled");
  };

  return (
    <DashboardShell>
      <TopBar title="Office Hours" subtitle="Schedulable 1:1 slots for your students" />

      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="grid grid-cols-3 gap-3 flex-1">
          {[
            { l: "Slots this week", v: slots.length },
            { l: "Booked", v: slots.filter((s) => s.bookedBy).length },
            { l: "Open", v: slots.filter((s) => !s.bookedBy).length },
          ].map((s) => (
            <div key={s.l} className="bg-card border-2 border-border rounded-2xl p-3 chunky-shadow">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50">{s.l}</p>
              <p className="text-xl font-black font-mono mt-1">{s.v}</p>
            </div>
          ))}
        </div>
        <button onClick={addSlot} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm border-2 border-foreground chunky-shadow"><Plus className="size-4" strokeWidth={3} /> New slot</button>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([day, list]) => (
          <section key={day} className="bg-card border-2 border-border rounded-3xl p-5 chunky-shadow">
            <h3 className="font-black text-base flex items-center gap-2 mb-3"><Calendar className="size-4 text-primary" strokeWidth={2.5} />{day}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map((s) => (
                <div key={s.id} className={`rounded-2xl p-3 border-2 ${s.bookedBy ? "bg-primary/10 border-primary/40" : "bg-muted/40 border-dashed border-border"}`}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-black"><Clock className="size-3.5" />{s.start}–{s.end}</span>
                    {s.bookedBy && <button onClick={() => cancel(s.id)} className="size-6 grid place-items-center rounded-md hover:bg-foreground/10"><X className="size-3.5" /></button>}
                  </div>
                  {s.bookedBy ? (
                    <>
                      <p className="text-sm font-black mt-2">{s.bookedBy}</p>
                      <p className="text-[11px] font-bold text-foreground/60">{s.topic}</p>
                      <button className="mt-2 w-full inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-black border border-foreground"><Video className="size-3" strokeWidth={3} /> Join</button>
                    </>
                  ) : (
                    <p className="text-[11px] font-bold text-foreground/40 mt-2">Open for booking</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
