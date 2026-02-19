/**
 * Text effect presets for the text properties panel.
 * Provides pre-configured text effects organized by category.
 */

import type { TextEffectType, TextEffect } from "@/types/timeline";

/**
 * A text effect preset with display information.
 */
export interface TextEffectPreset {
	/** Unique identifier for the preset. */
	id: string;
	/** Display name for the UI. */
	name: string;
	/** Description of the effect. */
	description?: string;
	/** The text effect configuration. */
	effect: TextEffect;
	/** Category for grouping effects. */
	category: "reveal" | "motion" | "style";
	/** Icon name from Lucide for the effect. */
	icon: string;
}

/**
 * Pre-defined text effect presets.
 */
export const TEXT_EFFECT_PRESETS: TextEffectPreset[] = [
	// ---- Reveal Effects (Priority 1) ----
	{
		id: "typewriter",
		name: "Typewriter",
		description: "Characters appear one by one like a typewriter",
		category: "reveal",
		icon: "Type",
		effect: {
			type: "typewriter",
			duration: 1.5,
			delay: 50,
		},
	},
	{
		id: "stream-word",
		name: "Stream Words",
		description: "Words appear one by one with a smooth flow",
		category: "reveal",
		icon: "TextCursor",
		effect: {
			type: "stream-word",
			duration: 1.2,
			delay: 150,
		},
	},
	{
		id: "fade-char",
		name: "Fade Characters",
		description: "Characters fade in sequentially",
		category: "reveal",
		icon: "Gradient",
		effect: {
			type: "fade-char",
			duration: 1.0,
			delay: 30,
		},
	},
	{
		id: "fade-word",
		name: "Fade Words",
		description: "Words fade in sequentially",
		category: "reveal",
		icon: "AlignJustify",
		effect: {
			type: "fade-word",
			duration: 1.0,
			delay: 100,
		},
	},

	// ---- Motion Effects (Priority 2) ----
	{
		id: "elastic",
		name: "Elastic",
		description: "Bouncy elastic scale effect",
		category: "motion",
		icon: "Zap",
		effect: {
			type: "elastic",
			duration: 0.8,
			intensity: 60,
		},
	},
	{
		id: "bounce",
		name: "Bounce",
		description: "Text drops and bounces",
		category: "motion",
		icon: "ArrowDown",
		effect: {
			type: "bounce",
			duration: 0.6,
			intensity: 70,
		},
	},
	{
		id: "wave",
		name: "Wave",
		description: "Continuous wave motion across characters",
		category: "motion",
		icon: "Waves",
		effect: {
			type: "wave",
			duration: 2,
			intensity: 30,
			loop: true,
		},
	},

	// ---- Style Effects (Priority 3) ----
	{
		id: "glitch",
		name: "Glitch",
		description: "Digital glitch distortion effect",
		category: "style",
		icon: "Cpu",
		effect: {
			type: "glitch",
			duration: 0.5,
			intensity: 50,
		},
	},
	{
		id: "neon-glow",
		name: "Neon Glow",
		description: "Pulsing neon glow effect",
		category: "style",
		icon: "Lightbulb",
		effect: {
			type: "neon-glow",
			duration: 1.5,
			intensity: 60,
			loop: true,
		},
	},
	{
		id: "outline-draw",
		name: "Outline Draw",
		description: "Text outline draws itself",
		category: "style",
		icon: "PenLine",
		effect: {
			type: "outline-draw",
			duration: 1.2,
			intensity: 50,
		},
	},
];

/**
 * Get effect presets by category.
 */
export function getEffectsByCategory(category: TextEffectPreset["category"]): TextEffectPreset[] {
	return TEXT_EFFECT_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get all effect categories.
 */
export function getEffectCategories(): TextEffectPreset["category"][] {
	return ["reveal", "motion", "style"];
}

/**
 * Get an effect preset by its ID.
 */
export function getEffectById(id: string): TextEffectPreset | undefined {
	return TEXT_EFFECT_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get an effect preset by its type.
 */
export function getEffectByType(type: TextEffectType): TextEffectPreset | undefined {
	return TEXT_EFFECT_PRESETS.find((preset) => preset.effect.type === type);
}

/**
 * Category labels for UI display.
 */
export const CATEGORY_LABELS: Record<TextEffectPreset["category"], string> = {
	reveal: "Reveal",
	motion: "Motion",
	style: "Style",
