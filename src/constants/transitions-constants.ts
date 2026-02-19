/**
 * Transition presets for the Transitions panel.
 * Transitions are applied between clips during the overlap period.
 */

import type { AnimationType } from "@/types/timeline";

/**
 * A transition preset that can be applied between clips.
 */
export interface TransitionPreset {
	/** Unique identifier for the preset. */
	id: string;
	/** Display name for the UI. */
	name: string;
	/** Description of the transition. */
	description?: string;
	/** The animation type to use for the transition. */
	animationType: AnimationType;
	/** Default duration in seconds. */
	defaultDuration: number;
	/** CSS gradient for the preview thumbnail. */
	previewGradient: string;
	/** Category for grouping transitions. */
	category: "fade" | "slide" | "zoom" | "special";
}

/**
 * Pre-defined transition presets.
 * Note: Transitions use existing animation types but apply them 
 * as overlap effects between adjacent clips.
 */
export const TRANSITION_PRESETS: TransitionPreset[] = [
	// ---- Fade Transitions ----
	{
		id: "cross-dissolve",
		name: "Cross Dissolve",
		description: "Smooth fade between clips",
		category: "fade",
		animationType: "fade",
		defaultDuration: 0.5,
		previewGradient: "linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 50%, #1a1a2e 100%)",
	},
	{
		id: "fade-through-black",
		name: "Fade to Black",
		description: "Fade through black screen",
		category: "fade",
		animationType: "fade",
		defaultDuration: 0.6,
		previewGradient: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
	},
	{
		id: "fade-through-white",
		name: "Fade to White",
		description: "Fade through white screen",
		category: "fade",
		animationType: "fade",
		defaultDuration: 0.6,
		previewGradient: "linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #ffffff 100%)",
	},

	// ---- Slide Transitions ----
	{
		id: "slide-left",
		name: "Slide Left",
		description: "New clip slides in from right",
		category: "slide",
		animationType: "slide-left",
		defaultDuration: 0.4,
		previewGradient: "linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%)",
	},
	{
		id: "slide-right",
		name: "Slide Right",
		description: "New clip slides in from left",
		category: "slide",
		animationType: "slide-right",
		defaultDuration: 0.4,
		previewGradient: "linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%)",
	},
	{
		id: "slide-up",
		name: "Slide Up",
		description: "New clip slides up from bottom",
		category: "slide",
		animationType: "slide-up",
		defaultDuration: 0.4,
		previewGradient: "linear-gradient(180deg, #2a2a4e 0%, #1a1a2e 100%)",
	},
	{
		id: "slide-down",
		name: "Slide Down",
		description: "New clip slides down from top",
		category: "slide",
		animationType: "slide-down",
		defaultDuration: 0.4,
		previewGradient: "linear-gradient(180deg, #1a1a2e 0%, #2a2a4e 100%)",
	},

	// ---- Zoom Transitions ----
	{
		id: "zoom-in",
		name: "Zoom In",
		description: "New clip zooms in",
		category: "zoom",
		animationType: "zoom-in",
		defaultDuration: 0.5,
		previewGradient: "radial-gradient(circle, #3a3a6e 0%, #1a1a2e 100%)",
	},
	{
		id: "zoom-out",
		name: "Zoom Out",
		description: "Old clip zooms out",
		category: "zoom",
		animationType: "zoom-out",
		defaultDuration: 0.5,
		previewGradient: "radial-gradient(circle, #1a1a2e 0%, #3a3a6e 100%)",
	},

	// ---- Special Transitions ----
	{
		id: "spin",
		name: "Spin",
		description: "Spinning transition",
		category: "special",
		animationType: "spin",
		defaultDuration: 0.6,
		previewGradient: "conic-gradient(from 0deg, #1a1a2e, #3a3a6e, #1a1a2e)",
	},
	{
		id: "blur",
		name: "Blur",
		description: "Blur transition",
		category: "special",
		animationType: "blur",
		defaultDuration: 0.5,
		previewGradient: "linear-gradient(135deg, #2a2a4e 0%, #4a4a6e 50%, #2a2a4e 100%)",
	},
];

/**
 * Get transition presets by category.
 */
export function getTransitionPresetsByCategory(category: TransitionPreset["category"]): TransitionPreset[] {
	return TRANSITION_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get all transition categories.
 */
export function getTransitionCategories(): TransitionPreset["category"][] {
	return ["fade", "slide", "zoom", "special"];
}