/**
 * Hook for loading fonts dynamically.
 * Provides font loading state and utilities for components.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { loadFont, isFontLoaded, waitForFont, preloadFontsForPreview } from "@/lib/font-loader";
import { getGoogleFonts, type FontOption, type FontCategory } from "@/constants/font-constants";

interface UseFontLoaderOptions {
	/** Preload fonts on mount */
	preload?: boolean;
	/** Specific fonts to preload */
	fontsToPreload?: FontOption[];
	/** Callback when a font fails to load */
	onError?: (fontFamily: string, error: Error) => void;
}

interface FontLoaderState {
	/** Set of loaded font families */
	loadedFonts: Set<string>;
	/** Currently loading font families */
	loadingFonts: Set<string>;
	/** Whether any font is currently loading */
	isLoading: boolean;
}

interface UseFontLoaderReturn extends FontLoaderState {
	/** Load a single font */
	loadFont: (fontFamily: string, weights?: number[]) => Promise<void>;
	/** Check if a font is loaded */
	isLoaded: (fontFamily: string) => boolean;
	/** Wait for a font to be ready for rendering */
	waitForReady: (fontFamily: string) => Promise<void>;
	/** Preload fonts for preview display */
	preloadForPreview: (fonts: FontOption[]) => Promise<void>;
}

/**
 * Hook for managing dynamic font loading.
 */
export function useFontLoader(options: UseFontLoaderOptions = {}): UseFontLoaderReturn {
	const { preload = false, fontsToPreload, onError } = options;

	const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
	const [loadingFonts, setLoadingFonts] = useState<Set<string>>(new Set());
	const isLoadingRef = useRef(false);

	// Sync loaded fonts with the font-loader module
	const syncLoadedFonts = useCallback(() => {
		const allFonts = document.fonts;
		const loaded = new Set<string>();

		// Check each Google font
		getGoogleFonts().forEach((font) => {
			if (allFonts.check(`16px "${font.value}"`)) {
				loaded.add(font.value);
			}
		});

		setLoadedFonts(loaded);
	}, []);

	// Load a single font
	const handleLoadFont = useCallback(async (fontFamily: string, weights?: number[]) => {
		if (isFontLoaded(fontFamily)) {
			setLoadedFonts((prev) => new Set(prev).add(fontFamily));
			return;
		}

		setLoadingFonts((prev) => new Set(prev).add(fontFamily));
		isLoadingRef.current = true;

		try {
			await loadFont(fontFamily, weights);
			setLoadedFonts((prev) => new Set(prev).add(fontFamily));
		} catch (error) {
			onError?.(fontFamily, error as Error);
			throw error;
		} finally {
			setLoadingFonts((prev) => {
				const next = new Set(prev);
				next.delete(fontFamily);
				return next;
			});
			isLoadingRef.current = false;
		}
	}, [onError]);

	// Check if a font is loaded
	const isLoaded = useCallback((fontFamily: string): boolean => {
		return isFontLoaded(fontFamily) || loadedFonts.has(fontFamily);
	}, [loadedFonts]);

	// Wait for a font to be ready
	const waitForReady = useCallback(async (fontFamily: string): Promise<void> => {
		await waitForFont(fontFamily);
		setLoadedFonts((prev) => new Set(prev).add(fontFamily));
	}, []);

	// Preload fonts for preview
	const preloadForPreview = useCallback(async (fonts: FontOption[]): Promise<void> => {
		await preloadFontsForPreview(fonts);
		syncLoadedFonts();
	}, [syncLoadedFonts]);

	// Preload on mount if requested
	useEffect(() => {
		if (preload) {
			const fonts = fontsToPreload ?? getGoogleFonts().slice(0, 20);
			preloadForPreview(fonts);
		}
	}, [preload, fontsToPreload, preloadForPreview]);

	// Sync with document.fonts on mount
	useEffect(() => {
		syncLoadedFonts();

		// Listen for font loading events
		const handleLoadingDone = () => syncLoadedFonts();
		document.fonts.addEventListener("loadingdone", handleLoadingDone);

		return () => {
			document.fonts.removeEventListener("loadingdone", handleLoadingDone);
		};
	}, [syncLoadedFonts]);

	return {
		loadedFonts,
		loadingFonts,
		isLoading: isLoadingRef.current || loadingFonts.size > 0,
		loadFont: handleLoadFont,
		isLoaded,
		waitForReady,
		preloadForPreview,
	};
}

/**
 * Hook for managing recently used fonts.
 * Persists to localStorage.
 */
export function useRecentFonts(maxRecent: number = 10): {
	recentFonts: string[];
	addRecentFont: (fontFamily: string) => void;
	clearRecentFonts: () => void;
} {
	const STORAGE_KEY = "prawn-recent-fonts";

	const [recentFonts, setRecentFonts] = useState<string[]>(() => {
		if (typeof window === "undefined") return [];
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	});

	const addRecentFont = useCallback((fontFamily: string) => {
		setRecentFonts((prev) => {
			// Remove if already exists
			const filtered = prev.filter((f) => f !== fontFamily);
			// Add to beginning
			const updated = [fontFamily, ...filtered].slice(0, maxRecent);
			// Persist
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			} catch {
				// Ignore storage errors
			}
			return updated;
		});
	}, [maxRecent]);

	const clearRecentFonts = useCallback(() => {
		setRecentFonts([]);
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// Ignore storage errors
		}
	}, []);

	return { recentFonts, addRecentFont, clearRecentFonts };
}

/**
 * Hook for searching fonts.
 */
export function useFontSearch(fonts: FontOption[]): {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	filteredFonts: FontOption[];
	selectedCategory: FontCategory | "all";
	setSelectedCategory: (category: FontCategory | "all") => void;
} {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<FontCategory | "all">("all");

	const filteredFonts = fonts.filter((font) => {
		// Category filter
		if (selectedCategory !== "all" && font.category !== selectedCategory) {
			return false;
		}

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			return (
				font.label.toLowerCase().includes(query) ||
				font.value.toLowerCase().includes(query)
			);
		}

		return true;
	});

	return {
		searchQuery,
		setSearchQuery,
		filteredFonts,
		selectedCategory,
		setSelectedCategory,
	};
}