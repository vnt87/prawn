"use client";

import type { ImageElement, VideoElement, AudioNormalization, VoiceEnhancement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	PropertyGroup,
	PropertyItem,
	PropertyItemLabel,
} from "../property-item";
import { useEditor } from "@/hooks/use-editor";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { measureLoudness, calculateNormalizationGain, LOUDNESS_PRESETS } from "@/lib/audio/loudness";
import { DEFAULT_VOICE_ENHANCEMENT } from "@/lib/audio/voice-enhancement";

/**
 * Convert a dB value to a linear gain multiplier.
 * 0 dB → 1.0, -50 dB → ~0.003, +20 dB → ~10
 */
function dbToLinear(db: number): number {
	return Math.pow(10, db / 20);
}

/**
 * Convert a linear gain multiplier to dB.
 * Clamps to -50 dB minimum to avoid -Infinity.
 */
function linearToDb(linear: number): number {
	if (linear <= 0) return -50;
	return 20 * Math.log10(linear);
}

export function AudioTab({
	element,
	trackId,
}: {
	element: VideoElement | ImageElement;
	/** Track id for timeline update calls */
	trackId: string;
}) {
	const editor = useEditor();
	const { t } = useTranslation();
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	// ---- Helpers ----

	/** Update audio-related fields without recording history (during drag). */
	function updateAudioLive(updates: Record<string, unknown>) {
		editor.timeline.updateElements({
			updates: [{ trackId, elementId: element.id, updates }],
			pushHistory: false,
		});
	}

	/** Commit audio fields to history (on pointer-up / blur). */
	function commitAudio(updates: Record<string, unknown>) {
		editor.timeline.updateElements({
			updates: [{ trackId, elementId: element.id, updates }],
			pushHistory: true,
		});
	}

	// ---- Derived display values ----

	// volume is stored as a linear multiplier (default 1.0); display as dB
	const volumeLinear = (element as VideoElement).volume ?? 1;
	const volumeDb = Math.round(linearToDb(volumeLinear) * 10) / 10; // 1 decimal place
	const fadeIn = (element as VideoElement).fadeIn ?? 0;
	const fadeOut = (element as VideoElement).fadeOut ?? 0;

	// Audio normalization state
	const normalization = (element as VideoElement).audioNormalization;

	// Voice enhancement state
	const voiceEnhancement = (element as VideoElement).voiceEnhancement ?? DEFAULT_VOICE_ENHANCEMENT;

	// ---- Handlers ----

	/**
	 * Handle toggling normalization on/off.
	 * When enabling, analyze audio if not already measured.
	 */
	const handleNormalizeToggle = async (enabled: boolean) => {
		if (enabled) {
			// Need to analyze audio first
			setIsAnalyzing(true);
			try {
				// Get the media asset to decode audio
				const mediaAssets = editor.media.getAssets();
				const mediaId = (element as VideoElement).mediaId;
				const asset = mediaAssets.find((a) => a.id === mediaId);

				if (asset && asset.file) {
					// Create audio context and decode
					const ctx = new AudioContext();
					const arrayBuffer = await asset.file.arrayBuffer();
					const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
					ctx.close();

					// Measure loudness
					const measuredLufs = await measureLoudness(audioBuffer);
					const targetLufs = normalization?.targetLufs ?? LOUDNESS_PRESETS.streaming;
					const gainDb = calculateNormalizationGain(measuredLufs, targetLufs);

					// Commit with measurement
					commitAudio({
						audioNormalization: {
							enabled: true,
							targetLufs,
							measuredLufs,
							gainDb,
						},
					});
				} else {
					// No asset found, enable with default settings
					commitAudio({
						audioNormalization: {
							enabled: true,
							targetLufs: LOUDNESS_PRESETS.streaming,
						},
					});
				}
			} catch (error) {
				console.error("Failed to analyze audio:", error);
				// Enable anyway with defaults
				commitAudio({
					audioNormalization: {
						enabled: true,
						targetLufs: LOUDNESS_PRESETS.streaming,
					},
				});
			} finally {
				setIsAnalyzing(false);
			}
		} else {
			// Just disable
			commitAudio({
				audioNormalization: {
					...normalization,
					enabled: false,
				},
			});
		}
	};

	/**
	 * Handle changing the target LUFS preset.
	 */
	const handleTargetLufsChange = (targetLufs: string) => {
		const newTarget = Number(targetLufs);
		const current = normalization ?? { enabled: true, targetLufs: newTarget };

		// Recalculate gain if we have a measurement
		let gainDb = current.gainDb;
		if (current.measuredLufs !== undefined) {
			gainDb = calculateNormalizationGain(current.measuredLufs, newTarget);
		}

		commitAudio({
			audioNormalization: {
				...current,
				targetLufs: newTarget,
				gainDb,
			},
		});
	};

	/**
	 * Handle toggling voice enhancement.
	 */
	const handleVoiceEnhancementToggle = (enabled: boolean) => {
		commitAudio({
			voiceEnhancement: {
				...voiceEnhancement,
				enabled,
			},
		});
	};

	return (
		<div className="flex flex-col pb-20">
			{/* ── Basic Audio ── */}
			<PropertyGroup title={t("properties.video.audio.basic")} defaultExpanded={true}>
				<div className="space-y-6">
					{/* Volume (dB) */}
					<PropertyItem direction="column" className="items-stretch gap-2">
						<div className="flex justify-between">
							<PropertyItemLabel>{t("properties.video.audio.volume")}</PropertyItemLabel>
							<span className="text-xs">{volumeDb >= 0 ? "+" : ""}{volumeDb}dB</span>
						</div>
						{/*
						 * Slider range: -50 dB to +20 dB
						 * We store the linear equivalent in element.volume
						 */}
						<Slider
							value={[volumeDb]}
							min={-50}
							max={20}
							step={0.1}
							onValueChange={([db]) =>
								updateAudioLive({ volume: dbToLinear(db) })
							}
							onPointerUp={() => commitAudio({ volume: volumeLinear })}
						/>
					</PropertyItem>

					{/* Fade in */}
					<PropertyItem direction="column" className="items-stretch gap-2">
						<div className="flex justify-between">
							<PropertyItemLabel>{t("properties.video.audio.fadeIn")}</PropertyItemLabel>
							<span className="text-xs">{fadeIn.toFixed(1)}s</span>
						</div>
						<Slider
							value={[fadeIn]}
							min={0}
							max={5}
							step={0.1}
							onValueChange={([v]) => updateAudioLive({ fadeIn: v })}
							onPointerUp={() => commitAudio({ fadeIn })}
						/>
					</PropertyItem>

					{/* Fade out */}
					<PropertyItem direction="column" className="items-stretch gap-2">
						<div className="flex justify-between">
							<PropertyItemLabel>{t("properties.video.audio.fadeOut")}</PropertyItemLabel>
							<span className="text-xs">{fadeOut.toFixed(1)}s</span>
						</div>
						<Slider
							value={[fadeOut]}
							min={0}
							max={5}
							step={0.1}
							onValueChange={([v]) => updateAudioLive({ fadeOut: v })}
							onPointerUp={() => commitAudio({ fadeOut })}
						/>
					</PropertyItem>
				</div>
			</PropertyGroup>

			{/* ── Enhancements ── */}
			<PropertyGroup
				title={t("properties.video.audio.enhancements")}
				defaultExpanded={true}
				hasBorderTop
				collapsible={false}
			>
				<div className="space-y-4">
					{/* Normalize Loudness */}
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<span className="text-sm text-muted-foreground">
								{t("properties.video.audio.normalizeLoudness")}
							</span>
							<span className="text-[10px] text-muted-foreground max-w-[200px]">
								{t("properties.video.audio.normalizeLoudnessDesc", "Normalize audio to target loudness level")}
							</span>
						</div>
						<div className="flex items-center gap-2">
							{isAnalyzing && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
							<Switch
								checked={normalization?.enabled ?? false}
								onCheckedChange={handleNormalizeToggle}
								disabled={isAnalyzing}
							/>
						</div>
					</div>

					{/* Target LUFS selector (only when enabled) */}
					{normalization?.enabled && (
						<div className="pl-2 space-y-3">
							<PropertyItem direction="row">
								<PropertyItemLabel>{t("properties.video.audio.targetLoudness", "Target")}</PropertyItemLabel>
								<Select
									value={String(normalization.targetLufs)}
									onValueChange={handleTargetLufsChange}
								>
									<SelectTrigger className="w-36 h-7 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="-14">-14 LUFS (Streaming)</SelectItem>
										<SelectItem value="-16">-16 LUFS (Podcast)</SelectItem>
										<SelectItem value="-23">-23 LUFS (Broadcast)</SelectItem>
									</SelectContent>
								</Select>
							</PropertyItem>

							{/* Show measured loudness if available */}
							{normalization.measuredLufs !== undefined && (
								<div className="text-[10px] text-muted-foreground flex justify-between">
									<span>{t("properties.video.audio.measured", "Measured")}: {normalization.measuredLufs.toFixed(1)} LUFS</span>
									<span>{t("properties.video.audio.gain", "Gain")}: {normalization.gainDb?.toFixed(1) ?? 0} dB</span>
								</div>
							)}
						</div>
					)}

					{/* Divider */}
					<div className="border-t border-border/50 pt-4" />

					{/* Voice Enhancement Toggle */}
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<span className="text-sm text-muted-foreground">
								{t("properties.video.audio.enhanceVoice")}
							</span>
							<span className="text-[10px] text-muted-foreground max-w-[200px]">
								{t("properties.video.audio.enhanceVoiceDesc", "Apply EQ and compression for clearer voice")}
							</span>
						</div>
						<Switch
							checked={voiceEnhancement.enabled}
							onCheckedChange={handleVoiceEnhancementToggle}
						/>
					</div>

					{/* Voice Enhancement Controls (only when enabled) */}
					{voiceEnhancement.enabled && (
						<div className="pl-2 space-y-4 border-l-2 border-primary/20">
							{/* High-pass frequency */}
							<PropertyItem direction="column" className="items-stretch gap-2">
								<div className="flex justify-between">
									<PropertyItemLabel>{t("properties.video.audio.highPass", "High-Pass")}</PropertyItemLabel>
									<span className="text-xs">{voiceEnhancement.highPassFreq} Hz</span>
								</div>
								<Slider
									value={[voiceEnhancement.highPassFreq]}
									min={60}
									max={200}
									step={10}
									onValueChange={([v]) =>
										updateAudioLive({
											voiceEnhancement: { ...voiceEnhancement, highPassFreq: v },
										})
									}
									onPointerUp={() => commitAudio({ voiceEnhancement })}
								/>
							</PropertyItem>

							{/* Compression */}
							<PropertyItem direction="column" className="items-stretch gap-2">
								<div className="flex justify-between">
									<PropertyItemLabel>{t("properties.video.audio.compression", "Compression")}</PropertyItemLabel>
									<span className="text-xs">{voiceEnhancement.compression}%</span>
								</div>
								<Slider
									value={[voiceEnhancement.compression]}
									min={0}
									max={100}
									step={5}
									onValueChange={([v]) =>
										updateAudioLive({
											voiceEnhancement: { ...voiceEnhancement, compression: v },
										})
									}
									onPointerUp={() => commitAudio({ voiceEnhancement })}
								/>
							</PropertyItem>

							{/* De-esser */}
							<PropertyItem direction="column" className="items-stretch gap-2">
								<div className="flex justify-between">
									<PropertyItemLabel>{t("properties.video.audio.deEsser", "De-Esser")}</PropertyItemLabel>
									<span className="text-xs">{voiceEnhancement.deEsser}%</span>
								</div>
								<Slider
									value={[voiceEnhancement.deEsser]}
									min={0}
									max={100}
									step={5}
									onValueChange={([v]) =>
										updateAudioLive({
											voiceEnhancement: { ...voiceEnhancement, deEsser: v },
										})
									}
									onPointerUp={() => commitAudio({ voiceEnhancement })}
								/>
							</PropertyItem>
						</div>
					)}
				</div>
			</PropertyGroup>
		</div>
	);
}