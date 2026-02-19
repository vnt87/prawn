/**
 * Dynamic font loader for Google Fonts.
 * Loads fonts on-demand using the CSS Font Loading API.
 */

import { getGoogleFonts, type FontOption } from "@/constants/font-constants";

/** Cache of loaded font families */
const loadedFonts = new Set<string>();

/** Fonts currently being loaded */
const loadingFonts = new Map<string, Promise<void>>();

/**
 * Convert a font family name to Google Fonts URL format.
 * E.g., "Open Sans" -> "Open+Sans"
 */
function toGoogleFontName(fontFamily: string): string {
	return fontFamily.replace(/\s+/g, "+");
}

/**
 * Get the Google Fonts CSS URL for a font family.
 * Includes Vietnamese subset for proper character support.
 */
function getGoogleFontsUrl(fontFamily: string, weights: number[] = [400, 700]): string {
	const family = toGoogleFontName(fontFamily);
	const weightStr = weights.join(";");
	// Request Vietnamese subset along with Latin
	return `https://fonts.googleapis.com/css2?family=${family}:wght@${weightStr}&subset=latin,vietnamese&display=swap`;
}

/**
 * Get the Google Fonts preconnect URLs.
 */
export function getGoogleFontsPreconnect(): string[] {
	return [
		"https://fonts.googleapis.com",
		"https://fonts.gstatic.com",
	];
}

/**
 * Generate the link tags for preconnecting to Google Fonts.
 * Use in document head for performance.
 */
export function getGoogleFontsPreconnectLinks(): string {
	return `
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	`.trim();
}

/**
 * Load a single font using the CSS Font Loading API.
 * Returns a promise that resolves when the font is ready.
 */
async function loadFontWithAPI(fontFamily: string, weights: number[] = [400]): Promise<void> {
	const loadPromises = weights.map((weight) => {
		const fontFace = new FontFace(
			fontFamily,
			`url('https://fonts.gstatic.com/s/${toGoogleFontName(fontFamily).toLowerCase()}/v1/font.woff2')`,
			{ weight: weight.toString() }
		);
		return fontFace.load().then(() => {
			document.fonts.add(fontFace);
		});
	});

	await Promise.all(loadPromises);
}

/**
 * Load a font by injecting a link element.
 * More reliable than the FontFace API for Google Fonts.
 */
function loadFontWithLink(fontFamily: string, weights: number[] = [400, 700]): Promise<void> {
	return new Promise((resolve, reject) => {
		// Check if already loaded
		if (loadedFonts.has(fontFamily)) {
			resolve();
			return;
		}

		// Check if currently loading
		if (loadingFonts.has(fontFamily)) {
			loadingFonts.get(fontFamily)?.then(resolve).catch(reject);
			return;
		}

		// Create link element
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = getGoogleFontsUrl(fontFamily, weights);

		link.onload = () => {
			loadedFonts.add(fontFamily);
			loadingFonts.delete(fontFamily);
			resolve();
		};

		link.onerror = () => {
			loadingFonts.delete(fontFamily);
			reject(new Error(`Failed to load font: ${fontFamily}`));
		};

		document.head.appendChild(link);
		loadingFonts.set(fontFamily, new Promise((res, rej) => {
			link.onload = () => {
				loadedFonts.add(fontFamily);
				loadingFonts.delete(fontFamily);
				res();
			};
			link.onerror = () => {
				loadingFonts.delete(fontFamily);
				rej(new Error(`Failed to load font: ${fontFamily}`));
			};
		}));

		loadingFonts.get(fontFamily)?.then(resolve).catch(reject);
	});
}

/**
 * Load a font family dynamically.
 * Uses link element injection for Google Fonts.
 */
export async function loadFont(fontFamily: string, weights?: number[]): Promise<void> {
	// Already loaded
	if (loadedFonts.has(fontFamily)) {
		return;
	}

	// System fonts don't need loading
	const googleFonts = getGoogleFonts();
	const fontInfo = googleFonts.find((f) => f.value === fontFamily);
	if (!fontInfo) {
		// Assume it's a system font or already available
		loadedFonts.add(fontFamily);
		return;
	}

	const weightsToLoad = weights ?? fontInfo.weights ?? [400, 700];
	return loadFontWithLink(fontFamily, weightsToLoad);
}

/**
 * Load multiple fonts at once.
 */
export async function loadFonts(fonts: Array<{ family: string; weights?: number[] }>): Promise<void> {
	await Promise.all(fonts.map(({ family, weights }) => loadFont(family, weights)));
}

/**
 * Preload fonts for dropdown preview.
 * Loads a single weight (400) for each font to show in the dropdown.
 */
export async function preloadFontsForPreview(fonts: FontOption[]): Promise<void> {
	const loadPromises = fonts.map((font) => {
		if (font.category === "system" || loadedFonts.has(font.value)) {
			return Promise.resolve();
		}
		// Load only regular weight for preview
		return loadFontWithLink(font.value, [400]).catch(() => {
			// Silently fail for preview - not critical
			console.warn(`Failed to preload font for preview: ${font.value}`);
		});
	});

	await Promise.all(loadPromises);
}

/**
 * Check if a font is already loaded.
 */
export function isFontLoaded(fontFamily: string): boolean {
	return loadedFonts.has(fontFamily);
}

/**
 * Get all loaded fonts.
 */
export function getLoadedFonts(): string[] {
	return Array.from(loadedFonts);
}

/**
 * Clear the font cache (for testing).
 */
export function clearFontCache(): void {
	loadedFonts.clear();
	loadingFonts.clear();
}

/**
 * Wait for a font to be ready for rendering.
 * Uses document.fonts.ready for reliable rendering.
 */
export async function waitForFont(fontFamily: string): Promise<void> {
	if (!loadedFonts.has(fontFamily)) {
		await loadFont(fontFamily);
	}

	// Wait for the font to be ready
	await document.fonts.ready;

	// Additional check for the specific font
	const hasFont = document.fonts.check(`16px "${fontFamily}"`);
	if (!hasFont) {
		// Give it a bit more time
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
}