import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/api/message';
import { CreateMessagePayload, Message } from '@/types';
import { useAuthStore } from '@/stores/authStore';

export function useMessages(channelId: string) {
  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => MessageService.getChannelMessages(channelId),
    enabled: !!channelId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (payload: CreateMessagePayload) => MessageService.createMessage(payload),

    // cache mutation running immediately
    onMutate: async (newMessagePayload) => {
      if (!newMessagePayload.channelId) return;

      await queryClient.cancelQueries({ queryKey: ['messages', newMessagePayload.channelId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', newMessagePayload.channelId]);

      // Optimistically update the cache with a mock message structure
      const optimisticMessage: any = {
        id: `temp-${Date.now()}`,
        content: newMessagePayload.content,
        channelId: newMessagePayload.channelId,
        createdAt: new Date().toISOString(),
        user: {
          id: currentUser?.id || 'temp-user-id',
          name: currentUser?.name || 'Me',
        },
        reactions: [],
        files: [],
      };

      queryClient.setQueryData(['messages', newMessagePayload.channelId], (old: Message[] | undefined) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages, channelId: newMessagePayload.channelId };
    },

    onError: (err, variables, context) => {
      if (context?.channelId && context.previousMessages) {
        queryClient.setQueryData(['messages', context.channelId], context.previousMessages);
      }
    },

    onSuccess: (realMessage) => {
      if (!realMessage.channelId) return;

      queryClient.setQueryData(['messages', realMessage.channelId], (old: Message[] | undefined) => {
        if (!old) return [realMessage];
        // Replace our temporary message with the real one returned from the backend
        return old.map((msg) => msg.id.toString().startsWith('temp-') && msg.content === realMessage.content ? realMessage : msg);
      });
    },
  });
}