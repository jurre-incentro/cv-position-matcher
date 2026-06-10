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
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  RESULT_EMAIL_FROM: z.string().email().optional(),
  RESULT_EMAIL_TO: z.string().email().optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().min(1).optional(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),
  GOOGLE_PRIVATE_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_MODEL: z.string().min(1).default("anthropic/claude-3.5-sonnet"),
});

function getRawEnv() {
  return rawEnvSchema.parse(process.env);
}

function requireEnv<T>(value: T | undefined, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

export function getEnv() {
  const env = getRawEnv();
  const supabase = getSupabaseEnv(env);

  return {
    ...env,
    ...supabase,
  };
}

export function getOpenRouterEnv() {
  const env = getRawEnv();

  return {
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    OPENROUTER_MODEL: env.OPENROUTER_MODEL,
    OPENROUTER_API_KEY: requireEnv(env.OPENROUTER_API_KEY, "Missing OPENROUTER_API_KEY."),
  };
}

export function getGoogleDriveEnv() {
  const env = getRawEnv();

  return {
    GOOGLE_DRIVE_FOLDER_ID: requireEnv(env.GOOGLE_DRIVE_FOLDER_ID, "Missing GOOGLE_DRIVE_FOLDER_ID."),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: requireEnv(env.GOOGLE_SERVICE_ACCOUNT_EMAIL, "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL."),
    GOOGLE_PRIVATE_KEY: requireEnv(env.GOOGLE_PRIVATE_KEY, "Missing GOOGLE_PRIVATE_KEY."),
  };
}

export function getResendWebhookEnv() {
  const env = getRawEnv();

  return {
    RESEND_WEBHOOK_SECRET: requireEnv(env.RESEND_WEBHOOK_SECRET, "Missing RESEND_WEBHOOK_SECRET."),
  };
}

export function getResendReportEnv() {
  const env = getRawEnv();

  return {
    RESEND_API_KEY: requireEnv(env.RESEND_API_KEY, "Missing RESEND_API_KEY."),
    RESULT_EMAIL_FROM: requireEnv(env.RESULT_EMAIL_FROM, "Missing RESULT_EMAIL_FROM."),
    RESULT_EMAIL_TO: requireEnv(env.RESULT_EMAIL_TO, "Missing RESULT_EMAIL_TO."),
  };
}

function getSupabaseEnv(env = getRawEnv()) {
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
