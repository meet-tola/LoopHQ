import prisma from "../utils/prisma";

export interface CreateGroupDmPayload {
  creatorId: string;
  memberIds: string[];
}

/**
 * Finds or creates a clean 1:1 DM channel between two users
 */
export const getOrCreate1to1DM = async (userA: string, userB: string) => {
  if (userA === userB) throw new Error("You cannot start a 1:1 DM conversation with yourself.");

  // Check if a 1:1 conversation already exists between these precise two users
  const existingDm = await prisma.dmGroup.findFirst({
    where: {
      isGroup: false,
      AND: [
        { memberIds: { has: userA } },
        { memberIds: { has: userB } },
      ],
    },
  });

  if (existingDm) {
    // Double check array length to avoid matches with accidental subset overlaps
    if (existingDm.memberIds.length === 2) return existingDm;
  }

  // Create a clean new one if it does not exist
  return prisma.dmGroup.create({
    data: {
      isGroup: false,
      memberIds: [userA, userB],
    },
  });
};

/**
 * Creates a brand new multi-person group DM
 */
export const createGroupDM = async ({ creatorId, memberIds }: CreateGroupDmPayload) => {
  // Ensure the creator is safely combined into the participant pool uniquely
  const uniqueMembers = Array.from(new Set([creatorId, ...memberIds]));

  if (uniqueMembers.length < 3) {
    throw new Error("Group DMs require at least 3 participants (including yourself).");
  }

  return prisma.dmGroup.create({
    data: {
      isGroup: true,
      memberIds: uniqueMembers,
    },
  });
};

/**
 * Lists all DM conversations (1:1 and Groups) the user belongs to
 */
export const getUserDMs = async (userId: string) => {
  return prisma.dmGroup.findMany({
    where: {
      memberIds: { has: userId },
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      _count: { select: { messages: true } },
    },
  });
};

/**
 * Verifies that a user is actively a registered participant of a given DM group
 */
export const validateDmParticipation = async (dmGroupId: string, userId: string) => {
  const dmGroup = await prisma.dmGroup.findUnique({ where: { id: dmGroupId } });
  if (!dmGroup) throw new Error("DM conversation context not found.");
  
  if (!dmGroup.memberIds.includes(userId)) {
    throw new Error("Access Denied: You are not part of this DM group.");
  }
  
  return dmGroup;
};