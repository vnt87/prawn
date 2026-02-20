"use client";

import type { KeyframeData } from "@/types/keyframe";
import type { TimelineElement } from "@/types/timeline";
import { hasKeyframeAtTime, hasKeyframesForProperty, toggleKeyframeAtTime, getAdjacentKeyframeTime } from "@/lib/keyframe/keyframe-manager";
import { Diamond, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/ui";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface KeyframeToggleButtonProps {
    /** The timeline element this keyframe belongs to */
    element: TimelineElement;
    /** The property path, e.g. "opacity", "transform.scale" */
    property: string;
    /** Current playhead time relative to the clip start (0 = clip start) */
    relativeTime: number;
    /** Callback to update keyframes on the element */
    onKeyframesChange: (newKeyframes: KeyframeData) => void;
    /** Callback to seek to a specific relative time */
    onSeekToRelativeTime?: (time: number) => void;
    /** Whether to show prev/next navigation arrows */
    showNav?: boolean;
}

/**
 * A diamond-shaped toggle button placed next to each keyframeable property.
 *
 * States:
 *  - Empty outline: no keyframe at current time, no keyframes at all
 *  - Outlined with dot: has keyframes on this property, but not at current time
 *  - Filled: keyframe exists at current time
 */
export function KeyframeToggleButton({
    element,
    property,
    relativeTime,
    onKeyframesChange,
    onSeekToRelativeTime,
    showNav = true,
}: KeyframeToggleButtonProps) {
    const keyframes = "keyframes" in element ? (element as { keyframes?: KeyframeData }).keyframes : undefined;

    const hasAtTime = hasKeyframeAtTime(keyframes, property, relativeTime);
    const hasAny = hasKeyframesForProperty(keyframes, property);

    const handleToggle = () => {
        const newKeyframes = toggleKeyframeAtTime(keyframes, element, property, relativeTime);
        onKeyframesChange(newKeyframes);
    };

    const handlePrev = () => {
        const prevTime = getAdjacentKeyframeTime(keyframes, property, relativeTime, "prev");
        if (prevTime !== undefined && onSeekToRelativeTime) {
            onSeekToRelativeTime(prevTime);
        }
    };

    const handleNext = () => {
        const nextTime = getAdjacentKeyframeTime(keyframes, property, relativeTime, "next");
        if (nextTime !== undefined && onSeekToRelativeTime) {
            onSeekToRelativeTime(nextTime);
        }
    };

    const prevTime = getAdjacentKeyframeTime(keyframes, property, relativeTime, "prev");
    const nextTime = getAdjacentKeyframeTime(keyframes, property, relativeTime, "next");

    return (
        <div className="flex items-center gap-0.5">
            {/* Previous keyframe arrow */}
            {showNav && hasAny && (
                <button
                    type="button"
                    className={cn(
                        "size-4 flex items-center justify-center rounded hover:bg-secondary transition-colors",
                        prevTime === undefined && "opacity-30 pointer-events-none",
                    )}
                    onClick={handlePrev}
                    disabled={prevTime === undefined}
                    title="Previous keyframe"
                >
                    <ChevronLeft className="size-2.5 text-muted-foreground" />
                </button>
            )}

            {/* Diamond toggle */}
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "size-5 flex items-center justify-center rounded transition-colors",
                                "hover:bg-secondary/80",
                                hasAtTime && "text-amber-400",
                                !hasAtTime && hasAny && "text-amber-400/50",
                                !hasAtTime && !hasAny && "text-muted-foreground/50 hover:text-muted-foreground",
                            )}
                            onClick={handleToggle}
                            title={hasAtTime ? "Remove keyframe" : "Add keyframe"}
                        >
                            <Diamond
                                className="size-2.5"
                                fill={hasAtTime ? "currentColor" : "none"}
                                strokeWidth={hasAtTime ? 0 : 2}
                            />
                            {/* Dot indicator: has keyframes but not at current time */}
                            {!hasAtTime && hasAny && (
                                <div className="absolute bottom-0 right-0.5 size-1 rounded-full bg-amber-400/60" />
                            )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[11px]">
                        {hasAtTime ? "Remove keyframe" : "Add keyframe"}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Next keyframe arrow */}
            {showNav && hasAny && (
                <button
                    type="button"
                    className={cn(
                        "size-4 flex items-center justify-center rounded hover:bg-secondary transition-colors",
                        nextTime === undefined && "opacity-30 pointer-events-none",
                    )}
                    onClick={handleNext}
                    disabled={nextTime === undefined}
                    title="Next keyframe"
                >
                    <ChevronRight className="size-2.5 text-muted-foreground" />
                </button>
            )}
        </div>
    );
}
