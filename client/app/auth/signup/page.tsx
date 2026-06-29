"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthService } from "@/api/auth";
import { signupSchema, SignupInput } from "@/validators/auth";
import AuthGuard from "@/components/protected/AuthGuard";


export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Extract optional invite token if user arrives from an invitation link
  const inviteToken = searchParams.get("inviteToken") || undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: SignupInput) => {
    setLoading(true);
    try {
      const payload = inviteToken ? { ...data, inviteToken } : data;
      await AuthService.signup(payload);

      toast.success("Account created successfully!", {
        description:
          "Please check your email inbox to verify your account credentials.",
        duration: 6000,
      });
      router.push("/auth/verify-request");
    } catch (error: any) {
      console.error("Signup error:", error);

      const serverMessage =
        error?.response?.data?.message ||
        "Registration failed. Please verify fields and try again.";

      toast.error("Registration Denied", {
        description: serverMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard variant="guest">
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <MessageSquare className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold">LoopHQ</span>
        </Link>

        {/* Form Card */}
        <div className="w-full max-w-md bg-card border border-border/40 rounded-lg p-8 sm:p-10 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">Create Account</h1>
            <p className="text-muted-foreground">
              Start collaborating with your team
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name / Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <input
                {...register("name")}
                type="text"
                placeholder="Jane Doe"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
              {password && password.length >= 8 && !errors.password && (
                <p className="text-sm text-green-600">
                  Password strength: Secure
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <input
                {...register("confirmPassword")}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-input cursor-pointer"
                />
                <span className="text-sm">
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">
                    Terms of Service
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
