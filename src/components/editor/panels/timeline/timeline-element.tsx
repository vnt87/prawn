"use client";

import { useEditor } from "@/hooks/use-editor";
import { useAssetsPanelStore } from "@/stores/assets-panel-store";
import AudioWaveform from "./audio-waveform";
import { DockedWaveform } from "./docked-waveform";
import { useTimelineElementResize } from "@/hooks/timeline/element/use-element-resize";
import type { SnapPoint } from "@/hooks/timeline/use-timeline-snapping";
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";
import {
	getTrackClasses,
	getTrackHeight,
	canElementHaveAudio,
	canElementBeHidden,
	hasMediaId,
} from "@/lib/timeline";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "../../../ui/context-menu";
import type {
	TimelineElement as TimelineElementType,
	TimelineTrack,
	ElementDragState,
} from "@/types/timeline";
import type { MediaAsset } from "@/types/assets";
import { mediaSupportsAudio } from "@/lib/media/media-utils";
import { getActionDefinition, type TAction, invokeAction } from "@/lib/actions";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import Image from "next/image";
import { Snowflake, Rewind, Copy, Trash2, Scissors, Eye, EyeOff, Volume2, VolumeX, SplitSquareHorizontal, FastForward } from "lucide-react";
import { uppercase } from "@/utils/string";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

function getDisplayShortcut(action: TAction) {
	const { defaultShortcuts } = getActionDefinition(action);
	if (!defaultShortcuts?.length) {
		return "";
	}

	return uppercase({
		string: defaultShortcuts[0].replace("+", " "),
	});
}

interface TimelineElementProps {
	element: TimelineElementType;
	track: TimelineTrack;
	zoomLevel: number;
	isSelected: boolean;
	onSnapPointChange?: (snapPoint: SnapPoint | null) => void;
	onResizeStateChange?: (params: { isResizing: boolean }) => void;
	onElementMouseDown: (
		e: React.MouseEvent,
		element: TimelineElementType,
	) => void;
	onElementClick: (e: React.MouseEvent, element: TimelineElementType) => void;
	dragState: ElementDragState;
}

