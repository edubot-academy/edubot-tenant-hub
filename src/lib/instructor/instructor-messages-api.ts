import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, isBackendApiEnabled } from "@/lib/api/client";
import { useAppContext } from "@/lib/app-context";

export type Conversation = {
  id: number;
  student: { id: number; fullName: string | null; avatar: string | null };
  instructor: { id: number; fullName: string | null; avatar: string | null };
  course: { id: number; title: string } | null;
  messagesCount: number;
  lastMessageAt: string | null;
  lastMessageSnippet: string | null;
  unreadCount: number;
  status: "active" | "archived";
};

export type InstructorMessage = {
  id: number;
  chatId: number;
  senderId: number;
  role: "student" | "instructor";
  content: string;
  createdAt: string;
};

export function useInstructorConversations() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["instructor-conversations"],
    queryFn: () => apiRequest<Conversation[]>("/instructor-chat?role=instructor"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
    refetchInterval: 10_000,
  });
}

export function useConversationMessages(chatId: number | null) {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["instructor-chat-messages", chatId],
    queryFn: () =>
      apiRequest<{ chatId: number; messages: InstructorMessage[] }>(
        `/instructor-chat/${chatId}/messages`,
      ),
    enabled: isBackendApiEnabled() && context.mode === "backend" && chatId !== null,
    refetchInterval: 4_000,
    staleTime: 0,
  });
}

export function useReplyToConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, content }: { chatId: number; content: string }) =>
      apiRequest<{ chatId: number; messageId: number; messageKey: string }>(
        `/instructor-chat/${chatId}/reply`,
        { body: { content } },
      ),
    onSuccess: (_, { chatId }) => {
      qc.invalidateQueries({ queryKey: ["instructor-chat-messages", chatId] });
      qc.invalidateQueries({ queryKey: ["instructor-conversations"] });
    },
  });
}

export function useStudentConversations() {
  const { context } = useAppContext();
  return useQuery({
    queryKey: ["student-conversations"],
    queryFn: () => apiRequest<Conversation[]>("/instructor-chat?role=student"),
    enabled: isBackendApiEnabled() && context.mode === "backend",
    refetchInterval: 10_000,
  });
}

export function useStudentSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, courseId }: { content: string; courseId?: number }) =>
      apiRequest<{ chatId: number; messageId: number; messageKey: string }>(
        "/instructor-chat",
        { body: { content, courseId } },
      ),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["student-conversations"] });
      qc.invalidateQueries({ queryKey: ["instructor-chat-messages", data.chatId] });
    },
  });
}
