/**
 * Keyframe Interpolation Engine
 *
 * Pure-function engine that evaluates keyframe tracks at a given time.
 * Uses binary search for efficient keyframe lookup and supports multiple
 * easing functions for smooth interpolation.
 */

import type { KeyframeData, KeyframeEasing, KeyframeTrack } from "@/types/keyframe";
import type { Transform } from "@/types/timeline";
import { Easing } from "@/lib/animation/remotion-animations";

// ---- Easing Helpers ----

/** Map a KeyframeEasing name to a (0→1) → (0→1) easing function. */
function getEasingFn(easing: KeyframeEasing): (t: number) => number {
    switch (easing) {
        case "linear":
            return Easing.linear;
        case "ease-in":
            return Easing.easeIn;
        case "ease-out":
            return Easing.easeOut;
        case "ease-in-out":
            return Easing.easeInOut;
        case "step":
            return () => 0; // Hold left value until the next keyframe
        default:
            return Easing.easeInOut;
    }
}

// ---- Core Evaluation ----

/**
 * Evaluate a single keyframe track at a given time.
 * Returns the interpolated value, or `undefined` if the track has no keyframes.
 *
 * Behavior:
 *  - Before first keyframe → holds first keyframe value
 *  - After last keyframe  → holds last keyframe value
 *  - Between keyframes    → interpolates using the LEFT keyframe's easing
 */
export function evaluateKeyframeTrack(
    track: KeyframeTrack,
    time: number,
): number | undefined {
    const { keyframes } = track;
    if (!keyframes || keyframes.length === 0) return undefined;

    // Single keyframe — constant value
    if (keyframes.length === 1) return keyframes[0].value;

    // Before first keyframe
    if (time <= keyframes[0].time) return keyframes[0].value;

    // After last keyframe
    const last = keyframes[keyframes.length - 1];
    if (time >= last.time) return last.value;

    // Binary search for the segment (find rightmost keyframe whose time <= time)
    let lo = 0;
    let hi = keyframes.length - 1;
    while (lo < hi - 1) {
        const mid = (lo + hi) >>> 1;
        if (keyframes[mid].time <= time) {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    const kfLeft = keyframes[lo];
    const kfRight = keyframes[hi];

    // "step" easing: hold the left value
    if (kfLeft.easing === "step") {
        return kfLeft.value;
    }

    // Calculate normalised progress (0→1) between the two keyframes
    const span = kfRight.time - kfLeft.time;
    if (span <= 0) return kfLeft.value;

    const t = (time - kfLeft.time) / span;
    const easedT = getEasingFn(kfLeft.easing)(t);

    // Linear interpolation in value space
    return kfLeft.value + (kfRight.value - kfLeft.value) * easedT;
}

/**
 * Evaluate all keyframe tracks and return a flat map of
 * `property path → interpolated value`.
 *
 * Only properties that have keyframes are included in the result.
 *
 * @example
 * ```ts
 * const values = evaluateKeyframes(element.keyframes, 1.5);
 * // { "opacity": 0.5, "transform.position.x": 120 }
 * ```
 */
export function evaluateKeyframes(
    keyframes: KeyframeData,
    time: number,
): Record<string, number> {
    const result: Record<string, number> = {};

    for (const track of keyframes) {
        const value = evaluateKeyframeTrack(track, time);
        if (value !== undefined) {
            result[track.property] = value;
        }
    }

    return result;
}

/**
 * Apply evaluated keyframe values to an element's transform and opacity,
 * producing resolved values for the renderer.
 *
 * Uses the static element values as the base and overlays any
 * keyframe-interpolated values on top.
 */
export function applyKeyframesToVisualParams(
    baseTransform: Transform,
    baseOpacity: number,
    keyframeValues: Record<string, number>,
): { transform: Transform; opacity: number } {
    // Start with a shallow copy of the base transform
    const transform: Transform = {
        scale: keyframeValues["transform.scale"] ?? baseTransform.scale,
        position: {
            x: keyframeValues["transform.position.x"] ?? baseTransform.position.x,
            y: keyframeValues["transform.position.y"] ?? baseTransform.position.y,
        },
        rotate: keyframeValues["transform.rotate"] ?? baseTransform.rotate,
        flipX: baseTransform.flipX,
        flipY: baseTransform.flipY,
    };

    const opacity = keyframeValues["opacity"] ?? baseOpacity;

    return { transform, opacity };
}
