/**
 * LutCache: singleton in-memory store for parsed 3D LUT data.
 *
 * Parsed LUTs are stored keyed by their asset ID. This avoids re-parsing
 * the .cube file on every render frame.
 */
import type { ParsedLut } from "@/lib/lut/cube-parser";

class LutCache {
    private cache = new Map<string, ParsedLut>();

    /** Store a parsed LUT by its asset ID. */
    set(id: string, lut: ParsedLut): void {
        this.cache.set(id, lut);
    }

    /** Retrieve a parsed LUT. Returns null if not loaded yet. */
    get(id: string): ParsedLut | null {
        return this.cache.get(id) ?? null;
    }

    /** Check if a LUT is already cached. */
    has(id: string): boolean {
        return this.cache.has(id);
    }

    /** Remove a specific LUT (e.g. on asset deletion). */
    remove(id: string): void {
        this.cache.delete(id);
    }

    /** Clear all cached LUTs. */
    clear(): void {
        this.cache.clear();
    }

    /** Number of cached LUTs. */
    get size(): number {
        return this.cache.size;
    }
}

export const lutCache = new LutCache();
