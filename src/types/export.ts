export const EXPORT_QUALITY_VALUES = [
	"low",
	"medium",
	"high",
	"very_high",
] as const;

export const EXPORT_FORMAT_VALUES = [
	// Video formats
	"mp4",
	"webm",
	"gif",
	// Audio-only formats
	"mp3",
	"wav",
] as const;

export type ExportFormat = (typeof EXPORT_FORMAT_VALUES)[number];
export type ExportQuality = (typeof EXPORT_QUALITY_VALUES)[number];

/** Resolution presets for export */
export const RESOLUTION_PRESETS = [
	{ label: "4K (2160p)", width: 3840, height: 2160 },
	{ label: "1080p (Full HD)", width: 1920, height: 1080 },
	{ label: "720p (HD)", width: 1280, height: 720 },
	{ label: "480p (SD)", width: 854, height: 480 },
] as const;

export type ResolutionPreset = (typeof RESOLUTION_PRESETS)[number];

/** Social media platform presets */
export const SOCIAL_PRESETS = [
	{ platform: "YouTube", width: 1920, height: 1080, fps: 30, description: "16:9 landscape" },
	{ platform: "TikTok", width: 1080, height: 1920, fps: 30, description: "9:16 vertical" },
	{ platform: "Instagram Feed", width: 1080, height: 1080, fps: 30, description: "1:1 square" },
	{ platform: "Instagram Story", width: 1080, height: 1920, fps: 30, description: "9:16 vertical" },
	{ platform: "Twitter/X", width: 1280, height: 720, fps: 30, description: "16:9 landscape" },
] as const;

export type SocialPreset = (typeof SOCIAL_PRESETS)[number];

/** GIF-specific export options */
export interface GifExportOptions {
	/** Whether the GIF should loop */
	loop: boolean;
	/** Frame rate for the GIF (default: 15) */
	fps: number;
	/** Quality of the GIF (1-100) */
	quality: number;
}

export interface ExportOptions {
	format: ExportFormat;
	quality: ExportQuality;
	fps?: number;
	includeAudio?: boolean;
	/** Custom resolution (overrides project settings) */
	resolution?: { width: number; height: number };
	/** Bitrate in kbps (for advanced users) */
	bitrate?: number;
	/** GIF-specific options */
	gif?: GifExportOptions;
	onProgress?: ({ progress }: { progress: number }) => void;
	onCancel?: () => boolean;
}

export interface ExportResult {
	success: boolean;
	buffer?: ArrayBuffer;
	error?: string;
	cancelled?: boolean;
}

/** Type guard to check if format is video */
export function isVideoFormat(format: ExportFormat): boolean {
	return ["mp4", "webm", "gif"].includes(format);
}

/** Type guard to check if format is audio-only */
export function isAudioFormat(format: ExportFormat): boolean {
	return ["mp3", "wav"].includes(format);
}
