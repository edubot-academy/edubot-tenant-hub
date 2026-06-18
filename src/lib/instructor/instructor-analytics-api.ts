import { useQuery } from "@tanstack/react-query";

import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type InstructorAnalyticsOverview = {
  summary: {
    totalCourses: number;
    publishedCourses: number;
    totalStudents: number;
    totalEnrollments: number;
    averageCompletionRate: number;
  };
  charts: {
    coursePerformance: Array<{
      courseId: number;
      title: string;
      enrollments: number;
      averageProgress: number;
      completionRate: number;
    }>;
    weakLessons: Array<{
      lessonId: number;
      title: string;
      completionRate: number;
      courseId: number;
      courseTitle: string;
    }>;
    atRiskStudents: Array<{
      studentId: number;
      studentName: string;
      courseId: number;
      courseTitle: string;
      riskReason: string;
      lastActivity: string;
    }>;
  };
};

export function useInstructorAnalyticsOverview() {
  const { context } = useAppContext();
  const enabled = isBackendApiEnabled() && context.mode === "backend";

  return useQuery({
    queryKey: ["instructor-analytics", "overview"],
    queryFn: () => apiRequest<InstructorAnalyticsOverview>("/analytics/instructor/overview"),
    enabled,
  });
}
