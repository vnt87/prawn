"use client";

import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
	RefreshCcw,
	Minus,
	ChevronUp,
	ChevronDown,
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

// Common Canvas 2D blend modes to expose in the UI
const BLEND_MODES: { value: GlobalCompositeOperation; label: string }[] = [
	{ value: "source-over", label: "Normal" },
	{ value: "multiply", label: "Multiply" },
	{ value: "screen", label: "Screen" },
	{ value: "overlay", label: "Overlay" },
	{ value: "darken", label: "Darken" },
	{ value: "lighten", label: "Lighten" },
	{ value: "color-dodge", label: "Color Dodge" },
	{ value: "color-burn", label: "Color Burn" },
	{ value: "hard-light", label: "Hard Light" },
	{ value: "soft-light", label: "Soft Light" },
	{ value: "difference", label: "Difference" },
	{ value: "exclusion", label: "Exclusion" },
];

export function BasicVideoTab({
	element,
	trackId,
}: {
	element: VideoElement | ImageElement;
	trackId: string;
}) {
	const editor = useEditor();

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
			<PropertyGroup title="Transform" defaultExpanded={true}>
				<div className="space-y-4">
					{/* Scale */}
					<PropertyItem direction="column" className="items-stretch gap-2">
						<div className="flex justify-between items-center">
							<PropertyItemLabel>Scale</PropertyItemLabel>
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

					{/* Uniform scale toggle (stored as a convention — both X and Y tied to one scale value) */}
					<PropertyItem>
						<PropertyItemLabel>Uniform scale</PropertyItemLabel>
						<Switch defaultChecked disabled title="Uniform scale is always on" />
					</PropertyItem>

					{/* Position */}
					<PropertyItem>
						<PropertyItemLabel>Position</PropertyItemLabel>
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
						<PropertyItemLabel>Rotate</PropertyItemLabel>
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

					{/* Reset all transform */}
					<div className="flex justify-end pt-1">
						<Button
							size="sm"
							variant="ghost"
							className="h-6 text-xs text-muted-foreground"
							onClick={() =>
								updateField({
									transform: { scale: 1, position: { x: 0, y: 0 }, rotate: 0 },
								})
							}
						>
							<RefreshCcw className="size-3 mr-1" /> Reset transform
						</Button>
					</div>
				</div>
			</PropertyGroup>

			{/* ── Blend ── */}
			<PropertyGroup title="Blend" defaultExpanded={true} hasBorderTop>
				<div className="space-y-4">
					{/* Opacity */}
					<PropertyItem>
						<PropertyItemLabel>Opacity</PropertyItemLabel>
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
						<PropertyItemLabel>Mode</PropertyItemLabel>
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
