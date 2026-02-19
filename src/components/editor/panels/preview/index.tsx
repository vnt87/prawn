"use client";

import { useCallback, useMemo, useRef } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import { useEditor } from "@/hooks/use-editor";
import { useRafLoop } from "@/hooks/use-raf-loop";
import { useContainerSize } from "@/hooks/use-container-size";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { CanvasRenderer } from "@/services/renderer/canvas-renderer";
import type { RootNode } from "@/services/renderer/nodes/root-node";
import { buildScene } from "@/services/renderer/scene-builder";
import { formatTimeCode, getLastFrameTime } from "@/lib/time";
import { PreviewInteractionOverlay } from "./preview-interaction-overlay";
import { EditableTimecode } from "@/components/editable-timecode";
import { invokeAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
	Maximize2,
	Pause,
	Play,
	Disc,
	Camera,
} from "lucide-react";
import { cn } from "@/utils/ui";
import { RecordingDialog } from "@/components/editor/dialogs/recording-dialog";
import { processMediaAssets } from "@/lib/media/processing";
import { useState } from "react";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
	ChevronDown,
	Monitor,
	ZoomIn,
	Check,
	RectangleHorizontal,
	RectangleVertical,
	Square,
	RotateCcw,
	Proportions,
} from "lucide-react";

function usePreviewSize() {
	const editor = useEditor();
	const activeProject = editor.project.getActive();

	return {
		width: activeProject?.settings.canvasSize.width,
		height: activeProject?.settings.canvasSize.height,
	};
}

function RenderTreeController() {
	const editor = useEditor();
	const tracks = editor.timeline.getTracks();
	const mediaAssets = editor.media.getAssets();
	const activeProject = editor.project.getActive();

	const { width, height } = usePreviewSize();

	useDeepCompareEffect(() => {
		if (!activeProject) return;

		const duration = editor.timeline.getTotalDuration();
		const renderTree = buildScene({
			tracks,
			mediaAssets,
			duration,
			canvasSize: { width, height },
			background: activeProject.settings.background,
		});

		editor.renderer.setRenderTree({ renderTree });
	}, [tracks, mediaAssets, activeProject?.settings.background, width, height]);

	return null;
}

const QualityIconFull = (props: React.SVGProps<SVGSVGElement>) => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M19 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3ZM12 13.5H11V15H9.5V13.5H6.5V9H8V12H9.5V9H11V12H12V13.5ZM18 15H16.2L14.4 12.8V15H13V9H14.5V11.2L16.2 9H18L15.8 12L18 15Z" fill="currentColor" />
	</svg>
);

const QualityIconHigh = (props: React.SVGProps<SVGSVGElement>) => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M14.5 13.5H16.5V10.5H14.5M18 14C18 14.2652 17.8946 14.5196 17.7071 14.7071C17.5196 14.8946 17.2652 15 17 15H16.25V16.5H14.75V15H14C13.7348 15 13.4804 14.8946 13.2929 14.7071C13.1054 14.5196 13 14.2652 13 14V10C13 9.73478 13.1054 9.48043 13.2929 9.29289C13.4804 9.10536 13.7348 9 14 9H17C17.2652 9 17.5196 9.10536 17.7071 9.29289C17.8946 9.48043 18 9.73478 18 10M11 15H9.5V13H7.5V15H6V9H7.5V11.5H9.5V9H11M19 4H5C3.89 4 3 4.89 3 6V18C3 18.5304 3.21071 19.0391 3.58579 19.4142C3.96086 19.7893 4.46957 20 5 20H19C19.5304 20 20.0391 19.7893 20.4142 19.4142C20.7893 19.0391 21 18.5304 21 18V6C21 4.89 20.1 4 19 4Z" fill="currentColor" />
	</svg>
);

