// ---- Keyframe Animation System ----

/** Easing function type for keyframe interpolation */
export type KeyframeEasing =
    | "linear"
    | "ease-in"
    | "ease-out"
    | "ease-in-out"
    | "step";

/** A single keyframe: value at a specific time offset within the clip */
export interface Keyframe {
    /** Unique ID for this keyframe */
    id: string;
    /** Time offset from clip start in seconds (0 = clip start) */
    time: number;
    /** The property value at this keyframe */
    value: number;
    /**
     * Easing function to use when interpolating TO the NEXT keyframe.
     * Ignored on the last keyframe. Default: "ease-in-out"
     */
    easing: KeyframeEasing;
}

/** A track of keyframes for a single property */
export interface KeyframeTrack {
    /**
     * Dot-notation property path, e.g.:
     * - "opacity"
     * - "transform.position.x"
     * - "transform.scale"
     * - "transform.rotate"
     */
    property: string;
    /** Sorted array of keyframes (ascending by time) */
    keyframes: Keyframe[];
}

/**
 * Array of keyframe tracks stored on each element that supports keyframes.
 * Each track controls a single property.
 */
export type KeyframeData = KeyframeTrack[];
