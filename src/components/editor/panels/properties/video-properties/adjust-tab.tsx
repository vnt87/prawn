"use client";

import { useRef } from "react";
import type { ImageElement, VideoElement, VideoFilters } from "@/types/timeline";
import { DEFAULT_VIDEO_FILTERS } from "@/types/timeline";
import { cn } from "@/utils/ui";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Upload, X } from "lucide-react";
import {
	PropertyGroup,
	PropertyItem,
	PropertyItemLabel,
} from "../property-item";
import { useEditor } from "@/hooks/use-editor";
import { useTranslation } from "react-i18next";
import { parseCubeFile } from "@/lib/lut/cube-parser";
import { lutCache } from "@/services/lut-cache/service";
import { generateUUID } from "@/utils/id";

export function AdjustTab({
	element,
	trackId,
}: {
	element: VideoElement | ImageElement;
	/** Track id for updateElements calls */
	trackId: string;
}) {
	const editor = useEditor();
	const { t } = useTranslation();

	// Read current filters, falling back to neutral defaults
	const filters: VideoFilters = element.filters ?? DEFAULT_VIDEO_FILTERS;

	// ---- Helpers ----

	/** Update a single filter field without recording history (live drag). */
	function updateFilterLive(patch: Partial<VideoFilters>) {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: { filters: { ...filters, ...patch } },
				},
			],
			pushHistory: false,
		});
	}

	/** Commit the current filters object to history (on pointer-up). */
	function commitFilters(patch: Partial<VideoFilters>) {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: { filters: { ...filters, ...patch } },
				},
			],
			pushHistory: true,
		});
	}

	/** Reset all filters to neutral defaults. */
	function resetFilters() {
		editor.timeline.updateElements({
			updates: [
				{
					trackId,
					elementId: element.id,
					updates: { filters: DEFAULT_VIDEO_FILTERS },
				},
			],
			pushHistory: true,
		});
	}

	return (
		<div className="flex flex-col pb-20">
			{/* ── Color ── */}
			<PropertyGroup title={t("properties.video.adjust.color")} defaultExpanded={true} hasBorderTop>
				<div className="space-y-6">
					{/* Temperature — pixel-level R/B channel shift */}
					<AdjustSlider
						label={t("properties.video.adjust.temp")}
						value={filters.temperature ?? 0}
						defaultValue={0}
						min={-100}
						max={100}
						trackGradient="linear-gradient(to right, #3b82f6, #f3f4f6, #eab308)"
						onChange={(v) => updateFilterLive({ temperature: v })}
						onCommit={(v) => commitFilters({ temperature: v })}
					/>
					{/* Tint — pixel-level G channel shift */}
					<AdjustSlider
						label={t("properties.video.adjust.tint")}
						value={filters.tint ?? 0}
						defaultValue={0}
						min={-100}
						max={100}
						trackGradient="linear-gradient(to right, #22c55e, #f3f4f6, #d946ef)"
						onChange={(v) => updateFilterLive({ tint: v })}
						onCommit={(v) => commitFilters({ tint: v })}
					/>
					{/* Saturation — CSS filter: saturate() */}
					<AdjustSlider
						label={t("properties.video.adjust.saturation")}
						value={filters.saturation}
						defaultValue={0}
						min={-100}
						max={100}
						trackGradient="linear-gradient(to right, #6b7280, #ef4444)"
						onChange={(v) => updateFilterLive({ saturation: v })}
						onCommit={(v) => commitFilters({ saturation: v })}
					/>
				</div>
			</PropertyGroup>

			{/* ── Lightness ── */}
			<PropertyGroup title={t("properties.video.adjust.lightness")} defaultExpanded={true} hasBorderTop>
				<div className="space-y-6">
					{/* Exposure → brightness */}
					<AdjustSlider
						label={t("properties.video.adjust.exposure")}
						value={filters.brightness}
						defaultValue={0}
						min={-100}
						max={100}
						onChange={(v) => updateFilterLive({ brightness: v })}
						onCommit={(v) => commitFilters({ brightness: v })}
					/>
					{/* Contrast */}
					<AdjustSlider
						label={t("properties.video.adjust.contrast")}
						value={filters.contrast}
						defaultValue={0}
						min={-100}
						max={100}
						onChange={(v) => updateFilterLive({ contrast: v })}
						onCommit={(v) => commitFilters({ contrast: v })}
					/>
					{/* Highlight — pixel-level tone curve */}
					<AdjustSlider
						label={t("properties.video.adjust.highlight")}
						value={filters.highlights ?? 0}
						defaultValue={0}
						min={-100}
						max={100}
						onChange={(v) => updateFilterLive({ highlights: v })}
						onCommit={(v) => commitFilters({ highlights: v })}
					/>
					{/* Shadow — pixel-level tone curve */}
					<AdjustSlider
						label={t("properties.video.adjust.shadow")}
						value={filters.shadows ?? 0}
						defaultValue={0}
						min={-100}
						max={100}
						onChange={(v) => updateFilterLive({ shadows: v })}
						onCommit={(v) => commitFilters({ shadows: v })}
					/>
					{/* Whites — pixel-level white point */}
					<AdjustSlider
						label={t("properties.video.adjust.whites")}
						value={filters.whites ?? 0}
						defaultValue={0}
						min={-100}
						max={100}
						onChange={(v) => updateFilterLive({ whites: v })}
						onCommit={(v) => commitFilters({ whites: v })}
					/>
					{/* Blacks — pixel-level black point */}
					<AdjustSlider
						label={t("properties.video.adjust.blacks")}
						value={filters.blacks ?? 0}
						defaultValue={0}
						min={-100}
						max={100}
						onChange={(v) => updateFilterLive({ blacks: v })}
						onCommit={(v) => commitFilters({ blacks: v })}
					/>
					{/* Brilliance: luminance-adaptive midtone boost */}
					<AdjustSlider
						label={t("properties.video.adjust.brilliance")}
						value={filters.brilliance ?? 0}
						defaultValue={0}
						min={-100}
						max={100}
						onChange={(v) => updateFilterLive({ brilliance: v })}
						onCommit={(v) => commitFilters({ brilliance: v })}
					/>
				</div>
			</PropertyGroup>

			{/* ── Effects ── */}
			<PropertyGroup title={t("properties.video.adjust.effects")} defaultExpanded={true} hasBorderTop>
				<div className="space-y-6">
					{/* Sharpen — convolution kernel */}
					<AdjustSlider
						label={t("properties.video.adjust.sharpen")}
						value={filters.sharpen ?? 0}
						defaultValue={0}
						min={0}
						max={100}
						onChange={(v) => updateFilterLive({ sharpen: v })}
						onCommit={(v) => commitFilters({ sharpen: v })}
					/>
					{/* Clarity — large-radius unsharp mask */}
					<AdjustSlider
						label={t("properties.video.adjust.clarity")}
						value={filters.clarity ?? 0}
						defaultValue={0}
						min={0}
						max={100}
						onChange={(v) => updateFilterLive({ clarity: v })}
						onCommit={(v) => commitFilters({ clarity: v })}
					/>
					{/* Fade — white overlay */}
					<AdjustSlider
						label={t("properties.video.adjust.fade")}
						value={filters.fade}
						defaultValue={0}
						min={0}
						max={100}
						onChange={(v) => updateFilterLive({ fade: v })}
						onCommit={(v) => commitFilters({ fade: v })}
					/>
					{/* Vignette — radial gradient overlay */}
					<AdjustSlider
						label={t("properties.video.adjust.vignette")}
						value={filters.vignette}
						defaultValue={0}
						min={0}
						max={100}
						onChange={(v) => updateFilterLive({ vignette: v })}
						onCommit={(v) => commitFilters({ vignette: v })}
					/>
				</div>
			</PropertyGroup>

			{/* ── LUT ── */}
			<LutSection filters={filters} onUpdate={commitFilters} />


			{/* Reset all filters button */}
			<div className="px-4 pb-4 pt-2 flex justify-end">
				<Button
					size="sm"
					variant="ghost"
					className="h-7 text-xs text-muted-foreground"
					onClick={resetFilters}
				>
					<RefreshCcw className="size-3 mr-1" /> {t("properties.video.adjust.resetAll")}
				</Button>
			</div>
		</div>
	);
}