const QualityIconMedium = (props: React.SVGProps<SVGSVGElement>) => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M21 6V18C21 18.5304 20.7893 19.0391 20.4142 19.4142C20.0391 19.7893 19.5304 20 19 20H5C4.46957 20 3.96086 19.7893 3.58579 19.4142C3.21071 19.0391 3 18.5304 3 18V6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4H19C19.5304 4 20.0391 4.21071 20.4142 4.58579C20.7893 4.96086 21 5.46957 21 6ZM12 10C12 9.5 11.5 9 11 9H6.5C6 9 5.5 9.5 5.5 10V15H7V10.5H8V14H9.5V10.5H10.5V15H12V10ZM14.5 9C14.2348 9 13.9804 9.10536 13.7929 9.29289C13.6054 9.48043 13.5 9.73478 13.5 10V14C13.5 14.2652 13.6054 14.5196 13.7929 14.7071C13.9804 14.8946 14.2348 15 14.5 15H15.5V16.5H16.75V15H17.5C17.7652 15 18.0196 14.8946 18.2071 14.7071C18.3946 14.5196 18.5 14.2652 18.5 14V10C18.5 9.73478 18.3946 9.48043 18.2071 9.29289C18.0196 9.10536 17.7652 9 17.5 9H14.5ZM15 10.5H17V13.5H15V10.5Z" fill="currentColor" />
	</svg>
);

const QualityIconLow = (props: React.SVGProps<SVGSVGElement>) => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M14.5 13.5H16.5V10.5H14.5M18 14C18 14.6 17.6 15 17 15H16.25V16.5H14.75V15H14C13.4 15 13 14.6 13 14V10C13 9.4 13.4 9 14 9H17C17.6 9 18 9.4 18 10M19 4H5C4.46957 4 3.96086 4.21071 3.58579 4.58579C3.21071 4.96086 3 5.46957 3 6V18C3 18.5304 3.21071 19.0391 3.58579 19.4142C3.96086 19.7893 4.46957 20 5 20H19C19.5304 20 20.0391 19.7893 20.4142 19.4142C20.7893 19.0391 21 18.5304 21 18V6C21 5.46957 20.7893 4.96086 20.4142 4.58579C20.0391 4.21071 19.5304 4 19 4ZM11 13.5V15H6V9H7.5V13.5H11Z" fill="currentColor" />
	</svg>
);

const QUALITY_OPTIONS = [
	{ label: "Full quality", value: 1, description: "Original video resolution", Icon: QualityIconFull },
	{ label: "High quality", value: 0.5, description: "Smooth playback, no impact on exported video", Icon: QualityIconHigh },
	{ label: "Medium quality", value: 0.25, description: "Smoother playback, no impact on exported video", Icon: QualityIconMedium },
	{ label: "Low quality", value: 0.125, description: "Smoothest playback, no impact on exported video", Icon: QualityIconLow },
];

const RATIO_OPTIONS = [
	{ label: "16:9", width: 1920, height: 1080, Icon: RectangleHorizontal },
	{ label: "9:16", width: 1080, height: 1920, Icon: RectangleVertical },
	{ label: "1:1", width: 1080, height: 1080, Icon: Square },
	{ label: "4:3", width: 1440, height: 1080, Icon: RectangleHorizontal },
	{ label: "3:4", width: 1080, height: 1440, Icon: RectangleVertical },
	{ label: "21:9", width: 2560, height: 1080, Icon: RectangleHorizontal },
];

export function PreviewPanel() {
	const containerRef = useRef<HTMLDivElement>(null);
	const { isFullscreen, toggleFullscreen } = useFullscreen({ containerRef });
	const [zoom, setZoom] = useState(1);
	const [quality, setQuality] = useState(1);

	return (
		<div
			ref={containerRef}
			className={cn(
				"panel bg-background relative flex h-full min-h-0 w-full min-w-0 flex-col",
				isFullscreen && "bg-background",
			)}
		>
			<div className="flex min-h-0 min-w-0 flex-1 items-center justify-center p-2 pb-0 overflow-auto bg-[#18181b]">
				<PreviewCanvas zoom={zoom} quality={quality} />
				<RenderTreeController />
			</div>
			<PreviewToolbar
				isFullscreen={isFullscreen}
				onToggleFullscreen={toggleFullscreen}
				zoom={zoom}
				onZoomChange={setZoom}
				quality={quality}
				onQualityChange={setQuality}
			/>
		</div>
	);
}

