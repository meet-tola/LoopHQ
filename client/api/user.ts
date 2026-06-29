import { api } from '../lib/axios';
import { User } from '@/types';

export const UserService = {
    async getWorkspaceUsers(workspaceId: string): Promise<User[]> {
        const response = await api.get<User[]>(`/workspaces/${workspaceId}/users`);
        return response.data;
    },

    async getUserById(userId: string): Promise<User> {
        const response = await api.get<User>(`/users/${userId}`);
        return response.data;
    }
};
