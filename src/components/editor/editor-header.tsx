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
	LucideIcon
} from "lucide-react";
import ShrimpIcon from "@/components/shrimp-icon";
import { useTheme } from "next-themes";
import { RenameProjectDialog } from "./dialogs/rename-project-dialog";
import { DeleteProjectDialog } from "./dialogs/delete-project-dialog";
import { ShortcutsDialog } from "./dialogs/shortcuts-dialog";
import { ExportDialog } from "./dialogs/export-dialog";
import { toast } from "sonner";
import { SOCIAL_LINKS } from "@/constants/site-constants";
import { FaDiscord } from "react-icons/fa6";
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
	const [openDialog, setOpenDialog] = useState<"rename" | "delete" | "shortcuts" | "export" | null>(null);
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

	const handleExit = async () => {
		try {
			await editor.project.prepareExit();
			editor.project.closeProject();
		} catch (error) {
			console.error("Failed to prepare project exit:", error);
		} finally {
			editor.project.closeProject();
			router.push("/projects");
		}
	};

	const handleRename = async (newName: string) => {
		if (!activeProject) return;
		try {
			await editor.project.renameProject({
				id: activeProject.metadata.id,
				name: newName.trim(),
			});
		} catch (error) {
			toast.error("Failed to rename project");
		} finally {
			setOpenDialog(null);
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
			{ label: "Rename Project...", icon: Edit3, action: () => setOpenDialog("rename") },
			{ label: "Export Project...", icon: Download, action: () => setOpenDialog("export") },
			"---",
			{ label: "Delete Project...", icon: Trash2, action: () => setOpenDialog("delete") },
			"---",
			{ label: "Exit to Projects", icon: LogOut, action: handleExit },
		],
		"Edit": [
			{ label: "Undo", icon: Undo, action: () => editor.command.undo(), shortcut: "⌘Z" },
			{ label: "Redo", icon: Redo, action: () => editor.command.redo(), shortcut: "⇧⌘Z" },
		],
		"Help": [
			{ label: "Keyboard Shortcuts", icon: Keyboard, action: () => setOpenDialog("shortcuts"), shortcut: "?" },
			{ label: "Discord Community", icon: FaDiscord, action: () => window.open(SOCIAL_LINKS.discord, "_blank") },
			{ label: "GitHub Source", icon: Github, action: () => window.open("https://github.com/vunam/webgimp", "_blank") },
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
					<div className="header-brand" onClick={() => router.push("/projects")}>
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

				{/* Center Project Name Display */}
				<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-50 text-xs font-medium">
					{activeProject?.metadata.name}
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

			<RenameProjectDialog
				isOpen={openDialog === "rename"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "rename" : null)}
				onConfirm={handleRename}
				projectName={activeProject?.metadata.name || ""}
			/>
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
		</>
	);
}
