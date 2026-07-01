import prisma from "../utils/prisma";

export interface CreateMessagePayload {
  content: string;
  userId: string;
  channelId?: string;
  dmGroupId?: string;
  threadId?: string;
}

// Helper to verify a user has permission to post/view in a channel
export const validateChannelMembership = async (channelId: string, userId: string) => {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: true },
  });

  if (!channel) throw new Error("Channel not found.");

  // If it's a private channel, explicitly check membership
  if (channel.type === "PRIVATE") {
    const isMember = channel.members.some((m) => m.userId === userId);
    if (!isMember) throw new Error("You do not have access to this private channel.");
  }
};

export const createMessage = async ({
  content,
  userId,
  channelId,
  dmGroupId,
  threadId,
}: CreateMessagePayload) => {
  if (!channelId && !dmGroupId) {
    throw new Error("Message must belong to either a channel or a DM group.");
  }

  if (channelId) {
    await validateChannelMembership(channelId, userId);
  }

  let finalThreadId = threadId;

  if (threadId) {
    let threadExists = await prisma.thread.findUnique({ where: { id: threadId } });

    if (!threadExists) {
      const rootMessage = await prisma.message.findUnique({ where: { id: threadId } });
      if (!rootMessage) throw new Error("Root message not found.");

      threadExists = await prisma.thread.create({
        data: {
          id: threadId,
          parentMsgId: threadId
        },
      });
    }

    finalThreadId = threadExists.id;
  }

  return prisma.message.create({
    data: {
      content,
      userId,
      channelId,
      dmGroupId,
      threadId: finalThreadId, // Tie it neatly to the thread table row
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      reactions: true,
      files: true,
    },
  });
};

export const getChannelMessages = async (channelId: string, userId: string, limit = 50, cursor?: string) => {
  await validateChannelMembership(channelId, userId);

  const messages = await prisma.message.findMany({
    where: {
      channelId,
      threadId: null,
    },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      reactions: true,
      files: true,
      parentOf: {
        include: {
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
              aiAgent: { select: { id: true, name: true, avatarUrl: true } },
            }
          }
        }
      }
    }
  });

  return messages.map((message) => {
    const threadRelation = message.parentOf;

    // If this message doesn't parent a thread, return it clean
    if (!threadRelation) return { ...message, parentOf: null };

    const replies = threadRelation.replies || [];

    // Extract thread participants
    const participantsMap = new Map();
    replies.forEach((reply) => {
      const actor = reply.user || reply.aiAgent;
      if (actor && !participantsMap.has(actor.id)) {
        participantsMap.set(actor.id, {
          id: actor.id,
          name: actor.name,
          avatarUrl: actor.avatarUrl,
        });
      }
    });

    return {
      ...message,
      parentOf: [
        {
          id: threadRelation.id,
          parentMsgId: threadRelation.parentMsgId,
          status: threadRelation.status,
          aiSummary: threadRelation.aiSummary,
          createdAt: threadRelation.createdAt,
          updatedAt: threadRelation.updatedAt,
          replyCount: replies.length,
          lastReplyAt: replies.length > 0 ? replies[replies.length - 1].createdAt : null,
          participants: Array.from(participantsMap.values()),
        }
      ]
    };
  });
};

export const createThread = async (parentMsgId: string) => {
  const message = await prisma.message.findUnique({ where: { id: parentMsgId } });
  if (!message) throw new Error("Root message not found.");

  return prisma.thread.create({
    data: { parentMsgId },
  });
};

export const getThreadReplies = async (threadId: string, channelId: string, userId: string) => {
  await validateChannelMembership(channelId, userId);

  const replies = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      },
      aiAgent: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      },
      reactions: true,
    },
  });

  const participantsMap = new Map<string, { id: string; name: string | null; avatarUrl: string | null }>();

  replies.forEach((reply) => {
    const author = reply.user || reply.aiAgent;
    if (author && !participantsMap.has(author.id)) {
      participantsMap.set(author.id, {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatarUrl,
      });
    }
  });

  return {
    replies,
    replyCount: replies.length,
    lastReplyAt: replies.length > 0 ? replies[replies.length - 1].createdAt : null,
    participants: Array.from(participantsMap.values()),
  };
};