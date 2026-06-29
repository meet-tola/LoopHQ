import { AuthResponse, Session, User as SupabaseUser } from "@supabase/supabase-js";
import {
    supabase,
    supabaseAdmin,
    supabaseWithAuth
} from "../utils/supabase";
import logger from "../utils/logger";
import prisma from "../utils/prisma";
import { sendVerificationEmail, sendPasswordResetEmail } from "./malier"
import { Env } from "../config/env.config";
import { WorkspaceRole } from "@prisma/client";

// --- Interfaces ---
export interface AuthResult {
    user: SupabaseUser;
    dbUser: any;
    session: Session | null;
}

export interface RegisterPayload {
    email: string;
    name: string;
    password?: string;
    inviteToken?: string;
}


// --- Google OAuth user token with Supabase  ---
export const syncGoogleAuthUser = async (idToken: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
    });

    if (error) {
        logger.error(`Google Authentication Error: ${error.message}`);
        throw error;
    }

    const { user, session } = data;
    if (!user) throw new Error("Authentication failed: No user returned from Google.");

    // Fetch or provision user record inside our local PostgreSQL via Prisma
    let dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    if (!dbUser) {
        // Generate a fallback clean unique name if metadata doesn't have it
        const basename = user.user_metadata.name?.replace(/\s+/g, "").toLowerCase() || "user";
        const uniqueSuffix = user.id.slice(-4);

        dbUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email!,
                name: `${basename}_${uniqueSuffix}`,
            },
        });
        logger.info(`New User provisioned via Google OAuth: ${user.email}`);
    }

    return { user, dbUser, session };
};


// --- Registers a new user  ---
export const registerUser = async ({ email, name, password, inviteToken }: RegisterPayload): Promise<Omit<AuthResult, "session">> => {
    // Check if an invite token was provided
    if (inviteToken) {
        const invite = await prisma.workspaceInvite.findUnique({ where: { token: inviteToken } });
        if (!invite) throw new Error("Invalid workspace invitation link.");
        if (invite.expiresAt < new Date()) throw new Error("Workspace invitation has expired.");
        if (invite.email.toLowerCase() !== email.toLowerCase()) {
            throw new Error("This workspace invite was issued to a different email address.");
        }
    }

    // Create user with user_metadata containing the pending invite token if present
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: inviteToken ? { pending_invite_token: inviteToken } : {},
    });

    if (authError) {
        if (authError.message.includes("already")) {
            throw new Error("User already registered");
        }
        throw authError;
    }

    const user = authData.user;
    if (!user) throw new Error("Registration failed: User configuration malformed.");

    try {
        let dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    id: user.id,
                    email,
                    name
                }
            });
        }

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email,
            password,
            options: { redirectTo: `${process.env.FRONTEND_URL}/auth/verify-email` },
        } as any);

        if (linkError) throw linkError;

        await sendVerificationEmail({
            email,
            verificationLink: linkData.properties.action_link,
        });

        return { user, dbUser };
    } catch (error) {
        // Transactional rollback of auth state if local database provisioning fails
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        throw error;
    }
};


// --- Verifies an access token & Auto-joins Workspace ---
export const verifyEmail = async (accessToken: string): Promise<AuthResult> => {
    if (!accessToken) throw new Error("Missing access token");

    const client = supabaseWithAuth(accessToken);
    const { data: { user }, error } = await client.auth.getUser();

    if (error || !user) {
        logger.error(`verifyEmail error: ${error?.message}`);
        throw new Error("Invalid or expired session");
    }

    if (!user.email_confirmed_at) {
        logger.error(`Email confirmation validation mismatch for user: ${user.id}`);
        throw new Error("Email not confirmed");
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new Error("Database user record not found");

    // Check if there was an invite token stashed in user metadata during registration
    const inviteToken = user.user_metadata?.pending_invite_token;

    if (inviteToken) {
        try {
            await prisma.$transaction(async (tx) => {
                const invite = await tx.workspaceInvite.findUnique({ where: { token: inviteToken } });

                // Extra failsafe validation
                if (invite && invite.expiresAt > new Date() && invite.email.toLowerCase() === user.email!.toLowerCase()) {

                    // Create workspace membership link
                    await tx.workspaceMember.upsert({
                        where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
                        update: {},
                        create: {
                            workspaceId: invite.workspaceId,
                            userId: user.id,
                            role: WorkspaceRole.MEMBER,
                        }
                    });

                    await tx.workspaceInvite.delete({ where: { token: inviteToken } });
                    logger.info(`User ${user.id} auto-joined workspace ${invite.workspaceId} upon email verification clearance.`);
                }
            });

            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: { ...user.user_metadata, pending_invite_token: null }
            });

        } catch (inviteError) {
            logger.error(`Failed auto-joining workspace during verification fallback: ${(inviteError as Error).message}`);
        }
    }

    logger.info(`Email verified: ${user.email}`);
    const { data: sessionData } = await client.auth.getSession();

    return { user, dbUser, session: sessionData.session };
};


