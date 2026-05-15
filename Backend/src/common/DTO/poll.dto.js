import { z } from "zod";

//  POLL SCHEMAS

// Poll Creation Schema
export const pollCreateSchema = z.object({
  title: z
    .string()
    .min(5, "Poll title must be at least 5 characters")
    .max(200, "Poll title cannot exceed 200 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .trim()
    .optional(),
  expiresAt: z
    .string()
    .datetime("Invalid date format")
    .refine(
      (date) => new Date(date) > new Date(),
      "Expiry date must be in the future"
    ),
  isAnonymous: z.boolean().default(true),
});

// Poll Update Schema
export const pollUpdateSchema = z.object({
  title: z
    .string()
    .min(5, "Poll title must be at least 5 characters")
    .max(200, "Poll title cannot exceed 200 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .trim()
    .optional(),
  expiresAt: z
    .string()
    .datetime("Invalid date format")
    .refine(
      (date) => new Date(date) > new Date(),
      "Expiry date must be in the future"
    )
    .optional(),
  isAnonymous: z.boolean().optional(),
  status: z.enum(["active", "closed", "expired"]).optional(),
});

// Poll Close Schema
export const pollCloseSchema = z.object({
  pollId: z.string().min(1, "Poll ID is required"),
});

// Poll Filter/Search Schema
export const pollFilterSchema = z.object({
  status: z.enum(["active", "closed", "expired"]).optional(),
  isAnonymous: z.boolean().optional(),
  sortBy: z.enum(["createdAt", "expiresAt", "totalResponses"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// QUESTION SCHEMAS 

// Question Creation Schema
export const questionCreateSchema = z.object({
  questionText: z
    .string()
    .min(3, "Question must be at least 3 characters")
    .max(500, "Question cannot exceed 500 characters")
    .trim(),
  isMandatory: z.boolean().default(true),
  questionType: z.enum(["single_choice"]).default("single_choice"),
  order: z.number().min(1, "Order must be at least 1"),
});

// Question Batch Create Schema (for creating multiple questions at once)
export const questionBatchCreateSchema = z.array(
  z.object({
    questionText: z
      .string()
      .min(3, "Question must be at least 3 characters")
      .max(500, "Question cannot exceed 500 characters")
      .trim(),
    isMandatory: z.boolean().default(true),
    questionType: z.enum(["single_choice"]).default("single_choice"),
    order: z.number().min(1, "Order must be at least 1"),
  })
);

// Question Update Schema
export const questionUpdateSchema = z.object({
  questionText: z
    .string()
    .min(3, "Question must be at least 3 characters")
    .max(500, "Question cannot exceed 500 characters")
    .trim()
    .optional(),
  isMandatory: z.boolean().optional(),
  order: z.number().min(1, "Order must be at least 1").optional(),
});

// OPTION SCHEMAS 

// Option Creation Schema
export const optionCreateSchema = z.object({
  optionText: z
    .string()
    .min(1, "Option must be at least 1 character")
    .max(200, "Option cannot exceed 200 characters")
    .trim(),
  order: z.number().min(1, "Order must be at least 1"),
});

// Option Batch Create Schema (for creating multiple options at once)
export const optionBatchCreateSchema = z.array(
  z.object({
    optionText: z
      .string()
      .min(1, "Option must be at least 1 character")
      .max(200, "Option cannot exceed 200 characters")
      .trim(),
    order: z.number().min(1, "Order must be at least 1"),
  })
);

// Option Update Schema
export const optionUpdateSchema = z.object({
  optionText: z
    .string()
    .min(1, "Option must be at least 1 character")
    .max(200, "Option cannot exceed 200 characters")
    .trim()
    .optional(),
  order: z.number().min(1, "Order must be at least 1").optional(),
});

//  POLL WITH QUESTIONS AND OPTIONS SCHEMAS 

// Complete Poll Creation Schema (Poll + Questions + Options all in one request)
export const pollCompleteCreateSchema = z.object({
  title: z
    .string()
    .min(5, "Poll title must be at least 5 characters")
    .max(200, "Poll title cannot exceed 200 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .trim()
    .optional(),
  expiresAt: z
    .string()
    .datetime("Invalid date format")
    .refine(
      (date) => new Date(date) > new Date(),
      "Expiry date must be in the future"
    ),
  isAnonymous: z.boolean().default(true),
  questions: z.array(
    z.object({
      questionText: z
        .string()
        .min(3, "Question must be at least 3 characters")
        .max(500, "Question cannot exceed 500 characters")
        .trim(),
      isMandatory: z.boolean().default(true),
      order: z.number().min(1),
      options: z.array(
        z.object({
          optionText: z
            .string()
            .min(1, "Option must be at least 1 character")
            .max(200, "Option cannot exceed 200 characters")
            .trim(),
          order: z.number().min(1),
        })
      ).min(2, "Each question must have at least 2 options"),
    })
  ).min(1, "Poll must have at least 1 question"),
});

// POLL LINK SCHEMAS 

// Poll Link Creation Schema
export const pollLinkCreateSchema = z.object({
  pollId: z.string().min(1, "Poll ID is required"),
  expiresAt: z
    .string()
    .datetime("Invalid date format")
    .optional(),
  isPublic: z.boolean().default(true),
  maxResponses: z.number().min(1).optional(),
});

// VALIDATION UTILITIES 

// Utility function to validate request data
export const validatePollCreate = (data) => {
  return pollCreateSchema.safeParse(data);
};

export const validatePollUpdate = (data) => {
  return pollUpdateSchema.safeParse(data);
};

export const validateQuestionCreate = (data) => {
  return questionCreateSchema.safeParse(data);
};

export const validateOptionCreate = (data) => {
  return optionCreateSchema.safeParse(data);
};

export const validatePollCompleteCreate = (data) => {
  return pollCompleteCreateSchema.safeParse(data);
};