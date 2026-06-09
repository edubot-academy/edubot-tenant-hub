import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type MarketplaceItem = {
  id: string;
  title: string;
  author: string;
  description: string;
  price: string;
  rating: number;
  downloads: string;
  emoji: string;
  category: string;
  questionCount: number;
};

export function useMarketplaceFeatured() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["marketplace-featured"],
    queryFn: () => apiRequest<MarketplaceItem[]>("/marketplace/featured"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
    staleTime: 5 * 60 * 1000,
  });
}

export function useAcquireMarketplaceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ ok: boolean; templateId?: number }>(`/marketplace/${id}/acquire`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quiz-templates"] }),
  });
}
