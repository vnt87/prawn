"use client";

import { Button } from "@/components/ui/button";
import { TRANSITION_PRESETS, getTransitionCategories, type TransitionPreset } from "@/constants/transitions-constants";
import { useEditor } from "@/hooks/use-editor";
import type { VideoElement, ImageElement, ClipAnimation } from "@/types/timeline";
import { cn } from "@/utils/ui";
import { Check, Sparkles, ArrowRightLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type VisualElement = VideoElement | ImageElement;

/**
 * Transitions panel view - displays transition presets that can be applied between clips.
 * 
 * Note: In the current implementation, transitions are applied as animationIn/animationOut
 * to the selected clip. A true transition would overlap two clips, but this simplified
 * approach provides immediate value while matching user expectations from other editors.
 */
export function TransitionsView() {
	const { t } = useTranslation();
	const editor = useEditor();
	const [activeCategory, setActiveCategory] = useState<TransitionPreset["category"] | "all">("all");
	
	// Get selected element to apply transitions to
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
		? TRANSITION_PRESETS
		: TRANSITION_PRESETS.filter((preset) => preset.category === activeCategory);

	/**
	 * Apply a transition preset to the selected element.
	 * Sets both animationIn and animationOut for a complete transition effect.
	 */
	const handleApplyTransition = (preset: TransitionPreset) => {
		if (!hasSelection || !selectedElement || !trackId) return;

		const animation: ClipAnimation = {
			type: preset.animationType,
			duration: preset.defaultDuration,
		};

		// Apply as both in and out animation for full transition effect
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: selectedElement.id,
					updates: { 
						animationIn: animation,
						animationOut: animation,
					},
				},
			],
			pushHistory: true,
		});
	};

	/**
	 * Apply transition as entry only.
	 */
	const handleApplyEntry = (preset: TransitionPreset) => {
		if (!hasSelection || !selectedElement || !trackId) return;

		const animation: ClipAnimation = {
			type: preset.animationType,
			duration: preset.defaultDuration,
		};

		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: selectedElement.id,
					updates: { animationIn: animation },
				},
			],
			pushHistory: true,
		});
	};

	/**
	 * Apply transition as exit only.
	 */
	const handleApplyExit = (preset: TransitionPreset) => {
		if (!hasSelection || !selectedElement || !trackId) return;

		const animation: ClipAnimation = {
			type: preset.animationType,
			duration: preset.defaultDuration,
		};

		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: selectedElement.id,
					updates: { animationOut: animation },
				},
			],
			pushHistory: true,
		});
	};

	/**
	 * Clear all transitions from the selected element.
	 */
	const handleClearTransitions = () => {
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
	const isPresetActive = (preset: TransitionPreset): boolean => {
		if (!hasSelection || !selectedElement) return false;
		
		const animIn = selectedElement.animationIn;
		const animOut = selectedElement.animationOut;
		
		// Active if both animations match the preset
		if (animIn && animOut) {
			return animIn.type === preset.animationType && 
				   animOut.type === preset.animationType;
		}
		return false;
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b px-4 py-3">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">{t("assets.transitions", "Transitions")}</span>
					{hasSelection && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={handleClearTransitions}
						>
							{t("common.clear", "Clear")}
						</Button>
					)}
				</div>
			</div>

			{/* Category tabs */}
			<div className="flex gap-1 border-b px-2 py-2 overflow-x-auto">
				<CategoryTab
					label={t("transitions.all", "All")}
					category="all"
					active={activeCategory === "all"}
					onClick={() => setActiveCategory("all")}
				/>
				{getTransitionCategories().map((category) => (
					<CategoryTab
						key={category}
						label={t(`transitions.${category}`, category)}
						category={category}
						active={activeCategory === category}
						onClick={() => setActiveCategory(category)}
					/>
				))}
			</div>

			{/* Transition grid */}
			<div className="flex-1 overflow-y-auto p-3">
				{!hasSelection ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
						<ArrowRightLeft className="size-8 opacity-50" />
						<p className="text-sm text-center">
							{t("transitions.selectElement", "Select a clip to apply transitions")}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-3 gap-2">
						{filteredPresets.map((preset) => (
							<TransitionCard
								key={preset.id}
								preset={preset}
								isActive={isPresetActive(preset)}
								onClick={() => handleApplyTransition(preset)}
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
	category: TransitionPreset["category"] | "all";
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
 * Transition preset card with preview thumbnail.
 */
function TransitionCard({
	preset,
	isActive,
	onClick,
}: {
	preset: TransitionPreset;
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