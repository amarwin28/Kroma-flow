import path from "node:path";

export function getEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const authSecret = process.env.AUTH_SECRET || (isProd ? "" : "kroma-flow-dev-secret-change-in-prod");
  if (isProd && !authSecret) {
    throw new Error("AUTH_SECRET environment variable must be set in production.");
  }

  return {
    isProd,
    authSecret,
    databasePath:
      process.env.DATABASE_PATH || path.join(process.cwd(), "data", "kroma-flow.db"),
    backupDir:
      process.env.BACKUP_DIR || path.join(process.cwd(), "data", "backups"),
    uploadDir:
      process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads"),
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  };
}