// --- Login user ---
export const loginUser = async ({
    email,
    password,
    inviteToken
}: Required<Pick<RegisterPayload, "email" | "password">> & { inviteToken?: string }): Promise<AuthResult & { session: Session }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        logger.error(`loginUser error: ${error.message}`);
        throw error;
    }

    if (!data.session || !data.user) {
        throw new Error("Login failed unexpectedly: Session context was missing.");
    }

    const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });
    if (!dbUser) {
        logger.error(`Orphaned Auth User Found. ID: ${data.user.id} has no corresponding database record.`);
        throw new Error("Database user record not found");
    }

    // Process Workspace Auto-Join if invite token is provided during login
    if (inviteToken) {
        try {
            await prisma.$transaction(async (tx) => {
                const invite = await tx.workspaceInvite.findUnique({ where: { token: inviteToken } });

                if (invite && invite.expiresAt > new Date() && invite.email.toLowerCase() === data.user.email!.toLowerCase()) {

                    // Link workspace membership
                    await tx.workspaceMember.upsert({
                        where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: data.user.id } },
                        update: {},
                        create: {
                            workspaceId: invite.workspaceId,
                            userId: data.user.id,
                            role: WorkspaceRole.MEMBER,
                        }
                    });

                    await tx.workspaceInvite.delete({ where: { token: inviteToken } });
                    logger.info(`User ${data.user.id} auto-joined workspace ${invite.workspaceId} through login interception.`);
                } else if (invite && invite.email.toLowerCase() !== data.user.email!.toLowerCase()) {
                    throw new Error("This workspace invite was issued to a different email address.");
                }
            });

            await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
                user_metadata: { ...data.user.user_metadata, pending_invite_token: null }
            });

        } catch (inviteError: any) {
            logger.error(`Failed auto-joining workspace during login execution: ${inviteError.message}`);
            if (inviteError.message.includes("different email")) {
                throw inviteError;
            }
        }
    }

    logger.info(`User logged in: ${email}`);
    return { session: data.session, user: data.user, dbUser };
};


// --- Logout user  ---
export const logoutUser = async (accessToken: string): Promise<void> => {
    const client = supabaseWithAuth(accessToken);
    const { error } = await client.auth.signOut();

    if (error) {
        logger.error(`logoutUser error: ${error.message}`);
        throw error;
    }
    logger.info("User logged out");
};


// --- Active refresh token  ---
export const refreshSession = async (refreshToken: string): Promise<Session> => {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
        logger.error(`refreshSession error: ${error.message}`);
        throw error;
    }

    if (!data.session) throw new Error("Failed to generate fresh session credentials.");
    return data.session;
};


// --- Resend verification token  ---
export const resendVerificationToken = async (email: string): Promise<{ success: boolean }> => {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw error;

    const user = data.users.find((u) => u.email === email);
    if (!user) throw new Error("User not found");
    if (user.email_confirmed_at) throw new Error("Email is already verified");

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        options: {
            redirectTo: `${Env.FRONTEND_ORIGIN!}/auth/verify-email`,
        },
    } as any);

    if (linkError) throw linkError;

    await sendVerificationEmail({
        email,
        verificationLink: linkData.properties.action_link,
    });

    return { success: true };
};


// --- Reset Password  ---
export const initiatePasswordReset = async (email: string): Promise<{ success: boolean }> => {
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password` },
    });

    if (linkError) {
        if (linkError.message.includes("User not found")) {
            throw new Error("User not found");
        }
        throw linkError;
    }

    await sendPasswordResetEmail({
        email,
        resetLink: linkData.properties.action_link,
    });

    return { success: true };
};


// --- Verify Password Reset  ---
export const finalizePasswordReset = async (accessToken: string, newPassword: string): Promise<{ success: boolean }> => {
    const client = supabaseWithAuth(accessToken);
    const { error } = await client.auth.updateUser({ password: newPassword });

    if (error) {
        logger.error(`finalizePasswordReset error: ${error.message}`);
        throw error;
    }

    logger.info("Password updated successfully.");
    return { success: true };
};

// --- Get user details with Id ---
export const getUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            memberships: {
                select: {
                    workspaceId: true,
                    role: true,
                    permissions: true,
                    workspace: {
                        select: {
                            name: true,
                            slug: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) throw new Error("User not found");
    return user;
};