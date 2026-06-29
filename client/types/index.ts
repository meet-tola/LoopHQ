export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type ChannelType = 'PUBLIC' | 'PRIVATE';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  status: 'online' | 'away' | 'offline';
  status_message?: string | null;
  created_at: string;
}

export type AuthResponse = {
  success: boolean;
  message: string;
  user: User;
  access_token: string | null;
  email_confirmation_required?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}


export type Workspace = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  inviteCode?: string | null;
  plan: string;
  customerId?: string | null;
  createdAt: string;
  updatedAt: string;
  members?: WorkspaceMember[];
}

export type WorkspaceMember = {
  id: string;
  role: string;
  permissions: Record<string, any>;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: ChannelType;
  workspaceId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  joinedAt: string;
}

export interface CreateChannelPayload {
  name: string;
  type: ChannelType;
}

export type Message = {
  id: string;
  userId: string;       // Matches the direct database reference key
  user: {
    id: string;
    email?: string;     // Made optional since getChannelMessages projects only id and name
    name: string;
  };
  content: string;
  createdAt: string;    // Clean string timestamp parsing to fix the Grouping/Invalid Date bugs
  channelId?: string;
  dmGroupId?: string;   // Updated from dmId to match backend naming precisely
  threadId?: string;    // Reference to target thread parent context
  reactions: Reaction[];
  files?: MessageFile[]; // Matches the integrated database file collection inclusions
  parentOf?: Array<{
    id: string;
    _count: {
      replies: number;
    };
  }>;                   // Maps the Prisma thread counting schema payload dynamically
};

export interface CreateMessagePayload {
  content: string;
  channelId?: string;
  dmGroupId?: string;
  threadId?: string;
}
export type Reaction = {
  id: string;
  emoji: string;
  messageId: string;
  userId: string;
  createdAt: string | Date;
};

export type MessageFile = {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  messageId: string;
};

export type DirectMessage = {
  id: string
  participants: User[]
  lastMessage?: Message
  unreadCount: number
}

export type Thread = {
  id: string
  parentMessageId: string
  messages: Message[]
  participantCount: number
}

export type TypingIndicator = {
  userId: string
  userName: string
  channelId?: string
  dmId?: string
}
