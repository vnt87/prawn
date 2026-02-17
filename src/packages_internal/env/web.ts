import { z } from "zod";

const webEnvSchema = z.object({
	// Node
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	ANALYZE: z.string().optional(),

	// Public
	NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const webEnv = webEnvSchema.parse(process.env);