// ---- Shared slider sub-component ----

function AdjustSlider({
	label,
	value,
	defaultValue,
	min,
	max,
	trackGradient,
	disabled = false,
	badge,
	onChange,
	onCommit,
}: {
	label: string;
	value: number;
	defaultValue: number;
	min: number;
	max: number;
	trackGradient?: string;
	disabled?: boolean;
	/** Optional badge text to show alongside the label when disabled */
	badge?: string;
	onChange: (v: number) => void;
	onCommit: (v: number) => void;
}) {
	return (
		<div className="space-y-2">
			<div className="flex justify-between items-center">
				<span className={cn("text-xs", disabled ? "text-muted-foreground/60" : "text-muted-foreground")}>
					{label}
				</span>
				<div className="flex items-center gap-1.5">
					{badge && (
						<span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
							{badge}
						</span>
					)}
					<div className="bg-secondary/50 rounded px-2 py-0.5 text-[10px] w-12 text-center">
						{disabled ? defaultValue : value}
					</div>
				</div>
			</div>
			<div className="relative flex items-center h-4">
				{trackGradient && (
					<div
						className="absolute h-1 w-full rounded-full opacity-40"
						style={{ background: trackGradient }}
					/>
				)}
				<Slider
					value={[disabled ? defaultValue : value]}
					min={min}
					max={max}
					step={1}
					disabled={disabled}
					className={cn("w-full", trackGradient && "z-10")}
					onValueChange={([v]) => onChange(v)}
					onPointerUp={() => onCommit(disabled ? defaultValue : value)}
				/>
			</div>
		</div>
	);
}

