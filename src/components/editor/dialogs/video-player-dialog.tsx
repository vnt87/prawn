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
	buildVideoElement,
} from "@/lib/timeline/element-utils";
import { formatTimeCode } from "@/lib/time";
import {
	Play,
	Pause,
	Volume2,
	VolumeX,
	SkipBack,
	SkipForward,
	ArrowDownToLine,
	ArrowUpFromLine,
	ChevronRight,
} from "lucide-react";

/**
 * Video player dialog with clip marking functionality.
 * Features:
 * - Play/pause, seek, volume controls
 * - Mark In/Out points for clip selection
 * - Visual indicators for in/out points above the seeker
 * - Add clipped segment to timeline
 * - Keyboard shortcuts
 */
export function VideoPlayerDialog() {
	const { asset, clipRegion, closePreview, setInPoint, setOutPoint } = useAssetPreviewStore();
	const editor = useEditor();
	const videoRef = useRef<HTMLVideoElement>(null);
	
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [isSeeking, setIsSeeking] = useState(false);

	// Initialize video element
	useEffect(() => {
		const video = videoRef.current;
		if (!video || !asset?.url) return;

		video.src = asset.url;
		video.load();

		const handleLoadedMetadata = () => {
			setDuration(video.duration);
		};

		const handleTimeUpdate = () => {
			if (!isSeeking) {
				setCurrentTime(video.currentTime);
			}
		};

		const handleEnded = () => {
			setIsPlaying(false);
		};

		const handlePlay = () => setIsPlaying(true);
		const handlePause = () => setIsPlaying(false);

		video.addEventListener("loadedmetadata", handleLoadedMetadata);
		video.addEventListener("timeupdate", handleTimeUpdate);
		video.addEventListener("ended", handleEnded);
		video.addEventListener("play", handlePlay);
		video.addEventListener("pause", handlePause);

		return () => {
			video.removeEventListener("loadedmetadata", handleLoadedMetadata);
			video.removeEventListener("timeupdate", handleTimeUpdate);
			video.removeEventListener("ended", handleEnded);
			video.removeEventListener("play", handlePlay);
			video.removeEventListener("pause", handlePause);
		};
	}, [asset?.url, isSeeking]);

	// Playback controls
	const togglePlay = useCallback(() => {
		const video = videoRef.current;
		if (!video) return;

		if (isPlaying) {
			video.pause();
		} else {
			video.play();
		}
	}, [isPlaying]);

	const seekTo = useCallback((time: number) => {
		const video = videoRef.current;
		if (!video) return;

		const clampedTime = Math.max(0, Math.min(time, duration));
		video.currentTime = clampedTime;
		setCurrentTime(clampedTime);
	}, [duration]);

	const handleSeek = useCallback(([value]: number[]) => {
		setIsSeeking(true);
		setCurrentTime(value);
	}, []);

	const handleSeekCommit = useCallback(([value]: number[]) => {
		seekTo(value);
		setIsSeeking(false);
	}, [seekTo]);

	const skipBackward = useCallback(() => {
		seekTo(currentTime - 5);
	}, [currentTime, seekTo]);

	const skipForward = useCallback(() => {
		seekTo(currentTime + 5);
	}, [currentTime, seekTo]);

	const toggleMute = useCallback(() => {
		const video = videoRef.current;
		if (!video) return;

		video.muted = !isMuted;
		setIsMuted(!isMuted);
	}, [isMuted]);

	const handleVolumeChange = useCallback(([value]: number[]) => {
		const video = videoRef.current;
		if (!video) return;

		video.volume = value;
		setVolume(value);
		setIsMuted(value === 0);
	}, []);

	// Clip marking
	const handleSetInPoint = useCallback(() => {
		setInPoint(currentTime);
	}, [currentTime, setInPoint]);

	const handleSetOutPoint = useCallback(() => {
		setOutPoint(currentTime);
	}, [currentTime, setOutPoint]);

	// Add clipped segment to timeline
	const handleAddToTimeline = useCallback(() => {
		if (!asset || !clipRegion) return;

		const startTime = editor.playback.getCurrentTime();
		const clipDuration = clipRegion.outPoint - clipRegion.inPoint;

		const element = buildVideoElement({
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
			if (!asset || asset.type !== "video") return;

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
				case "i":
				case "I":
					handleSetInPoint();
					break;
				case "o":
				case "O":
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

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [asset, togglePlay, skipBackward, skipForward, handleSetInPoint, handleSetOutPoint, toggleMute, closePreview]);

	if (!asset || asset.type !== "video") return null;

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
	const inPointPercent = clipRegion ? (clipRegion.inPoint / duration) * 100 : null;
	const outPointPercent = clipRegion ? (clipRegion.outPoint / duration) * 100 : null;

	return (
		<div className="flex h-full w-full flex-col bg-black/95 rounded-lg overflow-hidden">
			{/* Filename label - top left */}
			<div className="absolute top-4 left-4 z-10 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm">
				<span className="text-sm text-white font-medium">{asset.name}</span>
				{asset.width && asset.height && (
					<span className="text-white/60 ml-2 text-xs">
						({asset.width} × {asset.height}
						{asset.fps && ` @ ${asset.fps}fps`})
					</span>
				)}
			</div>

			{/* Video container */}
			<div className="relative flex flex-1 items-center justify-center">
				<video
					ref={videoRef}
					className="max-h-[60vh] max-w-[95%]"
					onClick={togglePlay}
					playsInline
				/>

				{/* Play/pause overlay */}
				{!isPlaying && (
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<div className="rounded-full bg-black/50 p-4 backdrop-blur-sm">
							<Play className="size-12 text-white" fill="white" />
						</div>
					</div>
				)}
			</div>

			{/* Controls */}
			<div className="flex flex-col gap-2 p-4 pt-2">
				{/* In/Out point markers above seeker */}
				<div className="relative h-4 mx-2">
					{/* In point marker */}
					{inPointPercent !== null && (
						<Tooltip>
							<TooltipTrigger asChild>
								<div
									className="absolute bottom-0 flex flex-col items-center cursor-pointer"
									style={{ left: `${inPointPercent}%`, transform: "translateX(-50%)" }}
								>
									<div className="text-[10px] text-white/80 font-mono mb-0.5">
										In
									</div>
									<ArrowDownToLine className="size-3 text-primary" />
								</div>
							</TooltipTrigger>
							<TooltipContent side="top" className="font-mono">
								In: {formatTimeCode({ timeInSeconds: clipRegion!.inPoint, format: "HH:MM:SS:CS" })}
							</TooltipContent>
						</Tooltip>
					)}

					{/* Out point marker */}
					{outPointPercent !== null && (
						<Tooltip>
							<TooltipTrigger asChild>
								<div
									className="absolute bottom-0 flex flex-col items-center cursor-pointer"
									style={{ left: `${outPointPercent}%`, transform: "translateX(-50%)" }}
								>
									<div className="text-[10px] text-white/80 font-mono mb-0.5">
										Out
									</div>
									<ArrowDownToLine className="size-3 text-destructive" />
								</div>
							</TooltipTrigger>
							<TooltipContent side="top" className="font-mono">
								Out: {formatTimeCode({ timeInSeconds: clipRegion!.outPoint, format: "HH:MM:SS:CS" })}
							</TooltipContent>
						</Tooltip>
					)}
				</div>

				{/* Timeline / Seekbar */}
				<div className="relative">
					{/* Clip region indicator */}
					{clipRegion && (
						<div
							className="absolute top-0 h-full bg-primary/30 rounded"
							style={{
								left: `${inPointPercent}%`,
								width: `${(outPointPercent as number) - (inPointPercent as number)}%`,
							}}
						/>
					)}

					<Slider
						value={[currentTime]}
						min={0}
						max={duration || 100}
						step={0.01}
						onValueChange={handleSeek}
						onValueCommit={handleSeekCommit}
						className="relative z-10"
					/>
				</div>

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
							<TooltipContent side="top">{isMuted ? "Unmute" : "Mute"} (M)</TooltipContent>
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
							<TooltipContent side="top">Back 5s (←)</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-11 text-white hover:bg-white/20"
									onClick={togglePlay}
								>
									{isPlaying ? (
										<Pause className="size-6" fill="currentColor" />
									) : (
										<Play className="size-6" fill="currentColor" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">{isPlaying ? "Pause" : "Play"} (Space)</TooltipContent>
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
							<TooltipContent side="top">Forward 5s (→)</TooltipContent>
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
									<ArrowDownToLine className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">Mark In (I)</TooltipContent>
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
									<ArrowUpFromLine className="size-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">Mark Out (O)</TooltipContent>
						</Tooltip>

						{/* Clip duration indicator */}
						{clipRegion && (
							<span className="text-xs text-white/60 ml-2 font-mono">
								{formatTimeCode({ timeInSeconds: clipRegion.outPoint - clipRegion.inPoint, format: "HH:MM:SS:CS" })}
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
									<ChevronRight className="size-4" />
									Add to Timeline
								</Button>
							</TooltipTrigger>
							<TooltipContent side="top">
								{clipRegion ? `Add clip to timeline` : "Mark In and Out points first"}
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>
		</div>
	);
}