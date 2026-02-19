/**
 * Effect presets for the Effects panel.
 * These are animation-based effects that can be applied to clips.
 */

import type { AnimationType, ClipAnimation } from "@/types/timeline";

/**
 * An effect preset that applies an animation to a clip.
 */
export interface EffectPreset {
	/** Unique identifier for the preset. */
	id: string;
	/** Display name for the UI. */
	name: string;
	/** Description of the effect. */
	description?: string;
	/** The animation configuration to apply. */
	animation: ClipAnimation;
	/** CSS gradient for the preview thumbnail. */
	previewGradient: string;
	/** Category for grouping effects. */
	category: "blur" | "motion" | "style" | "ken-burns";
}

/**
 * Pre-defined effect presets using the new animation types.
 */
export const EFFECT_PRESETS: EffectPreset[] = [
	// ---- Blur Effects ----
	{
		id: "blur-in",
		name: "Blur In",
		description: "Starts blurred and becomes clear",
		category: "blur",
		animation: { type: "blur", duration: 0.5 },
		previewGradient: "linear-gradient(135deg, #1a1a2e 0%, #3a3a5e 50%, #5a5a8e 100%)",
	},
	{
		id: "blur-out",
		name: "Blur Out",
		description: "Starts clear and becomes blurred",
		category: "blur",
		animation: { type: "blur", duration: 0.5 },
		previewGradient: "linear-gradient(135deg, #5a5a8e 0%, #3a3a5e 50%, #1a1a2e 100%)",
	},
	{
		id: "blur-intense",
		name: "Intense Blur",
		description: "Heavy blur effect with fade",
		category: "blur",
		animation: { type: "blur", duration: 0.8 },
		previewGradient: "linear-gradient(135deg, #0a0a1e 0%, #2a2a4e 50%, #4a4a7e 100%)",
	},

	// ---- Motion Effects ----
	{
		id: "rise-up",
		name: "Rise Up",
		description: "Rises from below with fade",
		category: "motion",
		animation: { type: "rise", duration: 0.5 },
		previewGradient: "linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 50%, #3a3a6e 100%)",
	},
	{
		id: "fall-down",
		name: "Fall Down",
		description: "Falls from above with fade",
		category: "motion",
		animation: { type: "fall", duration: 0.5 },
		previewGradient: "linear-gradient(135deg, #3a3a6e 0%, #2a2a4e 50%, #1a1a2e 100%)",
	},
	{
		id: "rise-slow",
		name: "Slow Rise",
		description: "Slow dramatic rise effect",
		category: "motion",
		animation: { type: "rise", duration: 1.2 },
		previewGradient: "linear-gradient(135deg, #1e1e3e 0%, #2e2e5e 50%, #3e3e7e 100%)",
	},

	// ---- Style Effects ----
	{
		id: "breathe-subtle",
		name: "Breathe",
		description: "Subtle pulsing scale effect",
		category: "style",
		animation: { type: "breathe", duration: 2 },
		previewGradient: "linear-gradient(135deg, #2a2a4a 0%, #3a3a6a 50%, #4a4a8a 100%)",
	},
	{
		id: "breathe-intense",
		name: "Heartbeat",
		description: "More pronounced pulsing effect",
		category: "style",
		animation: { type: "breathe", duration: 1 },
		previewGradient: "linear-gradient(135deg, #3a2a4a 0%, #5a3a6a 50%, #7a4a8a 100%)",
	},

	// ---- Ken Burns Effects ----
	{
		id: "ken-burns-zoom-in",
		name: "Ken Burns In",
		description: "Classic Ken Burns zoom in",
		category: "ken-burns",
		animation: { type: "ken-burns-in", duration: 3 },
		previewGradient: "linear-gradient(135deg, #2a2a3e 0%, #4a4a6e 50%, #6a6a9e 100%)",
	},
	{
		id: "ken-burns-zoom-out",
		name: "Ken Burns Out",
		description: "Classic Ken Burns zoom out",
		category: "ken-burns",
		animation: { type: "ken-burns-out", duration: 3 },
		previewGradient: "linear-gradient(135deg, #6a6a9e 0%, #4a4a6e 50%, #2a2a3e 100%)",
	},
	{
		id: "ken-burns-fast",
		name: "Quick Zoom",
		description: "Fast Ken Burns style zoom",
		category: "ken-burns",
		animation: { type: "ken-burns-in", duration: 1.5 },
		previewGradient: "linear-gradient(135deg, #2a3a4e 0%, #4a5a7e 50%, #6a7aae 100%)",
	},
];

/**
 * Get effect presets by category.
 */
export function getEffectPresetsByCategory(category: EffectPreset["category"]): EffectPreset[] {
	return EFFECT_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get all effect categories.
 */
export function getEffectCategories(): EffectPreset["category"][] {
	return ["blur", "motion", "style", "ken-burns"];
}