export function TimelineElement({
	element,
	track,
	zoomLevel,
	isSelected,
	onSnapPointChange,
	onResizeStateChange,
	onElementMouseDown,
	onElementClick,
	dragState,
}: TimelineElementProps) {
	const { t } = useTranslation();
	const editor = useEditor();
	const { selectedElements } = useElementSelection();
	const { requestRevealMedia } = useAssetsPanelStore();

	const mediaAssets = editor.media.getAssets();
	let mediaAsset: MediaAsset | null = null;

	if (hasMediaId(element)) {
		mediaAsset =
			mediaAssets.find((asset) => asset.id === element.mediaId) ?? null;
	}

	const hasAudio = mediaSupportsAudio({ media: mediaAsset });

	const { handleResizeStart, isResizing, currentStartTime, currentDuration } =
		useTimelineElementResize({
			element,
			track,
			zoomLevel,
			onSnapPointChange,
			onResizeStateChange,
		});

	const isCurrentElementSelected = selectedElements.some(
		(selected) =>
			selected.elementId === element.id && selected.trackId === track.id,
	);

	const isBeingDragged = dragState.elementId === element.id;
	const dragOffsetY =
		isBeingDragged && dragState.isDragging
			? dragState.currentMouseY - dragState.startMouseY
			: 0;
	const elementStartTime =
		isBeingDragged && dragState.isDragging
			? dragState.currentTime
			: element.startTime;
	const displayedStartTime = isResizing ? currentStartTime : elementStartTime;
	const displayedDuration = isResizing ? currentDuration : element.duration;
	const elementWidth =
		displayedDuration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
	const elementLeft = displayedStartTime * 50 * zoomLevel;

	const handleRevealInMedia = ({ event }: { event: React.MouseEvent }) => {
		event.stopPropagation();
		if (hasMediaId(element)) {
			requestRevealMedia(element.mediaId);
		}
	};

	const isMuted = canElementHaveAudio(element) && element.muted === true;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					className={`absolute top-0 h-full select-none ${isBeingDragged ? "z-30" : "z-10"
						}`}
					style={{
						left: `${elementLeft}px`,
						width: `${elementWidth}px`,
						transform:
							isBeingDragged && dragState.isDragging
								? `translate3d(0, ${dragOffsetY}px, 0)`
								: undefined,
					}}
				>
					<ElementInner
						element={element}
						track={track}
						isSelected={isSelected}
						isBeingDragged={isBeingDragged}
						hasAudio={hasAudio}
						isMuted={isMuted}
						mediaAssets={mediaAssets}
						onElementClick={onElementClick}
						onElementMouseDown={onElementMouseDown}
						handleResizeStart={handleResizeStart}
						zoomLevel={zoomLevel}
					/>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className="z-200 w-64">
				<ActionMenuItem
					action="split"
					icon={<Scissors className="size-4" />}
				>
					{t("timeline.contextMenu.split")}
				</ActionMenuItem>
				<CopyMenuItem />
				{canElementHaveAudio(element) && hasAudio && (
					<MuteMenuItem
						isMultipleSelected={selectedElements.length > 1}
						isCurrentElementSelected={isCurrentElementSelected}
						isMuted={isMuted}
					/>
				)}
				{canElementBeHidden(element) && (
					<VisibilityMenuItem
						element={element}
						isMultipleSelected={selectedElements.length > 1}
						isCurrentElementSelected={isCurrentElementSelected}
					/>
				)}
				{selectedElements.length === 1 && (
					<ActionMenuItem
						action="duplicate-selected"
						icon={<Copy className="size-4" />}
					>
						{t("timeline.contextMenu.duplicate")}
					</ActionMenuItem>
				)}
				{/* Video-specific options: Reverse, Freeze Frame, and Separate Audio */}
				{element.type === "video" && hasAudio && (
					<ActionMenuItem
						action="separate-audio"
						icon={<SplitSquareHorizontal className="size-4" />}
					>
						{t("timeline.contextMenu.separateAudio")}
					</ActionMenuItem>
				)}
				{element.type === "video" && (
					<>
						<ActionMenuItem
							action="toggle-reverse-selected"
							icon={<Rewind className="size-4" />}
						>
							{(element as any).reversed ? t("timeline.contextMenu.removeReverse") : t("timeline.contextMenu.reversePlayback")}
						</ActionMenuItem>
						<ActionMenuItem
							action="freeze-frame"
							icon={<Snowflake className="size-4" />}
						>
							{t("timeline.contextMenu.freezeFrame")}
						</ActionMenuItem>
					</>
				)}
				<ContextMenuSeparator />
				<DeleteMenuItem
					isMultipleSelected={selectedElements.length > 1}
					isCurrentElementSelected={isCurrentElementSelected}
					elementType={element.type}
					selectedCount={selectedElements.length}
				/>
			</ContextMenuContent>
		</ContextMenu>
	);
}

function ElementInner({
	element,
	track,
	isSelected,
	isBeingDragged,
	hasAudio,
	isMuted,
	mediaAssets,
	onElementClick,
	onElementMouseDown,
	handleResizeStart,
	zoomLevel,
}: {
	element: TimelineElementType;
	track: TimelineTrack;
	isSelected: boolean;
	isBeingDragged: boolean;
	hasAudio: boolean;
	isMuted: boolean;
	mediaAssets: MediaAsset[];
	onElementClick: (e: React.MouseEvent, element: TimelineElementType) => void;
	onElementMouseDown: (
		e: React.MouseEvent,
		element: TimelineElementType,
	) => void;
	handleResizeStart: (params: {
		e: React.MouseEvent;
		elementId: string;
		side: "left" | "right";
	}) => void;
	zoomLevel: number;
}) {
	return (
		<div
			className={`relative h-full cursor-pointer overflow-hidden rounded-[0.5rem] ${getTrackClasses(
				{
					type: track.type,
				},
			)} ${isBeingDragged ? "z-30" : "z-10"} ${canElementBeHidden(element) && element.hidden ? "opacity-50" : ""}`}
		>
			<button
				type="button"
				className="absolute inset-0 size-full cursor-pointer"
				onClick={(e) => onElementClick(e, element)}
				onMouseDown={(e) => onElementMouseDown(e, element)}
			>
				<div className="absolute inset-0 flex h-full items-center">
					<ElementContent
						element={element}
						track={track}
						isSelected={isSelected}
						mediaAssets={mediaAssets}
						zoomLevel={zoomLevel}
					/>
				</div>

				{(hasAudio
					? isMuted
					: canElementBeHidden(element) && element.hidden) && (
						<div className="bg-opacity-50 pointer-events-none absolute inset-0 flex items-center justify-center bg-black">
							{hasAudio ? (
								<Volume2
									className="size-6 text-white"
								/>
							) : (
								<VolumeX
									className="size-6 text-white"
								/>
							)}
						</div>
					)}
			</button>

			{isSelected && (
				<>
					<ResizeHandle
						side="left"
						elementId={element.id}
						handleResizeStart={handleResizeStart}
					/>
					<ResizeHandle
						side="right"
						elementId={element.id}
						handleResizeStart={handleResizeStart}
					/>
				</>
			)}
		</div>
	);
}

