"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEditor } from "@/hooks/use-editor";
import { cn } from "@/utils/ui";
import {
	ChevronDown,
	Search,
	Settings,
	Sun,
	Moon,
	Monitor,
	Check,
	LogOut,
	Keyboard,
	Github,
	Trash2,
	Edit3,
	Undo,
	Redo,
	Download,
	Plus,
	LucideIcon,
	Puzzle
} from "lucide-react";
import ShrimpIcon from "@/components/shrimp-icon";
import { useTheme } from "next-themes";
import { RenameProjectDialog } from "./dialogs/rename-project-dialog";
import { DeleteProjectDialog } from "./dialogs/delete-project-dialog";
import { ShortcutsDialog } from "./dialogs/shortcuts-dialog";
import { ExportDialog } from "./dialogs/export-dialog";
import { IntegrationsDialog } from "./dialogs/integrations-dialog";
import { toast } from "sonner";
import { SOCIAL_LINKS } from "@/constants/site-constants";
import { IconType } from "react-icons";

interface MenuItem {
	label: string;
	icon?: LucideIcon | IconType;
	action: () => void;
	shortcut?: string;
}

type MenuSection = (MenuItem | "---")[];

export function EditorHeader() {
	const [activeMenu, setActiveMenu] = useState<string | null>(null);
	const [openDialog, setOpenDialog] = useState<"delete" | "shortcuts" | "export" | "integrations" | null>(null);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [titleEditValue, setTitleEditValue] = useState("");
	const editor = useEditor();
	const activeProject = editor.project.getActive();
	const router = useRouter();
	const menuRef = useRef<HTMLDivElement>(null);
	const { theme, setTheme } = useTheme();

	const [settingsOpen, setSettingsOpen] = useState(false);
	const settingsRef = useRef<HTMLDivElement>(null);

	// Click outside handlers
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setActiveMenu(null);
			}
			if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
				setSettingsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleNewProject = async () => {
		try {
			await editor.project.prepareExit();
			const projectId = await editor.project.createNewProject({
				name: "Untitled Project",
			});
			router.push(`/editor/${projectId}`);
		} catch (error) {
			toast.error("Failed to create new project");
		}
	};

	const handleExit = async () => {
		try {
			await editor.project.prepareExit();
			editor.project.closeProject();
		} catch (error) {
			console.error("Failed to prepare project exit:", error);
		} finally {
			editor.project.closeProject();
			router.push("/");
		}
	};

	const handleRename = async (newName: string) => {
		if (!activeProject) return;
		const trimmedName = newName.trim();
		if (!trimmedName || trimmedName === activeProject.metadata.name) {
			setIsEditingTitle(false);
			return;
		}
		try {
			await editor.project.renameProject({
				id: activeProject.metadata.id,
				name: trimmedName,
			});
		} catch (error) {
			toast.error("Failed to rename project");
		} finally {
			setIsEditingTitle(false);
		}
	};

	const handleDelete = async () => {
		if (!activeProject) return;
		try {
			await editor.project.deleteProjects({ ids: [activeProject.metadata.id] });
			router.push("/projects");
		} catch (error) {
			toast.error("Failed to delete project");
		} finally {
			setOpenDialog(null);
		}
	};

	const menuData: Record<string, MenuSection> = {
		"File": [
			{ label: "New Project", icon: Plus, action: handleNewProject, shortcut: "⌘N" },
			"---",
			{
				label: "Rename Project...", icon: Edit3, action: () => {
					setIsEditingTitle(true);
					setTitleEditValue(activeProject?.metadata.name || "");
				}
			},
			{ label: "Export Project...", icon: Download, action: () => setOpenDialog("export") },
			"---",
			{ label: "Delete Project...", icon: Trash2, action: () => setOpenDialog("delete") },
			"---",
			{ label: "All Projects", icon: LogOut, action: handleExit },
		],
		"Edit": [
			{ label: "Undo", icon: Undo, action: () => editor.command.undo(), shortcut: "⌘Z" },
			{ label: "Redo", icon: Redo, action: () => editor.command.redo(), shortcut: "⇧⌘Z" },
		],
		"Help": [
			{ label: "Keyboard Shortcuts", icon: Keyboard, action: () => setOpenDialog("shortcuts"), shortcut: "?" },
			{ label: "GitHub Source", icon: Github, action: () => window.open("https://github.com/vnt87/prawn", "_blank") },
		]
	};

	const themeOptions = [
		{ value: "light", label: "Light", icon: Sun },
		{ value: "dark", label: "Dark", icon: Moon },
		{ value: "system", label: "System", icon: Monitor },
	];

	return (
		<>
			<div className="header">
				<div className="header-left">
					<div className="header-brand" onClick={() => router.push("/")}>
						<ShrimpIcon className="brand-icon" />
						<span className="brand-text">Prawn</span>
					</div>

					<div className="header-menu" ref={menuRef}>
						{Object.entries(menuData).map(([key, items]) => (
							<div
								key={key}
								className={cn("header-menu-item", activeMenu === key && "active")}
								onClick={() => setActiveMenu(activeMenu === key ? null : key)}
								onMouseEnter={() => activeMenu && setActiveMenu(key)}
							>
								{key}
								{activeMenu === key && (
									<div className="header-menu-dropdown">
										{items.map((item, idx) => {
											if (item === "---") {
												return <div key={idx} className="header-menu-dropdown-divider" style={{ borderTop: "1px solid var(--border-color)", margin: "4px 0" }} />;
											}
											// Explicitly cast or just let TS infer correctly now that we have interface
											const menuItem = item as MenuItem;
											return (
												<div
													key={idx}
													className="header-menu-dropdown-item"
													onClick={(e) => {
														e.stopPropagation();
														menuItem.action();
														setActiveMenu(null);
													}}
												>
													{menuItem.icon && <menuItem.icon size={14} style={{ marginRight: 8 }} />}
													{menuItem.label}
													{menuItem.shortcut && <span className="shortcut">{menuItem.shortcut}</span>}
												</div>
											);
										})}
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Center Project Name Display / Inline Edit */}
				<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
					{isEditingTitle ? (
						<input
							autoFocus
							className="bg-background border-accent-active h-6 w-48 rounded-sm border px-2 text-center text-xs font-medium outline-hidden"
							value={titleEditValue}
							onChange={(e) => setTitleEditValue(e.target.value)}
							onBlur={() => handleRename(titleEditValue)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleRename(titleEditValue);
								if (e.key === "Escape") {
									setIsEditingTitle(false);
									setTitleEditValue(activeProject?.metadata.name || "");
								}
							}}
						/>
					) : (
						<div
							className="cursor-pointer select-none text-xs font-medium opacity-70 transition-opacity hover:opacity-100"
							onDoubleClick={() => {
								setIsEditingTitle(true);
								setTitleEditValue(activeProject?.metadata.name || "");
							}}
							title="Double-click to rename"
						>
							{activeProject?.metadata.name}
						</div>
					)}
				</div>

				<div className="header-right">
					<div className="header-search">
						<Search className="search-icon" />
						<input
							type="text"
							placeholder="Search (⌘/)"
							readOnly
							className="cursor-default"
						/* Not implemented yet */
						/>
					</div>

					<div className="header-divider" />

					<div
						className="header-icon-btn"
						title="Theme Settings"
						onClick={() => setSettingsOpen(!settingsOpen)}
						ref={settingsRef}
					>
						<Settings size={16} />
						<ChevronDown size={12} strokeWidth={3} style={{ marginLeft: 4 }} />

						{settingsOpen && (
							<div className="header-menu-dropdown" style={{ right: 8, left: 'auto', minWidth: 150 }}>
								<div className="header-menu-dropdown-item" style={{ cursor: 'default', fontSize: 11, color: 'var(--text-secondary)', padding: '4px 12px' }}>
									General
								</div>
								<div
									className="header-menu-dropdown-item"
									onClick={(e) => {
										e.stopPropagation();
										setOpenDialog("integrations");
										setSettingsOpen(false);
									}}
								>
									<Puzzle size={14} style={{ marginRight: 8 }} />
									Integrations
								</div>

								<div className="header-menu-dropdown-divider" style={{ borderTop: "1px solid var(--border-color)", margin: "4px 0" }} />

								<div className="header-menu-dropdown-item" style={{ cursor: 'default', fontSize: 11, color: 'var(--text-secondary)', padding: '4px 12px' }}>
									Theme
								</div>
								{themeOptions.map((opt) => (
									<div
										key={opt.value}
										className="header-menu-dropdown-item"
										onClick={(e) => {
											e.stopPropagation();
											setTheme(opt.value);
											setSettingsOpen(false);
										}}
									>
										<opt.icon size={14} style={{ marginRight: 8 }} />
										{opt.label}
										{(theme === opt.value || (theme === "system" && opt.value === "system")) && <Check size={14} style={{ marginLeft: 'auto' }} />}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<DeleteProjectDialog
				isOpen={openDialog === "delete"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "delete" : null)}
				onConfirm={handleDelete}
				projectNames={[activeProject?.metadata.name || ""]}
			/>
			<ShortcutsDialog
				isOpen={openDialog === "shortcuts"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "shortcuts" : null)}
			/>
			<ExportDialog
				open={openDialog === "export"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "export" : null)}
			/>
			<IntegrationsDialog
				open={openDialog === "integrations"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "integrations" : null)}
			/>
		</>
	);
}
