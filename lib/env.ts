import { z } from "zod";

const rawEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  STORAGE_CV_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STORAGE_CV_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STORAGE_CV_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STORAGE_CV_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STORAGE_CV_SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  RESULT_EMAIL_FROM: z.string().email(),
  RESULT_EMAIL_TO: z.string().email(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().min(1),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().min(1).default("anthropic/claude-3.5-sonnet"),
});

export function getEnv() {
  const env = rawEnvSchema.parse(process.env);
  const supabaseUrl = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? env.STORAGE_CV_SUPABASE_URL;
  const supabaseAnonKey =
    env.SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_STORAGE_CV_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_STORAGE_CV_SUPABASE_PUBLISHABLE_KEY;
  const supabaseServiceRoleKey =
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.STORAGE_CV_SUPABASE_SERVICE_ROLE_KEY ?? env.STORAGE_CV_SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing Supabase anon/publishable key. Set SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_STORAGE_CV_SUPABASE_ANON_KEY, or NEXT_PUBLIC_STORAGE_CV_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY, STORAGE_CV_SUPABASE_SERVICE_ROLE_KEY, or STORAGE_CV_SUPABASE_SECRET_KEY.",
    );
  }

  return {
    ...env,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
  };
}
