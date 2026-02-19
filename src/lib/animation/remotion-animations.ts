/**
 * Animation utilities adapted from Remotion's spring and interpolate functions.
 * These provide physics-based animations for the Prawn video editor.
 * 
 * @see https://www.remotion.dev/docs/spring
 * @see https://www.remotion.dev/docs/interpolate
 */

// Spring configuration options
export interface SpringConfig {
  /** Controls the damping of the spring. Higher = less oscillation. Default: 10 */
  damping?: number;
  /** Controls the stiffness of the spring. Higher = snappier. Default: 100 */
  stiffness?: number;
  /** The weight of the spring. Higher = slower animation. Default: 1 */
  mass?: number;
  /** Whether to clamp the overshoot. Default: false */
  overshootClamping?: boolean;
}

// Animation easing functions
export type EasingFunction = (t: number) => number;

/**
 * Easing functions for smooth animations.
 * Ported from Remotion's easing module.
 */
export const Easing = {
  /** Linear easing - no acceleration */
  linear: (t: number): number => t,

  /** Quadratic ease-in - accelerates from zero */
  easeIn: (t: number): number => t * t,

  /** Quadratic ease-out - decelerates to zero */
  easeOut: (t: number): number => 1 - (1 - t) * (1 - t),

  /** Quadratic ease-in-out - acceleration until halfway, then deceleration */
  easeInOut: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  /** Smooth step easing */
  ease: (t: number): number => t * t * (3 - 2 * t),

  /** Cubic bezier easing */
  bezier: (x1: number, y1: number, x2: number, y2: number): EasingFunction => {
    return (t: number): number => {
      // Cubic bezier implementation
      // Use binary search to find t for given x, then calculate y
      let start = 0;
      let end = 1;
      let mid = t;

      // Binary search for the parameter that gives us x = t
      for (let i = 0; i < 8; i++) {
        const x = cubicBezier(mid, x1, x2);
        if (Math.abs(x - t) < 0.001) break;
        if (x < t) {
          start = mid;
        } else {
          end = mid;
        }
        mid = (start + end) / 2;
      }

      return cubicBezierY(mid, y1, y2);
    };
  },
};

/**
 * Helper function for cubic bezier calculation (x coordinate)
 */
function cubicBezier(t: number, x1: number, x2: number): number {
  return 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
}

/**
 * Helper function for cubic bezier calculation (y coordinate)
 */
function cubicBezierY(t: number, y1: number, y2: number): number {
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
}

/**
 * Spring physics calculation adapted from Remotion.
 * Creates a natural, physics-based animation.
 * 
 * @param frame - Current frame number
 * @param fps - Frames per second
 * @param config - Spring configuration options
 * @param from - Starting value (default: 0)
 * @param to - Ending value (default: 1)
 * @returns The spring-animated value between from and to
 * 
 * @example
 * ```ts
 * const value = spring({
 *   frame: 30,
 *   fps: 30,
 *   config: { damping: 12, stiffness: 100 }
 * });
 * // Returns a value from 0 to 1 with spring physics
 * ```
 */
export function spring({
  frame,
  fps,
  config = {},
  from = 0,
  to = 1,
}: {
  frame: number;
  fps: number;
  config?: SpringConfig;
  from?: number;
  to?: number;
}): number {
  const { damping = 10, stiffness = 100, mass = 1, overshootClamping = false } = config;

  // If frame is 0 or negative, return the starting value
  if (frame <= 0) {
    return from;
  }

  // Calculate duration based on spring parameters
  // Using the formula for underdamped harmonic oscillator
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  // Time in seconds
  const t = frame / fps;

  // Calculate spring value
  let value: number;

  if (zeta < 1) {
    // Underdamped - oscillates
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omega * t);
    value = 1 - decay * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t));
  } else if (zeta === 1) {
    // Critically damped
    const decay = Math.exp(-omega * t);
    value = 1 - decay * (1 + omega * t);
  } else {
    // Overdamped
    const r1 = -omega * (zeta - Math.sqrt(zeta * zeta - 1));
    const r2 = -omega * (zeta + Math.sqrt(zeta * zeta - 1));
    const c2 = (1 - r1) / (r2 - r1);
    const c1 = 1 - c2;
    value = 1 - (c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t));
  }

  // Clamp overshoot if needed
  if (overshootClamping) {
    value = Math.max(0, Math.min(1, value));
  }

  // Map to output range
  return from + (to - from) * value;
}

/**
 * Interpolation options
 */
interface InterpolateOptions {
  /** How to handle values outside the input range on the left. Default: 'clamp' */
  extrapolateLeft?: 'clamp' | 'identity' | 'extend';
  /** How to handle values outside the input range on the right. Default: 'clamp' */
  extrapolateRight?: 'clamp' | 'identity' | 'extend';
  /** Easing function to apply to the input. Default: linear */
  easing?: EasingFunction;
}

