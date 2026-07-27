import { z } from "zod";

export const createLinkSchema = z.object({
  url: z.string().min(1, "url is required").max(2048, "url is too long"),
  alias: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, "alias may only contain letters, digits, '_' and '-'")
    .optional(),
  ttlSeconds: z.coerce
    .number()
    .int()
    .positive()
    .max(60 * 60 * 24 * 365 * 5)
    .optional(),
});

export type CreateLinkDto = z.infer<typeof createLinkSchema>;

export const shortCodeParamSchema = z.object({
  code: z.string().min(1).max(64),
});

export const statsTokenParamSchema = z.object({
  token: z.string().min(1).max(64),
});
