import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";
import crypto from "crypto";
import { WorkspaceRole } from "@prisma/client";
import { sendVerificationEmail } from "./malier";

export interface UpdateRolePayload {
  workspaceId: string;
  targetUserId: string;
  newRole: WorkspaceRole;
  requestedByUserId: string;
}

export interface WorkspacePermissionsPayload {
  workspaceId: string;
  targetUserId: string;
  permissions: Record<string, any>;
  requestedByUserId: string;
}

export interface CreateWorkspacePayload {
  name: string;
  slug: string;
  userId: string;
}

// --- Add a member to workspace ---
export const createWorkspace = async ({ name, slug, userId }: CreateWorkspacePayload) => {
  const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
  if (existingSlug) throw new Error("Workspace slug is already taken");

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name, slug },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: WorkspaceRole.OWNER,
      },
    });

    logger.info(`Workspace '${name}' created and seeded with Owner user ${userId}`);
    return workspace;
  });
};


// --- Add a member to workspace ---
export const addMemberToWorkspace = async (workspaceId: string, targetEmail: string, requestedByUserId: string) => {
  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: requestedByUserId } },
  });

  if (!requester || (requester.role !== WorkspaceRole.OWNER && requester.role !== WorkspaceRole.ADMIN)) {
    throw new Error("Access denied: Insufficient privileges to add members directly.");
  }

  const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (!targetUser) throw new Error("No user registered with this email address.");

  const existingMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
  });
  if (existingMember) throw new Error("User is already a member of this workspace.");

  return prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: targetUser.id,
      role: WorkspaceRole.MEMBER,
    },
    include: {
      user: { select: { id: true, username: true, email: true } },
    },
  });
};


// --- Send invite to member to join a workspace using link ---
export const sendWorkspaceInvite = async (workspaceId: string, email: string, requestedByUserId: string) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: requestedByUserId } },
  });

  if (!membership || (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN)) {
    throw new Error("Access denied: Insufficient privileges to invite users.");
  }

  // Generate token 
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Track invitation in the database
  await prisma.workspaceInvite.upsert({
    where: { workspaceId_email: { workspaceId, email } },
    update: { token, expiresAt },
    create: { workspaceId, email, token, expiresAt, invitedById: requestedByUserId },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/invite/accept?token=${token}`;

  await sendVerificationEmail({
    email,
    verificationLink: inviteLink,
  });

  return { success: true };
};

// --- Verify Invite Token ---
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
}

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
}


// --- Lists all members within a given workspace ---
export const getWorkspaceMembers = async (workspaceId: string, userId: string) => {
  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!requester) throw new Error("Access denied: Not a member of this workspace");

  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: {
      id: true,
      role: true,
      permissions: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });
};

// --- Updates a member's workspace role ---
export const updateWorkspaceUserRole = async ({
  workspaceId,
  targetUserId,
  newRole,
  requestedByUserId,
}: UpdateRolePayload) => {
  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: requestedByUserId } },
  });

  if (!requester) throw new Error("Access denied: You are not a member of this workspace.");
  if (requester.role !== WorkspaceRole.OWNER && requester.role !== WorkspaceRole.ADMIN) {
    throw new Error("Access denied: Insufficient administrative privileges.");
  }
  if (newRole === WorkspaceRole.OWNER && requester.role !== WorkspaceRole.OWNER) {
    throw new Error("Access denied: Only workspace owners can assign the OWNER role.");
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });

  if (!targetMember) throw new Error("Target user is not a member of this workspace.");
  if (targetMember.role === WorkspaceRole.OWNER && requestedByUserId !== targetUserId) {
    throw new Error("Access denied: Workspace Owners cannot be downgraded.");
  }

  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { role: newRole },
    include: {
      user: { select: { id: true, username: true, email: true } },
    },
  });
};

// --- Updates Workspace user permission ---
export const updateWorkspaceUserPermissions = async ({
  workspaceId,
  targetUserId,
  permissions,
  requestedByUserId,
}: WorkspacePermissionsPayload) => {
  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: requestedByUserId } },
  });

  if (!requester || (requester.role !== WorkspaceRole.OWNER && requester.role !== WorkspaceRole.ADMIN)) {
    throw new Error("Access denied: Insufficient privileges to update fine-grained permissions.");
  }

  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    data: { permissions },
  });
};

// --- Removes a user from a workspace ---
export const removeUserFromWorkspace = async (workspaceId: string, targetUserId: string, requestedByUserId: string) => {
  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: requestedByUserId } },
  });

  if (!requester || (requester.role !== WorkspaceRole.OWNER && requester.role !== WorkspaceRole.ADMIN)) {
    throw new Error("Access denied: You cannot remove members from this workspace.");
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });

  if (!targetMember) throw new Error("User is not a member of this workspace.");
  if (targetMember.role === WorkspaceRole.OWNER) {
    throw new Error("Access denied: Workspace owners cannot be removed directly.");
  }

  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });

  logger.warn(`User ${targetUserId} removed from workspace ${workspaceId} by ${requestedByUserId}`);
  return { success: true };
};