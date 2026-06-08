import { useQuery } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type ParentBillingInvoice = {
  id: number;
  studentId: number;
  studentName: string | null;
  amount: number;
  currency: string;
  status: "paid" | "open" | "failed";
  paidAt: string | null;
  createdAt: string;
  description: string | null;
};

export type ParentBillingSummary = {
  totalPaid: number;
  totalOpen: number;
  currency: string;
  nextDueDate: string | null;
  nextDueAmount: number | null;
};

export function useParentBillingSummary() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["parent-billing-summary"],
    queryFn: () => apiRequest<ParentBillingSummary>("/parent/billing/summary"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}

export function useParentBillingInvoices() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["parent-billing-invoices"],
    queryFn: () => apiRequest<ParentBillingInvoice[]>("/parent/billing/invoices"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
  });
}
