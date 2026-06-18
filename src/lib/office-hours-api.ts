import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type OfficeHourSlotStatus = "open" | "booked" | "cancelled";

export type OfficeHourSlotRecord = {
  id: number;
  instructorId: number;
  instructorName: string | null;
  startsAt: string;
  endsAt: string;
  meetLink: string | null;
  status: OfficeHourSlotStatus;
  bookedById: number | null;
  bookedByName: string | null;
  bookingTopic: string | null;
  bookedAt: string | null;
  createdAt: string;
};

const QUERY_KEY = "office-hour-slots";

function buildUrl(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return `/office-hours${qs ? `?${qs}` : ""}`;
}

export function useOfficeHourSlots(from?: string, to?: string) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: [QUERY_KEY, from, to],
    queryFn: () => apiRequest<OfficeHourSlotRecord[]>(buildUrl(from, to)),
    enabled: isBackendApiEnabled() && context.mode === "backend",
    refetchInterval: 15_000,
  });
}

export function useCreateOfficeHourSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { startsAt: string; endsAt: string; meetLink?: string }) =>
      apiRequest<OfficeHourSlotRecord>("/office-hours", { method: "POST", body: dto }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteOfficeHourSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ ok: boolean }>(`/office-hours/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<OfficeHourSlotRecord>(`/office-hours/${id}/book`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
