"use client";

import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
	PropertyGroup,
	PropertyItem,
	PropertyItemLabel,
} from "../property-item";
import { useEditor } from "@/hooks/use-editor";
import { useTranslation } from "react-i18next";

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

			{/* ── Enhancements (P4+ / AI required) ── */}
			<PropertyGroup
				title={t("properties.video.audio.enhancements")}
				defaultExpanded={true}
				hasBorderTop
				collapsible={false}
			>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<span className="text-sm text-muted-foreground">{t("properties.video.audio.normalizeLoudness")}</span>
							<span className="text-[10px] text-muted-foreground w-48">
								{t("properties.video.audio.normalizeLoudnessDesc")}
							</span>
						</div>
						<div className="flex flex-col items-end gap-1">
							<Switch disabled />
							<span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
								{t("common.comingSoon")}
							</span>
						</div>
					</div>

					<div className="flex items-center justify-between pt-2">
						<span className="text-sm text-muted-foreground">{t("properties.video.audio.enhanceVoice")}</span>
						<div className="flex flex-col items-end gap-1">
							<Switch disabled />
							<span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
								{t("common.comingSoon")}
							</span>
						</div>
					</div>

				</div>
			</PropertyGroup>
		</div>
	);
}
