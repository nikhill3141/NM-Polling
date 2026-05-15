import { z } from "zod";

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain uppercase, lowercase, number and special character"
  );

// User Registration Schema
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email")
    .toLowerCase(),
  password: passwordSchema,
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .trim(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .trim()
    .optional(),
});

// User Login Schema
export const userLoginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email")
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// User Profile Update Schema
export const userProfileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .trim()
    .optional(),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .trim()
    .optional(),
  profilePicture: z
    .object({
      url: z.string().url("Invalid profile picture URL").optional(),
      cloudinaryId: z.string().optional(),
    })
    .optional(),
  preferences: z
    .object({
      notificationsEnabled: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      theme: z.enum(["light", "dark", "auto"]).optional(),
    })
    .optional(),
});

// Password Change Schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Email Verification Schema
export const emailVerificationSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

// Password Reset Request Schema
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email")
    .toLowerCase(),
});

// Password Reset Schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
