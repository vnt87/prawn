import { z } from "zod";

const toolsEnvSchema = z.object({
  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ANALYZE: z.string().optional(),

  // Public
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

export type ToolsEnv = z.infer<typeof toolsEnvSchema>;

export const toolsEnv = toolsEnvSchema.parse(process.env);
