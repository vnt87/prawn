import type { ExportOptions, GifExportOptions } from "@/types/export";

export const DEFAULT_EXPORT_OPTIONS = {
	format: "mp4",
	quality: "high",
	includeAudio: true,
} satisfies ExportOptions;

export const DEFAULT_GIF_OPTIONS: GifExportOptions = {
	loop: true,
	fps: 15,
	quality: 80,
};

export const EXPORT_MIME_TYPES = {
	// Video formats
	webm: "video/webm",
	mp4: "video/mp4",
	gif: "image/gif",
	// Audio formats
	mp3: "audio/mpeg",
	wav: "audio/wav",
} as const;

/** Format descriptions for UI */
export const EXPORT_FORMAT_DESCRIPTIONS = {
	mp4: {
		label: "MP4 (H.264)",
		description: "Best compatibility, works everywhere",
		category: "video" as const,
	},
	webm: {
		label: "WebM (VP9)",
		description: "Smaller file size, web optimized",
		category: "video" as const,
	},
	gif: {
		label: "GIF",
		description: "Animated image, perfect for social media",
		category: "video" as const,
	},
	mp3: {
		label: "MP3",
		description: "Compressed audio, universal compatibility",
		category: "audio" as const,
	},
	wav: {
		label: "WAV",
		description: "Uncompressed audio, highest quality",
		category: "audio" as const,
	},
} as const;

/** Quality to bitrate mapping (in kbps) for video */
export const QUALITY_BITRATE_MAP = {
	low: 1500,
	medium: 4000,
	high: 8000,
	very_high: 15000,
} as const;

/** Quality to bitrate mapping (in kbps) for audio */
export const AUDIO_QUALITY_BITRATE_MAP = {
	low: 96,
	medium: 192,
	high: 320,
	very_high: 320,
} as const;
