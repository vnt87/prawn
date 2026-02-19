import type { ElementType } from "react";
import { create } from "zustand";
import {
	ChevronsRight,
	Captions,
	Folder,
	Smile,
	Headphones,
	Wand2,
	Type,
	Settings,
	Palette,
} from "lucide-react";

export const TAB_KEYS = [
	"media",
	"sounds",
	"text",
	"stickers",
	"effects",
	"transitions",
	"captions",
	"filters",
	"settings",
] as const;

export type Tab = (typeof TAB_KEYS)[number];

const createIcon =
	(Icon: any) =>
		({ className }: { className?: string }) => (
			<Icon className={className} />
		);

export const tabs = {
	media: {
		icon: createIcon(Folder),
		label: "Media",
	},
	sounds: {
		icon: createIcon(Headphones),
		label: "Sounds",
	},
	text: {
		icon: createIcon(Type),
		label: "Text",
	},
	stickers: {
		icon: createIcon(Smile),
		label: "Stickers",
	},
	effects: {
		icon: createIcon(Wand2),
		label: "Effects",
	},
	transitions: {
		icon: createIcon(ChevronsRight),
		label: "Transitions",
	},
	captions: {
		icon: createIcon(Captions),
		label: "Captions",
	},
	filters: {
		icon: createIcon(Palette),
		label: "Filters",
	},
	settings: {
		icon: createIcon(Settings),
		label: "Settings",
	},
} satisfies Record<
	Tab,
	{ icon: ElementType<{ className?: string }>; label: string }
>;

type MediaViewMode = "grid" | "list";

interface AssetsPanelStore {
	activeTab: Tab;
	setActiveTab: (tab: Tab) => void;
	highlightMediaId: string | null;
	requestRevealMedia: (mediaId: string) => void;
	clearHighlight: () => void;

	/* Media */
	mediaViewMode: MediaViewMode;
	setMediaViewMode: (mode: MediaViewMode) => void;
	selectedMediaId: string | null;
	setSelectedMediaId: (id: string | null) => void;
}

export const useAssetsPanelStore = create<AssetsPanelStore>((set) => ({
	activeTab: "media",
	setActiveTab: (tab) => set({ activeTab: tab }),
	highlightMediaId: null,
	requestRevealMedia: (mediaId) =>
		set({ activeTab: "media", highlightMediaId: mediaId }),
	clearHighlight: () => set({ highlightMediaId: null }),
	mediaViewMode: "grid",
	setMediaViewMode: (mode) => set({ mediaViewMode: mode }),
	selectedMediaId: null,
	setSelectedMediaId: (id) => set({ selectedMediaId: id }),
}));
