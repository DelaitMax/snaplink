import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("email must be a valid email address"),
  password: z.string().min(8, "password must be at least 8 characters long").max(128),
});

export type LoginDto = z.infer<typeof loginSchema>;
