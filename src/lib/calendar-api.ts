import { useQuery } from "@tanstack/react-query";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

export type CalendarItem = {
  type: "course_session" | "academic_session";
  id: number;
  title: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "completed" | "cancelled";
  courseId: number;
  courseTitle: string | null;
  groupId: number | null;
  groupName: string | null;
  classId: number | null;
  className: string | null;
  instructorId: number | null;
};

export type CalendarResponse = {
  items: CalendarItem[];
};

export function calendarQueryKey(companyId: number, from: string, to: string) {
  return ["calendar", companyId, from, to] as const;
}

export function useCalendar(from: Date, to: Date) {
  const { context } = useAppContext();
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  const validCompany = Number.isFinite(companyId) && companyId > 0;
  const enabled = isBackendApiEnabled() && context.mode === "backend" && validCompany;

  const fromIso = format(from, "yyyy-MM-dd'T'HH:mm:ss");
  const toIso = format(to, "yyyy-MM-dd'T'HH:mm:ss");

  return useQuery({
    queryKey: validCompany ? calendarQueryKey(companyId, fromIso, toIso) : ["calendar", "none"],
    queryFn: () =>
      apiRequest<CalendarResponse>("/calendar", {
        params: { from: fromIso, to: toIso },
      }),
    enabled,
  });
}

export function weekRange(weekOffset: number): { from: Date; to: Date } {
  const base = addWeeks(new Date(), weekOffset);
  return {
    from: startOfWeek(base, { weekStartsOn: 1 }),
    to: endOfWeek(base, { weekStartsOn: 1 }),
  };
}
