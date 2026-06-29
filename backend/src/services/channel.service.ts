import prisma from "../utils/prisma";
import { ChannelType } from "@prisma/client";

export interface CreateChannelPayload {
    workspaceId: string;
    name: string;
    type: ChannelType;
    userId: string;
}

export const createChannel = async ({ workspaceId, name, type, userId }: CreateChannelPayload) => {
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, "-");
    
    const existingChannel = await prisma.channel.findUnique({
        where: { workspaceId_name: { workspaceId, name: cleanName } },
    });
    if (existingChannel) throw new Error("A channel with this name already exists in this workspace.");

    return prisma.$transaction(async (tx) => {
        const channel = await tx.channel.create({
            data: { workspaceId, name: cleanName, type },
        });

        await tx.channelMember.create({
            data: { channelId: channel.id, userId },
        });

        return channel;
    });
};

export const getWorkspaceChannels = async (workspaceId: string, userId: string) => {
    return prisma.channel.findMany({
        where: {
            workspaceId,
            OR: [
                { type: ChannelType.PUBLIC },
                {
                    type: ChannelType.PRIVATE,
                    members: { some: { userId } },
                },
            ],
        },
        include: {
            _count: { select: { members: true } },
        },
    });
};

export const joinChannel = async (channelId: string, userId: string) => {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw new Error("Channel not found.");
    if (channel.type === ChannelType.PRIVATE) throw new Error("Cannot directly join a private channel.");

    const existingMember = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId, userId } },
    });
    if (existingMember) return existingMember;

    return prisma.channelMember.create({
        data: { channelId, userId },
    });
};

export const leaveChannel = async (channelId: string, userId: string) => {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (channel?.name === "general") throw new Error("Members are not allowed to leave the general channel.");

    const member = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId, userId } },
    });
    if (!member) throw new Error("You are not a member of this channel.");

    await prisma.channelMember.delete({
        where: { channelId_userId: { channelId, userId } },
    });

    return { success: true };
};

export const deleteChannel = async (channelId: string) => {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw new Error("Channel not found.");
    if (channel.name === "general") throw new Error("The base default channel cannot be deleted.");

    await prisma.channel.delete({ where: { id: channelId } });
    return { success: true };
};