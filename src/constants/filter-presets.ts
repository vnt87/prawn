/**
 * Filter presets for the Filters panel.
 * These are pre-configured VideoFilters combinations that can be applied with one click.
 */

import type { VideoFilters } from "@/types/timeline";

/**
 * A filter preset with a name, the filter values, and a preview gradient.
 */
export interface FilterPreset {
	/** Unique identifier for the preset. */
	id: string;
	/** Display name for the UI. */
	name: string;
	/** The filter values to apply. */
	filters: Partial<VideoFilters>;
	/** CSS gradient for the preview thumbnail. */
	previewGradient: string;
	/** Optional category for grouping. */
	category?: "cinematic" | "vintage" | "color" | "dramatic";
}

/**
 * Pre-defined filter presets inspired by popular video editing tools.
 * These are designed to be starting points that users can further customize.
 */
export const FILTER_PRESETS: FilterPreset[] = [
	// ---- Cinematic ----
	{
		id: "cinematic",
		name: "Cinematic",
		category: "cinematic",
		filters: {
			contrast: 15,
			saturation: -10,
			fade: 10,
			vignette: 30,
		},
		previewGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
	},
	{
		id: "cinematic-warm",
		name: "Cinematic Warm",
		category: "cinematic",
		filters: {
			contrast: 10,
			temperature: 25,
			saturation: -5,
			vignette: 25,
		},
		previewGradient: "linear-gradient(135deg, #2d2d2d 0%, #4a3728 50%, #6b4423 100%)",
	},
	{
		id: "cinematic-cool",
		name: "Cinematic Cool",
		category: "cinematic",
		filters: {
			contrast: 15,
			temperature: -20,
			tint: -10,
			vignette: 20,
		},
		previewGradient: "linear-gradient(135deg, #1a1a2e 0%, #2d3a4a 50%, #1e3a5f 100%)",
	},

	// ---- Vintage ----
	{
		id: "vintage",
		name: "Vintage",
		category: "vintage",
		filters: {
			saturation: -30,
			temperature: 20,
			fade: 25,
			vignette: 40,
		},
		previewGradient: "linear-gradient(135deg, #3d3d3d 0%, #6b5b4a 50%, #8b7355 100%)",
	},
	{
		id: "sepia",
		name: "Sepia",
		category: "vintage",
		filters: {
			saturation: -40,
			temperature: 35,
			fade: 15,
		},
		previewGradient: "linear-gradient(135deg, #5c4033 0%, #8b6914 50%, #c4a35a 100%)",
	},
	{
		id: "retro",
		name: "Retro",
		category: "vintage",
		filters: {
			saturation: -20,
			temperature: 15,
			fade: 20,
			vignette: 35,
		},
		previewGradient: "linear-gradient(135deg, #4a4a4a 0%, #7a6a5a 50%, #9a8a7a 100%)",
	},

	// ---- Color ----
	{
		id: "bw",
		name: "Black & White",
		category: "color",
		filters: {
			saturation: -100,
		},
		previewGradient: "linear-gradient(135deg, #000000 0%, #555555 50%, #ffffff 100%)",
	},
	{
		id: "cool",
		name: "Cool",
		category: "color",
		filters: {
			temperature: -30,
			tint: -10,
		},
		previewGradient: "linear-gradient(135deg, #1a3a5c 0%, #2a5a8c 50%, #4a8abc 100%)",
	},
	{
		id: "warm",
		name: "Warm",
		category: "color",
		filters: {
			temperature: 30,
			tint: 10,
		},
		previewGradient: "linear-gradient(135deg, #5c3a1a 0%, #8c5a2a 50%, #bc8a4a 100%)",
	},
	{
		id: "vibrant",
		name: "Vibrant",
		category: "color",
		filters: {
			saturation: 40,
			contrast: 10,
		},
		previewGradient: "linear-gradient(135deg, #ff0080 0%, #00ff80 50%, #8000ff 100%)",
	},
	{
		id: "pastel",
		name: "Pastel",
		category: "color",
		filters: {
			saturation: -20,
			fade: 20,
			contrast: -15,
		},
		previewGradient: "linear-gradient(135deg, #ffc0cb 0%, #b0e0e6 50%, #dda0dd 100%)",
	},

	// ---- Dramatic ----
	{
		id: "high-contrast",
		name: "High Contrast",
		category: "dramatic",
		filters: {
			contrast: 50,
		},
		previewGradient: "linear-gradient(135deg, #000000 0%, #333333 50%, #ffffff 100%)",
	},
	{
		id: "dramatic",
		name: "Dramatic",
		category: "dramatic",
		filters: {
			contrast: 30,
			saturation: 20,
			shadows: -20,
			highlights: 20,
		},
		previewGradient: "linear-gradient(135deg, #0a0a0a 0%, #2a2a4a 50%, #4a4a6a 100%)",
	},
	{
		id: "matte",
		name: "Matte",
		category: "dramatic",
		filters: {
			fade: 30,
			contrast: -10,
		},
		previewGradient: "linear-gradient(135deg, #2a2a2a 0%, #4a4a4a 50%, #6a6a6a 100%)",
	},
	{
		id: "noir",
		name: "Noir",
		category: "dramatic",
		filters: {
			saturation: -100,
			contrast: 40,
			shadows: -30,
			vignette: 50,
		},
		previewGradient: "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #3a3a3a 100%)",
	},
	{
		id: "bleach-bypass",
		name: "Bleach Bypass",
		category: "dramatic",
		filters: {
			saturation: -40,
			contrast: 25,
			fade: 15,
		},
		previewGradient: "linear-gradient(135deg, #3a3a3a 0%, #5a5a5a 50%, #7a7a7a 100%)",
	},
];

/**
 * Get filter presets by category.
 */
export function getFilterPresetsByCategory(category: FilterPreset["category"]): FilterPreset[] {
	return FILTER_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get all filter categories.
 */
export function getFilterCategories(): FilterPreset["category"][] {
	return ["cinematic", "vintage", "color", "dramatic"];
}