/**
 * Interpolates a value from an input range to an output range.
 * Ported from Remotion's interpolate function.
 * 
 * @param input - The input value to interpolate
 * @param inputRange - Array of input values (must be monotonically increasing)
 * @param outputRange - Array of output values (same length as inputRange)
 * @param options - Interpolation options
 * @returns The interpolated value
 * 
 * @example
 * ```ts
 * // Map frame 0-30 to opacity 0-1
 * const opacity = interpolate(frame, [0, 30], [0, 1], {
 *   extrapolateRight: 'clamp'
 * });
 * ```
 */
export function interpolate(
  input: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options?: InterpolateOptions
): number {
  const {
    extrapolateLeft = 'clamp',
    extrapolateRight = 'clamp',
    easing = Easing.linear,
  } = options || {};

  // Validate input
  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length');
  }

  if (inputRange.length < 2) {
    throw new Error('inputRange must have at least 2 elements');
  }

  // Check monotonicity
  for (let i = 1; i < inputRange.length; i++) {
    if (inputRange[i] <= inputRange[i - 1]) {
      throw new Error('inputRange must be monotonically increasing');
    }
  }

  // Handle extrapolation
  if (input < inputRange[0]) {
    if (extrapolateLeft === 'identity') {
      return input;
    }
    if (extrapolateLeft === 'extend') {
      return linearInterpolate(
        input,
        inputRange[0],
        inputRange[1],
        outputRange[0],
        outputRange[1],
        easing
      );
    }
    // clamp
    return outputRange[0];
  }

  if (input > inputRange[inputRange.length - 1]) {
    if (extrapolateRight === 'identity') {
      return input;
    }
    if (extrapolateRight === 'extend') {
      return linearInterpolate(
        input,
        inputRange[inputRange.length - 2],
        inputRange[inputRange.length - 1],
        outputRange[outputRange.length - 2],
        outputRange[outputRange.length - 1],
        easing
      );
    }
    // clamp
    return outputRange[outputRange.length - 1];
  }

  // Find the segment
  for (let i = 1; i < inputRange.length; i++) {
    if (input <= inputRange[i]) {
      return linearInterpolate(
        input,
        inputRange[i - 1],
        inputRange[i],
        outputRange[i - 1],
        outputRange[i],
        easing
      );
    }
  }

  // Should never reach here
  return outputRange[outputRange.length - 1];
}

/**
 * Linear interpolation helper with easing
 */
function linearInterpolate(
  input: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  easing: EasingFunction
): number {
  // Calculate progress (0-1)
  const progress = (input - inMin) / (inMax - inMin);
  // Apply easing
  const easedProgress = easing(progress);
  // Map to output
  return outMin + (outMax - outMin) * easedProgress;
}

/**
 * Predefined spring configurations for common use cases
 */
export const SpringPresets = {
  /** Snappy, quick animation */
  snappy: { damping: 20, stiffness: 300, mass: 1 } as SpringConfig,
  
  /** Gentle, smooth animation */
  gentle: { damping: 15, stiffness: 80, mass: 1 } as SpringConfig,
  
  /** Bouncy, playful animation */
  bouncy: { damping: 8, stiffness: 150, mass: 0.5 } as SpringConfig,
  
  /** Slow, dramatic animation */
  slow: { damping: 20, stiffness: 50, mass: 2 } as SpringConfig,
  
  /** Quick with no overshoot */
  quick: { damping: 30, stiffness: 400, mass: 1, overshootClamping: true } as SpringConfig,
  
  /** Default Remotion spring */
  default: { damping: 10, stiffness: 100, mass: 1 } as SpringConfig,
} as const;

/**
 * Calculate the duration of a spring animation in frames.
 * Useful for determining when a spring animation is "done".
 * 
 * @param config - Spring configuration
 * @param fps - Frames per second
 * @param threshold - Value threshold to consider "done" (default: 0.001)
 * @returns Duration in frames
 */
export function measureSpring({
  config = {},
  fps,
  threshold = 0.001,
}: {
  config?: SpringConfig;
  fps: number;
  threshold?: number;
}): number {
  const { damping = 10, stiffness = 100, mass = 1 } = config;
  
  // Estimate duration based on settling time
  // For underdamped systems, settling time ≈ 4/(zeta * omega)
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  
  if (zeta < 1) {
    // Underdamped - use settling time formula
    const settlingTime = 4 / (zeta * omega);
    return Math.ceil(settlingTime * fps);
  }
  
  // Critically damped or overdamped
  const settlingTime = 6 / omega;
  return Math.ceil(settlingTime * fps);
}
