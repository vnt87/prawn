"use client";

import { Button } from "@/components/ui/button";
import { EFFECT_PRESETS, getEffectCategories, type EffectPreset } from "@/constants/effects-constants";
import { useEditor } from "@/hooks/use-editor";
import type { VideoElement, ImageElement, VideoFilters, ClipAnimation } from "@/types/timeline";
import { DEFAULT_VIDEO_FILTERS } from "@/types/timeline";
import { cn } from "@/utils/ui";
import { Check, Sparkles, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type VisualElement = VideoElement | ImageElement;

/**
 * Effects panel view - displays effect presets that can be applied to selected clips.
 */
export function EffectsView() {
	const { t } = useTranslation();
	const editor = useEditor();
	const [activeCategory, setActiveCategory] = useState<EffectPreset["category"] | "all">("all");
	
	// Get selected element to apply effects to
	const selectedRefs = editor.selection.getSelectedElements();
	const selectedRef = selectedRefs[0];
	
	// Get the actual element from the track
	let selectedElement: VisualElement | null = null;
	let trackId: string | undefined;
	
	if (selectedRef) {
		const tracks = editor.timeline.getTracks();
		for (const track of tracks) {
			const element = track.elements.find((el) => el.id === selectedRef.elementId);
			if (element && (element.type === "video" || element.type === "image")) {
				selectedElement = element as VisualElement;
				trackId = track.id;
				break;
			}
		}
	}
	
	const hasSelection = selectedElement !== null;

	// Filter presets by active category
	const filteredPresets = activeCategory === "all"
		? EFFECT_PRESETS
		: EFFECT_PRESETS.filter((preset) => preset.category === activeCategory);

	/**
	 * Apply an effect preset to the selected element.
	 */
	const handleApplyEffect = (preset: EffectPreset) => {
		if (!hasSelection || !selectedElement || !trackId) return;

		// Apply the animation as animationIn
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: selectedElement.id,
					updates: { animationIn: preset.animation },
				},
			],
			pushHistory: true,
		});
	};

	/**
	 * Clear all animations from the selected element.
	 */
	const handleClearEffects = () => {
		if (!hasSelection || !selectedElement || !trackId) return;

		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: selectedElement.id,
					updates: { 
						animationIn: undefined,
						animationOut: undefined,
					},
				},
			],
			pushHistory: true,
		});
	};

	/**
	 * Check if a preset is currently active.
	 */
	const isPresetActive = (preset: EffectPreset): boolean => {
		if (!hasSelection || !selectedElement) return false;
		
		const currentAnim = selectedElement.animationIn;
		if (!currentAnim) return false;
		
		return currentAnim.type === preset.animation.type && 
			   currentAnim.duration === preset.animation.duration;
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b px-4 py-3">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">{t("assets.effects", "Effects")}</span>
					{hasSelection && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={handleClearEffects}
						>
							{t("common.clear", "Clear")}
						</Button>
					)}
				</div>
			</div>

			{/* Category tabs */}
			<div className="flex gap-1 border-b px-2 py-2 overflow-x-auto">
				<CategoryTab
					label={t("effects.all", "All")}
					category="all"
					active={activeCategory === "all"}
					onClick={() => setActiveCategory("all")}
				/>
				{getEffectCategories().map((category) => (
					<CategoryTab
						key={category}
						label={t(`effects.${category}`, category)}
						category={category}
						active={activeCategory === category}
						onClick={() => setActiveCategory(category)}
					/>
				))}
			</div>

			{/* Effect grid */}
			<div className="flex-1 overflow-y-auto p-3">
				{!hasSelection ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
						<Sparkles className="size-8 opacity-50" />
						<p className="text-sm text-center">
							{t("effects.selectElement", "Select a clip to apply effects")}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-3 gap-2">
						{filteredPresets.map((preset) => (
							<EffectCard
								key={preset.id}
								preset={preset}
								isActive={isPresetActive(preset)}
								onClick={() => handleApplyEffect(preset)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

/**
 * Category tab button.
 */
function CategoryTab({
	label,
	category,
	active,
	onClick,
}: {
	label: string;
	category: EffectPreset["category"] | "all";
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			className={cn(
				"rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap",
				active
					? "bg-primary/10 text-primary"
					: "text-muted-foreground hover:bg-muted hover:text-foreground"
			)}
			onClick={onClick}
		>
			{label}
		</button>
	);
}

/**
 * Effect preset card with preview thumbnail.
 */
function EffectCard({
	preset,
	isActive,
	onClick,
}: {
	preset: EffectPreset;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					className={cn(
						"group relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all",
						isActive
							? "border-primary bg-primary/5 ring-1 ring-primary"
							: "border-border hover:border-primary/40 hover:bg-muted/50"
					)}
					onClick={onClick}
				>
					{/* Preview thumbnail */}
					<div
						className="aspect-square w-full rounded-md"
						style={{ background: preset.previewGradient }}
					>
						{/* Active indicator */}
						{isActive && (
							<div className="flex size-full items-center justify-center bg-black/20 rounded-md">
								<Check className="size-5 text-white drop-shadow-md" />
							</div>
						)}
					</div>

					{/* Label */}
					<span className="text-[10px] font-medium leading-tight text-center line-clamp-1">
						{preset.name}
					</span>
				</button>
			</TooltipTrigger>
			{preset.description && (
				<TooltipContent side="top" className="max-w-[200px]">
					<p className="text-xs">{preset.description}</p>
				</TooltipContent>
			)}
		</Tooltip>
	);
}