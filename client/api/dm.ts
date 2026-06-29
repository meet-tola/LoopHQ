import { api } from '../lib/axios';
import { DirectMessage } from '@/types';

export const DMService = {
  async getDirectMessages(workspaceId: string): Promise<DirectMessage[]> {
    const response = await api.get<DirectMessage[]>(`/workspaces/${workspaceId}/dms`);
    return response.data;
  },

  async getDirectMessageById(dmId: string): Promise<DirectMessage> {
    const response = await api.get<DirectMessage>(`/dms/${dmId}`);
    return response.data;
  }
};