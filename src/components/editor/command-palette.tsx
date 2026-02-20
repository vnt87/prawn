"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDialogStore } from "@/stores/dialog-store";
import {
	Dialog,
	DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/ui";
import { useKeyboardShortcutsHelp } from "@/hooks/use-keyboard-shortcuts-help";
import { invokeAction } from "@/lib/actions";
import { Search, CornerDownLeft } from "lucide-react";
import { getPlatformSpecialKey } from "@/utils/platform";
import { useTranslation } from "react-i18next";

/**
 * CommandPalette - A searchable dropdown for quick access to all editor actions
 * 
 * Features:
 * - Fuzzy search across actions
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Display shortcuts next to each action
 * - Grouped by category
 */
export function CommandPalette() {
	const { t } = useTranslation();
	const { openDialog, setOpenDialog } = useDialogStore();
	const isOpen = openDialog === "command-palette";
	const [search, setSearch] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const { shortcuts } = useKeyboardShortcutsHelp();

	// Filter shortcuts based on search query
	const filteredShortcuts = useMemo(() => {
		if (!search.trim()) return shortcuts;
		
		const query = search.toLowerCase();
		return shortcuts.filter(
			(shortcut) =>
				shortcut.description.toLowerCase().includes(query) ||
				shortcut.category.toLowerCase().includes(query) ||
				shortcut.keys.some((key) => key.toLowerCase().includes(query))
		);
	}, [shortcuts, search]);

	// Group filtered shortcuts by category
	const groupedShortcuts = useMemo(() => {
		const groups: Record<string, typeof shortcuts> = {};
		
		for (const shortcut of filteredShortcuts) {
			if (!groups[shortcut.category]) {
				groups[shortcut.category] = [];
			}
			groups[shortcut.category].push(shortcut);
		}
		
		return groups;
	}, [filteredShortcuts]);

	// Flatten for keyboard navigation
	const flatShortcuts = useMemo(() => filteredShortcuts, [filteredShortcuts]);

	// Reset state when dialog opens/closes
	useEffect(() => {
		if (isOpen) {
			setSearch("");
			setSelectedIndex(0);
			// Focus input after a brief delay to ensure dialog is mounted
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [isOpen]);

	// Scroll selected item into view
	useEffect(() => {
		if (listRef.current && flatShortcuts.length > 0) {
			const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
			if (selectedElement) {
				selectedElement.scrollIntoView({ block: "nearest" });
			}
		}
	}, [selectedIndex, flatShortcuts.length]);

	// Handle keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev < flatShortcuts.length - 1 ? prev + 1 : 0
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev > 0 ? prev - 1 : flatShortcuts.length - 1
					);
					break;
				case "Enter":
					e.preventDefault();
					if (flatShortcuts[selectedIndex]) {
						handleSelectAction(flatShortcuts[selectedIndex].action);
					}
					break;
				case "Escape":
					e.preventDefault();
					setOpenDialog(null);
					break;
			}
		},
		[flatShortcuts, selectedIndex, setOpenDialog]
	);

	// Handle action selection
	const handleSelectAction = useCallback(
		(action: string) => {
			invokeAction(action as Parameters<typeof invokeAction>[0]);
			setOpenDialog(null);
		},
		[setOpenDialog]
	);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => setOpenDialog(open ? "command-palette" : null)}>
			<DialogContent className="overflow-hidden p-0 shadow-lg max-w-md [&>button]:hidden">
				{/* Search Input */}
				<div className="flex items-center border-b bg-background px-3">
					<Search className="h-4 w-4 shrink-0 opacity-50" />
					<Input
						ref={inputRef}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setSelectedIndex(0);
						}}
						onKeyDown={handleKeyDown}
						placeholder={t("commandPalette.searchPlaceholder", "Search actions...")}
						className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-3 py-3"
					/>
				</div>

				{/* Actions List */}
				<div
					ref={listRef}
					className="max-h-[300px] overflow-y-auto overflow-x-hidden"
				>
					{flatShortcuts.length === 0 ? (
						<div className="py-6 text-center text-sm text-muted-foreground">
							{t("commandPalette.noResults", "No actions found")}
						</div>
					) : (
						Object.entries(groupedShortcuts).map(([category, items]) => (
							<div key={category}>
								<div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
									{t(`shortcuts.categories.${category}`, category)}
								</div>
								{items.map((shortcut) => {
									const globalIndex = flatShortcuts.indexOf(shortcut);
									return (
										<div
											key={shortcut.id}
											data-index={globalIndex}
											className={cn(
												"flex cursor-pointer items-center justify-between px-3 py-2 text-sm",
												globalIndex === selectedIndex
													? "bg-accent text-accent-foreground"
													: "hover:bg-accent/50"
											)}
											onClick={() => handleSelectAction(shortcut.action)}
											onMouseEnter={() => setSelectedIndex(globalIndex)}
										>
											<span>{t(`shortcuts.actions.${shortcut.action}`, shortcut.description)}</span>
											<div className="flex items-center gap-1">
												{shortcut.keys.slice(0, 2).map((key, idx) => (
													<div key={idx} className="flex items-center gap-0.5">
														<kbd className="pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px]">
															{key}
														</kbd>
														{idx < Math.min(shortcut.keys.length - 1, 1) && (
															<span className="text-muted-foreground text-[10px]">
																{t("common.or", "or")}
															</span>
														)}
													</div>
												))}
												{globalIndex === selectedIndex && (
													<div className="ml-2 flex items-center text-muted-foreground">
														<CornerDownLeft className="h-3 w-3" />
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						))
					)}
				</div>

				{/* Footer hint */}
				<div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
					<div className="flex items-center gap-2">
						<kbd className="pointer-events-none inline-flex h-5 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px]">
							↑↓
						</kbd>
						<span>{t("commandPalette.navigate", "Navigate")}</span>
					</div>
					<div className="flex items-center gap-2">
						<kbd className="pointer-events-none inline-flex h-5 select-none items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px]">
							↵
						</kbd>
						<span>{t("commandPalette.select", "Select")}</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}