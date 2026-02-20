/**
 * Audio loudness measurement utilities.
 * Implements simplified EBU R128 loudness measurement for normalization.
 */

/**
 * Measure integrated loudness using simplified EBU R128 algorithm.
 * Returns loudness in LUFS (Loudness Units Full Scale).
 *
 * Target levels reference:
 * - Streaming (Spotify, YouTube): -14 LUFS
 * - Podcast: -16 LUFS
 * - Broadcast (EBU R128): -23 LUFS
 *
 * @param audioBuffer - Decoded audio buffer to analyze
 * @returns Loudness in LUFS (typically -70 to 0)
 */
export async function measureLoudness(audioBuffer: AudioBuffer): Promise<number> {
	const numberOfChannels = audioBuffer.numberOfChannels;
	const length = audioBuffer.length;

	if (length === 0) return -70;

	// Collect channel data
	const channelData: Float32Array[] = [];
	for (let i = 0; i < numberOfChannels; i++) {
		channelData.push(audioBuffer.getChannelData(i));
	}

	// Calculate mean square energy across all channels
	let totalEnergy = 0;
	for (const data of channelData) {
		for (let i = 0; i < data.length; i++) {
			totalEnergy += data[i] * data[i];
		}
	}

	const totalSamples = length * numberOfChannels;
	if (totalSamples === 0) return -70;

	const meanSquare = totalEnergy / totalSamples;
	if (meanSquare <= 0) return -70; // Silence

	// Convert to LUFS
	// Simplified formula: LUFS ≈ 10 * log10(meanSquare) - 10.691
	// The -10.691 accounts for the K-weighting filter approximation
	const loudnessDb = 10 * Math.log10(meanSquare);
	const lufs = loudnessDb - 10.691;

	// Clamp to reasonable range
	return Math.max(-70, Math.min(0, lufs));
}

/**
 * Calculate the gain adjustment needed to reach target loudness.
 *
 * @param currentLufs - Current measured loudness in LUFS
 * @param targetLufs - Desired target loudness in LUFS
 * @returns Gain adjustment in dB
 */
export function calculateNormalizationGain(
	currentLufs: number,
	targetLufs: number,
): number {
	return targetLufs - currentLufs;
}

/**
 * Convert dB value to linear gain multiplier.
 * 0 dB → 1.0, -6 dB → ~0.5, +6 dB → ~2.0
 *
 * @param db - Decibel value
 * @returns Linear gain multiplier
 */
export function dbToLinear(db: number): number {
	return Math.pow(10, db / 20);
}

/**
 * Convert linear gain to dB value.
 * 1.0 → 0 dB, 0.5 → -6 dB, 2.0 → +6 dB
 *
 * @param linear - Linear gain multiplier
 * @returns Decibel value (clamped to -50 dB minimum)
 */
export function linearToDb(linear: number): number {
	if (linear <= 0) return -50;
	return 20 * Math.log10(linear);
}

/**
 * Target loudness presets for common use cases.
 */
export const LOUDNESS_PRESETS = {
	/** Streaming platforms (Spotify, YouTube, Apple Music) */
	streaming: -14,
	/** Podcasts and spoken content */
	podcast: -16,
	/** Broadcast (EBU R128 standard) */
	broadcast: -23,
	/** Maximum loudness (avoid clipping) */
	maximum: -1,
} as const;

export type LoudnessPreset = keyof typeof LOUDNESS_PRESETS;