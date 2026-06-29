import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { WorkspaceService } from '@/api/workspace'
import { UserRole } from '@/types'

// --- QUERIES ---

// Fetches all workspaces user belongs to
export function useWorkspaces(isEnabled: boolean) {
    return useQuery({
        queryKey: ['workspaces'],
        queryFn: WorkspaceService.getWorkspaces,
        enabled: isEnabled,
    })
}

// Fetches members within a single active workspace 
export function useWorkspaceMembers(workspaceId: string) {
    return useQuery({
        queryKey: ['workspace-members', workspaceId],
        queryFn: () => WorkspaceService.getWorkspaceMembers(workspaceId),
        enabled: !!workspaceId,
    })
}

// Validates token 
export function useVerifyInviteToken(token: string, isEnabled: boolean) {
    return useQuery({
        queryKey: ['verify-invite', token],
        queryFn: () => WorkspaceService.verifyInviteToken(token),
        enabled: isEnabled && !!token,
        retry: false,
    })
}


// --- MUTATIONS ---

// Creates a brand new workspace
export function useCreateWorkspace() {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
        mutationFn: WorkspaceService.createWorkspace,
        onSuccess: (newWorkspace) => {
            toast.success('Workspace created!', {
                description: `Welcome to your new home, ${newWorkspace.name}.`,
            })
            queryClient.invalidateQueries({ queryKey: ['workspaces'] })
            router.push(`/workspace/${newWorkspace.slug}`)
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Could not create workspace.'
            toast.error('Creation Error', { description: message })
        }
    })
}

// Redeems a short alphanumeric text-code token string
export function useJoinWorkspaceWithCode() {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
        mutationFn: (inviteCode: string) => WorkspaceService.joinWithCode(inviteCode),
        onSuccess: (newMembership) => {
            toast.success('Joined successfully!', { description: 'You have been added to the team.' })
            queryClient.invalidateQueries({ queryKey: ['workspaces'] })
            router.push(`/workspace/${newMembership.workspaceId}`)
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Invalid or expired invite code.'
            toast.error('Join Error', { description: message })
        }
    })
}

// Admin to generate numeric codes
export function useGenerateWorkspaceCode(workspaceId: string) {
    return useMutation({
        mutationFn: () => WorkspaceService.generateInviteCode(workspaceId),
        onSuccess: (data) => {
            toast.success('Invite code active!', {
                description: `Code "${data.inviteCode}" is ready to share.`,
            })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to generate code.'
            toast.error('Generation Error', { description: message })
        }
    })
}

// Changes member user roles (Admin, Member, Owner)
export function useUpdateMemberRole(workspaceId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ targetUserId, role }: { targetUserId: string; role: UserRole }) =>
            WorkspaceService.updateMemberRole(workspaceId, targetUserId, role),
        onSuccess: () => {
            toast.success('Role updated successfully')
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to update role permissions.'
            toast.error('Update Failed', { description: message })
        }
    })
}

export function useUpdateCustomPermissions(workspaceId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ targetUserId, permissions }: { targetUserId: string; permissions: Record<string, boolean> }) =>
            WorkspaceService.updateCustomPermissions(workspaceId, targetUserId, permissions),
        onSuccess: () => {
            toast.success('Permissions saved.')
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to update custom permissions.'
            toast.error('Error saving rules', { description: message })
        }
    })
}

export function useRemoveUserFromWorkspace(workspaceId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (targetUserId: string) => WorkspaceService.removeUser(workspaceId, targetUserId),
        onSuccess: () => {
            toast.success('Member removed successfully.')
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Could not remove member user.'
            toast.error('Action Restricted', { description: message })
        }
    })
}

export function useAddMember(workspaceId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (email: string) => WorkspaceService.addMemberDirectly(workspaceId, email),
        onSuccess: () => {
            toast.success('Member added directly to workspace.')
            queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'User lookup failed.'
            toast.error('Failed to Add', { description: message })
        }
    })
}

export function useSendWorkspaceInvite(workspaceId: string) {
    return useMutation({
        mutationFn: (email: string) => WorkspaceService.sendEmailInvite(workspaceId, email),
        onSuccess: (res) => {
            toast.success(res.message || 'Invitation sent to target inbox.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to dispatch email link invitation.'
            toast.error('Failed to Invite', { description: message })
        }
    })
}

export function useAcceptEmailInvite() {
    const queryClient = useQueryClient()
    const router = useRouter()

    return useMutation({
        mutationFn: (token: string) => WorkspaceService.acceptEmailInvite(token),
        onSuccess: (data) => {
            toast.success('Welcome aboard!', { description: 'Successfully joined using confirmation code token link.' })
            queryClient.invalidateQueries({ queryKey: ['workspaces'] })
            router.push(`/workspace/${data.workspaceId}`)
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Verification confirmation sequence rejected.'
            toast.error('Invitation Error', { description: message })
        }
    })
}