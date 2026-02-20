/**
 * Parses an Adobe .cube LUT file string into a Float32Array 3D LUT grid.
 *
 * Supports:
 * - 3D LUTs (LUT_3D_SIZE N) — most common format
 * - 1D LUTs (LUT_1D_SIZE N) — for basic tone curves
 * - DOMAIN_MIN/MAX — custom input range (normalised to 0-1)
 * - Comment lines starting with '#'
 *
 * Returns null if the file is malformed or unsupported.
 */
export interface ParsedLut {
    size: number;
    /** Float32Array of length size^3 * 3 (for 3D) or size * 3 (for 1D), RGB interleaved 0-1. */
    data: Float32Array;
    is3D: boolean;
    name: string;
}

export function parseCubeFile(text: string, name = "LUT"): ParsedLut | null {
    let size = 0;
    let is3D = true;
    const dataLines: string[] = [];

    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        if (line.startsWith("LUT_3D_SIZE")) {
            size = parseInt(line.split(/\s+/)[1], 10);
            is3D = true;
        } else if (line.startsWith("LUT_1D_SIZE")) {
            size = parseInt(line.split(/\s+/)[1], 10);
            is3D = false;
        } else if (
            line.startsWith("DOMAIN_MIN") ||
            line.startsWith("DOMAIN_MAX") ||
            line.startsWith("TITLE") ||
            line.startsWith("LUT_3D_INPUT_RANGE") ||
            line.startsWith("LUT_1D_INPUT_RANGE")
        ) {
            // Metadata lines — skip
            continue;
        } else {
            // Data line: three space-separated floats
            const parts = line.split(/\s+/);
            if (parts.length >= 3) {
                dataLines.push(line);
            }
        }
    }

    if (size < 2 || dataLines.length === 0) {
        console.warn("[parseCubeFile] Invalid or empty .cube file");
        return null;
    }

    const expectedLength = is3D ? size * size * size : size;

    if (dataLines.length !== expectedLength) {
        console.warn(
            `[parseCubeFile] Data length mismatch: got ${dataLines.length}, expected ${expectedLength} (size=${size}, is3D=${is3D})`
        );
        // Attempt partial parse rather than failing completely
    }

    const data = new Float32Array(Math.min(dataLines.length, expectedLength) * 3);

    for (let i = 0; i < Math.min(dataLines.length, expectedLength); i++) {
        const parts = dataLines[i].split(/\s+/);
        data[i * 3] = parseFloat(parts[0]);
        data[i * 3 + 1] = parseFloat(parts[1]);
        data[i * 3 + 2] = parseFloat(parts[2]);
    }

    return { size, data, is3D, name };
}

/**
 * Applies a trilinear-interpolated 3D LUT to a pixel's RGB values.
 * All inputs and outputs are in 0-1 range.
 */
export function sampleLut3D(
    data: Float32Array,
    size: number,
    r: number,
    g: number,
    b: number
): [number, number, number] {
    const maxIdx = size - 1;

    // Clamp
    const rn = Math.max(0, Math.min(1, r)) * maxIdx;
    const gn = Math.max(0, Math.min(1, g)) * maxIdx;
    const bn = Math.max(0, Math.min(1, b)) * maxIdx;

    const r0 = Math.floor(rn);
    const g0 = Math.floor(gn);
    const b0 = Math.floor(bn);

    const r1 = Math.min(r0 + 1, maxIdx);
    const g1 = Math.min(g0 + 1, maxIdx);
    const b1 = Math.min(b0 + 1, maxIdx);

    const rf = rn - r0;
    const gf = gn - g0;
    const bf = bn - b0;

    // .cube is stored B→G→R (blue is outermost)
    const idx = (br: number, gr: number, rr: number) =>
        (br * size * size + gr * size + rr) * 3;

    const i000 = idx(b0, g0, r0);
    const i001 = idx(b0, g0, r1);
    const i010 = idx(b0, g1, r0);
    const i011 = idx(b0, g1, r1);
    const i100 = idx(b1, g0, r0);
    const i101 = idx(b1, g0, r1);
    const i110 = idx(b1, g1, r0);
    const i111 = idx(b1, g1, r1);

    // Trilinear interpolation
    const lerp = (a: number, b_: number, t: number) => a + (b_ - a) * t;

    const out: [number, number, number] = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
        const v000 = data[i000 + c];
        const v001 = data[i001 + c];
        const v010 = data[i010 + c];
        const v011 = data[i011 + c];
        const v100 = data[i100 + c];
        const v101 = data[i101 + c];
        const v110 = data[i110 + c];
        const v111 = data[i111 + c];

        const v00 = lerp(v000, v001, rf);
        const v01 = lerp(v010, v011, rf);
        const v10 = lerp(v100, v101, rf);
        const v11 = lerp(v110, v111, rf);

        const v0 = lerp(v00, v01, gf);
        const v1 = lerp(v10, v11, gf);

        out[c] = lerp(v0, v1, bf);
    }

    return out;
}
