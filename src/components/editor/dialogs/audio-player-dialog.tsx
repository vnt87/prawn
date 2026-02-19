"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAssetPreviewStore } from "@/stores/asset-preview-store";
import { useEditor } from "@/hooks/use-editor";
import {
	buildUploadAudioElement,
} from "@/lib/timeline/element-utils";
import { formatTimeCode } from "@/lib/time";
import { useTranslation } from "react-i18next";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import {
	Play,
	Pause,
	Volume2,
	VolumeX,
	SkipBack,
	SkipForward,
	ArrowRightFromLine,
	ArrowRightToLine,
	BetweenVerticalStart,
	Music,
} from "lucide-react";

/**
 * Audio player dialog with clip marking functionality.
 * Features:
 * - Waveform visualization with interactive region selection
 * - Play/pause, seek, volume controls
 * - Mark In/Out points for clip selection
 * - Add clipped segment to timeline
 * - Keyboard shortcuts
 */
export function AudioPlayerDialog() {
	const { asset, clipRegion, closePreview, setInPoint, setOutPoint } = useAssetPreviewStore();
	const editor = useEditor();
	const containerRef = useRef<HTMLDivElement>(null);
	const wavesurferRef = useRef<WaveSurfer | null>(null);
	const regionsRef = useRef<RegionsPlugin | null>(null);
	const { t } = useTranslation();
	
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	// Initialize WaveSurfer
	useEffect(() => {
		if (!containerRef.current || !asset?.url) return;

		// Create regions plugin
		const regions = RegionsPlugin.create();
		regionsRef.current = regions;

		// Create WaveSurfer instance
		const wavesurfer = WaveSurfer.create({
			container: containerRef.current,
			waveColor: "rgba(255, 255, 255, 0.3)",
			progressColor: "rgba(59, 130, 246, 0.8)",
			cursorColor: "#3b82f6",
			cursorWidth: 2,
			barWidth: 2,
			barGap: 1,
			barRadius: 2,
			height: 150,
			normalize: true,
			plugins: [regions],
		});

		wavesurferRef.current = wavesurfer;

		// Load audio
		wavesurfer.load(asset.url);

		// Event handlers
		wavesurfer.on("ready", () => {
			setDuration(wavesurfer.getDuration());
			setIsLoaded(true);
			
			// Create initial region for full clip
			if (asset.duration) {
				regions.addRegion({
					id: "clip-region",
					start: 0,
					end: asset.duration,
					color: "rgba(59, 130, 246, 0.3)",
					drag: false,
					resize: true,
				});
			}
		});

		wavesurfer.on("audioprocess", () => {
			setCurrentTime(wavesurfer.getCurrentTime());
		});

		wavesurfer.on("seeking", () => {
			setCurrentTime(wavesurfer.getCurrentTime());
		});

		wavesurfer.on("play", () => setIsPlaying(true));
		wavesurfer.on("pause", () => setIsPlaying(false));
		wavesurfer.on("finish", () => setIsPlaying(false));

		// Region update handler
		regions.on("region-updated", (region) => {
			if (region.id === "clip-region") {
				setInPoint(region.start);
				setOutPoint(region.end);
			}
		});

		// Set initial volume
		wavesurfer.setVolume(volume);

		return () => {
			wavesurfer.destroy();
			wavesurferRef.current = null;
			regionsRef.current = null;
		};
	}, [asset?.url]);

	// Playback controls
	const togglePlay = useCallback(() => {
		if (!wavesurferRef.current) return;
		wavesurferRef.current.playPause();
	}, []);

	const seekTo = useCallback((time: number) => {
		if (!wavesurferRef.current) return;
		wavesurferRef.current.seekTo(time / duration);
		setCurrentTime(time);
	}, [duration]);

	const skipBackward = useCallback(() => {
		seekTo(Math.max(0, currentTime - 5));
	}, [currentTime, seekTo]);

	const skipForward = useCallback(() => {
		seekTo(Math.min(duration, currentTime + 5));
	}, [currentTime, duration, seekTo]);

	const toggleMute = useCallback(() => {
		if (!wavesurferRef.current) return;
		const newMuted = !isMuted;
		wavesurferRef.current.setMuted(newMuted);
		setIsMuted(newMuted);
	}, [isMuted]);

	const handleVolumeChange = useCallback(([value]: number[]) => {
		if (!wavesurferRef.current) return;
		wavesurferRef.current.setVolume(value);
		setVolume(value);
		setIsMuted(value === 0);
	}, []);

	// Clip marking
	const handleSetInPoint = useCallback(() => {
		if (!regionsRef.current || !duration) return;
		
		setInPoint(currentTime);
		
		// Update region
		const existingRegion = regionsRef.current.getRegions().find(r => r.id === "clip-region");
		if (existingRegion) {
			existingRegion.setOptions({
				start: Math.min(currentTime, clipRegion?.outPoint || duration),
			});
		}
	}, [currentTime, duration, clipRegion, setInPoint]);

	const handleSetOutPoint = useCallback(() => {
		if (!regionsRef.current || !duration) return;
		
		setOutPoint(currentTime);
		
		// Update region
		const existingRegion = regionsRef.current.getRegions().find(r => r.id === "clip-region");
		if (existingRegion) {
			existingRegion.setOptions({
				end: Math.max(currentTime, clipRegion?.inPoint || 0),
			});
		}
	}, [currentTime, duration, clipRegion, setOutPoint]);

	// Add clipped segment to timeline
	const handleAddToTimeline = useCallback(async () => {
		if (!asset || !clipRegion) return;

		const startTime = editor.playback.getCurrentTime();
		const clipDuration = clipRegion.outPoint - clipRegion.inPoint;

		const element = buildUploadAudioElement({
			mediaId: asset.id,
			name: asset.name,
			duration: clipDuration,
			startTime,
		});

		// Add trim information
		element.trimStart = clipRegion.inPoint;
		element.trimEnd = asset.duration! - clipRegion.outPoint;

		editor.timeline.insertElement({
			element,
			placement: { mode: "auto" },
		});

		closePreview();
	}, [asset, clipRegion, editor, closePreview]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Stop the event from propagating to the main app
			e.stopImmediatePropagation();

			if (!asset || asset.type !== "audio") return;

			switch (e.key) {
				case " ":
					e.preventDefault();
					togglePlay();
					break;
				case "ArrowLeft":
					e.preventDefault();
					skipBackward();
					break;
				case "ArrowRight":
					e.preventDefault();
					skipForward();
					break;
				case "[":
					handleSetInPoint();
					break;
				case "]":
					handleSetOutPoint();
					break;
				case "m":
				case "M":
					toggleMute();
					break;
				case "Escape":
					closePreview();
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [asset, togglePlay, skipBackward, skipForward, handleSetInPoint, handleSetOutPoint, toggleMute, closePreview]);

	if (!asset || asset.type !== "audio") return null;

	return (
		<div className="flex h-full w-full flex-col bg-black/95 rounded-lg overflow-hidden">
			{/* Filename label - top left */}
			<div className="absolute top-4 left-4 z-10 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm">
				<span className="text-sm text-white font-medium">{asset.name}</span>
				{asset.duration && (
					<span className="text-white/60 ml-2 text-xs">
						{formatTimeCode({ timeInSeconds: asset.duration, format: "HH:MM:SS:CS" })}
					</span>
				)}
			</div>

			{/* Audio visualization container */}
			<div className="flex flex-1 min-h-0 flex-col items-center justify-center p-8">
				{/* Audio icon */}
				<div className="mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30">
					<Music className="size-10 text-white/80" />
				</div>

				{/* Waveform */}
				<div className="w-full max-w-4xl">
					<div 
						ref={containerRef} 
						className="min-h-[120px] w-full rounded-lg bg-white/5 p-4"
					/>
				</div>
			</div>

			{/* Controls */}
			<div className="flex flex-col gap-2 p-4 pt-2">
				{/* Time display */}
				<div className="flex items-center justify-between text-sm text-white px-1">
					<span className="font-mono">
						{formatTimeCode({ timeInSeconds: currentTime, format: "HH:MM:SS:CS" })}
					</span>
					<span className="font-mono text-white/60">
						/ {formatTimeCode({ timeInSeconds: duration, format: "HH:MM:SS:CS" })}
					</span>
				</div>

				{/* Control buttons */}
				<div className="flex items-center justify-center gap-6">
					{/* Left controls - Volume */}
					<div className="flex items-center gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-9 text-white hover:bg-white/20"
									onClick={toggleMute}
								>
									{isMuted || volume === 0 ? (
										<VolumeX className="size-5" />
									) : (
										<Volume2 className="size-5" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">{isMuted ? t("assetPreview.unmute") : t("assetPreview.mute")} (M)</TooltipContent>
						</Tooltip>

						<Slider
							value={[isMuted ? 0 : volume]}
							min={0}
							max={1}
							step={0.01}
							onValueChange={handleVolumeChange}
							className="w-20"
						/>
					</div>

					{/* Center controls - Playback and Mark In/Out */}
					<div className="flex items-center gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-9 text-white hover:bg-white/20"
									onClick={skipBackward}
								>
									<SkipBack className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">{t("assetPreview.back5s")} (←)</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-11 text-white hover:bg-white/20"
									onClick={togglePlay}
									disabled={!isLoaded}
								>
									{isPlaying ? (
										<Pause className="size-6" fill="currentColor" />
									) : (
										<Play className="size-6" fill="currentColor" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">{isPlaying ? t("assetPreview.pause") : t("assetPreview.play")} (Space)</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-9 text-white hover:bg-white/20"
									onClick={skipForward}
								>
									<SkipForward className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">{t("assetPreview.forward5s")} (→)</TooltipContent>
						</Tooltip>

						{/* Divider */}
						<div className="w-px h-6 bg-white/20 mx-2" />

						{/* Mark In */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-9 text-white hover:bg-white/20"
									onClick={handleSetInPoint}
								>
									<ArrowRightFromLine className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">{t("assetPreview.markIn")} ([)</TooltipContent>
						</Tooltip>

						{/* Mark Out */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-9 text-white hover:bg-white/20"
									onClick={handleSetOutPoint}
								>
									<ArrowRightToLine className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">{t("assetPreview.markOut")} (])</TooltipContent>
						</Tooltip>

						{/* Clip duration indicator */}
						{clipRegion && (
							<span className="text-xs text-white/60 ml-2 font-mono">
								{t("assetPreview.clipDuration")}: {formatTimeCode({ timeInSeconds: clipRegion.outPoint - clipRegion.inPoint, format: "HH:MM:SS:CS" })}
							</span>
						)}
					</div>

					{/* Right controls - Add to Timeline */}
					<div className="flex items-center">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="default"
									size="sm"
									className="gap-1.5"
									onClick={handleAddToTimeline}
									disabled={!clipRegion}
								>
									<BetweenVerticalStart className="size-4" />
									{t("assetPreview.addToTimeline")}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">
								{clipRegion ? t("assetPreview.addToTimelineTooltip") : t("assetPreview.markInAndOutFirst")}
							</TooltipContent>
						</Tooltip>
					</div>
				</div>

				{/* Instructions */}
				<div className="text-center text-xs text-white/40">
					{t("assetPreview.dragRegionToSelect")}
				</div>
			</div>
		</div>
	);
}