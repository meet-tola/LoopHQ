import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChannelService } from '@/api/channel'
import { CreateChannelPayload } from '@/types'

// --- QUERIES ---

// Fetches all channels inside a workspace
export function useChannels(workspaceId: string) {
  return useQuery({
    queryKey: ['channels', workspaceId],
    queryFn: () => ChannelService.getWorkspaceChannels(workspaceId),
    enabled: !!workspaceId,
  })
}


// --- MUTATIONS ---

// Creates a channel inside a specific workspace
export function useCreateChannel(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => 
      ChannelService.createChannel(workspaceId, payload),
    onSuccess: (newChannel) => {
      toast.success('Channel created!', {
        description: `#${newChannel.name} is ready for messages.`,
      })
      queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Could not create channel.'
      toast.error('Creation Error', { description: message })
    }
  })
}

// Joins a channel
export function useJoinChannel(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: string) => 
      ChannelService.joinChannel(workspaceId, channelId),
    onSuccess: (_, channelId) => {
      toast.success('Joined channel successfully!')
      // Invalidate channel lists and active states if applicable
      queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['channel-membership', channelId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to join channel.'
      toast.error('Error', { description: message })
    }
  })
}

// Leaves a channel
export function useLeaveChannel(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: string) => 
      ChannelService.leaveChannel(workspaceId, channelId),
    onSuccess: (response, channelId) => {
      toast.success(response.message || 'Left channel.')
      queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['channel-membership', channelId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to leave channel.'
      toast.error('Error', { description: message })
    }
  })
}

// Deletes a channel (Admins/Owners only)
export function useDeleteChannel(workspaceId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (channelId: string) => 
      ChannelService.deleteChannel(workspaceId, channelId),
    onSuccess: (response) => {
      toast.success(response.message || 'Channel deleted.')
      queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] })
      // Redirect back to main workspace page since current channel is gone
      router.push(`/workspace/${workspaceId}`)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete channel.'
      toast.error('Error', { description: message })
    }
  })
}