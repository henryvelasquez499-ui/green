import { z } from "zod"

export const CreateActionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  impactValue: z.number().positive("Impact value must be positive").optional(),
  impactUnit: z.enum(["kg_co2", "kwh", "liters", "km"]).optional(),
  actionDate: z.string().datetime("Invalid date format"),
  attachments: z.array(z.string().url("Invalid attachment URL")).optional(),
})

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, "First name required").max(100, "First name too long").optional(),
  lastName: z.string().min(1, "Last name required").max(100, "Last name too long").optional(),
  department: z.string().max(100, "Department name too long").optional(),
})

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  firstName: z.string().min(1, "First name required").max(100, "First name too long"),
  lastName: z.string().min(1, "Last name required").max(100, "Last name too long"),
  department: z.string().max(100, "Department name too long").optional(),
})

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password required"),
})

export const CreateChallengeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long"),
  challengeType: z.enum(["individual", "team", "department", "company_wide"]),
  targetMetric: z.enum(["actions_count", "points_total", "impact_value"]),
  targetValue: z.number().positive("Target value must be positive"),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  rewardPoints: z.number().min(0, "Reward points cannot be negative"),
  rewardDescription: z.string().max(500, "Reward description too long").optional(),
})

export const CreateBadgeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name too long"),
  description: z.string().max(500, "Description too long"),
  iconUrl: z.string().url("Invalid icon URL"),
  criteriaType: z.enum(["action_count", "points_total", "streak_days", "category_master"]),
  criteriaValue: z.number().positive("Criteria value must be positive"),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  rarity: z.enum(["common", "rare", "epic", "legendary"]),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
})
