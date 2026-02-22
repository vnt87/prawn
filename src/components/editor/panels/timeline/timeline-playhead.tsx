"use client";

import { useRef } from "react";
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";
import { useTimelinePlayhead } from "@/hooks/timeline/use-timeline-playhead";
import { useEditor } from "@/hooks/use-editor";

interface TimelinePlayheadProps {
	zoomLevel: number;
	rulerRef: React.RefObject<HTMLDivElement | null>;
	rulerScrollRef: React.RefObject<HTMLDivElement | null>;
	tracksScrollRef: React.RefObject<HTMLDivElement | null>;
	timelineRef: React.RefObject<HTMLDivElement | null>;
	playheadRef?: React.RefObject<HTMLDivElement | null>;
	isSnappingToPlayhead?: boolean;
}

export function TimelinePlayhead({
	zoomLevel,
	rulerRef,
	rulerScrollRef,
	tracksScrollRef,
	timelineRef,
	playheadRef: externalPlayheadRef,
	isSnappingToPlayhead = false,
}: TimelinePlayheadProps) {
	const editor = useEditor();
	const duration = editor.timeline.getTotalDuration();
	const internalPlayheadRef = useRef<HTMLDivElement>(null);
	const playheadRef = externalPlayheadRef || internalPlayheadRef;

	const { playheadPosition, handlePlayheadMouseDown } = useTimelinePlayhead({
		zoomLevel,
		rulerRef,
		rulerScrollRef,
		tracksScrollRef,
		playheadRef,
	});

	const scrollContainer = tracksScrollRef.current;
	const visibleHeight = scrollContainer?.clientHeight ?? 400;
	const fullScrollHeight = scrollContainer?.scrollHeight ?? visibleHeight;
	// Use the full scrollable height so playhead spans all tracks even when scrolling
	const totalHeight = Math.max(visibleHeight, fullScrollHeight);

	const timelinePosition =
		playheadPosition * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
	const leftPosition = timelinePosition;

	const handlePlayheadKeyDown = (
		event: React.KeyboardEvent<HTMLDivElement>,
	) => {
		if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

		event.preventDefault();
		const step = 1 / Math.max(1, editor.project.getActive().settings.fps);
		const direction = event.key === "ArrowRight" ? 1 : -1;
		const nextTime = Math.max(
			0,
			Math.min(duration, playheadPosition + direction * step),
		);

		editor.playback.seek({ time: nextTime });
	};

	return (
		<>
			{/* Playhead line - spans the full scrollable height */}
			<div
				ref={playheadRef}
				role="slider"
				aria-label="Timeline playhead"
				aria-valuemin={0}
				aria-valuemax={duration}
				aria-valuenow={playheadPosition}
				tabIndex={0}
				className="pointer-events-auto absolute z-60"
				style={{
					left: `${leftPosition}px`,
					top: 0,
					height: `${totalHeight}px`,
					width: "2px",
				}}
				onMouseDown={handlePlayheadMouseDown}
				onKeyDown={handlePlayheadKeyDown}
			>
				<div className="bg-foreground absolute left-0 h-full w-0.5 cursor-col-resize" />
			</div>
		</>
	);
}

/**
 * PlayheadTip - Renders the diamond-shaped playhead tip.
 * This should be rendered inside the sticky header area so it stays visible when scrolling.
 */
export function TimelinePlayheadTip({
	playheadPosition,
	zoomLevel,
	isSnappingToPlayhead = false,
}: {
	playheadPosition: number;
	zoomLevel: number;
	isSnappingToPlayhead?: boolean;
}) {
	const timelinePosition =
		playheadPosition * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
	const leftPosition = timelinePosition;

	return (
		<div
			className="pointer-events-none absolute z-70"
			style={{
				left: `${leftPosition}px`,
				top: "6px",
			}}
		>
			{/* Diamond-shaped playhead tip */}
			<div
				className={`size-2.5 -translate-x-1/2 rotate-45 transform border shadow-sm ${
					isSnappingToPlayhead
						? "bg-foreground border-foreground"
						: "bg-foreground border-foreground/50"
				}`}
			/>
		</div>
	);
}
