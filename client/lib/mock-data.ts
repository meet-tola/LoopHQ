import { Channel, Message, User, DirectMessage } from '@/types'

export const currentUser: User = {
  id: 'user-1',
  name: 'You',
  email: 'you@example.com',
  status: 'online',
  statusMessage: 'Working on Q1 goals',
}

export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    status: 'online',
  },
  {
    id: 'user-3',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    status: 'away',
    statusMessage: 'In a meeting',
  },
  {
    id: 'user-4',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    status: 'offline',
  },
]

export const channels: Channel[] = [
  {
    id: 'channel-1',
    name: 'general',
    description: 'General discussion',
    private: false,
    members: ['user-1', 'user-2', 'user-3', 'user-4'],
    unreadCount: 0,
  },
  {
    id: 'channel-2',
    name: 'random',
    description: 'Random stuff',
    private: false,
    members: ['user-1', 'user-2', 'user-3'],
    unreadCount: 2,
  },
  {
    id: 'channel-3',
    name: 'design',
    description: 'Design discussions',
    private: false,
    members: ['user-1', 'user-2'],
    unreadCount: 0,
  },
  {
    id: 'channel-4',
    name: 'engineering',
    description: 'Engineering team',
    private: false,
    members: ['user-1', 'user-3', 'user-4'],
    unreadCount: 5,
  },
]

export const messages: Message[] = [
  {
    id: 'msg-1',
    authorId: 'user-2',
    authorName: 'Sarah Chen',
    content: 'Hey everyone! Just finished the Q1 planning',
    timestamp: new Date(Date.now() - 3600000),
    channelId: 'channel-1',
    reactions: [
      { emoji: '👍', users: ['user-1', 'user-3'] },
      { emoji: '🎉', users: ['user-1'] },
    ],
    threadCount: 2,
  },
  {
    id: 'msg-2',
    authorId: 'user-1',
    authorName: 'You',
    content: 'Great work! Let me review the docs',
    timestamp: new Date(Date.now() - 3000000),
    channelId: 'channel-1',
    reactions: [],
    threadCount: 0,
  },
  {
    id: 'msg-3',
    authorId: 'user-3',
    authorName: 'Alex Morgan',
    content: 'This looks amazing 🚀',
    timestamp: new Date(Date.now() - 2400000),
    channelId: 'channel-1',
    reactions: [{ emoji: '❤️', users: ['user-2'] }],
    threadCount: 1,
  },
  {
    id: 'msg-4',
    authorId: 'user-2',
    authorName: 'Sarah Chen',
    content: 'Did you see the new design mockups?',
    timestamp: new Date(Date.now() - 1800000),
    channelId: 'channel-3',
    reactions: [],
    threadCount: 0,
  },
  {
    id: 'msg-5',
    authorId: 'user-1',
    authorName: 'You',
    content: 'Just checked them out. Love the new color scheme!',
    timestamp: new Date(Date.now() - 1200000),
    channelId: 'channel-3',
    reactions: [{ emoji: '👀', users: ['user-2'] }],
    threadCount: 0,
  },
]

export const directMessages: DirectMessage[] = [
  {
    id: 'dm-1',
    participants: [currentUser, users[1]],
    lastMessage: {
      id: 'msg-dm-1',
      authorId: 'user-2',
      authorName: 'Sarah Chen',
      content: 'Let me know when you are free for a call',
      timestamp: new Date(Date.now() - 300000),
      reactions: [],
      threadCount: 0,
    },
    unreadCount: 1,
  },
  {
    id: 'dm-2',
    participants: [currentUser, users[2]],
    lastMessage: {
      id: 'msg-dm-2',
      authorId: 'user-1',
      authorName: 'You',
      content: 'Sounds good, see you then!',
      timestamp: new Date(Date.now() - 7200000),
      reactions: [],
      threadCount: 0,
    },
    unreadCount: 0,
  },
  {
    id: 'dm-3',
    participants: [currentUser, users[3]],
    lastMessage: {
      id: 'msg-dm-3',
      authorId: 'user-4',
      authorName: 'Jordan Lee',
      content: 'Thanks for the feedback!',
      timestamp: new Date(Date.now() - 86400000),
      reactions: [],
      threadCount: 0,
    },
    unreadCount: 0,
  },
]
