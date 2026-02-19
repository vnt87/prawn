import type { TCanvasSize } from "@/types/project";

export const DEFAULT_CANVAS_PRESETS: TCanvasSize[] = [
	{ width: 1920, height: 1080 },
	{ width: 1080, height: 1920 },
	{ width: 1080, height: 1080 },
	{ width: 1440, height: 1080 },
];

export const FPS_PRESETS = [
	{ value: "24", label: "24 fps" },
	{ value: "25", label: "25 fps" },
	{ value: "30", label: "30 fps" },
	{ value: "60", label: "60 fps" },
	{ value: "120", label: "120 fps" },
] as const;

export const BLUR_INTENSITY_PRESETS: { label: string; value: number }[] = [
	{ label: "Light", value: 4 },
	{ label: "Medium", value: 8 },
	{ label: "Heavy", value: 18 },
] as const;

export const FILMSTRIP_INTERVAL_PRESETS = [
	{ value: "2", label: "Low (2s)", description: "Less memory usage" },
	{ value: "1", label: "Standard (1s)", description: "Default" },
	{ value: "0.5", label: "Dense (0.5s)", description: "More memory usage" },
] as const;

export const DEFAULT_CANVAS_SIZE: TCanvasSize = { width: 1920, height: 1080 };
export const DEFAULT_FPS = 30;
export const DEFAULT_BLUR_INTENSITY = 8;
export const DEFAULT_COLOR = "#000000";
/** Default interval in seconds between filmstrip thumbnails */
export const DEFAULT_FILMSTRIP_INTERVAL = 1 as const;
