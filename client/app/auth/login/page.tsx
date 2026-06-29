"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { AuthService } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import AuthGuard from "@/components/protected/AuthGuard";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  // Extract optional invite token if user arrives from an invitation link
  const inviteToken = searchParams.get("inviteToken") || undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const toastId = toast.loading("Signing you in...");

    try {
      const payload = inviteToken ? { ...data, inviteToken } : data;

      const res = await AuthService.login(payload);

      if (res.success && res.access_token && res.user) {
        setAuth(res.user, res.access_token);

        toast.success("Welcome back!", { id: toastId });
        router.replace("/workspace");
      } else {
        throw new Error("Invalid session data returned.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const serverMessage =
        error?.response?.data?.message || "Invalid email or password.";
      toast.error("Authentication Failed", {
        id: toastId,
        description: serverMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard variant="guest">
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <MessageSquare className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">LoopHQ</span>
        </Link>

        <div className="w-full max-w-md bg-card border border-border/40 rounded-lg p-8 sm:p-10 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">Sign In</h1>
            <p className="text-muted-foreground">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Don't have an account?{" "}
            </span>
            <Link
              href="/signup"
              className="text-primary hover:underline font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
