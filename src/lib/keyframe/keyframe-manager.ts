/**
 * Keyframe Manager — CRUD utility functions
 *
 * All functions are pure (immutable): they return new KeyframeData arrays.
 * The UI calls `editor.timeline.updateElements()` with the result.
 */

import type { Keyframe, KeyframeData, KeyframeEasing, KeyframeTrack } from "@/types/keyframe";
import type { TimelineElement, Transform } from "@/types/timeline";
import { evaluateKeyframeTrack } from "./keyframe-engine";

// ---- ID generation ----

let keyframeCounter = 0;

/** Generate a short, unique keyframe ID. */
function generateKeyframeId(): string {
    return `kf_${Date.now().toString(36)}_${(keyframeCounter++).toString(36)}`;
}

// ---- Property path helpers ----

/**
 * Read a numeric value from an element using a dot-notation property path.
 * Returns `undefined` if the path doesn't resolve to a number.
 */
export function getStaticPropertyValue(
    element: TimelineElement,
    property: string,
): number | undefined {
    // Fast-path common properties
    switch (property) {
        case "opacity":
            return "opacity" in element ? (element as { opacity: number }).opacity : undefined;
        case "transform.position.x":
            return "transform" in element ? (element as { transform: Transform }).transform.position.x : undefined;
        case "transform.position.y":
            return "transform" in element ? (element as { transform: Transform }).transform.position.y : undefined;
        case "transform.scale":
            return "transform" in element ? (element as { transform: Transform }).transform.scale : undefined;
        case "transform.rotate":
            return "transform" in element ? (element as { transform: Transform }).transform.rotate : undefined;
        default:
            return undefined;
    }
}

// ---- Track helpers ----

/** Find a track for a given property, or undefined. */
function findTrack(keyframes: KeyframeData, property: string): KeyframeTrack | undefined {
    return keyframes.find((t) => t.property === property);
}

/** Find a keyframe at the exact time (within 0.001s tolerance). */
function findKeyframeAtTime(track: KeyframeTrack, time: number): Keyframe | undefined {
    return track.keyframes.find((kf) => Math.abs(kf.time - time) < 0.001);
}

// ---- CRUD Operations ----

/**
 * Add a keyframe to a specific property track.
 * If a keyframe already exists at the same time (±0.001s), it is updated instead.
 * Returns a new KeyframeData array.
 */
export function addKeyframe(
    keyframes: KeyframeData | undefined,
    property: string,
    time: number,
    value: number,
    easing: KeyframeEasing = "ease-in-out",
): KeyframeData {
    const data = keyframes ? [...keyframes] : [];

    const trackIndex = data.findIndex((t) => t.property === property);
    if (trackIndex === -1) {
        // Create a new track
        data.push({
            property,
            keyframes: [{ id: generateKeyframeId(), time, value, easing }],
        });
        return data;
    }

    // Clone track
    const track = { ...data[trackIndex], keyframes: [...data[trackIndex].keyframes] };
    data[trackIndex] = track;

    // Check if a keyframe exists at this time
    const existingIdx = track.keyframes.findIndex((kf) => Math.abs(kf.time - time) < 0.001);
    if (existingIdx >= 0) {
        // Update it
        track.keyframes[existingIdx] = { ...track.keyframes[existingIdx], value, easing };
    } else {
        // Insert in sorted order
        const kf: Keyframe = { id: generateKeyframeId(), time, value, easing };
        const insertIdx = track.keyframes.findIndex((k) => k.time > time);
        if (insertIdx === -1) {
            track.keyframes.push(kf);
        } else {
            track.keyframes.splice(insertIdx, 0, kf);
        }
    }

    return data;
}

/**
 * Remove a keyframe by its ID.
 * If the track becomes empty, the track itself is also removed.
 */
export function removeKeyframe(
    keyframes: KeyframeData,
    keyframeId: string,
): KeyframeData {
    return keyframes
        .map((track) => {
            const filtered = track.keyframes.filter((kf) => kf.id !== keyframeId);
            if (filtered.length === track.keyframes.length) return track; // No change
            return { ...track, keyframes: filtered };
        })
        .filter((track) => track.keyframes.length > 0);
}

/**
 * Update a keyframe's time, value, or easing.
 * Maintains sorted order within the track.
 */
