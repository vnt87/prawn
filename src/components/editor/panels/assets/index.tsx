"use client";

import { Separator } from "@/components/ui/separator";
import { type Tab, useAssetsPanelStore } from "@/stores/assets-panel-store";
import { useDialogStore } from "@/stores/dialog-store";
import { TabBar } from "./tabbar";
import { Captions } from "./views/captions";
import { EffectsView } from "./views/effects";
import { FiltersView } from "./views/filters";
import { MediaView } from "./views/media";
import { SettingsView } from "./views/settings";
import { SoundsView } from "./views/sounds";
import { StickersView } from "./views/stickers";
import { TextView } from "./views/text";
import { TransitionsView } from "./views/transitions";
import { AIGenerationView } from "./views/ai-generation";
import { FaceSwapView } from "./views/faceswap-view";
import { useTranslation } from "react-i18next";

export function AssetsPanel() {
	const { activeTab } = useAssetsPanelStore();
	const { t } = useTranslation();
	const { setOpenDialog } = useDialogStore();

	// Handler to open FaceSwap dialog
	const handleOpenFaceSwapDialog = () => {
		setOpenDialog("faceswap");
	};

	const viewMap: Record<Tab, React.ReactNode> = {
		media: <MediaView />,
		sounds: <SoundsView />,
		text: <TextView />,
		stickers: <StickersView />,
		effects: <EffectsView />,
		transitions: <TransitionsView />,
		captions: <Captions />,
		filters: <FiltersView />,
		"ai-generation": <AIGenerationView />,
		faceswap: <FaceSwapView onOpenFaceSwapDialog={handleOpenFaceSwapDialog} />,
		settings: <SettingsView />,
	};

	return (
		<div className="panel bg-background flex h-full overflow-hidden">
			<TabBar />
			<Separator orientation="vertical" />
			<div className="flex-1 overflow-hidden">{viewMap[activeTab]}</div>
		</div>
	);
}
