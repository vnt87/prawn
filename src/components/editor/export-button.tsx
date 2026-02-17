"use client";

import { useState, useRef } from "react";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/utils/ui";
import { getExportMimeType, getExportFileExtension } from "@/lib/export";
import { Check, Copy, Download, RotateCcw } from "lucide-react";
import {
	EXPORT_FORMAT_VALUES,
	EXPORT_QUALITY_VALUES,
	type ExportFormat,
	type ExportQuality,
	type ExportResult,
} from "@/types/export";
import { PropertyGroup } from "@/components/editor/panels/properties/property-item";
import { useEditor } from "@/hooks/use-editor";
import { DEFAULT_EXPORT_OPTIONS } from "@/constants/export-constants";

export function ExportButton() {
	const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
	const editor = useEditor();

	const handleExport = () => {
		setIsExportPopoverOpen(true);
	};

	const hasProject = !!editor.project.getActive();

	return (
		<Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"group relative flex items-center gap-2 overflow-hidden rounded-[100px] border border-indigo-500/40 bg-transparent px-6 h-7 text-sm font-semibold text-foreground cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:text-white hover:rounded-[12px] active:scale-[0.95]",
						!hasProject && "opacity-50 cursor-not-allowed hover:rounded-[100px] hover:border-indigo-500/40 hover:text-foreground hover:bg-transparent"
					)}
					onClick={hasProject ? handleExport : undefined}
					disabled={!hasProject}
				>
					{/* Left icon (Download) - enters on hover */}
					<Download
						className="absolute w-4 h-4 left-[-20%] stroke-current z-[9] group-hover:left-3 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
					/>

					{/* Text */}
					<span className="relative z-[1] -translate-x-2 group-hover:translate-x-2 transition-all duration-[800ms] ease-out">
						Export
					</span>

					{/* Circle background fill */}
					<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-[50%] opacity-0 group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]"></span>

					{/* Right icon (Download) - exits on hover */}
					<Download
						className="absolute w-4 h-4 right-3 stroke-current z-[9] group-hover:right-[-20%] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
					/>
				</button>
			</PopoverTrigger>
			{hasProject && <ExportPopover onOpenChange={setIsExportPopoverOpen} />}
		</Popover>
	);
}

