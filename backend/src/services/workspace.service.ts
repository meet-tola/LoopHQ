import prisma from "../utils/prisma";
import logger from "../utils/logger";
import crypto from "crypto";
import { WorkspaceRole } from "@prisma/client";
import { sendVerificationEmail } from "./malier";

export interface UpdateRolePayload {
  workspaceId: string;
  targetUserId: string;
  newRole: WorkspaceRole;
  requesterRole: WorkspaceRole;
}

export interface WorkspacePermissionsPayload {
  workspaceId: string;
  targetUserId: string;
  permissions: Record<string, any>;
}

export interface CreateWorkspacePayload {
  name: string;
  slug: string;
  image?: string;
  userId: string;
}

// --- Create workspace ---
export const createWorkspace = async ({ name, slug, image, userId }: CreateWorkspacePayload) => {
  const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
  if (existingSlug) throw new Error("Workspace slug is already taken");

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({ data: { name, slug } });
    await tx.workspaceMember.create({
      data: { workspaceId: workspace.id, userId, role: WorkspaceRole.OWNER },
    });
    const defaultChannel = await tx.channel.create({
      data: {
        workspaceId: workspace.id,
        name: "general",
        type: "PUBLIC",
      },
    });
    await tx.channelMember.create({
      data: {
        channelId: defaultChannel.id,
        userId,
      },
    });
    logger.info(`Workspace '${name}' created and seeded with Owner user ${userId}`);
    return workspace;
  });
};

// --- Lists all workspaces a specific user belongs to ---
export const getUserWorkspaces = async (userId: string) => {
  return prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      createdAt: true,
    },
  });
};

// --- Add a member to workspace ---
export const addMemberToWorkspace = async (workspaceId: string, targetEmail: string) => {
  const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (!targetUser) throw new Error("No user registered with this email address.");

  const existingMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
  });
  if (existingMember) throw new Error("User is already a member of this workspace.");

  return prisma.workspaceMember.create({
    data: { workspaceId, userId: targetUser.id, role: WorkspaceRole.MEMBER },
    include: { user: { select: { id: true, username: true, email: true } } },
  });
};

// --- Send invite to member to join a workspace using link ---
export const sendWorkspaceInvite = async (workspaceId: string, email: string, requestedByUserId: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.workspaceInvite.upsert({
    where: { workspaceId_email: { workspaceId, email } },
    update: { token, expiresAt },
    create: { workspaceId, email, token, expiresAt, invitedById: requestedByUserId },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/invite/accept?token=${token}`;
  await sendVerificationEmail({ email, verificationLink: inviteLink });
  return { success: true };
};

// --- Verify invite token ---
export const verifyInviteToken = async (token: string) => {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: { select: { name: true, slug: true } } },
  });

  if (!invite) throw new Error("Invalid or expired invitation link.");
  if (invite.expiresAt < new Date()) {
    await prisma.workspaceInvite.delete({ where: { token } }).catch(() => { });
    throw new Error("This invitation has expired.");
  }
  return invite;
};

// --- Accept workspace invitation ---
export const acceptWorkspaceInvite = async (token: string, userId: string) => {
  const invite = await verifyInviteToken(token);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new Error("User not found.");
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error("Access denied: This invitation was issued to a different email address.");
  }

  return prisma.$transaction(async (tx) => {
    const existingMember = await tx.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
    });

    if (existingMember) {
      await tx.workspaceInvite.delete({ where: { token } });
      return existingMember;
    }

    const newMember = await tx.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId, role: WorkspaceRole.MEMBER },
    });

    await tx.workspaceInvite.delete({ where: { token } });
    return newMember;
  });
};

// --- Generate or replace a unique invite code for a workspace ---
export const generateWorkspaceInviteCode = async (workspaceId: string) => {
  const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { inviteCode },
    select: { inviteCode: true },
  });
};

// --- Join a workspace using a unique invite code ---
export const joinWorkspaceWithCode = async (inviteCode: string, userId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
  });

  if (!workspace) throw new Error("Invalid invite code.");
  const existingMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
  });

  if (existingMember) throw new Error("You are already a member of this workspace.");

  return prisma.$transaction(async (tx) => {
    const newMember = await tx.workspaceMember.create({
      data: { workspaceId: workspace.id, userId, role: WorkspaceRole.MEMBER },
    });

    const generalChannel = await tx.channel.findFirst({
      where: { workspaceId: workspace.id, name: "general" }
    });

    if (generalChannel) {
      await tx.channelMember.create({
        data: { channelId: generalChannel.id, userId }
      }).catch(() => {}); 
    }

    return newMember;
  });
};

// --- Lists all members within a given workspace ---
export const getWorkspaceMembers = async (workspaceId: string) => {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: {
      id: true,
      role: true,
      permissions: true,
      createdAt: true,
      user: { select: { id: true, email: true, username: true } },
    },
  });
};


// --- Updates a member's workspace role ---
export const updateWorkspaceUserRole = async ({ workspaceId, targetUserId, newRole, requesterRole }: UpdateRolePayload) => {
  if (newRole === WorkspaceRole.OWNER && requesterRole !== WorkspaceRole.OWNER) {
    throw new Error("Access denied: Only workspace owners can assign the OWNER role.");
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });

  if (!targetMember) throw new Error("Target user is not a member of this workspace.");
  if (targetMember.role === WorkspaceRole.OWNER) {
    throw new Error("Access denied: Workspace Owners cannot be downgraded.");
  }

  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { role: newRole },
    include: { user: { select: { id: true, username: true, email: true } } },
  });
};

// --- Updates workspace user permission ---
export const updateWorkspaceUserPermissions = async ({ workspaceId, targetUserId, permissions }: WorkspacePermissionsPayload) => {
  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { permissions },
  });
};

// --- Removes a user from a workspace ---
export const removeUserFromWorkspace = async (workspaceId: string, targetUserId: string) => {
  const targetMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });

  if (!targetMember) throw new Error("User is not a member of this workspace.");
  if (targetMember.role === WorkspaceRole.OWNER) {
    throw new Error("Access denied: Workspace owners cannot be removed.");
  }

  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });

  return { success: true };
};