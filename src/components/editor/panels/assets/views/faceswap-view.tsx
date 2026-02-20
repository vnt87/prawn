"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanFace, AlertCircle, Settings } from "lucide-react";
import { useIntegrationsStore } from "@/stores/integrations-store";
import { useDialogStore } from "@/stores/dialog-store";
import { useTranslation } from "react-i18next";

interface FaceSwapViewProps {
	onOpenFaceSwapDialog: () => void;
}

export function FaceSwapView({ onOpenFaceSwapDialog }: FaceSwapViewProps) {
	const { t } = useTranslation();
	const { facefusionServiceUrl } = useIntegrationsStore();
	const { openIntegrationsDialog } = useDialogStore();

	// Check if FaceFusion is configured
	const isConfigured = !!facefusionServiceUrl;

	const handleOpenSettings = () => {
		openIntegrationsDialog("ai");
	};

	return (
		<div className="flex flex-col h-full">
			<div className="p-3 space-y-3 flex-1 overflow-y-auto">
				{/* Compact Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<ScanFace className="w-4 h-4 text-primary" />
						<span className="text-sm font-medium">{t("faceswap.title")}</span>
					</div>
					<Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
						BETA
					</Badge>
				</div>

				{/* Description */}
				<p className="text-xs text-muted-foreground">
					{t("faceswap.description")}
				</p>

				{/* Warning if not configured */}
				{!isConfigured && (
					<div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
						<AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
						<div className="space-y-1">
							<span className="text-[11px] text-yellow-600 dark:text-yellow-400 block">
								{t("faceswap.notConfigured")}
							</span>
							<button
								onClick={handleOpenSettings}
								className="text-[11px] underline hover:no-underline font-medium text-yellow-700 dark:text-yellow-300 cursor-pointer"
							>
								{t("faceswap.openSettings")}
							</button>
						</div>
					</div>
				)}

				{/* Launch Button */}
				<Button
					onClick={onOpenFaceSwapDialog}
					disabled={!isConfigured}
					size="sm"
					className="w-full gap-1.5 h-8"
				>
					<ScanFace className="w-3.5 h-3.5" />
					{t("faceswap.launchTool")}
				</Button>

				{/* Features Preview */}
				<div className="pt-2 border-t">
					<span className="text-[11px] font-medium text-muted-foreground">{t("faceswap.features")}:</span>
					<div className="flex flex-wrap gap-1 mt-1.5">
						<Badge variant="outline" className="text-[10px]">{t("faceswap.featuresList.faceSwap")}</Badge>
						<Badge variant="outline" className="text-[10px]">{t("faceswap.featuresList.faceEnhance")}</Badge>
						<Badge variant="outline" className="text-[10px]">{t("faceswap.featuresList.multipleFaces")}</Badge>
						<Badge variant="outline" className="text-[10px]">{t("faceswap.featuresList.videoSupport")}</Badge>
					</div>
				</div>

				{/* Settings Link */}
				<div className="pt-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleOpenSettings}
						className="w-full gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground"
					>
						<Settings className="w-3 h-3" />
						{t("faceswap.configureService")}
					</Button>
				</div>
			</div>
		</div>
	);
}