function ExportPopover({
	onOpenChange,
}: {
	onOpenChange: (open: boolean) => void;
}) {
	const editor = useEditor();
	const activeProject = editor.project.getActive();
	const [format, setFormat] = useState<ExportFormat>(
		DEFAULT_EXPORT_OPTIONS.format,
	);
	const [quality, setQuality] = useState<ExportQuality>(
		DEFAULT_EXPORT_OPTIONS.quality,
	);
	const [includeAudio, setIncludeAudio] = useState<boolean>(
		DEFAULT_EXPORT_OPTIONS.includeAudio || true,
	);
	const [isExporting, setIsExporting] = useState(false);
	const [progress, setProgress] = useState(0);
	const [exportResult, setExportResult] = useState<ExportResult | null>(null);
	const cancelRequestedRef = useRef(false);

	const handleExport = async () => {
		if (!activeProject) return;

		cancelRequestedRef.current = false;
		setIsExporting(true);
		setProgress(0);
		setExportResult(null);

		const result = await editor.project.export({
			options: {
				format,
				quality,
				fps: activeProject.settings.fps,
				includeAudio,
				onProgress: ({ progress }) => setProgress(progress),
				onCancel: () => cancelRequestedRef.current,
			},
		});

		setIsExporting(false);

		if (result.cancelled) {
			setExportResult(null);
			setProgress(0);
			return;
		}

		setExportResult(result);

		if (result.success && result.buffer) {
			const mimeType = getExportMimeType({ format });
			const extension = getExportFileExtension({ format });
			const blob = new Blob([result.buffer], { type: mimeType });
			const url = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.href = url;
			a.download = `${activeProject.metadata.name}${extension}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			onOpenChange(false);
			setExportResult(null);
			setProgress(0);
		}
	};

	const handleCancel = () => {
		cancelRequestedRef.current = true;
	};

	return (
		<PopoverContent className="w-[280px] p-0" align="end" sideOffset={8}>
			{exportResult && !exportResult.success ? (
				<div className="p-4">
					<ExportError
						error={exportResult.error || "Unknown error occurred"}
						onRetry={handleExport}
					/>
				</div>
			) : (
				<>
					<div className="flex items-center justify-between px-4 py-3 border-b border-border">
						<h3 className="font-medium text-sm">
							{isExporting ? "Exporting project" : "Export project"}
						</h3>
					</div>

					<div className="flex flex-col">
						{!isExporting && (
							<>
								<div className="flex flex-col py-2">
									<PropertyGroup
										title="Format"
										defaultExpanded={true}
										hasBorderTop={false}
										hasBorderBottom={false}
										className="border-b border-border/50"
									>
										<RadioGroup
											value={format}
											onValueChange={(value) => {
												if (isExportFormat(value)) {
													setFormat(value);
												}
											}}
											className="gap-2 px-1"
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="mp4" id="mp4" />
												<Label htmlFor="mp4" className="text-sm font-normal cursor-pointer">
													MP4 (H.264)
												</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="webm" id="webm" />
												<Label htmlFor="webm" className="text-sm font-normal cursor-pointer">
													WebM (VP9)
												</Label>
											</div>
										</RadioGroup>
									</PropertyGroup>

									<PropertyGroup
										title="Quality"
										defaultExpanded={true}
										hasBorderBottom={false}
										hasBorderTop={false}
										className="border-b border-border/50"
									>
										<RadioGroup
											value={quality}
											onValueChange={(value) => {
												if (isExportQuality(value)) {
													setQuality(value);
												}
											}}
											className="gap-2 px-1"
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="low" id="low" />
												<Label htmlFor="low" className="text-sm font-normal cursor-pointer">Low</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="medium" id="medium" />
												<Label htmlFor="medium" className="text-sm font-normal cursor-pointer">Medium</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="high" id="high" />
												<Label htmlFor="high" className="text-sm font-normal cursor-pointer">High</Label>
											</div>
										</RadioGroup>
									</PropertyGroup>

									<PropertyGroup
										title="Audio"
										defaultExpanded={true}
										hasBorderBottom={false}
										hasBorderTop={false}
									>
										<div className="flex items-center space-x-2 px-1">
											<Checkbox
												id="include-audio"
												checked={includeAudio}
												onCheckedChange={(checked) =>
													setIncludeAudio(!!checked)
												}
											/>
											<Label htmlFor="include-audio" className="text-sm font-normal cursor-pointer">
												Include audio
											</Label>
										</div>
									</PropertyGroup>
								</div>

								<div className="p-3 border-t border-border bg-muted/30">
									<Button
										onClick={handleExport}
										className="w-full gap-2"
										size="sm"
									>
										<Download className="size-4" />
										Export Project
									</Button>
								</div>
							</>
						)}

						{isExporting && (
							<div className="space-y-4 p-4">
								<div className="flex flex-col gap-2">
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>Processing...</span>
										<span>{Math.round(progress * 100)}%</span>
									</div>
									<Progress value={progress * 100} className="w-full h-2" />
								</div>

								<Button
									variant="outline"
									className="w-full"
									size="sm"
									onClick={handleCancel}
								>
									Cancel
								</Button>
							</div>
						)}
					</div>
				</>
			)}
		</PopoverContent>
	);
}

function isExportFormat(value: string): value is ExportFormat {
	return EXPORT_FORMAT_VALUES.some((formatValue) => formatValue === value);
}

function isExportQuality(value: string): value is ExportQuality {
	return EXPORT_QUALITY_VALUES.some((qualityValue) => qualityValue === value);
}

function ExportError({
	error,
	onRetry,
}: {
	error: string;
	onRetry: () => void;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(error);
		setCopied(true);
		setTimeout(() => setCopied(false), 1000);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-1.5">
				<p className="text-destructive text-sm font-medium">Export failed</p>
				<p className="text-muted-foreground text-xs">{error}</p>
			</div>

			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					className="h-8 flex-1 text-xs"
					onClick={handleCopy}
				>
					{copied ? <Check className="text-constructive" /> : <Copy />}
					Copy
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-8 flex-1 text-xs"
					onClick={onRetry}
				>
					<RotateCcw />
					Retry
				</Button>
			</div>
		</div>
	);
}
