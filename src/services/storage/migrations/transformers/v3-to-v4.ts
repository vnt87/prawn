import type { ProjectRecord } from "./types";

/**
 * v3 → v4: Keyframe animation support.
 *
 * No actual data transformation needed — existing projects simply don't have
 * `keyframes` fields on their elements, and the code uses optional chaining (`?.`)
 * to handle this gracefully. This migration only bumps the version number.
 */
export function transformProjectV3ToV4({ project }: { project: ProjectRecord }): {
    project: ProjectRecord;
    skipped: boolean;
    reason?: string;
} {
    return {
        project: { ...project, version: 4 },
        skipped: false,
    };
}
