/**
 * Font constants for the editor.
 * Includes system fonts and Google Fonts that support Vietnamese language.
 * All Google Fonts listed here have Vietnamese character support.
 */

export interface FontOption {
	/** Font family name (exact match for CSS font-family) */
	value: string;
	/** Display label for the UI */
	label: string;
	/** Font category for grouping */
	category: "system" | "sans-serif" | "serif" | "display" | "handwriting" | "monospace";
	/** Available font weights */
	weights?: number[];
	/** Whether font has a Tailwind className */
	hasClassName?: boolean;
}

/**
 * System fonts - always available without loading.
 */
const SYSTEM_FONTS: FontOption[] = [
	{ value: "Arial", label: "Arial", category: "system", hasClassName: false },
	{ value: "Helvetica", label: "Helvetica", category: "system", hasClassName: false },
	{ value: "Times New Roman", label: "Times New Roman", category: "system", hasClassName: false },
	{ value: "Georgia", label: "Georgia", category: "system", hasClassName: false },
	{ value: "Courier New", label: "Courier New", category: "system", hasClassName: false },
	{ value: "Verdana", label: "Verdana", category: "system", hasClassName: false },
];

/**
 * Sans Serif Google Fonts with Vietnamese support.
 * Clean, modern fonts ideal for body text and UI.
 */
