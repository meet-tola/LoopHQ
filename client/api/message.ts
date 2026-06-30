import { api } from '../lib/axios';
import { ApiResponse, CreateMessagePayload, Message } from '@/types'

export const MessageService = {
  async getChannelMessages(channelId: string, limit?: number, cursor?: string): Promise<Message[]> {
    const response = await api.get<ApiResponse<Message[]>>(`/messages/channel/${channelId}`, {
      params: { limit, cursor }
    });
    return response.data.data;
  },

  async createMessage(payload: CreateMessagePayload): Promise<Message> {
    const response = await api.post<ApiResponse<Message>>('/messages', payload);
    return response.data.data;
  },

  async getThreadReplies(threadId: string, channelId: string): Promise<Message[]> {
    const response = await api.get<ApiResponse<Message[]>>(`/messages/${channelId}/${threadId}`);
    return response.data.data;
  },


  async addReaction(messageId: string, emoji: string): Promise<{ messageId: string; emoji: string }> {
    const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return { messageId, emoji };
  },

  async searchMessages(workspaceId: string, query: string): Promise<Message[]> {
    const response = await api.get<Message[]>(`/workspaces/${workspaceId}/search`, { params: { query } });
    return response.data;
  },

  async replyToThread(parentMessageId: string, content: string): Promise<Partial<Message>> {
    const response = await api.post(`/messages/${parentMessageId}/thread`, { content });
    return response.data;
  }
};
