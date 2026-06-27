import { getEnv } from "../utils/get-env";

export const Env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "8000"),

  //Supabase(Database)
  DATABASE_URL: getEnv("DATABASE_URL"),
  SUPABASE_URL: getEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnv("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),

  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),

  //mail
  EMAIL_USER: getEnv("EMAIL_USER"),
  EMAIL_APP_PASSWORD: getEnv("EMAIL_APP_PASSWORD"),

  // Cloudinary
  // CLOUDINARY_CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME"),
  // CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY"),
  // CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET"),
} as const;