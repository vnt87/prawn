"use client";

import * as React from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
	FONT_OPTIONS,
	getFontCategories,
	getFontByValue,
	type FontFamily,
	type FontCategory,
	type FontOption,
} from "@/constants/font-constants";
import { isFontLoaded, loadFont } from "@/lib/font-loader";
import { cn } from "@/utils/ui";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Storage key for recent fonts */
const RECENT_FONTS_KEY = "prawn-recent-fonts";

/**
 * Hook for managing recently used fonts.
 */
function useRecentFonts(maxRecent: number = 5) {
	const [recentFonts, setRecentFonts] = React.useState<string[]>(() => {
		if (typeof window === "undefined") return [];
		try {
			const stored = localStorage.getItem(RECENT_FONTS_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	});

	const addRecentFont = React.useCallback((fontFamily: string) => {
		setRecentFonts((prev) => {
			const filtered = prev.filter((f) => f !== fontFamily);
			const updated = [fontFamily, ...filtered].slice(0, maxRecent);
			try {
				localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(updated));
			} catch {
				// Ignore storage errors
			}
			return updated;
		});
	}, [maxRecent]);

	return { recentFonts, addRecentFont };
}

/**
 * Memoized font item component for performance.
 */
const FontItem = React.memo(function FontItem({
	font,
	isSelected,
	onSelect,
}: {
	font: FontOption;
	isSelected: boolean;
	onSelect: () => void;
}) {
	const [loaded, setLoaded] = React.useState(false);

	// Load font on first render if it's a Google font
	React.useEffect(() => {
		if (font.category === "system" || isFontLoaded(font.value)) {
			setLoaded(true);
			return;
		}
		// Lazy load - don't await, let it load in background
		loadFont(font.value, [400]).then(() => setLoaded(true)).catch(() => {});
	}, [font.value, font.category]);

	return (
		<CommandItem
			value={font.value}
			onSelect={onSelect}
			className="flex items-center justify-between gap-2"
		>
			<span
				style={{
					fontFamily: loaded || font.category === "system" ? font.value : undefined,
				}}
				className="truncate"
			>
				{font.label}
			</span>
			{isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
		</CommandItem>
	);
});

/**
 * Memoized category tab component.
 */
const CategoryTab = React.memo(function CategoryTab({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			className={cn(
				"rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap",
				active
					? "bg-primary/10 text-primary"
					: "text-muted-foreground hover:bg-muted hover:text-foreground"
			)}
			onClick={onClick}
		>
			{label}
		</button>
	);
});

interface FontPickerProps {
	/** Currently selected font family */
	value?: FontFamily;
	/** Callback when font changes */
	onValueChange?: (value: FontFamily) => void;
	/** Additional CSS classes */
	className?: string;
	/** Whether the picker is disabled */
	disabled?: boolean;
	/** Placeholder text */
	placeholder?: string;
}

/**
 * Enhanced font picker with search, categories, and font preview.
 * Loads Google Fonts dynamically when selected.
 */
export function FontPicker({
	value,
	onValueChange,
	className,
	disabled = false,
	placeholder,
}: FontPickerProps) {
	const { t } = useTranslation();
	const [open, setOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [selectedCategory, setSelectedCategory] = React.useState<FontCategory | "all">("all");

	// Recent fonts
	const { recentFonts, addRecentFont } = useRecentFonts(5);

	// Get current font info
	const selectedFont = value ? getFontByValue(value) : null;

	// Handle font selection
	const handleSelect = React.useCallback(async (fontFamily: FontFamily) => {
		// Load the font if not already loaded
		if (!isFontLoaded(fontFamily)) {
			await loadFont(fontFamily);
		}

		// Add to recent fonts
		addRecentFont(fontFamily);

		// Call callback
		onValueChange?.(fontFamily);
		setOpen(false);
	}, [addRecentFont, onValueChange]);

	// Filter fonts based on search and category
	const filteredFonts = React.useMemo(() => {
		return FONT_OPTIONS.filter((font) => {
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
	}, [searchQuery, selectedCategory]);

	// Get recent font options
	const recentFontOptions = React.useMemo(() => {
		return recentFonts
			.map((family) => getFontByValue(family))
			.filter((font): font is FontOption => font !== undefined);
	}, [recentFonts]);

	// Group fonts by category for display
	const fontsByCategory = React.useMemo(() => {
		const grouped: Record<string, FontOption[]> = {};

		filteredFonts.forEach((font) => {
			if (!grouped[font.category]) {
				grouped[font.category] = [];
			}
			grouped[font.category].push(font);
		});

		return grouped;
	}, [filteredFonts]);

	// Category labels
	const categoryLabels: Record<FontCategory | "system" | "recent", string> = {
		system: t("fonts.system", "System"),
		recent: t("fonts.recent", "Recent"),
		"sans-serif": t("fonts.sansSerif", "Sans Serif"),
		serif: t("fonts.serif", "Serif"),
		display: t("fonts.display", "Display"),
		handwriting: t("fonts.handwriting", "Handwriting"),
		monospace: t("fonts.monospace", "Monospace"),
	};

	// Clear search when closing
	const handleOpenChange = React.useCallback((newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			// Reset state when closing
			setSearchQuery("");
		}
	}, []);

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className={cn("w-full justify-between font-normal", className)}
				>
					<span
						style={{ fontFamily: value ?? undefined }}
						className="truncate"
					>
						{selectedFont?.label ?? placeholder ?? t("fonts.selectFont", "Select font...")}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[320px] p-0" align="start">
				<Command shouldFilter={false}>
					{/* Search input */}
					<div className="border-b px-3 py-2">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								type="text"
								placeholder={t("fonts.search", "Search fonts...")}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full bg-transparent pl-8 pr-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery("")}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>
					</div>

					{/* Category tabs */}
					<div className="flex gap-1 border-b px-2 py-2 overflow-x-auto">
						<CategoryTab
							label={t("fonts.all", "All")}
							active={selectedCategory === "all"}
							onClick={() => setSelectedCategory("all")}
						/>
						{getFontCategories().map((category) => (
							<CategoryTab
								key={category}
								label={categoryLabels[category]}
								active={selectedCategory === category}
								onClick={() => setSelectedCategory(category)}
							/>
						))}
					</div>

					<CommandList className="max-h-[300px] overflow-y-auto">
						{/* Recent fonts */}
						{!searchQuery && recentFontOptions.length > 0 && (
							<>
								<CommandGroup heading={categoryLabels.recent}>
									{recentFontOptions.map((font) => (
										<FontItem
											key={font.value}
											font={font}
											isSelected={value === font.value}
											onSelect={() => handleSelect(font.value as FontFamily)}
										/>
									))}
								</CommandGroup>
								<CommandSeparator />
							</>
						)}

						{/* Empty state */}
						{filteredFonts.length === 0 && (
							<CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
								{t("fonts.noFontsFound", "No fonts found.")}
							</CommandEmpty>
						)}

						{/* Fonts by category */}
						{selectedCategory === "all" ? (
							Object.entries(fontsByCategory).map(([category, fonts]) => (
								<CommandGroup key={category} heading={categoryLabels[category as FontCategory]}>
									{fonts.map((font) => (
										<FontItem
											key={font.value}
											font={font}
											isSelected={value === font.value}
											onSelect={() => handleSelect(font.value as FontFamily)}
										/>
									))}
								</CommandGroup>
							))
						) : (
							<CommandGroup>
								{filteredFonts.map((font) => (
									<FontItem
										key={font.value}
										font={font}
										isSelected={value === font.value}
										onSelect={() => handleSelect(font.value as FontFamily)}
									/>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

/**
 * Simple font picker without search (for backward compatibility).
 */
export function FontPickerSimple({
	defaultValue,
	onValueChange,
	className,
}: {
	defaultValue?: FontFamily;
	onValueChange?: (value: FontFamily) => void;
	className?: string;
}) {
	return (
		<FontPicker
			value={defaultValue}
			onValueChange={onValueChange}
			className={className}
		/>
	);
}