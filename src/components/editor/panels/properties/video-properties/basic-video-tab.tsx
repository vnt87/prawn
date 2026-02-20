"use client";

import type { ImageElement, VideoElement } from "@/types/timeline";
import type { KeyframeData } from "@/types/keyframe";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
	RefreshCcw,
	Minus,
	ChevronUp,
	ChevronDown,
	FlipHorizontal,
	FlipVertical,
	Info,
} from "lucide-react";
import {
	PropertyGroup,
	PropertyItem,
	PropertyItemLabel,
} from "../property-item";
import { useEditor } from "@/hooks/use-editor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { KeyframeToggleButton } from "../keyframe-toggle-button";

export function BasicVideoTab({
	element,
	trackId,
}: {
	element: VideoElement | ImageElement;
	trackId: string;
}) {
	const editor = useEditor();
	const { t } = useTranslation();

	// Common Canvas 2D blend modes to expose in the UI
	const BLEND_MODES: { value: GlobalCompositeOperation; label: string }[] = [
		{ value: "source-over", label: t("properties.video.basic.blendModes.source-over") },
		{ value: "multiply", label: t("properties.video.basic.blendModes.multiply") },
		{ value: "screen", label: t("properties.video.basic.blendModes.screen") },
		{ value: "overlay", label: t("properties.video.basic.blendModes.overlay") },
		{ value: "darken", label: t("properties.video.basic.blendModes.darken") },
		{ value: "lighten", label: t("properties.video.basic.blendModes.lighten") },
		{ value: "color-dodge", label: t("properties.video.basic.blendModes.color-dodge") },
		{ value: "color-burn", label: t("properties.video.basic.blendModes.color-burn") },
		{ value: "hard-light", label: t("properties.video.basic.blendModes.hard-light") },
		{ value: "soft-light", label: t("properties.video.basic.blendModes.soft-light") },
		{ value: "difference", label: t("properties.video.basic.blendModes.difference") },
		{ value: "exclusion", label: t("properties.video.basic.blendModes.exclusion") },
	];

	// ---- Keyframe helpers ----

	const project = editor.project.getActive();
	const playheadTime = project.timelineViewState?.playheadTime ?? 0;
	/** Time relative to clip start (used for keyframe positioning). */
	const relativeTime = Math.max(0, playheadTime - element.startTime);

	/** Update keyframes on this element via the command system. */
	function updateKeyframes(newKeyframes: KeyframeData) {
		editor.timeline.updateElements({
			updates: [{ trackId, elementId: element.id, updates: { keyframes: newKeyframes } }],
			pushHistory: true,
		});
	}

	/** Seek the playhead to a relative time offset within this clip. */
	function seekToRelativeTime(time: number) {
		editor.project.setTimelineViewState({
			viewState: {
				...(project.timelineViewState ?? { zoomLevel: 1, scrollLeft: 0, playheadTime: 0 }),
				playheadTime: element.startTime + time,
			},
		});
	}

	/** Common props for KeyframeToggleButton instances. */
	const kfProps = {
		element: element as unknown as import("@/types/timeline").TimelineElement,
		relativeTime,
		onKeyframesChange: updateKeyframes,
		onSeekToRelativeTime: seekToRelativeTime,
	};

	// ---- Helpers: push element updates through the command system ----

	/** Update transform fields without recording a history step (during live drag). */
	function updateTransformLive(partial: Partial<typeof element.transform>) {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: { transform: { ...element.transform, ...partial } },
				},
			],
			pushHistory: false,
		});
	}

	/** Commit the current transform to history (on pointer-up / blur). */
	function commitTransform() {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: { transform: element.transform },
				},
			],
			pushHistory: true,
		});
	}

	/** Update one or more top-level fields with a history entry. */
	function updateField(updates: Record<string, unknown>) {
		editor.timeline.updateElements({
			updates: [{ trackId, elementId: element.id, updates }],
			pushHistory: true,
		});
	}

	/** Update opacity without history during drag, commit on release. */
	function updateOpacityLive(pct: number) {
		editor.timeline.updateElements({
			updates: [
				{ trackId, elementId: element.id, updates: { opacity: pct / 100 } },
			],
			pushHistory: false,
		});
	}

	// ---- Derived display values ----

	const scalePercent = Math.round((element.transform.scale ?? 1) * 100);
	const opacityPercent = Math.round((element.opacity ?? 1) * 100);
	const posX = Math.round(element.transform.position?.x ?? 0);
	const posY = Math.round(element.transform.position?.y ?? 0);
	const rotate = Number((element.transform.rotate ?? 0).toFixed(2));
	const blendMode = element.blendMode ?? "source-over";

	return (
		<div className="flex flex-col pb-20">
			{/* ── Transform ── */}
			<PropertyGroup title={t("properties.video.basic.transform")} defaultExpanded={true}>
				<div className="space-y-4">
					<PropertyItem direction="column" className="items-stretch gap-2">
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-1.5">
								<PropertyItemLabel>{t("properties.video.scale")}</PropertyItemLabel>
								<KeyframeToggleButton property="transform.scale" {...kfProps} />
								<TooltipProvider>
									<Tooltip delayDuration={300}>
										<TooltipTrigger asChild>
											<Info className="size-3 text-muted-foreground/70 hover:text-muted-foreground cursor-help" />
										</TooltipTrigger>
										<TooltipContent side="right" className="max-w-[200px] text-[11px] leading-relaxed">
											{t("properties.video.scaleTooltip")}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
							<div className="flex items-center gap-1">
								<div className="bg-secondary rounded px-2 py-0.5 text-xs w-16 text-right">
									{scalePercent}%
								</div>
								{/* Fine nudge buttons */}
								<div className="flex flex-col -gap-1">
									<ChevronUp
										className="size-2 text-muted-foreground cursor-pointer hover:text-foreground"
										onClick={() =>
											updateField({
												transform: {
													...element.transform,
													scale: Math.min(2, (element.transform.scale ?? 1) + 0.01),
												},
											})
										}
									/>
									<ChevronDown
										className="size-2 text-muted-foreground cursor-pointer hover:text-foreground"
										onClick={() =>
											updateField({
												transform: {
													...element.transform,
													scale: Math.max(0.01, (element.transform.scale ?? 1) - 0.01),
												},
											})
										}
									/>
								</div>
								{/* Reset scale to 100% */}
								<RefreshCcw
									className="size-3.5 text-muted-foreground cursor-pointer hover:text-foreground ml-1"
									onClick={() =>
										updateField({ transform: { ...element.transform, scale: 1 } })
									}
								/>
							</div>
						</div>
						<Slider
							value={[scalePercent]}
							min={1}
							max={200}
							step={1}
							className="w-full"
							onValueChange={([v]) => updateTransformLive({ scale: v / 100 })}
							onPointerUp={commitTransform}
						/>
					</PropertyItem>

					{/* Position */}
					<PropertyItem>
						<div className="flex items-center gap-1.5">
							<PropertyItemLabel>{t("properties.video.basic.position")}</PropertyItemLabel>
							<KeyframeToggleButton property="transform.position.x" {...kfProps} showNav={false} />
						</div>
						<div className="flex gap-2">
							{/* X */}
							<div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
								<span className="text-muted-foreground text-xs">X</span>
								<input
									className="bg-transparent border-none outline-none text-xs w-full text-right"
									value={posX}
									onChange={(e) => {
										const val = Number(e.target.value);
										if (!isNaN(val))
											updateTransformLive({
												position: { x: val, y: element.transform.position?.y ?? 0 },
											});
									}}
									onBlur={commitTransform}
									type="number"
								/>
							</div>
							{/* Y */}
							<div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
								<span className="text-muted-foreground text-xs">Y</span>
								<input
									className="bg-transparent border-none outline-none text-xs w-full text-right"
									value={posY}
									onChange={(e) => {
										const val = Number(e.target.value);
										if (!isNaN(val))
											updateTransformLive({
												position: { x: element.transform.position?.x ?? 0, y: val },
											});
									}}
									onBlur={commitTransform}
									type="number"
								/>
							</div>
						</div>
					</PropertyItem>

					{/* Rotation */}
					<PropertyItem>
						<div className="flex items-center gap-1.5">
							<PropertyItemLabel>{t("properties.video.basic.rotate")}</PropertyItemLabel>
							<KeyframeToggleButton property="transform.rotate" {...kfProps} showNav={false} />
						</div>
						<div className="flex items-center gap-2">
							<input
								className="bg-secondary rounded px-2 py-0.5 text-xs w-20 text-right outline-none"
								value={rotate}
								type="number"
								step={0.5}
								onChange={(e) => {
									const val = Number(e.target.value);
									if (!isNaN(val)) updateTransformLive({ rotate: val });
								}}
								onBlur={commitTransform}
							/>
							<span className="text-xs text-muted-foreground">°</span>
							{/* Reset rotation */}
							<Button
								size="icon"
								variant="ghost"
								className="size-6 rounded-full"
								onClick={() =>
									updateField({ transform: { ...element.transform, rotate: 0 } })
								}
							>
								<Minus className="size-3" />
							</Button>
						</div>
					</PropertyItem>

					{/* Flip controls */}
					<PropertyItem>
						<PropertyItemLabel>{t("properties.video.basic.flip")}</PropertyItemLabel>
						<div className="flex gap-2">
							<Button
								variant={element.transform.flipX ? "default" : "outline"}
								size="sm"
								className="h-7 px-3"
								onClick={() =>
									updateField({
										transform: {
											...element.transform,
											flipX: !element.transform.flipX,
										},
									})
								}
								title="Flip horizontally"
							>
								<FlipHorizontal className="size-4" />
							</Button>
							<Button
								variant={element.transform.flipY ? "default" : "outline"}
								size="sm"
								className="h-7 px-3"
								onClick={() =>
									updateField({
										transform: {
											...element.transform,
											flipY: !element.transform.flipY,
										},
									})
								}
								title="Flip vertically"
							>
								<FlipVertical className="size-4" />
							</Button>
						</div>
					</PropertyItem>

					{/* Reset all transform */}
					<div className="flex justify-end pt-1">
						<Button
							size="sm"
							variant="ghost"
							className="h-6 text-xs text-muted-foreground"
							onClick={() =>
								updateField({
									transform: { scale: 1, position: { x: 0, y: 0 }, rotate: 0, flipX: false, flipY: false },
								})
							}
						>
							<RefreshCcw className="size-3 mr-1" /> {t("properties.video.basic.resetTransform")}
						</Button>
					</div>
				</div>
			</PropertyGroup>

			{/* ── Blend ── */}
			<PropertyGroup title={t("properties.video.basic.blend")} defaultExpanded={true} hasBorderTop>
				<div className="space-y-4">
					{/* Opacity */}
					<PropertyItem>
						<div className="flex items-center gap-1.5">
							<PropertyItemLabel>{t("properties.video.basic.opacity")}</PropertyItemLabel>
							<KeyframeToggleButton property="opacity" {...kfProps} />
						</div>
						<div className="flex items-center gap-2">
							<Slider
								value={[opacityPercent]}
								min={0}
								max={100}
								step={1}
								className="w-24"
								onValueChange={([v]) => updateOpacityLive(v)}
								onPointerUp={() => updateField({ opacity: element.opacity })}
							/>
							<span className="text-xs w-8 text-right">{opacityPercent}%</span>
						</div>
					</PropertyItem>

					{/* Blend Mode — full Select dropdown */}
					<PropertyItem>
						<PropertyItemLabel>{t("properties.video.basic.mode")}</PropertyItemLabel>
						<Select
							value={blendMode}
							onValueChange={(v) =>
								updateField({ blendMode: v as GlobalCompositeOperation })
							}
						>
							<SelectTrigger className="h-7 text-xs min-w-[110px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{BLEND_MODES.map((m) => (
									<SelectItem key={m.value} value={m.value} className="text-xs">
										{m.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</PropertyItem>
				</div>
			</PropertyGroup>

		</div>
	);
}
