import { api } from '../lib/axios';
import { Channel, ChannelMember, CreateChannelPayload, ApiResponse } from '@/types';

export const ChannelService = {
  // Get all channels inside a workspace
  async getWorkspaceChannels(workspaceId: string): Promise<Channel[]> {
    const response = await api.get<ApiResponse<Channel[]>>(`/channels/${workspaceId}`);
    return response.data.data;
  },

  // Create a channel inside a workspace
  async createChannel(workspaceId: string, payload: CreateChannelPayload): Promise<Channel> {
    const response = await api.post<ApiResponse<Channel>>(`/channels/${workspaceId}`, payload);
    return response.data.data;
  },

  // Join a specific channel
  async joinChannel(workspaceId: string, channelId: string): Promise<ChannelMember> {
    const response = await api.post<ApiResponse<ChannelMember>>(
      `/channels/${workspaceId}/${channelId}/join`
    );
    return response.data.data;
  },

  // Leave a specific channel
  async leaveChannel(workspaceId: string, channelId: string): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<null>>(
      `/channels/${workspaceId}/${channelId}/leave`
    );
    return { message: response.data.message || "Successfully left channel." };
  },

  // Delete a channel completely
  async deleteChannel(workspaceId: string, channelId: string): Promise<{ message: string }> {
    const response = await api.delete<ApiResponse<null>>(
      `/channels/${workspaceId}/${channelId}`
    );
    return { message: response.data.message || "Channel dropped successfully." };
  }
};