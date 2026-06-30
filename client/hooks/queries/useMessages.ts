import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageService } from "@/api/message";
import { CreateMessagePayload, Message } from "@/types";
import { useAuthStore } from "@/stores/authStore";

export function useMessages(channelId: string) {
  return useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => MessageService.getChannelMessages(channelId),
    enabled: !!channelId,
  });
}

export function useThreadMessages(threadId: string, channelId: string) {
  return useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => MessageService.getThreadReplies(threadId, channelId),
    enabled: !!threadId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (payload: CreateMessagePayload) => MessageService.createMessage(payload),

    onMutate: async (newMessagePayload) => {
      const targetChannelId = newMessagePayload.channelId;
      const targetThreadId = newMessagePayload.threadId;
      if (!targetChannelId) return;

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: newMessagePayload.content,
        channelId: targetChannelId,
        threadId: targetThreadId || undefined,
        createdAt: new Date().toISOString(),
        userId: currentUser?.id || "temp-user-id",
        user: {
          id: currentUser?.id || "temp-user-id",
          name: currentUser?.name || "Me",
        },
        reactions: [],
      };

      if (targetThreadId) {
        // Optimistic update for Thread Sidebar Panel
        await queryClient.cancelQueries({ queryKey: ["thread-messages", targetThreadId] });
        const previousReplies = queryClient.getQueryData<Message[]>(["thread-messages", targetThreadId]);

        queryClient.setQueryData<Message[]>(["thread-messages", targetThreadId], (old) =>
          old ? [...old, optimisticMessage] : [optimisticMessage]
        );

        return { previousReplies, isThread: true, targetThreadId, targetChannelId };
      } else {
        // Optimistic update for Main Channel Feed
        await queryClient.cancelQueries({ queryKey: ["messages", targetChannelId] });
        const previousMessages = queryClient.getQueryData<Message[]>(["messages", targetChannelId]);

        queryClient.setQueryData<Message[]>(["messages", targetChannelId], (old) =>
          old ? [...old, optimisticMessage] : [optimisticMessage]
        );

        return { previousMessages, isThread: false, targetChannelId };
      }
    },

    onError: (err, variables, context) => {
      if (!context) return;
      if (context.isThread && context.previousReplies) {
        queryClient.setQueryData(["thread-messages", context.targetThreadId], context.previousReplies);
      } else if (!context.isThread && context.previousMessages) {
        queryClient.setQueryData(["messages", context.targetChannelId], context.previousMessages);
      }
    },

    onSuccess: (responseBody, variables) => {
      const realMessage = (responseBody as any).data || responseBody;
      const targetChannelId = realMessage.channelId || variables.channelId;
      const targetThreadId = realMessage.threadId || variables.threadId;

      if (!targetChannelId) return;

      if (targetThreadId) {
        // Replace temp message inside Thread replies cache structure
        queryClient.setQueryData<Message[]>(["thread-messages", targetThreadId], (old) => {
          if (!old) return [realMessage];
          let replaced = false;
          const updated = old.map((msg) => {
            if (msg.id.toString().startsWith("temp-") && !replaced) {
              replaced = true;
              return realMessage;
            }
            return msg;
          });
          return replaced ? updated : [...old, realMessage];
        });

        // Invalidate channel queries to keep main thread counters accurate
        queryClient.invalidateQueries({ queryKey: ["messages", targetChannelId] });
      } else {
        // Replace temp message inside standard Main Feed cache channel
        queryClient.setQueryData<Message[]>(["messages", targetChannelId], (old) => {
          if (!old) return [realMessage];
          let replaced = false;
          const updated = old.map((msg) => {
            if (msg.id.toString().startsWith("temp-") && !replaced) {
              replaced = true;
              return realMessage;
            }
            return msg;
          });
          return replaced ? updated : [...old, realMessage];
        });
      }
    },
  });
}