export function updateKeyframe(
    keyframes: KeyframeData,
    keyframeId: string,
    updates: Partial<Pick<Keyframe, "time" | "value" | "easing">>,
): KeyframeData {
    return keyframes.map((track) => {
        const idx = track.keyframes.findIndex((kf) => kf.id === keyframeId);
        if (idx === -1) return track;

        const newKeyframes = [...track.keyframes];
        newKeyframes[idx] = { ...newKeyframes[idx], ...updates };

        // Re-sort by time if time was updated
        if (updates.time !== undefined) {
            newKeyframes.sort((a, b) => a.time - b.time);
        }

        return { ...track, keyframes: newKeyframes };
    });
}

/**
 * Get the current value of a property at a given time.
 * Reads from keyframes if they exist, otherwise returns the static value.
 *
 * @param time - Time relative to clip start (0 = clip start)
 */
export function getPropertyValueAtTime(
    element: TimelineElement,
    property: string,
    time: number,
): number | undefined {
    const keyframes = "keyframes" in element ? (element as { keyframes?: KeyframeData }).keyframes : undefined;
    if (keyframes) {
        const track = findTrack(keyframes, property);
        if (track && track.keyframes.length > 0) {
            return evaluateKeyframeTrack(track, time);
        }
    }
    return getStaticPropertyValue(element, property);
}

/**
 * Toggle a keyframe at the current time:
 *  - If a keyframe exists at this time → remove it
 *  - If no keyframe exists → add one with the current resolved value
 *
 * @param time - Time relative to clip start (0 = clip start)
 */
export function toggleKeyframeAtTime(
    keyframes: KeyframeData | undefined,
    element: TimelineElement,
    property: string,
    time: number,
): KeyframeData {
    const data = keyframes ?? [];
    const track = findTrack(data, property);

    if (track) {
        const existing = findKeyframeAtTime(track, time);
        if (existing) {
            // Remove the existing keyframe
            return removeKeyframe(data, existing.id);
        }
    }

    // Add a new keyframe with the current resolved value
    const currentValue = getPropertyValueAtTime(element, property, time) ?? 0;
    return addKeyframe(data, property, time, currentValue);
}

/**
 * Check if a property has any keyframes.
 */
export function hasKeyframesForProperty(
    keyframes: KeyframeData | undefined,
    property: string,
): boolean {
    if (!keyframes) return false;
    const track = findTrack(keyframes, property);
    return !!track && track.keyframes.length > 0;
}

/**
 * Check if a keyframe exists at a specific time for a property.
 */
export function hasKeyframeAtTime(
    keyframes: KeyframeData | undefined,
    property: string,
    time: number,
): boolean {
    if (!keyframes) return false;
    const track = findTrack(keyframes, property);
    if (!track) return false;
    return !!findKeyframeAtTime(track, time);
}

/**
 * Get all keyframe times across all tracks (de-duplicated and sorted).
 * Useful for rendering diamond markers on the timeline.
 */
export function getAllKeyframeTimes(keyframes: KeyframeData | undefined): number[] {
    if (!keyframes) return [];
    const timeSet = new Set<number>();
    for (const track of keyframes) {
        for (const kf of track.keyframes) {
            timeSet.add(kf.time);
        }
    }
    return [...timeSet].sort((a, b) => a - b);
}

/**
 * Navigate between keyframes on a track: returns the time of the
 * previous/next keyframe relative to the current time.
 * Returns `undefined` if there is no previous/next keyframe.
 */
export function getAdjacentKeyframeTime(
    keyframes: KeyframeData | undefined,
    property: string,
    currentTime: number,
    direction: "prev" | "next",
): number | undefined {
    if (!keyframes) return undefined;
    const track = findTrack(keyframes, property);
    if (!track || track.keyframes.length === 0) return undefined;

    if (direction === "prev") {
        for (let i = track.keyframes.length - 1; i >= 0; i--) {
            if (track.keyframes[i].time < currentTime - 0.001) {
                return track.keyframes[i].time;
            }
        }
    } else {
        for (const kf of track.keyframes) {
            if (kf.time > currentTime + 0.001) {
                return kf.time;
            }
        }
    }

    return undefined;
}
