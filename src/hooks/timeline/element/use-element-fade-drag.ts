import { useState, useEffect, useRef, useCallback } from "react";
import type { TimelineElement, TimelineTrack } from "@/types/timeline";
import { EditorCore } from "@/core";
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";

interface FadeDragState {
    side: "left" | "right";
    startX: number;
    initialFadeIn: number;
    initialFadeOut: number;
    elementDuration: number;
}

interface UseElementFadeDragProps {
    element: TimelineElement;
    track: TimelineTrack;
    zoomLevel: number;
}

/**
 * Hook for handling drag-to-fade interaction on timeline elements.
 * When dragging the left fade handle, adjusts fadeIn duration.
 * When dragging the right fade handle, adjusts fadeOut duration.
 *
 * For video elements: sets both audio fade (fadeIn/fadeOut) and visual
 * animation (animationIn/animationOut with type "fade").
 * For audio elements: sets audio fade (fadeIn/fadeOut).
 */
export function useElementFadeDrag({
    element,
    track,
    zoomLevel,
}: UseElementFadeDragProps) {
    const editor = EditorCore.getInstance();

    const [fadeDrag, setFadeDrag] = useState<FadeDragState | null>(null);
    const [currentFadeIn, setCurrentFadeIn] = useState(0);
    const [currentFadeOut, setCurrentFadeOut] = useState(0);
    const currentFadeInRef = useRef(0);
    const currentFadeOutRef = useRef(0);

    // Read initial fade values from element
    const getElementFadeIn = useCallback((): number => {
        if (element.type === "video") return element.fadeIn ?? 0;
        if (element.type === "audio") return element.fadeIn ?? 0;
        if (element.type === "image") return element.animationIn?.type === "fade" ? element.animationIn.duration : 0;
        return 0;
    }, [element]);

    const getElementFadeOut = useCallback((): number => {
        if (element.type === "video") return element.fadeOut ?? 0;
        if (element.type === "audio") return element.fadeOut ?? 0;
        if (element.type === "image") return element.animationOut?.type === "fade" ? element.animationOut.duration : 0;
        return 0;
    }, [element]);

    const handleFadeStart = useCallback(
        (e: React.MouseEvent, side: "left" | "right") => {
            e.stopPropagation();
            e.preventDefault();

            const fadeIn = getElementFadeIn();
            const fadeOut = getElementFadeOut();

            setFadeDrag({
                side,
                startX: e.clientX,
                initialFadeIn: fadeIn,
                initialFadeOut: fadeOut,
                elementDuration: element.duration,
            });

            setCurrentFadeIn(fadeIn);
            setCurrentFadeOut(fadeOut);
            currentFadeInRef.current = fadeIn;
            currentFadeOutRef.current = fadeOut;
        },
        [element.duration, getElementFadeIn, getElementFadeOut],
    );

    const updateFadeFromMouseMove = useCallback(
        ({ clientX }: { clientX: number }) => {
            if (!fadeDrag) return;

            const deltaX = clientX - fadeDrag.startX;
            const deltaTime =
                deltaX / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel);

            // Max fade is half the element duration (so fadeIn + fadeOut can't overlap)
            const maxFade = fadeDrag.elementDuration / 2;

            if (fadeDrag.side === "left") {
                // Dragging right = increasing fade in
                const newFadeIn = Math.max(
                    0,
                    Math.min(maxFade, fadeDrag.initialFadeIn + deltaTime),
                );
                // Round to 1 decimal place
                const rounded = Math.round(newFadeIn * 10) / 10;
                setCurrentFadeIn(rounded);
                currentFadeInRef.current = rounded;

                // Live update (no history)
                applyFadeUpdate({
                    fadeIn: rounded,
                    fadeOut: currentFadeOutRef.current,
                    pushHistory: false,
                });
            } else {
                // Dragging left = increasing fade out (negative deltaX = more fade)
                const newFadeOut = Math.max(
                    0,
                    Math.min(maxFade, fadeDrag.initialFadeOut - deltaTime),
                );
                const rounded = Math.round(newFadeOut * 10) / 10;
                setCurrentFadeOut(rounded);
                currentFadeOutRef.current = rounded;

                // Live update (no history)
                applyFadeUpdate({
                    fadeIn: currentFadeInRef.current,
                    fadeOut: rounded,
                    pushHistory: false,
                });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [fadeDrag, zoomLevel],
    );

    const applyFadeUpdate = useCallback(
        ({
            fadeIn,
            fadeOut,
            pushHistory,
        }: {
            fadeIn: number;
            fadeOut: number;
            pushHistory: boolean;
        }) => {
            const trackId = track.id;
            const elementId = element.id;

            if (element.type === "video") {
                // Video: set audio fade + visual animation
                const updates: Record<string, unknown> = {
                    fadeIn,
                    fadeOut,
                };

                // Also set visual fade animation
                if (fadeIn > 0) {
                    updates.animationIn = {
                        type: "fade" as const,
                        duration: fadeIn,
                        easing: "ease-in-out" as const,
                    };
                } else {
                    updates.animationIn = undefined;
                }

                if (fadeOut > 0) {
                    updates.animationOut = {
                        type: "fade" as const,
                        duration: fadeOut,
                        easing: "ease-in-out" as const,
                    };
                } else {
                    updates.animationOut = undefined;
                }

                editor.timeline.updateElements({
                    updates: [{ trackId, elementId, updates }],
                    pushHistory,
                });
            } else if (element.type === "image") {
                // Image: visual animation only (no audio)
                const updates: Record<string, unknown> = {};

                if (fadeIn > 0) {
                    updates.animationIn = {
                        type: "fade" as const,
                        duration: fadeIn,
                        easing: "ease-in-out" as const,
                    };
                } else {
                    updates.animationIn = undefined;
                }

                if (fadeOut > 0) {
                    updates.animationOut = {
                        type: "fade" as const,
                        duration: fadeOut,
                        easing: "ease-in-out" as const,
                    };
                } else {
                    updates.animationOut = undefined;
                }

                editor.timeline.updateElements({
                    updates: [{ trackId, elementId, updates }],
                    pushHistory,
                });
            } else if (element.type === "audio") {
                // Audio: audio fade only
                editor.timeline.updateElements({
                    updates: [
                        {
                            trackId,
                            elementId,
                            updates: { fadeIn, fadeOut },
                        },
                    ],
                    pushHistory,
                });
            }
        },
        [editor.timeline, element.id, element.type, track.id],
    );

    const handleFadeEnd = useCallback(() => {
        if (!fadeDrag) return;

        // Commit to history
        applyFadeUpdate({
            fadeIn: currentFadeInRef.current,
            fadeOut: currentFadeOutRef.current,
            pushHistory: true,
        });

        setFadeDrag(null);
    }, [fadeDrag, applyFadeUpdate]);

    useEffect(() => {
        if (!fadeDrag) return;

        const handleDocumentMouseMove = ({ clientX }: MouseEvent) => {
            updateFadeFromMouseMove({ clientX });
        };

        const handleDocumentMouseUp = () => {
            handleFadeEnd();
        };

        document.addEventListener("mousemove", handleDocumentMouseMove);
        document.addEventListener("mouseup", handleDocumentMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleDocumentMouseMove);
            document.removeEventListener("mouseup", handleDocumentMouseUp);
        };
    }, [fadeDrag, handleFadeEnd, updateFadeFromMouseMove]);

    return {
        handleFadeStart,
        currentFadeIn: fadeDrag ? currentFadeIn : getElementFadeIn(),
        currentFadeOut: fadeDrag ? currentFadeOut : getElementFadeOut(),
        isFadeDragging: fadeDrag !== null,
    };
}
