import { z } from "zod";

const PASSWORD_RULES = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "One uppercase letter")
  .regex(/[a-z]/, "One lowercase letter")
  .regex(/\d/, "One number")
  .regex(/[^A-Za-z0-9]/, "One special character");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid phone number");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "Required").max(60),
    lastName: z.string().trim().min(1, "Required").max(60),
    email: emailSchema,
    phone: phoneSchema,
    country: z.string().trim().min(2, "Select your country"),
    password: PASSWORD_RULES,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "Accept the Terms of Service" }) }),
    acceptPrivacy: z.literal(true, { errorMap: () => ({ message: "Accept the Privacy Policy" }) }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
export type SignUpInput = z.infer<typeof signUpSchema>;

export const phoneOnlySchema = z.object({ phone: phoneSchema });
export type PhoneOnlyInput = z.infer<typeof phoneOnlySchema>;

export const otpSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code").regex(/^\d+$/, "Digits only"),
});
export type OtpInput = z.infer<typeof otpSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: PASSWORD_RULES,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;