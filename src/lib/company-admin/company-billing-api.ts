import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useActiveTenant, useAppContext } from "@/lib/app-context";

export type CompanyBillingSubscription = {
  generatedAt: string;
  tenant: {
    id: number;
    name: string;
    host?: string | null;
    locale?: string | null;
    timezone?: string | null;
  };
  subscription: {
    plan?: string | null;
    billingStatus?: string | null;
    tenantStatus?: string | null;
    billingEmail?: string | null;
    billingContactName?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    nextInvoiceDate?: string | null;
    autoRenew?: boolean | null;
    paymentMethodAvailable?: boolean;
    source?: string;
  };
  capabilities?: {
    canManagePlan?: boolean;
    canViewInvoices?: boolean;
    canViewPaymentMethod?: boolean;
  };
  notes?: string[];
};

export type CompanyBillingUsage = {
  generatedAt: string;
  tenant: {
    id: number;
    name: string;
    plan?: string | null;
    billingStatus?: string | null;
  };
  usage: {
    seats: {
      unit: string;
      used: number;
      limit?: number | null;
      source?: string;
      available: boolean;
    };
    storageGb: {
      unit: string;
      used?: number | null;
      limit?: number | null;
      source?: string;
      available: boolean;
      note?: string;
    };
    aiCredits: {
      unit: string;
      used: number;
      limit?: number | null;
      source?: string;
      available: boolean;
    };
    courses: {
      unit: string;
      used: number;
      limit?: number | null;
      source?: string;
      available: boolean;
    };
  };
};

export type CompanyBillingInvoices = {
  generatedAt: string;
  tenant: {
    id: number;
    name: string;
    plan?: string | null;
    billingStatus?: string | null;
  };
  items: Array<{
    id: string;
    date: string;
    amount: number;
    status: "paid" | "open" | "failed";
    period: string;
  }>;
  total: number;
  limit: number;
  source?: string;
  capabilities?: {
    canDownload?: boolean;
  };
  note?: string;
};

export type CompanyBillingPaymentMethod = {
  generatedAt: string;
  tenant: {
    id: number;
    name: string;
  };
  paymentMethod: {
    available: boolean;
    brand?: string | null;
    last4?: string | null;
    expiryMonth?: number | null;
    expiryYear?: number | null;
    cardholderName?: string | null;
    billingEmail?: string | null;
    source?: string;
  };
  note?: string;
};

function useActiveCompanyId() {
  const tenant = useActiveTenant();
  const companyId = Number(tenant.id);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

function useBillingEnabled() {
  const { context } = useAppContext();
  const companyId = useActiveCompanyId();
  return {
    companyId,
    enabled: isBackendApiEnabled() && context.mode === "backend" && companyId !== null,
  };
}

export function useCompanyBillingSubscription() {
  const { companyId, enabled } = useBillingEnabled();
  return useQuery({
    queryKey: companyId === null ? ["company-billing-subscription", "none"] : ["company-billing-subscription", companyId],
    queryFn: () => apiRequest<CompanyBillingSubscription>(`/companies/${companyId}/billing/subscription`),
    enabled,
  });
}

export function useCompanyBillingUsage() {
  const { companyId, enabled } = useBillingEnabled();
  return useQuery({
    queryKey: companyId === null ? ["company-billing-usage", "none"] : ["company-billing-usage", companyId],
    queryFn: () => apiRequest<CompanyBillingUsage>(`/companies/${companyId}/billing/usage`),
    enabled,
  });
}

export function useCompanyBillingInvoices(limit = 20) {
  const { companyId, enabled } = useBillingEnabled();
  return useQuery({
    queryKey: companyId === null ? ["company-billing-invoices", "none"] : ["company-billing-invoices", companyId, limit],
    queryFn: () => apiRequest<CompanyBillingInvoices>(`/companies/${companyId}/billing/invoices`, {
      params: { limit },
    }),
    enabled,
  });
}

export function useCompanyBillingPaymentMethod() {
  const { companyId, enabled } = useBillingEnabled();
  return useQuery({
    queryKey: companyId === null ? ["company-billing-payment-method", "none"] : ["company-billing-payment-method", companyId],
    queryFn: () => apiRequest<CompanyBillingPaymentMethod>(`/companies/${companyId}/billing/payment-method`),
    enabled,
  });
}

export function useUpdateCompanyBillingPlan() {
  const queryClient = useQueryClient();
  const { companyId } = useBillingEnabled();

  return useMutation({
    mutationFn: (input: { plan: "starter" | "growth" | "scale" | "enterprise" }) =>
      apiRequest<CompanyBillingSubscription>(`/companies/${companyId}/billing/plan`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: async (result) => {
      if (companyId === null) return;
      queryClient.setQueryData(["company-billing-subscription", companyId], result);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["company-billing-usage", companyId] }),
        queryClient.invalidateQueries({ queryKey: ["company-billing-invoices", companyId] }),
      ]);
    },
  });
}

export function useUpdateCompanyBillingPaymentMethod() {
  const queryClient = useQueryClient();
  const { companyId } = useBillingEnabled();

  return useMutation({
    mutationFn: (input: {
      available?: boolean;
      brand?: string | null;
      last4?: string | null;
      expiryMonth?: number | null;
      expiryYear?: number | null;
      cardholderName?: string | null;
      billingEmail?: string | null;
    }) =>
      apiRequest<CompanyBillingPaymentMethod>(`/companies/${companyId}/billing/payment-method`, {
        method: "PATCH",
        body: input,
      }),
    onSuccess: async (result) => {
      if (companyId === null) return;
      queryClient.setQueryData(["company-billing-payment-method", companyId], result);
      await queryClient.invalidateQueries({ queryKey: ["company-billing-subscription", companyId] });
    },
  });
}
