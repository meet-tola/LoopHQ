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
        select: { id: true, _count: { select: { replies: true } } },
      },
    },
  });

  return messages.reverse();
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

  return await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true } },
      reactions: true,
    },
  });
};