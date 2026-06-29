import { api } from '../lib/axios';
import { ApiResponse, CreateMessagePayload, Message } from '@/types'

export const MessageService = {
  async getChannelMessages(channelId: string, limit?: number, cursor?: string): Promise<Message[]> {
    const response = await api.get<ApiResponse<Message[]>>(`/messages/channel/${channelId}`, {
      params: { limit, cursor }
    });
    return response.data.data;
  },

  // Create a new message
  async createMessage(payload: CreateMessagePayload): Promise<Message> {
    const response = await api.post<ApiResponse<Message>>('/messages', payload);
    return response.data.data;
  },

  async getMessages(params: { channelId?: string; dmId?: string }): Promise<Message[]> {
    const response = await api.get<Message[]>('/messages', { params });
    return response.data;
  },

  async sendMessage(data: { content: string; channelId?: string; dmId?: string }): Promise<Message> {
    const response = await api.post<Message>('/messages', data);
    return response.data;
  },

  async addReaction(messageId: string, emoji: string): Promise<{ messageId: string; emoji: string }> {
    const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return { messageId, emoji };
  },

  async searchMessages(workspaceId: string, query: string): Promise<Message[]> {
    const response = await api.get<Message[]>(`/workspaces/${workspaceId}/search`, { params: { query } });
    return response.data;
  },

  async getThreadMessages(parentMessageId: string): Promise<Message[]> {
    const response = await api.get<Message[]>(`/messages/${parentMessageId}/thread`);
    return response.data;
  },

  async replyToThread(parentMessageId: string, content: string): Promise<Partial<Message>> {
    const response = await api.post(`/messages/${parentMessageId}/thread`, { content });
    return response.data;
  }
};
