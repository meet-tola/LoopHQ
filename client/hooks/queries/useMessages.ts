import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageService } from "@/api/message";
import { CreateMessagePayload, Message, Thread } from "@/types";
import { useAuthStore } from "@/stores/authStore";

const MESSAGING_CACHE_CONFIG = {
  staleTime: 1000 * 60 * 5,       // 5 minutes
  gcTime: 1000 * 60 * 60 * 24,    // 24 hours
};

export function useMessages(channelId: string) {
  return useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => MessageService.getChannelMessages(channelId),
    enabled: !!channelId,
    ...MESSAGING_CACHE_CONFIG,
  });
}

export function useThreadMessages(threadId: string, channelId: string) {
  return useQuery<Thread>({
    queryKey: ['thread-messages', threadId, channelId],
    queryFn: () => MessageService.getThreadReplies(threadId, channelId),
    enabled: !!threadId && !!channelId,
    ...MESSAGING_CACHE_CONFIG,
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
        const queryKey = ["thread-messages", targetThreadId, targetChannelId];
        await queryClient.cancelQueries({ queryKey });

        const previousThread = queryClient.getQueryData<Thread>(queryKey);

        queryClient.setQueryData<Thread>(queryKey, (old) => {
          // Aligning exactly with your interface: mapping to the 'replies' property
          if (!old) {
            return {
              id: targetThreadId,
              channelId: targetChannelId,
              replies: [optimisticMessage]
            } as unknown as Thread;
          }

          const currentReplies = old.replies || [];
          return {
            ...old,
            replies: [...currentReplies, optimisticMessage]
          };
        });

        return { previousThread, isThread: true, targetThreadId, targetChannelId };
      } else {
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
      if (context.isThread && context.previousThread) {
        queryClient.setQueryData(["thread-messages", context.targetThreadId, context.targetChannelId], context.previousThread);
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
        const queryKey = ["thread-messages", targetThreadId, targetChannelId];

        queryClient.setQueryData<Thread>(queryKey, (old) => {
          if (!old) {
            return {
              id: targetThreadId,
              channelId: targetChannelId,
              replies: [realMessage]
            } as unknown as Thread;
          }

          const currentReplies = old.replies || [];
          let replaced = false;

          const updated = currentReplies.map((msg) => {
            if (msg.id.toString().startsWith("temp-") && !replaced) {
              replaced = true;
              return realMessage;
            }
            return msg;
          });

          return {
            ...old,
            replies: replaced ? updated : [...currentReplies, realMessage]
          };
        });

        // Trigger background sync to keep parent component item counters updated
        queryClient.invalidateQueries({ queryKey: ["messages", targetChannelId] });
      } else {
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