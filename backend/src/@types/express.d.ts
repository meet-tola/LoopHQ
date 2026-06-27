import { User as SupabaseUser } from "@supabase/supabase-js";
import { WorkspaceRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: SupabaseUser;
      accessToken?: string;
      workspaceMember?: {
        workspaceId: string;
        role: WorkspaceRole;
        permissions: any;
      };
    }
  }
}

export {};