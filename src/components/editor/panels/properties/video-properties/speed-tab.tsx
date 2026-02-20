"use client";

import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
	PropertyGroup,
	PropertyItem,
	PropertyItemLabel,
} from "../property-item";
import { useEditor } from "@/hooks/use-editor";
import { useTranslation } from "react-i18next";

export function SpeedTab({
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

	/** Update speed without history during drag. */
	function updateSpeedLive(speed: number) {
		editor.timeline.updateElements({
			updates: [{ trackId, elementId: element.id, updates: { speed } }],
			pushHistory: false,
		});
	}

	/** Commit speed to history on pointer-up. */
	function commitSpeed() {
		editor.timeline.updateElements({
			updates: [
				{ trackId, elementId: element.id, updates: { speed: currentSpeed } },
			],
			pushHistory: true,
		});
	}

	// ---- Derived values ----

	const currentSpeed = (element as VideoElement).speed ?? 1;
	// Effective duration at the current speed (original duration = element.duration at speed 1)
	const effectiveDuration = element.duration / currentSpeed;

	return (
		<div className="flex flex-col pb-20">
			<PropertyGroup title={t("properties.video.speed.standard")} defaultExpanded={true}>
				<div className="space-y-6">
					{/* Speed multiplier slider */}
					<PropertyItem direction="column" className="items-stretch gap-2">
						<div className="flex justify-between">
							<PropertyItemLabel>{t("properties.video.speed.label")}</PropertyItemLabel>
							<span className="text-xs bg-secondary px-2 py-0.5 rounded">
								{currentSpeed.toFixed(2)}x
							</span>
						</div>
						{/*
						 * Range: 0.1x – 10x (covers slow-mo and fast forward)
						 * Step 0.05 for fine control at low speeds
						 */}
						<Slider
							value={[currentSpeed]}
							min={0.1}
							max={10}
							step={0.05}
							onValueChange={([v]) => updateSpeedLive(v)}
							onPointerUp={commitSpeed}
						/>
					</PropertyItem>

					{/* Effective duration display (read-only, derived from speed) */}
					<PropertyItem direction="column" className="items-stretch gap-2">
						<div className="flex justify-between">
							<PropertyItemLabel>{t("properties.video.speed.effectiveDuration")}</PropertyItemLabel>
							<span className="text-xs bg-secondary px-2 py-0.5 rounded">
								{effectiveDuration.toFixed(1)}s
							</span>
						</div>
						{/* Visual progress bar representing the adjusted duration relative to original */}
						<div className="h-1 bg-secondary rounded w-full overflow-hidden">
							<div
								className="h-full bg-primary/40 rounded transition-all"
								style={{
									width: `${Math.min(100, (effectiveDuration / element.duration) * 100)}%`,
								}}
							/>
						</div>
					</PropertyItem>

					{/* Change audio pitch (stored, pitch shifting is P4+) */}
					<PropertyItem>
						<PropertyItemLabel>{t("properties.video.speed.changePitch")}</PropertyItemLabel>
						<div className="flex flex-col items-end gap-1">
							<Switch disabled />
							<span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
								{t("common.comingSoon")}
							</span>
						</div>
					</PropertyItem>

				</div>
			</PropertyGroup>
		</div>
	);
}