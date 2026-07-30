import { z } from "zod";

const email = z.string().email("email must be a valid email address");
const password = z.string().min(8, "password must be at least 8 characters long").max(128);

export const loginSchema = z.object({ email, password });
export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.object({ email, password });
export type RegisterDto = z.infer<typeof registerSchema>;