function PreviewToolbar({
	isFullscreen,
	onToggleFullscreen,
	zoom,
	onZoomChange,
	quality,
	onQualityChange,
}: {
	isFullscreen: boolean;
	onToggleFullscreen: () => void;
	zoom: number;
	onZoomChange: (zoom: number) => void;
	quality: number;
	onQualityChange: (quality: number) => void;
}) {
	const editor = useEditor();
	const isPlaying = editor.playback.getIsPlaying();
	const currentTime = editor.playback.getCurrentTime();
	const totalDuration = editor.timeline.getTotalDuration();
	const fps = editor.project.getActive().settings.fps;
	const activeProject = editor.project.getActive();
	const [isRecordingOpen, setIsRecordingOpen] = useState(false);

	const handleSaveRecording = async (file: File) => {
		if (!activeProject) return;
		try {
			const dt = new DataTransfer();
			dt.items.add(file);
			const assets = await processMediaAssets({
				files: dt.files,
				onProgress: () => { },
			});

			for (const asset of assets) {
				await editor.media.addMediaAsset({
					projectId: activeProject.metadata.id,
					asset,
				});
			}
			toast.success("Recording saved to project assets");
		} catch (error) {
			console.error("Failed to save recording", error);
			toast.error("Failed to save recording");
		}
	};

	const handleExportFrame = useCallback(() => {
		const canvas = document.querySelector("canvas[data-preview-canvas]") as HTMLCanvasElement | null;
		if (!canvas) {
			toast.error("No preview canvas found");
			return;
		}

		// Get current time for filename
		const currentTime = editor.playback.getCurrentTime();
		const timeStr = currentTime.toFixed(2).replace(".", "-");
		const projectName = activeProject?.metadata.name || "prawn";
		const filename = `${projectName}-frame-${timeStr}s.png`;

		// Create a link to download the image
		const link = document.createElement("a");
		link.download = filename;
		link.href = canvas.toDataURL("image/png");
		link.click();

		toast.success("Frame exported successfully");
	}, [activeProject, editor.playback]);

	return (
		<div className="flex items-center justify-between pb-3 pt-4 px-5 gap-4">
			{/* Left controls: Timecode */}
			<div className="flex items-center">
				<EditableTimecode
					time={currentTime}
					duration={totalDuration}
					format="HH:MM:SS:FF"
					fps={fps}
					onTimeChange={({ time }) => editor.playback.seek({ time })}
					className="text-center w-[100px]"
				/>
				<span className="text-muted-foreground px-1 font-mono text-xs">/</span>
				<span className="text-muted-foreground font-mono text-xs">
					{formatTimeCode({
						timeInSeconds: totalDuration,
						format: "HH:MM:SS:FF",
						fps,
					})}
				</span>
			</div>

			{/* Center controls: Play and Record */}
			<div className="flex items-center gap-1">
				<Button
					variant="text"
					size="icon"
					type="button"
					onClick={() => invokeAction("toggle-play")}
					className="size-8"
				>
					{isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
				</Button>

				<Button
					variant="text"
					size="icon"
					type="button"
					onClick={() => setIsRecordingOpen(true)}
					title="Record Video"
					className="text-red-500 hover:text-red-600 size-8"
				>
					<Disc fill="currentColor" className="size-4" />
				</Button>
			</div>

			{/* Right controls: Quality, Ratio, Zoom, Fullscreen */}
			<div className="flex items-center gap-2">
				{/* Quality Selector */}
				<Popover>
					<PopoverTrigger asChild>
						<Button variant="text" size="sm" className="h-8 gap-1 px-2 font-normal text-muted-foreground hover:text-foreground">
							{(() => {
								const Option = QUALITY_OPTIONS.find(q => q.value === quality);
								const Icon = Option?.Icon || QualityIconFull;
								return (
									<>
										<Icon className="size-4" />
										<span className="sr-only">{Option?.label || "Quality"}</span>
									</>
								);
							})()}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-64 p-1" align="start" side="top">
						<div className="space-y-1">
							{QUALITY_OPTIONS.map((option) => (
								<button
									key={option.value}
									className={cn(
										"flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
										quality === option.value && "bg-accent text-accent-foreground"
									)}
									onClick={() => onQualityChange(option.value)}
								>
									<div className="flex w-full items-center justify-between">
										<div className="flex items-center gap-2">
											<option.Icon className="size-4" />
											<span className="font-medium">{option.label}</span>
										</div>
										{quality === option.value && <Check className="size-3" />}
									</div>
									<span className="text-xs text-muted-foreground text-left pl-6">{option.description}</span>
								</button>
							))}
						</div>
					</PopoverContent>
				</Popover>

				{/* Ratio Selector */}
				<Popover>
					<Tooltip>
						<TooltipTrigger asChild>
							<PopoverTrigger asChild>
								<Button variant="text" size="sm" className="h-8 w-8 px-0 font-normal text-muted-foreground hover:text-foreground">
									<Proportions className="size-4" />
								</Button>
							</PopoverTrigger>
						</TooltipTrigger>
						<TooltipContent side="top">Aspect Ratio</TooltipContent>
					</Tooltip>
					<PopoverContent className="w-56 p-1" align="center" side="top">
						<div className="space-y-1">
							<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
								Project Aspect Ratio
							</div>
							{RATIO_OPTIONS.map((option) => (
								<button
									key={option.label}
									className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
									onClick={() => {
										if (activeProject) {
											editor.project.updateSettings({
												settings: {
													canvasSize: {
														width: option.width,
														height: option.height,
													},
												},
											});
										}
									}}
								>
									<option.Icon className="size-4 text-muted-foreground" />
									<span>{option.label}</span>
								</button>
							))}
						</div>
					</PopoverContent>
				</Popover>

				{/* Export Frame Button */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="text"
							size="sm"
							type="button"
							onClick={handleExportFrame}
							title="Export current frame"
							className="h-8 w-8"
						>
							<Camera className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top">Export Frame</TooltipContent>
				</Tooltip>

				{/* Zoom Control */}
				<Popover>
					<PopoverTrigger asChild>
						<Button variant="text" size="sm" className="h-8 gap-1 px-2 font-normal text-muted-foreground hover:text-foreground min-w-[3rem]">
							{Math.round(zoom * 100)}%
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-64 p-4" align="center" side="top">
						<div className="flex items-center gap-4">
							<Button
								variant="ghost"
								size="icon"
								className="size-6 shrink-0"
								onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
							>
								<div className="h-0.5 w-3 bg-current" />
							</Button>
							<Slider
								value={[zoom]}
								min={0.1}
								max={5}
								step={0.1}
								onValueChange={([value]) => onZoomChange(value)}
								className="flex-1"
							/>
							<Button
								variant="ghost"
								size="icon"
								className="size-6 shrink-0"
								onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}
							>
								<div className="h-3 w-3 relative">
									<div className="absolute inset-0 m-auto h-0.5 w-full bg-current" />
									<div className="absolute inset-0 m-auto w-0.5 h-full bg-current" />
								</div>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="size-6 shrink-0"
								title="Reset Zoom"
								onClick={() => onZoomChange(1)}
							>
								<RotateCcw className="size-3" />
							</Button>
						</div>
						<div className="mt-4 grid grid-cols-4 gap-2">
							{[0.25, 0.5, 1, 2].map((value) => (
								<Button
									key={value}
									variant="outline"
									size="sm"
									className={cn("h-7 text-xs", zoom === value && "border-primary")}
									onClick={() => onZoomChange(value)}
								>
									{value * 100}%
								</Button>
							))}
						</div>
					</PopoverContent>
				</Popover>

				<Button
					variant="text"
					size="icon"
					type="button"
					onClick={onToggleFullscreen}
					title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
					className="h-8 w-8"
				>
					<Maximize2 className="size-4" />
				</Button>
			</div>

			<RecordingDialog
				isOpen={isRecordingOpen}
				onClose={() => setIsRecordingOpen(false)}
				mode="video"
				onSave={handleSaveRecording}
			/>
		</div>
	);
}

function PreviewCanvas({ zoom = 1, quality = 1 }: { zoom?: number; quality?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const lastFrameRef = useRef(-1);
	const lastSceneRef = useRef<RootNode | null>(null);
	const renderingRef = useRef(false);
	const { width: nativeWidth, height: nativeHeight } = usePreviewSize();
	const containerSize = useContainerSize({ containerRef });
	const editor = useEditor();
	const activeProject = editor.project.getActive();

	const renderer = useMemo(() => {
		return new CanvasRenderer({
			width: nativeWidth * quality,
			height: nativeHeight * quality,
			fps: activeProject.settings.fps,
		});
	}, [nativeWidth, nativeHeight, activeProject.settings.fps, quality]);

	const displaySize = useMemo(() => {
		if (
			!nativeWidth ||
			!nativeHeight ||
			containerSize.width === 0 ||
			containerSize.height === 0
		) {
			return { width: nativeWidth ?? 0, height: nativeHeight ?? 0 };
		}

		const paddingBuffer = 4;
		const availableWidth = containerSize.width - paddingBuffer;
		const availableHeight = containerSize.height - paddingBuffer;

		const aspectRatio = nativeWidth / nativeHeight;
		const containerAspect = availableWidth / availableHeight;

		const displayWidth =
			containerAspect > aspectRatio
				? availableHeight * aspectRatio
				: availableWidth;
		const displayHeight =
			containerAspect > aspectRatio
				? availableHeight
				: availableWidth / aspectRatio;

		return { width: displayWidth * zoom, height: displayHeight * zoom };
	}, [nativeWidth, nativeHeight, containerSize.width, containerSize.height, zoom]);

	const renderTree = editor.renderer.getRenderTree();

	const render = useCallback(() => {
		if (canvasRef.current && renderTree && !renderingRef.current) {
			const time = editor.playback.getCurrentTime();
			const lastFrameTime = getLastFrameTime({
				duration: renderTree.duration,
				fps: renderer.fps,
			});
			const renderTime = Math.min(time, lastFrameTime);
			const frame = Math.floor(renderTime * renderer.fps);

			if (
				frame !== lastFrameRef.current ||
				renderTree !== lastSceneRef.current
			) {
				renderingRef.current = true;
				lastSceneRef.current = renderTree;
				lastFrameRef.current = frame;
				renderer
					.renderToCanvas({
						node: renderTree,
						time: renderTime,
						targetCanvas: canvasRef.current,
					})
					.then(() => {
						renderingRef.current = false;
					});
			}
		}
	}, [renderer, renderTree, editor.playback]);

	useRafLoop(render);

	return (
		<div
			ref={containerRef}
			className="relative flex min-h-full min-w-full items-center justify-center"
		>
			<canvas
				data-preview-canvas
				ref={canvasRef}
				width={nativeWidth}
				height={nativeHeight}
				className="block border"
				style={{
					width: displaySize.width,
					height: displaySize.height,
					background:
						activeProject.settings.background.type === "blur"
							? "transparent"
							: activeProject?.settings.background.color,
					transform: "translate3d(0, 0, 0)", // Force hardware acceleration
				}}
			/>
			<PreviewInteractionOverlay canvasRef={canvasRef} />
		</div>
	);
}
