"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Loader2, ShieldX, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const verificationStarted = useRef(false);

  useEffect(() => {
    const token = searchParams.get("access_token");

    if (!token) {
      setStatus("error");
      return;
    }
    const accessToken = token;
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    async function executeVerification() {
      try {
        const res = await AuthService.verifyEmail(accessToken);

        if (res.success && res.access_token && res.user) {
          setAuth(res.user, res.access_token);
          setStatus("success");

          toast.success("Email cleared! Welcome to LoopHQ.");
          setTimeout(() => {
            router.replace("/dashboard");
          }, 1500);
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Verification processing fault:", err);
        setStatus("error");
      }
    }

    executeVerification();
  }, [searchParams, setAuth, router]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setResending(true);
    const toastId = toast.loading("Dispatching fresh validation links...");

    try {
      const res = await AuthService.resendVerification(email.trim());
      toast.success("Link generated!", {
        id: toastId,
        description: res.message || "A fresh verification URL has been forwarded to your inbox.",
      });
      setEmail("");
    } catch (error: any) {
      console.error("Resend routine failure:", error);
      const message = error?.response?.data?.message || "Failed to resend activation link. Check email and try again.";
      toast.error("Dispatch Failed", {
        id: toastId,
        description: message,
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-border/40 rounded-lg p-8 text-center space-y-6">
        {status === "verifying" && (
          <div className="space-y-4 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Validating Credentials</h2>
            <p className="text-sm text-muted-foreground animate-pulse">
              Syncing security authorization signatures with the backend cluster...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 flex flex-col items-center">
            <CheckCircle className="h-10 w-10 text-green-500 animate-bounce" />
            <h2 className="text-xl font-semibold">Account Verified!</h2>
            <p className="text-sm text-muted-foreground">
              Redirection mechanisms routing you safely to your workspace...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <ShieldX className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-destructive">Verification Defect</h2>
              <p className="text-xs text-muted-foreground">
                The parameters provided are missing, structurally corrupt, or have exceeded their activation lifespan.
              </p>
            </div>

            {/* Interactive Recovery Action Block */}
            <div className="w-full pt-4 border-t border-border/60 space-y-3 text-left">
              <label className="text-xs font-semibold text-foreground block pl-0.5">
                Request a New Link
              </label>
              <form onSubmit={handleResendVerification} className="space-y-2">
                <input
                  type="email"
                  required
                  disabled={resending}
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all disabled:opacity-50"
                />
                <Button 
                  type="submit" 
                  disabled={resending || !email.trim()} 
                  className="w-full text-xs font-bold gap-2"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching Link...
                    </>
                  ) : (
                    "Send Fresh Link"
                  )}
                </Button>
              </form>
            </div>

            <Link
              href="/auth/login"
              className={buttonVariants({ variant: "outline", className: "w-full text-xs" })}
            >
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}