// ---- LUT section sub-component ----

function LutSection({
	filters,
	onUpdate,
}: {
	filters: VideoFilters;
	onUpdate: (updates: Partial<VideoFilters>) => void;
}) {
	const { t } = useTranslation();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const activeLut = filters.lut;

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const text = await file.text();
		const lutName = file.name.replace(/\.cube$/i, "");
		const parsed = parseCubeFile(text, lutName);
		if (!parsed) {
			console.warn("[LutSection] Could not parse .cube file:", file.name);
			return;
		}

		// Generate a stable ID from the file name + size (avoids duplicate cache entries)
		const id = `lut-${lutName}-${file.size}`;
		lutCache.set(id, parsed);

		onUpdate({ lut: { id, name: lutName, intensity: activeLut?.intensity ?? 100 } });

		// Reset input so the same file can be reloaded if needed
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleIntensityChange = (v: number) => {
		if (!activeLut) return;
		onUpdate({ lut: { ...activeLut, intensity: v } });
	};

	const handleRemove = () => {
		onUpdate({ lut: undefined });
	};

	return (
		<PropertyGroup title={t("properties.video.adjust.lut")} defaultExpanded={true} hasBorderTop>
			<div className="space-y-4 pb-2">
				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					accept=".cube"
					className="hidden"
					onChange={handleFileChange}
				/>

				{activeLut ? (
					/* Active LUT: show name + remove button */
					<PropertyItem direction="row" className="items-center gap-2">
						<span className="text-xs truncate flex-1 font-medium">{activeLut.name}</span>
						<button
							type="button"
							onClick={handleRemove}
							className="text-muted-foreground hover:text-destructive transition-colors"
							title={t("common.remove")}
						>
							<X size={13} />
						</button>
					</PropertyItem>
				) : (
					/* No LUT: upload button */
					<Button
						size="sm"
						variant="secondary"
						className="w-full h-8 text-xs gap-1.5"
						onClick={() => fileInputRef.current?.click()}
					>
						<Upload size={12} />
						{t("properties.video.adjust.uploadLut")}
					</Button>
				)}

				{/* Intensity slider (only shown when a LUT is active) */}
				{activeLut && (
					<PropertyItem direction="column" className="items-stretch gap-2">
						<div className="flex justify-between">
							<PropertyItemLabel className="text-muted-foreground">
								{t("properties.video.adjust.intensity")}
							</PropertyItemLabel>
							<span className="text-xs text-muted-foreground">{activeLut.intensity}</span>
						</div>
						<Slider
							value={[activeLut.intensity]}
							min={0}
							max={100}
							step={1}
							onValueChange={([v]) => handleIntensityChange(v)}
							onPointerUp={() => handleIntensityChange(activeLut.intensity)}
						/>
					</PropertyItem>
				)}
			</div>
		</PropertyGroup>
	);
}
