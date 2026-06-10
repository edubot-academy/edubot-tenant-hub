import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export type CatalogCourse = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  durationInHours: number;
  coverImageUrl: string;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
  isPaid: boolean;
  ratingAverage: number;
  ratingCount: number;
  enrolledStudents: number;
  lessonCount: number | null;
  instructor: { id: number; fullName: string; avatarUrl: string | null } | null;
  category: { id: number; name: string } | null;
};

export type CatalogPage = {
  items: CatalogCourse[];
  total: number;
  page: number;
  limit: number;
};

export function useCourseCatalog(params: { q?: string; page?: number; limit?: number } = {}) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["course-catalog", params.q ?? "", params.page ?? 1],
    queryFn: () =>
      apiRequest<CatalogPage>("/courses/catalog", {
        params: { q: params.q || undefined, page: params.page ?? 1, limit: params.limit ?? 24 },
      }),
    enabled: isBackendApiEnabled() && context.mode === "backend",
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
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
