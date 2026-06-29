import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserService } from '@/api/user'
import { ChannelService } from '@/api/channel'
import { MessageService } from '@/api/message'
import { DMService } from '@/api/dm'




// --- Workspace Users ---
export function useUsers(workspaceId: string) {
  return useQuery({
    queryKey: ['users', workspaceId],
    queryFn: () => UserService.getWorkspaceUsers(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => UserService.getUserById(userId),
    enabled: !!userId,
  })
}

// --- Channels ---
export function useChannels(workspaceId: string) {
  return useQuery({
    queryKey: ['channels', workspaceId],
    queryFn: () => ChannelService.getWorkspaceChannels(workspaceId),
    enabled: !!workspaceId,
  })
}


// --- Direct Messages ---
export function useDirectMessages(workspaceId: string) {
  return useQuery({
    queryKey: ['directMessages', workspaceId],
    queryFn: () => DMService.getDirectMessages(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useDirectMessage(dmId: string) {
  return useQuery({
    queryKey: ['directMessage', dmId],
    queryFn: () => DMService.getDirectMessageById(dmId),
    enabled: !!dmId,
  })
}

// --- Messages & Interactive Mutations ---
export function useMessages(channelId?: string, dmId?: string) {
  return useQuery({
    queryKey: ['messages', channelId, dmId],
    queryFn: () => MessageService.getMessages({ channelId, dmId }),
    // Only fetch if at least one target scope is provided
    enabled: !!channelId || !!dmId,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      content: string
      channelId?: string
      dmId?: string
    }) => MessageService.sendMessage(data),
    onSuccess: (newMessage) => {
      // Intelligently targets the exact channel/dm list structure
      queryClient.invalidateQueries({
        queryKey: ['messages', newMessage.channelId, newMessage.dmId],
      })
    },
  })
}

export function useAddReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      messageId: string
      emoji: string
    }) => MessageService.addReaction(data.messageId, data.emoji),
    onSuccess: () => {
      // Invalidates target message caches globally to reload the updated reactions array
      queryClient.invalidateQueries({
        queryKey: ['messages'],
      })
    },
  })
}

// --- Full Text Search ---
export function useSearchMessages(workspaceId: string, query: string) {
  return useQuery({
    queryKey: ['searchMessages', workspaceId, query],
    queryFn: () => MessageService.searchMessages(workspaceId, query),
    enabled: !!workspaceId && query.trim().length > 0,
  })
}

// --- Nested Message Threads ---
export function useThreadMessages(parentMessageId: string) {
  return useQuery({
    queryKey: ['threadMessages', parentMessageId],
    queryFn: () => MessageService.getThreadMessages(parentMessageId),
    enabled: !!parentMessageId,
  })
}

export function useReplyToThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      parentMessageId: string
      content: string
    }) => MessageService.replyToThread(data.parentMessageId, data.content),
    onSuccess: (_, variables) => {
      // Invalidate the thread view specifically
      queryClient.invalidateQueries({
        queryKey: ['threadMessages', variables.parentMessageId],
      })
      // Refresh the parent channel/dm chat feed layout too
      queryClient.invalidateQueries({
        queryKey: ['messages'],
      })
    },
  })
}