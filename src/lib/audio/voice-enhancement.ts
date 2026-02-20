/**
 * Voice enhancement audio processing utilities.
 * Provides client-side DSP for improving voice clarity without AI.
 */

import type { VoiceEnhancement } from "@/types/timeline";

/**
 * Audio node chain for voice enhancement processing.
 */
export interface VoiceEnhancementChain {
	/** Input node to connect source to */
	input: AudioNode;
	/** Output node to connect to destination */
	output: AudioNode;
	/** High-pass filter node */
	highpass: BiquadFilterNode;
	/** Dynamics compressor node */
	compressor: DynamicsCompressorNode;
	/** De-esser (high-shelf filter) node */
	deEsser: BiquadFilterNode;
}

/**
 * Default voice enhancement settings.
 */
export const DEFAULT_VOICE_ENHANCEMENT: VoiceEnhancement = {
	enabled: false,
	highPassFreq: 100,
	compression: 50,
	deEsser: 30,
};

/**
 * Create a voice enhancement audio processing chain.
 *
 * The chain consists of:
 * 1. High-pass filter - Removes low-frequency rumble and handling noise
 * 2. Dynamics compressor - Evens out volume levels for consistent speech
 * 3. De-esser - Reduces harsh sibilance (s, sh, ch sounds)
 *
 * @param ctx - AudioContext to create nodes in
 * @param settings - Voice enhancement settings
 * @returns Object containing input/output nodes and individual processor nodes
 */
export function createVoiceEnhancementChain(
	ctx: AudioContext,
	settings: VoiceEnhancement,
): VoiceEnhancementChain {
	// 1. High-pass filter (remove low rumble, handling noise, breath sounds)
	const highpass = ctx.createBiquadFilter();
	highpass.type = "highpass";
	highpass.frequency.value = settings.highPassFreq;
	highpass.Q.value = 0.7; // Gentle 12dB/octave slope

	// 2. Dynamics compressor (even out levels, make quiet parts louder)
	const compressor = ctx.createDynamicsCompressor();
	const compIntensity = settings.compression / 100; // 0-1

	// Threshold: lower = more compression (catches more of the signal)
	compressor.threshold.value = -30 - compIntensity * 10; // -30 to -40 dB
	// Knee: softer transition into compression
	compressor.knee.value = 10 + compIntensity * 10; // 10 to 20 dB
	// Ratio: higher = more aggressive compression
	compressor.ratio.value = 2 + compIntensity * 6; // 2:1 to 8:1
	// Attack: how quickly compression engages
	compressor.attack.value = 0.003; // 3ms - fast for voice
	// Release: how quickly compression releases
	compressor.release.value = 0.25; // 250ms - natural for speech

	// 3. De-esser (reduce harsh sibilance)
	// Simple approach: high-shelf filter cutting high frequencies
	const deEsser = ctx.createBiquadFilter();
	deEsser.type = "highshelf";
	deEsser.frequency.value = 6000; // Target sibilance range (5-8 kHz)
	deEsser.gain.value = -settings.deEsser * 0.3; // 0 to -30 dB reduction
	deEsser.Q.value = 0.5;

	// Connect the chain: source → highpass → compressor → de-esser → output
	highpass.connect(compressor);
	compressor.connect(deEsser);

	return {
		input: highpass,
		output: deEsser,
		highpass,
		compressor,
		deEsser,
	};
}

/**
 * Update an existing voice enhancement chain with new settings.
 *
 * @param chain - Existing voice enhancement chain
 * @param settings - New settings to apply
 */
export function updateVoiceEnhancementChain(
	chain: VoiceEnhancementChain,
	settings: VoiceEnhancement,
): void {
	// Update high-pass filter
	chain.highpass.frequency.value = settings.highPassFreq;

	// Update compressor
	const compIntensity = settings.compression / 100;
	chain.compressor.threshold.value = -30 - compIntensity * 10;
	chain.compressor.knee.value = 10 + compIntensity * 10;
	chain.compressor.ratio.value = 2 + compIntensity * 6;

	// Update de-esser
	chain.deEsser.gain.value = -settings.deEsser * 0.3;
}

/**
 * Disconnect and clean up a voice enhancement chain.
 *
 * @param chain - Chain to dispose
 */
export function disposeVoiceEnhancementChain(chain: VoiceEnhancementChain): void {
	try {
		chain.highpass.disconnect();
		chain.compressor.disconnect();
		chain.deEsser.disconnect();
	} catch {
		// Nodes may already be disconnected
	}
}