const SANS_SERIF_FONTS: FontOption[] = [
	{ value: "Inter", label: "Inter", category: "sans-serif", weights: [400, 500, 600, 700], hasClassName: true },
	{ value: "Roboto", label: "Roboto", category: "sans-serif", weights: [400, 500, 700], hasClassName: true },
	{ value: "Open Sans", label: "Open Sans", category: "sans-serif", weights: [400, 600, 700] },
	{ value: "Lato", label: "Lato", category: "sans-serif", weights: [400, 700] },
	{ value: "Montserrat", label: "Montserrat", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Poppins", label: "Poppins", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Nunito", label: "Nunito", category: "sans-serif", weights: [400, 600, 700] },
	{ value: "Source Sans 3", label: "Source Sans 3", category: "sans-serif", weights: [400, 600, 700] },
	{ value: "Raleway", label: "Raleway", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Ubuntu", label: "Ubuntu", category: "sans-serif", weights: [400, 500, 700] },
	{ value: "Rubik", label: "Rubik", category: "sans-serif", weights: [400, 500, 700] },
	{ value: "Work Sans", label: "Work Sans", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Nunito Sans", label: "Nunito Sans", category: "sans-serif", weights: [400, 600, 700] },
	{ value: "Quicksand", label: "Quicksand", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Barlow", label: "Barlow", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Manrope", label: "Manrope", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "DM Sans", label: "DM Sans", category: "sans-serif", weights: [400, 500, 700] },
	{ value: "Josefin Sans", label: "Josefin Sans", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Karla", label: "Karla", category: "sans-serif", weights: [400, 500, 700] },
	{ value: "Cabin", label: "Cabin", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Outfit", label: "Outfit", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Sora", label: "Sora", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Space Grotesk", label: "Space Grotesk", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Lexend", label: "Lexend", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Figtree", label: "Figtree", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Albert Sans", label: "Albert Sans", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Onest", label: "Onest", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "IBM Plex Sans", label: "IBM Plex Sans", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "Be Vietnam Pro", label: "Be Vietnam Pro", category: "sans-serif", weights: [400, 500, 600, 700] },
	{ value: "M PLUS Rounded 1c", label: "M PLUS Rounded 1c", category: "sans-serif", weights: [400, 500, 700] },
];

/**
 * Serif Google Fonts with Vietnamese support.
 * Classic, elegant fonts ideal for headings and formal text.
 */
const SERIF_FONTS: FontOption[] = [
	{ value: "Playfair Display", label: "Playfair Display", category: "serif", weights: [400, 500, 600, 700], hasClassName: true },
	{ value: "Merriweather", label: "Merriweather", category: "serif", weights: [400, 700] },
	{ value: "Lora", label: "Lora", category: "serif", weights: [400, 500, 600, 700] },
	{ value: "Noto Serif", label: "Noto Serif", category: "serif", weights: [400, 700] },
	{ value: "Libre Baskerville", label: "Libre Baskerville", category: "serif", weights: [400, 700] },
	{ value: "Crimson Text", label: "Crimson Text", category: "serif", weights: [400, 600, 700] },
	{ value: "Bitter", label: "Bitter", category: "serif", weights: [400, 500, 600, 700] },
	{ value: "Source Serif 4", label: "Source Serif 4", category: "serif", weights: [400, 600, 700] },
	{ value: "DM Serif Display", label: "DM Serif Display", category: "serif", weights: [400] },
	{ value: "EB Garamond", label: "EB Garamond", category: "serif", weights: [400, 500, 600, 700] },
	{ value: "Spectral", label: "Spectral", category: "serif", weights: [400, 500, 600, 700] },
	{ value: "Cormorant Garamond", label: "Cormorant Garamond", category: "serif", weights: [400, 500, 600, 700] },
	{ value: "Vollkorn", label: "Vollkorn", category: "serif", weights: [400, 500, 600, 700] },
	{ value: "Abril Fatface", label: "Abril Fatface", category: "serif", weights: [400] },
	{ value: "Newsreader", label: "Newsreader", category: "serif", weights: [400, 500, 600, 700] },
	{ value: "Fraunces", label: "Fraunces", category: "serif", weights: [400, 500, 600, 700] },
	{ value: "Crimson Pro", label: "Crimson Pro", category: "serif", weights: [400, 500, 600, 700] },
	{ value: "Libre Caslon Text", label: "Libre Caslon Text", category: "serif", weights: [400, 700] },
];

/**
 * Display/Heading Google Fonts with Vietnamese support.
 * Bold, distinctive fonts ideal for titles and headlines.
 */
const DISPLAY_FONTS: FontOption[] = [
	{ value: "Bebas Neue", label: "Bebas Neue", category: "display", weights: [400] },
	{ value: "Oswald", label: "Oswald", category: "display", weights: [400, 500, 600, 700] },
	{ value: "Anton", label: "Anton", category: "display", weights: [400] },
	{ value: "Righteous", label: "Righteous", category: "display", weights: [400] },
	{ value: "Staatliches", label: "Staatliches", category: "display", weights: [400] },
	{ value: "Bungee", label: "Bungee", category: "display", weights: [400] },
	{ value: "Permanent Marker", label: "Permanent Marker", category: "display", weights: [400] },
	{ value: "Alfa Slab One", label: "Alfa Slab One", category: "display", weights: [400] },
	{ value: "Lobster", label: "Lobster", category: "display", weights: [400] },
	{ value: "Lobster Two", label: "Lobster Two", category: "display", weights: [400, 700] },
	{ value: "Pacifico", label: "Pacifico", category: "display", weights: [400] },
	{ value: "Satisfy", label: "Satisfy", category: "display", weights: [400] },
	{ value: "Bangers", label: "Bangers", category: "display", weights: [400] },
	{ value: "Russo One", label: "Russo One", category: "display", weights: [400] },
	{ value: "Black Ops One", label: "Black Ops One", category: "display", weights: [400] },
	{ value: "Bowlby One SC", label: "Bowlby One SC", category: "display", weights: [400] },
	{ value: "Kanit", label: "Kanit", category: "display", weights: [400, 500, 600, 700] },
	{ value: "Teko", label: "Teko", category: "display", weights: [400, 500, 600, 700] },
	{ value: "Passion One", label: "Passion One", category: "display", weights: [400, 700, 900] },
	{ value: "Fredoka One", label: "Fredoka One", category: "display", weights: [400] },
	{ value: "Secular One", label: "Secular One", category: "display", weights: [400] },
	{ value: "Bree Serif", label: "Bree Serif", category: "display", weights: [400] },
	{ value: "Archivo Black", label: "Archivo Black", category: "display", weights: [400] },
	{ value: "Spicy Rice", label: "Spicy Rice", category: "display", weights: [400] },
	{ value: "Chakra Petch", label: "Chakra Petch", category: "display", weights: [400, 500, 600, 700] },
	{ value: "Concert One", label: "Concert One", category: "display", weights: [400] },
	{ value: "Fugaz One", label: "Fugaz One", category: "display", weights: [400] },
	{ value: "Yeseva One", label: "Yeseva One", category: "display", weights: [400] },
];

/**
 * Handwriting Google Fonts with Vietnamese support.
 * Script and cursive fonts for creative text.
 */
const HANDWRITING_FONTS: FontOption[] = [
	{ value: "Dancing Script", label: "Dancing Script", category: "handwriting", weights: [400, 500, 600, 700] },
	{ value: "Caveat", label: "Caveat", category: "handwriting", weights: [400, 500, 600, 700] },
	{ value: "Indie Flower", label: "Indie Flower", category: "handwriting", weights: [400] },
	{ value: "Shadows Into Light", label: "Shadows Into Light", category: "handwriting", weights: [400] },
	{ value: "Sacramento", label: "Sacramento", category: "handwriting", weights: [400] },
	{ value: "Great Vibes", label: "Great Vibes", category: "handwriting", weights: [400] },
	{ value: "Tangerine", label: "Tangerine", category: "handwriting", weights: [400, 700] },
	{ value: "Allura", label: "Allura", category: "handwriting", weights: [400] },
	{ value: "Alex Brush", label: "Alex Brush", category: "handwriting", weights: [400] },
	{ value: "Kaushan Script", label: "Kaushan Script", category: "handwriting", weights: [400] },
	{ value: "Grand Hotel", label: "Grand Hotel", category: "handwriting", weights: [400] },
	{ value: "Sedgwick Ave", label: "Sedgwick Ave", category: "handwriting", weights: [400] },
	{ value: "Amatic SC", label: "Amatic SC", category: "handwriting", weights: [400, 700] },
	{ value: "Homemade Apple", label: "Homemade Apple", category: "handwriting", weights: [400] },
	{ value: "Just Another Hand", label: "Just Another Hand", category: "handwriting", weights: [400] },
	{ value: "Gloria Hallelujah", label: "Gloria Hallelujah", category: "handwriting", weights: [400] },
	{ value: "Patrick Hand", label: "Patrick Hand", category: "handwriting", weights: [400] },
	{ value: "Coming Soon", label: "Coming Soon", category: "handwriting", weights: [400] },
	{ value: "Rock Salt", label: "Rock Salt", category: "handwriting", weights: [400] },
];

/**
 * Monospace Google Fonts with Vietnamese support.
 * Fixed-width fonts ideal for code and technical content.
 */
const MONOSPACE_FONTS: FontOption[] = [
	{ value: "Fira Code", label: "Fira Code", category: "monospace", weights: [400, 500, 600, 700] },
	{ value: "JetBrains Mono", label: "JetBrains Mono", category: "monospace", weights: [400, 500, 600, 700] },
	{ value: "Source Code Pro", label: "Source Code Pro", category: "monospace", weights: [400, 500, 600, 700] },
	{ value: "IBM Plex Mono", label: "IBM Plex Mono", category: "monospace", weights: [400, 500, 600, 700] },
	{ value: "Roboto Mono", label: "Roboto Mono", category: "monospace", weights: [400, 500, 700] },
	{ value: "Ubuntu Mono", label: "Ubuntu Mono", category: "monospace", weights: [400, 700] },
	{ value: "Space Mono", label: "Space Mono", category: "monospace", weights: [400, 700] },
	{ value: "Inconsolata", label: "Inconsolata", category: "monospace", weights: [400, 500, 600, 700] },
	{ value: "DM Mono", label: "DM Mono", category: "monospace", weights: [400, 500] },
	{ value: "Red Hat Mono", label: "Red Hat Mono", category: "monospace", weights: [400, 500, 600, 700] },
	{ value: "Major Mono Display", label: "Major Mono Display", category: "monospace", weights: [400] },
	{ value: "VT323", label: "VT323", category: "monospace", weights: [400] },
];

/**
 * All available font options.
 */
export const FONT_OPTIONS: FontOption[] = [
	...SYSTEM_FONTS,
	...SANS_SERIF_FONTS,
	...SERIF_FONTS,
	...DISPLAY_FONTS,
	...HANDWRITING_FONTS,
	...MONOSPACE_FONTS,
];

export const DEFAULT_FONT = "Arial";

/** Font category type */
export type FontCategory = FontOption["category"];

/** Type-safe font family union */
export type FontFamily = (typeof FONT_OPTIONS)[number]["value"];

/**
 * Get all font categories (excluding system).
 */
export const getFontCategories = (): FontCategory[] => [
	"sans-serif",
	"serif",
	"display",
	"handwriting",
	"monospace",
];

/**
 * Get fonts by category.
 */
export const getFontsByCategory = (category: FontCategory): FontOption[] =>
	FONT_OPTIONS.filter((font) => font.category === category);

/**
 * Get a font option by its value.
 */
export const getFontByValue = (value: string): FontOption | undefined =>
	FONT_OPTIONS.find((font) => font.value === value);

/**
 * Get all Google fonts (non-system).
 */
export const getGoogleFonts = (): FontOption[] =>
	FONT_OPTIONS.filter((font) => font.category !== "system");

/**
 * Get all system fonts.
 */
export const getSystemFonts = (): FontOption[] =>
	FONT_OPTIONS.filter((font) => font.category === "system");

/**
 * Check if a font is a Google Font.
 */
export const isGoogleFont = (fontFamily: string): boolean =>
	FONT_OPTIONS.some((font) => font.value === fontFamily && font.category !== "system");