function ResizeHandle({
	side,
	elementId,
	handleResizeStart,
}: {
	side: "left" | "right";
	elementId: string;
	handleResizeStart: (params: {
		e: React.MouseEvent;
		elementId: string;
		side: "left" | "right";
	}) => void;
}) {
	const isLeft = side === "left";
	return (
		<button
			type="button"
			className={`bg-primary absolute top-0 bottom-0 z-50 flex w-[0.6rem] items-center justify-center ${isLeft ? "left-0 cursor-w-resize" : "right-0 cursor-e-resize"}`}
			onMouseDown={(e) => handleResizeStart({ e, elementId, side })}
			aria-label={`${isLeft ? "Left" : "Right"} resize handle`}
		>
			<div className="bg-foreground h-[1.5rem] w-[0.2rem] rounded-full" />
		</button>
	);
}

function ElementContent({
	element,
	track,
	isSelected,
	mediaAssets,
	zoomLevel,
}: {
	element: TimelineElementType;
	track: TimelineTrack;
	isSelected: boolean;
	mediaAssets: MediaAsset[];
	zoomLevel: number;
}) {
	if (element.type === "text") {
		return (
			<div className="flex size-full items-center justify-start pl-2">
				<span className="truncate text-xs text-white">{element.content}</span>
			</div>
		);
	}

	if (element.type === "sticker") {
		return (
			<div className="flex size-full items-center gap-2 pl-2">
				<Image
					src={`https://api.iconify.design/${element.iconName}.svg?width=20&height=20`}
					alt={element.name}
					className="size-5 shrink-0"
					width={20}
					height={20}
					unoptimized
				/>
				<span className="truncate text-xs text-white">{element.name}</span>
			</div>
		);
	}

	if (element.type === "audio") {
		const audioBuffer =
			element.sourceType === "library" ? element.buffer : undefined;

		const audioUrl =
			element.sourceType === "library"
				? element.sourceUrl
				: mediaAssets.find((asset) => asset.id === element.mediaId)?.url;

		if (audioBuffer || audioUrl) {
			return (
				<div className="flex size-full items-center gap-2">
					<div className="min-w-0 flex-1">
						<AudioWaveform
							audioBuffer={audioBuffer}
							audioUrl={audioUrl}
							height={24}
							className="w-full"
						/>
					</div>
				</div>
			);
		}

		return (
			<span className="text-foreground/80 truncate text-xs">
				{element.name}
			</span>
		);
	}

	const mediaAsset = mediaAssets.find((asset) => asset.id === element.mediaId);
	if (!mediaAsset) {
		return (
			<span className="text-foreground/80 truncate text-xs">
				{element.name}
			</span>
		);
	}

	// Check if this video has audio waveform peaks for docked waveform
	const hasAudioWaveform =
		mediaAsset.type === "video" &&
		mediaAsset.audioWaveformPeaks &&
		mediaAsset.audioWaveformPeaks.length > 0;

	// Get the muted state for video elements
	const isVideoMuted = element.type === "video" && element.muted === true;

	if (
		mediaAsset.type === "image" ||
		(mediaAsset.type === "video" && mediaAsset.thumbnailUrl)
	) {
		const trackHeight = getTrackHeight({ type: track.type });
		const tileWidth = trackHeight * (16 / 9);
		const imageUrl =
			mediaAsset.type === "image" ? mediaAsset.url : mediaAsset.thumbnailUrl;

		// Calculate thumbnail section height - leave room for waveform if video has audio
		const waveformHeight = hasAudioWaveform ? 20 : 0;
		const thumbnailHeight = hasAudioWaveform
			? `calc(100% - ${waveformHeight}px)`
			: "100%";

		return (
			<div className="flex size-full flex-col overflow-hidden">
				{/* Thumbnails section */}
				<div
					className="relative overflow-hidden"
					style={{ height: thumbnailHeight }}
				>
					<div
						className={`relative size-full ${isSelected ? "bg-primary" : "bg-transparent"}`}
					>
						{mediaAsset.filmstripThumbnails &&
							mediaAsset.filmstripThumbnails.length > 0 ? (
							<div
								className="absolute w-full h-full overflow-hidden pointer-events-none"
								style={{
									top: isSelected ? "0.25rem" : "0rem",
									bottom: isSelected ? "0.25rem" : "0rem",
									height: isSelected ? "calc(100% - 0.5rem)" : "100%",
								}}
							>
								{(() => {
									const interval = mediaAsset.filmstripInterval ?? 1;

									// Calculate available height for thumbnails (subtracting waveform if present)
									const availableHeight = hasAudioWaveform
										? trackHeight - 20 - (isSelected ? 8 : 0)
										: trackHeight - (isSelected ? 8 : 0);

									// Video aspect ratio for thumbnail sizing
									const videoAspectRatio = mediaAsset.width && mediaAsset.height
										? mediaAsset.width / mediaAsset.height
										: 16 / 9;

									// Fixed thumbnail size based on track height (never stretches with zoom)
									const thumbnailWidth = availableHeight * videoAspectRatio;

									// Pixels per second at current zoom level
									const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;

									// Calculate visible time range for this element
									const trimStartOffset = element.trimStart;
									const elementDuration = element.duration;

									// Calculate which thumbnails we need to render
									// Start from the first thumbnail that could be visible
									const firstThumbnailIndex = Math.max(0, Math.floor(trimStartOffset / interval));

									// End at the last thumbnail that could be visible
									const lastThumbnailIndex = Math.min(
										mediaAsset.filmstripThumbnails.length - 1,
										Math.ceil((trimStartOffset + elementDuration) / interval)
									);

									// Build visible thumbnails array
									const visibleThumbnails: React.ReactElement[] = [];

									for (let index = firstThumbnailIndex; index <= lastThumbnailIndex; index++) {
										const thumbnail = mediaAsset.filmstripThumbnails[index];
										if (!thumbnail) continue;

										// Position thumbnail at its time offset
										const thumbnailTime = index * interval;
										const leftPosition = (thumbnailTime - trimStartOffset) * pixelsPerSecond;

										// If zoomed in, we may need to repeat the thumbnail to fill gaps
										// Calculate how many times this thumbnail should repeat
										const intervalWidth = interval * pixelsPerSecond;
										const repeatCount = Math.max(1, Math.ceil(intervalWidth / thumbnailWidth));

										// Render thumbnail(s) for this interval
										for (let repeat = 0; repeat < repeatCount; repeat++) {
											const repeatLeftPosition = leftPosition + (repeat * thumbnailWidth);

											// Skip if outside visible bounds
											if (repeatLeftPosition > elementDuration * pixelsPerSecond + thumbnailWidth) continue;
											if (repeatLeftPosition + thumbnailWidth < -thumbnailWidth) continue;

											visibleThumbnails.push(
												<img
													key={`${index}-${repeat}`}
													src={thumbnail}
													alt={`Thumbnail ${index}`}
													className="absolute pointer-events-none select-none"
													style={{
														position: "absolute",
														left: `${repeatLeftPosition}px`,
														width: `${thumbnailWidth}px`,
														height: `${availableHeight}px`,
														objectFit: "cover",
														objectPosition: "center",
													}}
													draggable={false}
												/>
											);
										}
									}

									return visibleThumbnails;
								})()}
							</div>
						) : (
							<div
								className="absolute right-0 left-0"
								style={{
									backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
									backgroundRepeat: "repeat-x",
									backgroundSize: `${tileWidth}px ${trackHeight}px`,
									backgroundPosition: "left center",
									pointerEvents: "none",
									top: isSelected ? "0.25rem" : "0rem",
									bottom: isSelected ? "0.25rem" : "0rem",
								}}
							/>
						)}
					</div>
				</div>

				{/* Docked audio waveform section - only for videos with audio */}
				{hasAudioWaveform && (
					<div
						className="absolute bottom-0 left-0 right-0 bg-black/40 border-t border-white/5"
						style={{ height: `${waveformHeight}px` }}
					>
						<DockedWaveform
							peaks={mediaAsset.audioWaveformPeaks!}
							height={waveformHeight}
							muted={isVideoMuted}
							className="w-full h-full px-1"
						/>
					</div>
				)}

				{/* Reverse indicator for video elements */}
				{element.type === "video" && (element as any).reversed && (
					<div className="absolute top-1 right-1 bg-orange-500/80 rounded px-1 py-0.5 flex items-center gap-0.5 pointer-events-none">
						<Rewind className="size-3 text-white" />
						<span className="text-[10px] text-white font-medium">R</span>
					</div>
				)}
			</div>
		);
	}

	return (
		<span className="text-foreground/80 truncate text-xs">{element.name}</span>
	);
}

