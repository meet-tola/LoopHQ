import { api } from '../lib/axios';
import { Workspace, WorkspaceMember, UserRole, ApiResponse } from '@/types';

export const WorkspaceService = {
  // GET /workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await api.get<ApiResponse<Workspace[]>>('/workspaces');
    return response.data.data;
  },

  // POST /workspaces/create
  async createWorkspace(data: { name: string; slug: string; image?: string }): Promise<Workspace> {
    const response = await api.post<ApiResponse<Workspace>>('/workspaces/create', data);
    return response.data.data;
  },

  // POST /workspaces/join/code
  async joinWithCode(inviteCode: string): Promise<{ id: string; workspaceId: string; role: string; name: string; slug: string; }> {
    const response = await api.post<ApiResponse<any>>('/workspaces/join/code', { inviteCode });
    return response.data.data;
  },

  // POST /workspaces/:workspaceId/code
  async generateInviteCode(workspaceId: string): Promise<{ inviteCode: string }> {
    const response = await api.post<ApiResponse<{ inviteCode: string }>>(`/workspaces/${workspaceId}/code`);
    return response.data.data;
  },

  // GET /workspaces/:workspaceId/members
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await api.get<ApiResponse<WorkspaceMember[]>>(`/workspaces/${workspaceId}/members`);
    return response.data.data;
  },

  // PATCH /workspaces/:workspaceId/members/role
  async updateMemberRole(workspaceId: string, targetUserId: string, role: UserRole): Promise<any> {
    const response = await api.patch<ApiResponse<any>>(`/workspaces/${workspaceId}/members/role`, { targetUserId, role });
    return response.data.data;
  },

  // PATCH /workspaces/:workspaceId/members/permissions
  async updateCustomPermissions(workspaceId: string, targetUserId: string, permissions: Record<string, boolean>): Promise<any> {
    const response = await api.patch<ApiResponse<any>>(`/workspaces/${workspaceId}/members/permissions`, { targetUserId, permissions });
    return response.data.data;
  },

  // DELETE /workspaces/:workspaceId/members/remove
  async removeUser(workspaceId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<ApiResponse<any>>(`/workspaces/${workspaceId}/members/remove`, { data: { targetUserId } });
    return {
      success: response.data.success,
      message: response.data.message ?? "User removed successfully"
    };
  },

  // POST /workspaces/:workspaceId/members/add
  async addMemberDirectly(workspaceId: string, email: string): Promise<any> {
    const response = await api.post<ApiResponse<any>>(`/workspaces/${workspaceId}/members/add`, { email });
    return response.data.data;
  },

  // POST /workspaces/:workspaceId/members/invite
  async sendEmailInvite(workspaceId: string, email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<ApiResponse<any>>(`/workspaces/${workspaceId}/members/invite`, { email });
    return {
      success: response.data.success,
      message: response.data.message ?? "Invitation sent successfully"
    };
  },

  // GET /workspaces/invites/verify?token=...
  async verifyInviteToken(token: string): Promise<{ email: string; workspaceSlug: string }> {
    const response = await api.get<ApiResponse<{ invite: { email: string; workspaceName: string; workspaceSlug: string } }>>(`/workspaces/invites/verify?token=${token}`);
    return response.data.data.invite;
  },

  // POST /workspaces/invites/accept
  async acceptEmailInvite(token: string): Promise<any> {
    const response = await api.post<ApiResponse<any>>('/workspaces/invites/accept', { token });
    return response.data.data;
  }
};