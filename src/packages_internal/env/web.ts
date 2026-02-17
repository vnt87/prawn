import { z } from "zod";

const webEnvSchema = z.object({
	// Node
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	ANALYZE: z.string().optional(),

	// Public
	NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

	// Optional external APIs (can differ or be removed if not used)
	NEXT_PUBLIC_MARBLE_API_URL: z.string().url().optional().default("https://api.marble.com"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const webEnv = webEnvSchema.parse(process.env);
