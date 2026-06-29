import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z
  .object({
    name: z.string().min(1, "Please enter your full name"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export const resetSchema = z.object({
  access_token: z.string().min(4, "Security code must be at least 4 characters."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match.",
  path: ["confirm_password"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type EmailStepInput = z.infer<typeof emailSchema>;
export type ResetStepInput = z.infer<typeof resetSchema>;