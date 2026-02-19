"use client";

import { PanelBaseView } from "@/components/editor/panels/panel-base-view";
import { Button } from "@/components/ui/button";
import { FILTER_PRESETS, getFilterCategories, type FilterPreset } from "@/constants/filter-presets";
import { useEditor } from "@/hooks/use-editor";
import type { VideoFilters } from "@/types/timeline";
import { DEFAULT_VIDEO_FILTERS } from "@/types/timeline";
import { cn } from "@/utils/ui";
import { Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

/**
 * Filters panel view - displays filter presets that can be applied to selected clips.
 */
export function FiltersView() {
	const { t } = useTranslation();
	const editor = useEditor();
	const [activeCategory, setActiveCategory] = useState<FilterPreset["category"] | "all">("all");
	
	// Get selected element to apply filters to
	const selectedRefs = editor.selection.getSelectedElements();
	const selectedRef = selectedRefs[0];
	
	// Get the actual element from the track
	let selectedElement: { id: string; filters?: VideoFilters } | null = null;
	let trackId: string | undefined;
	
	if (selectedRef) {
		const tracks = editor.timeline.getTracks();
		for (const track of tracks) {
			const element = track.elements.find((el) => el.id === selectedRef.elementId);
			if (element && "filters" in element) {
				selectedElement = element;
				trackId = track.id;
				break;
			}
		}
	}
	
	const hasSelection = selectedElement !== null;
	
	// Get current filters from selection
	const currentFilters: VideoFilters = hasSelection && selectedElement
		? (selectedElement.filters ?? DEFAULT_VIDEO_FILTERS)
		: DEFAULT_VIDEO_FILTERS;

	// Filter presets by active category
	const filteredPresets = activeCategory === "all"
		? FILTER_PRESETS
		: FILTER_PRESETS.filter((preset) => preset.category === activeCategory);

	/**
	 * Apply a filter preset to the selected element.
	 */
	const handleApplyFilter = (preset: FilterPreset) => {
		if (!hasSelection || !selectedElement) return;

		// Get the track ID for the selected element
		const tracks = editor.timeline.getTracks();
		let trackId: string | undefined;
		for (const track of tracks) {
			const element = track.elements.find((el) => el.id === selectedElement.id);
			if (element) {
				trackId = track.id;
				break;
			}
		}
		if (!trackId) return;

		// Merge the preset filters with current filters
		const newFilters: VideoFilters = {
			...DEFAULT_VIDEO_FILTERS,
			...currentFilters,
			...preset.filters,
		};

		// Update the element
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: selectedElement.id,
					updates: { filters: newFilters },
				},
			],
			pushHistory: true,
		});
	};

	/**
	 * Reset filters on the selected element.
	 */
	const handleResetFilters = () => {
		if (!hasSelection || !selectedElement) return;

		const tracks = editor.timeline.getTracks();
		let trackId: string | undefined;
		for (const track of tracks) {
			const element = track.elements.find((el) => el.id === selectedElement.id);
			if (element) {
				trackId = track.id;
				break;
			}
		}
		if (!trackId) return;

		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: selectedElement.id,
					updates: { filters: DEFAULT_VIDEO_FILTERS },
				},
			],
			pushHistory: true,
		});
	};

	/**
	 * Check if a preset is currently active (filters match).
	 */
	const isPresetActive = (preset: FilterPreset): boolean => {
		if (!hasSelection) return false;
		
		// Check if all preset filter values match current filters
		for (const [key, value] of Object.entries(preset.filters)) {
			const filterKey = key as keyof VideoFilters;
			if ((currentFilters[filterKey] ?? 0) !== value) {
				return false;
			}
		}
		return true;
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b px-4 py-3">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">{t("assets.filters", "Filters")}</span>
					{hasSelection && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={handleResetFilters}
						>
							{t("common.reset", "Reset")}
						</Button>
					)}
				</div>
			</div>

			{/* Category tabs */}
			<div className="flex gap-1 border-b px-2 py-2">
				<CategoryTab
					label={t("filters.all", "All")}
					category="all"
					active={activeCategory === "all"}
					onClick={() => setActiveCategory("all")}
				/>
				{getFilterCategories().map((category) => (
					<CategoryTab
						key={category}
						label={t(`filters.${category}`, category ?? "")}
						category={category}
						active={activeCategory === category}
						onClick={() => setActiveCategory(category)}
					/>
				))}
			</div>

			{/* Filter grid */}
			<div className="flex-1 overflow-y-auto p-3">
				{!hasSelection ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
						<Sparkles className="size-8 opacity-50" />
						<p className="text-sm text-center">
							{t("filters.selectElement", "Select a clip to apply filters")}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-3 gap-2">
						{filteredPresets.map((preset) => (
							<FilterCard
								key={preset.id}
								preset={preset}
								isActive={isPresetActive(preset)}
								onClick={() => handleApplyFilter(preset)}
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
	category: FilterPreset["category"] | "all";
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			className={cn(
				"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
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
 * Filter preset card with preview thumbnail.
 */
function FilterCard({
	preset,
	isActive,
	onClick,
}: {
	preset: FilterPreset;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
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
	);
}