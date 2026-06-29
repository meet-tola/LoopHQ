"use client";

import Link from "next/link";
import { Mail, ArrowRight, MessageSquare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-2">
        <MessageSquare className="w-8 h-8 text-primary" />
        <span className="text-xl font-bold">LoopHQ</span>
      </div>

      <div className="w-full max-w-md bg-card border border-border/40 rounded-lg p-8 text-center space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Confirm your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent an account confirmation hyperlink directly to your inbox. 
            Please select that link to verify your ownership profile.
          </p>
        </div>

        <div className="pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground mb-4">
            Didn't receive the magic verification transmission? 
          </p>
          <Link 
            href="/signup" 
            className={buttonVariants({ variant: "outline", className: "w-full gap-2" })}
          >
            Restart Registration <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}