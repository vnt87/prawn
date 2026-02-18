"use client";

import type { AnimationType, ClipAnimation, ImageElement, VideoElement } from "@/types/timeline";
import { cn } from "@/utils/ui";
import { Slider } from "@/components/ui/slider";
import {
	PropertyGroup,
	PropertyItem,
	PropertyItemLabel,
} from "../property-item";
import { useEditor } from "@/hooks/use-editor";
import {
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	ArrowDown,
	ZoomIn,
	ZoomOut,
	RefreshCw,
	Eye,
	X,
} from "lucide-react";

/** Preset animation options shown as a grid of cards. */
const ANIMATION_PRESETS: {
	type: AnimationType;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{ type: "fade", label: "Fade", icon: Eye },
	{ type: "slide-left", label: "Slide Left", icon: ArrowLeft },
	{ type: "slide-right", label: "Slide Right", icon: ArrowRight },
	{ type: "slide-up", label: "Slide Up", icon: ArrowUp },
	{ type: "slide-down", label: "Slide Down", icon: ArrowDown },
	{ type: "zoom-in", label: "Zoom In", icon: ZoomIn },
	{ type: "zoom-out", label: "Zoom Out", icon: ZoomOut },
	{ type: "spin", label: "Spin", icon: RefreshCw },
];

/** Default animation duration in seconds when a preset is selected. */
const DEFAULT_ANIM_DURATION = 0.4;

export function AnimationTab({
	element,
	trackId,
}: {
	element: VideoElement | ImageElement;
	/** Track id for updateElements calls */
	trackId: string;
}) {
	const editor = useEditor();

	// Read current animation state from element
	const animIn = element.animationIn;
	const animOut = element.animationOut;

	// ---- Helpers ----

	function setAnimIn(anim: ClipAnimation | undefined) {
		editor.timeline.updateElements({
			updates: [{ trackId, elementId: element.id, updates: { animationIn: anim } }],
			pushHistory: true,
		});
	}

	function setAnimOut(anim: ClipAnimation | undefined) {
		editor.timeline.updateElements({
			updates: [{ trackId, elementId: element.id, updates: { animationOut: anim } }],
			pushHistory: true,
		});
	}

	function updateAnimInDuration(duration: number) {
		if (!animIn) return;
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: { animationIn: { ...animIn, duration } },
				},
			],
			pushHistory: true,
		});
	}

	function updateAnimOutDuration(duration: number) {
		if (!animOut) return;
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: { animationOut: { ...animOut, duration } },
				},
			],
			pushHistory: true,
		});
	}

	return (
		<div className="flex flex-col pb-20">
			{/* ── In animation ── */}
			<PropertyGroup title="In" defaultExpanded={true}>
				{/* "None" clear button + preset grid */}
				<AnimationGrid
					selected={animIn?.type ?? null}
					onSelect={(type) =>
						type
							? setAnimIn({ type, duration: DEFAULT_ANIM_DURATION })
							: setAnimIn(undefined)
					}
				/>
				{/* Duration slider — only shown when an animation is selected */}
				{animIn && (
					<PropertyItem
						direction="column"
						className="items-stretch gap-2 mt-4"
					>
						<div className="flex justify-between">
							<PropertyItemLabel>Duration</PropertyItemLabel>
							<span className="text-xs bg-secondary px-2 py-0.5 rounded">
								{animIn.duration.toFixed(1)}s
							</span>
						</div>
						<Slider
							value={[animIn.duration]}
							min={0.1}
							max={Math.min(2, element.duration * 0.5)}
							step={0.05}
							onValueChange={([v]) => updateAnimInDuration(v)}
						/>
					</PropertyItem>
				)}
			</PropertyGroup>

			{/* ── Out animation ── */}
			<PropertyGroup title="Out" defaultExpanded={true} hasBorderTop>
				<AnimationGrid
					selected={animOut?.type ?? null}
					onSelect={(type) =>
						type
							? setAnimOut({ type, duration: DEFAULT_ANIM_DURATION })
							: setAnimOut(undefined)
					}
				/>
				{animOut && (
					<PropertyItem
						direction="column"
						className="items-stretch gap-2 mt-4"
					>
						<div className="flex justify-between">
							<PropertyItemLabel>Duration</PropertyItemLabel>
							<span className="text-xs bg-secondary px-2 py-0.5 rounded">
								{animOut.duration.toFixed(1)}s
							</span>
						</div>
						<Slider
							value={[animOut.duration]}
							min={0.1}
							max={Math.min(2, element.duration * 0.5)}
							step={0.05}
							onValueChange={([v]) => updateAnimOutDuration(v)}
						/>
					</PropertyItem>
				)}
			</PropertyGroup>

			{/* ── Combo animations (P4+) ── */}
			<PropertyGroup title="Combo" defaultExpanded={false} hasBorderTop>
				<div className="p-4 text-center text-muted-foreground text-sm">
					No combo animations available
				</div>
			</PropertyGroup>
		</div>
	);
}

/** Grid of animation preset cards with a "None" clear option. */
function AnimationGrid({
	selected,
	onSelect,
}: {
	selected: AnimationType | null;
	onSelect: (type: AnimationType | null) => void;
}) {
	return (
		<div className="grid grid-cols-4 gap-2">
			{/* None / clear */}
			<AnimCard
				label="None"
				icon={X}
				active={selected === null}
				onClick={() => onSelect(null)}
			/>
			{ANIMATION_PRESETS.map((preset) => (
				<AnimCard
					key={preset.type}
					label={preset.label}
					icon={preset.icon}
					active={selected === preset.type}
					onClick={() => onSelect(preset.type)}
				/>
			))}
		</div>
	);
}

/** Single animation preset card. */
function AnimCard({
	label,
	icon: Icon,
	active,
	onClick,
}: {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			className={cn(
				"flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors cursor-pointer",
				active
					? "border-primary bg-primary/10 text-primary"
					: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
			)}
			onClick={onClick}
		>
			<Icon className="size-5" />
			<span className="text-[10px] text-center leading-tight">{label}</span>
		</button>
	);
}
