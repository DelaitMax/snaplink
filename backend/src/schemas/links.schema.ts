import { z } from "zod";
import { MAX_LINK_TTL_SECONDS } from "@/constants";
import { isValidAlias } from "@/utils/shortCode";

export const createLinkSchema = z.object({
  url: z.string().min(1, "url is required").max(2048, "url is too long"),
  alias: z
    .string()
    .refine(isValidAlias, {
      message: "Alias must be 3-32 characters long and contain only letters, digits, '_' or '-'",
    })
    .optional(),
  ttlSeconds: z.coerce.number().int().positive().max(MAX_LINK_TTL_SECONDS).optional(),
});

export type CreateLinkDto = z.infer<typeof createLinkSchema>;

export const shortCodeParamSchema = z.object({
  code: z.string().min(1).max(64),
});

export const statsTokenParamSchema = z.object({
  token: z.string().min(1).max(64),
});
