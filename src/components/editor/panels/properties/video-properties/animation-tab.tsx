"use client";

import type { AnimationType, ClipAnimation, ImageElement, VideoElement, SpringConfig, EasingType } from "@/types/timeline";
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
	Droplet,
	Heart,
	Maximize,
	Minimize,
	Zap,
	Activity,
	Feather,
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
	// New animations ported from Twick
	{ type: "blur", label: "Blur", icon: Droplet },
	{ type: "rise", label: "Rise", icon: ArrowUp },
	{ type: "fall", label: "Fall", icon: ArrowDown },
	{ type: "breathe", label: "Breathe", icon: Heart },
	{ type: "ken-burns-in", label: "Ken Burns In", icon: Maximize },
	{ type: "ken-burns-out", label: "Ken Burns Out", icon: Minimize },
];

/** Spring-based animation presets */
const SPRING_PRESETS: {
	type: AnimationType;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}[] = [
	{ type: "spring-bounce", label: "Spring Bounce", icon: Zap },
	{ type: "spring-elastic", label: "Spring Elastic", icon: Activity },
	{ type: "spring-gentle", label: "Spring Gentle", icon: Feather },
];

/** Default animation duration in seconds when a preset is selected. */
const DEFAULT_ANIM_DURATION = 0.4;

/** Default spring configuration */
const DEFAULT_SPRING_CONFIG: SpringConfig = {
	damping: 10,
	stiffness: 100,
	mass: 1,
};

/** Check if animation type is spring-based */
function isSpringAnimation(type: AnimationType): boolean {
	return type.startsWith('spring-');
}

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

	function updateAnimInSpringConfig(config: Partial<SpringConfig>) {
		if (!animIn || !isSpringAnimation(animIn.type)) return;
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: {
						animationIn: {
							...animIn,
							springConfig: { ...animIn.springConfig, ...config },
						},
					},
				},
			],
			pushHistory: true,
		});
	}

	function updateAnimOutSpringConfig(config: Partial<SpringConfig>) {
		if (!animOut || !isSpringAnimation(animOut.type)) return;
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: {
						animationOut: {
							...animOut,
							springConfig: { ...animOut.springConfig, ...config },
						},
					},
				},
			],
			pushHistory: true,
		});
	}

	function updateAnimInEasing(easing: EasingType) {
		if (!animIn) return;
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: { animationIn: { ...animIn, easing } },
				},
			],
			pushHistory: true,
		});
	}

	function updateAnimOutEasing(easing: EasingType) {
		if (!animOut) return;
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: { animationOut: { ...animOut, easing } },
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
							? setAnimIn({
								type,
								duration: DEFAULT_ANIM_DURATION,
								springConfig: isSpringAnimation(type) ? DEFAULT_SPRING_CONFIG : undefined,
							})
							: setAnimIn(undefined)
					}
				/>
				{/* Duration slider — only shown when an animation is selected */}
				{animIn && (
					<>
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

						{/* Spring configuration for spring animations */}
						{isSpringAnimation(animIn.type) && (
							<SpringConfigControls
								config={animIn.springConfig ?? DEFAULT_SPRING_CONFIG}
								onChange={updateAnimInSpringConfig}
							/>
						)}
					</>
				)}
			</PropertyGroup>

			{/* ── Out animation ── */}
			<PropertyGroup title="Out" defaultExpanded={true} hasBorderTop>
				<AnimationGrid
					selected={animOut?.type ?? null}
					onSelect={(type) =>
						type
							? setAnimOut({
								type,
								duration: DEFAULT_ANIM_DURATION,
								springConfig: isSpringAnimation(type) ? DEFAULT_SPRING_CONFIG : undefined,
							})
							: setAnimOut(undefined)
					}
				/>
				{animOut && (
					<>
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

						{/* Spring configuration for spring animations */}
						{isSpringAnimation(animOut.type) && (
							<SpringConfigControls
								config={animOut.springConfig ?? DEFAULT_SPRING_CONFIG}
								onChange={updateAnimOutSpringConfig}
							/>
						)}
					</>
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

/** Spring configuration controls */
function SpringConfigControls({
	config,
	onChange,
}: {
	config: SpringConfig;
	onChange: (config: Partial<SpringConfig>) => void;
}) {
	return (
		<div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-3">
			<div className="text-xs font-medium text-muted-foreground mb-2">Spring Settings</div>
			
			<PropertyItem direction="column" className="items-stretch gap-1">
				<div className="flex justify-between">
					<PropertyItemLabel className="text-xs">Damping</PropertyItemLabel>
					<span className="text-xs text-muted-foreground">{config.damping ?? 10}</span>
				</div>
				<Slider
					value={[config.damping ?? 10]}
					min={1}
					max={30}
					step={1}
					onValueChange={([v]) => onChange({ damping: v })}
				/>
			</PropertyItem>

			<PropertyItem direction="column" className="items-stretch gap-1">
				<div className="flex justify-between">
					<PropertyItemLabel className="text-xs">Stiffness</PropertyItemLabel>
					<span className="text-xs text-muted-foreground">{config.stiffness ?? 100}</span>
				</div>
				<Slider
					value={[config.stiffness ?? 100]}
					min={50}
					max={500}
					step={10}
					onValueChange={([v]) => onChange({ stiffness: v })}
				/>
			</PropertyItem>

			<PropertyItem direction="column" className="items-stretch gap-1">
				<div className="flex justify-between">
					<PropertyItemLabel className="text-xs">Mass</PropertyItemLabel>
					<span className="text-xs text-muted-foreground">{config.mass ?? 1}</span>
				</div>
				<Slider
					value={[config.mass ?? 1]}
					min={0.5}
					max={3}
					step={0.1}
					onValueChange={([v]) => onChange({ mass: v })}
				/>
			</PropertyItem>
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
		<>
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
			
			{/* Spring animations section */}
			<div className="mt-4">
				<div className="text-xs font-medium text-muted-foreground mb-2">Spring Animations</div>
				<div className="grid grid-cols-3 gap-2">
					{SPRING_PRESETS.map((preset) => (
						<AnimCard
							key={preset.type}
							label={preset.label}
							icon={preset.icon}
							active={selected === preset.type}
							onClick={() => onSelect(preset.type)}
						/>
					))}
				</div>
			</div>
		</>
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
