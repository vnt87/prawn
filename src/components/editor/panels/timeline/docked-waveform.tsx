"use client";

import { useEffect, useRef } from "react";

interface DockedWaveformProps {
	/** Pre-computed audio peaks per channel */
	peaks: number[][];
	/** Height of the waveform in pixels */
	height?: number;
	/** Optional className for styling */
	className?: string;
	/** Whether the audio is muted */
	muted?: boolean;
}

/**
 * A lightweight waveform visualization component for displaying
 * audio waveforms docked under video thumbnails in the timeline.
 * Uses pre-computed peaks for efficient rendering without WaveSurfer.
 */
export function DockedWaveform({
	peaks,
	height = 24,
	className = "",
	muted = false,
}: DockedWaveformProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !peaks || peaks.length === 0) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Set canvas dimensions for sharp rendering
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		// Clear canvas
		ctx.clearRect(0, 0, rect.width, rect.height);

		// Use first channel (mono representation) or average of channels
		const channelPeaks = peaks[0] || [];
		if (channelPeaks.length === 0) return;

		const barWidth = rect.width / channelPeaks.length;
		const centerY = rect.height / 2;

		// Waveform color - muted shows greyed out
		const color = muted 
			? "rgba(255, 255, 255, 0.3)" 
			: "rgba(255, 255, 255, 0.6)";

		ctx.fillStyle = color;

		// Draw bars from peaks
		for (let i = 0; i < channelPeaks.length; i++) {
			const peak = channelPeaks[i];
			const barHeight = peak * (rect.height * 0.8); // 80% of height max
			const x = i * barWidth;
			const y = centerY - barHeight / 2;

			// Draw centered bar
			ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
		}
	}, [peaks, height, muted]);

	if (!peaks || peaks.length === 0) {
		return null;
	}

	return (
		<div className={`docked-waveform ${className}`}>
			<canvas
				ref={canvasRef}
				className="w-full"
				style={{ height: `${height}px` }}
			/>
		</div>
	);
}

export default DockedWaveform;