function CopyMenuItem() {
	const { t } = useTranslation();
	return (
		<ActionMenuItem
			action="copy-selected"
			icon={<Copy className="size-4" />}
		>
			{t("timeline.contextMenu.copy")}
		</ActionMenuItem>
	);
}

function MuteMenuItem({
	isMultipleSelected,
	isCurrentElementSelected,
	isMuted,
}: {
	isMultipleSelected: boolean;
	isCurrentElementSelected: boolean;
	isMuted: boolean;
}) {
	const { t } = useTranslation();
	const getIcon = () => {
		if (isMultipleSelected && isCurrentElementSelected) {
			return <VolumeX className="size-4" />;
		}
		return isMuted ? (
			<Volume2 className="size-4" />
		) : (
			<VolumeX className="size-4" />
		);
	};

	return (
		<ActionMenuItem action="toggle-elements-muted-selected" icon={getIcon()}>
			{isMuted ? t("timeline.contextMenu.unmute") : t("timeline.contextMenu.mute")}
		</ActionMenuItem>
	);
}

function VisibilityMenuItem({
	element,
	isMultipleSelected,
	isCurrentElementSelected,
}: {
	element: TimelineElementType;
	isMultipleSelected: boolean;
	isCurrentElementSelected: boolean;
}) {
	const { t } = useTranslation();
	const isHidden = canElementBeHidden(element) && element.hidden;

	const getIcon = () => {
		if (isMultipleSelected && isCurrentElementSelected) {
			return <EyeOff className="size-4" />;
		}
		return isHidden ? (
			<Eye className="size-4" />
		) : (
			<EyeOff className="size-4" />
		);
	};

	return (
		<ActionMenuItem
			action="toggle-elements-visibility-selected"
			icon={getIcon()}
		>
			{isHidden ? t("timeline.contextMenu.show") : t("timeline.contextMenu.hide")}
		</ActionMenuItem>
	);
}

function DeleteMenuItem({
	isMultipleSelected,
	isCurrentElementSelected,
	elementType,
	selectedCount,
}: {
	isMultipleSelected: boolean;
	isCurrentElementSelected: boolean;
	elementType: TimelineElementType["type"];
	selectedCount: number;
}) {
	const { t } = useTranslation();
	return (
		<ActionMenuItem
			action="delete-selected"
			variant="destructive"
			icon={<Trash2 className="size-4" />}
		>
			{isMultipleSelected && isCurrentElementSelected
				? t("timeline.contextMenu.deleteMultiple", { count: selectedCount })
				: t(elementType === "text" ? "timeline.contextMenu.deleteText" : "timeline.contextMenu.deleteClip")}
		</ActionMenuItem>
	);
}

function ActionMenuItem({
	action,
	children,
	...props
}: Omit<ComponentProps<typeof ContextMenuItem>, "onClick" | "textRight"> & {
	action: TAction;
}) {
	return (
		<ContextMenuItem
			onClick={(event) => {
				event.stopPropagation();
				invokeAction(action);
			}}
			textRight={getDisplayShortcut(action)}
			{...props}
		>
			{children}
		</ContextMenuItem>
	);
}
