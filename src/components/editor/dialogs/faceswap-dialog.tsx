"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	ScanFace,
	Upload,
	Play,
	Loader2,
	X,
	Video,
	Sparkles,
	ChevronRight,
} from "lucide-react";
import { useDialogStore } from "@/stores/dialog-store";
import { useIntegrationsStore } from "@/stores/integrations-store";
import { useEditor } from "@/hooks/use-editor";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/ui";

// Types for FaceSwap state
interface SourceFile {
	id: string;
	name: string;
	preview: string;
}

interface TargetFile {
	id: string;
	name: string;
	preview: string;
	isVideo: boolean;
}

interface DetectedFace {
	index: number;
	bounding_box: number[];
	image_base64: string;
}

interface ProcessingProgress {
	progress: number;
	status: string;
	currentFrame: number;
	totalFrames: number;
	speed: number;
}

export function FaceSwapDialog() {
	const { t } = useTranslation();
	const { openDialog, setOpenDialog } = useDialogStore();
	const { facefusionDefaultModel, facefusionEnableModal } = useIntegrationsStore();
	const editor = useEditor();

	const isOpen = openDialog === "faceswap";

	// State
	const [sourceFile, setSourceFile] = useState<SourceFile | null>(null);
	const [targetFile, setTargetFile] = useState<TargetFile | null>(null);
	const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
	const [selectedFaceIndex, setSelectedFaceIndex] = useState(0);
	const [selectedModel, setSelectedModel] = useState(facefusionDefaultModel || "inswapper_128");
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState<ProcessingProgress | null>(null);
	const [logs, setLogs] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<"files" | "settings">("files");

	// Preload current selected clip as Target Media (placeholder for future implementation)
	// This will be enhanced once the editor API is better documented
	useEffect(() => {
		// TODO: Implement preloading of selected clip when editor API is available
		// For now, users can manually upload target media
	}, [isOpen]);

	const handleClose = () => {
		setOpenDialog(null);
		// Reset state on close
		setSourceFile(null);
		setTargetFile(null);
		setDetectedFaces([]);
		setSelectedFaceIndex(0);
		setIsProcessing(false);
		setProgress(null);
		setLogs([]);
		setActiveTab("files");
	};

	const handleSourceUpload = useCallback((file: File) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			setSourceFile({
				id: crypto.randomUUID(),
				name: file.name,
				preview: e.target?.result as string,
			});
		};
		reader.readAsDataURL(file);
	}, []);

	const handleTargetUpload = useCallback((file: File) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			setTargetFile({
				id: crypto.randomUUID(),
				name: file.name,
				preview: e.target?.result as string,
				isVideo: file.type.startsWith("video/"),
			});
		};
		reader.readAsDataURL(file);
	}, []);

	const handleProcess = async () => {
		setIsProcessing(true);
		setLogs([t("faceswap.dialog.startingProcess")]);
		
		// Simulate processing for UI demonstration
		// Real implementation will call the FaceFusion API
		for (let i = 0; i <= 100; i += 10) {
			await new Promise((resolve) => setTimeout(resolve, 500));
			setProgress({
				progress: i,
				status: i < 100 ? t("faceswap.dialog.processing") : t("faceswap.dialog.complete"),
				currentFrame: i,
				totalFrames: 100,
				speed: 2.5,
			});
			setLogs((prev) => [...prev, `${t("faceswap.dialog.frameProgress")} ${i}/100`]);
		}

		setLogs((prev) => [...prev, t("faceswap.dialog.processComplete")]);
		setIsProcessing(false);
	};

	// For demo purposes, allow processing without detected faces
	const canProcess = sourceFile && targetFile;

	// Available models
	const AVAILABLE_MODELS = [
		{ id: "inswapper_128", name: "InSwapper 128" },
		{ id: "inswapper_128_beta", name: "InSwapper 128 Beta" },
		{ id: "hyperswap_1a_256", name: "HyperSwap 1A 256" },
		{ id: "blendswap_256", name: "BlendSwap 256" },
		{ id: "simswap_256", name: "SimSwap 256" },
	];

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
				{/* Header */}
				<DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
							<ScanFace className="h-5 w-5 text-white" />
						</div>
						<div>
							<DialogTitle className="text-xl">{t("faceswap.dialog.title")}</DialogTitle>
							<p className="text-sm text-muted-foreground">
								{t("faceswap.dialog.subtitle")}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{facefusionEnableModal && (
							<Badge variant="outline" className="gap-1">
								<Sparkles className="w-3 h-3" />
								{t("faceswap.dialog.modalEnabled")}
							</Badge>
						)}
					</div>
				</DialogHeader>

				{/* Main Content */}
				<div className="flex-1 flex min-h-0">
					{/* Left Panel - Upload & Settings */}
					<div className="w-80 border-r flex flex-col shrink-0">
						<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
							<TabsList className="w-full justify-start rounded-none border-b h-10 px-4 shrink-0">
								<TabsTrigger value="files" className="text-xs">
									{t("faceswap.dialog.filesTab")}
								</TabsTrigger>
								<TabsTrigger value="settings" className="text-xs">
									{t("faceswap.dialog.settingsTab")}
								</TabsTrigger>
							</TabsList>

							<div className="flex-1 min-h-0 flex flex-col">
								<TabsContent value="files" className="flex-1 overflow-y-auto p-4 space-y-4 m-0 data-[state=inactive]:hidden">
									{/* Source Upload */}
									<div className="space-y-2">
										<label className="text-sm font-medium">{t("faceswap.dialog.sourceFace")}</label>
										{sourceFile ? (
											<div className="relative group">
												<img
													src={sourceFile.preview}
													alt="Source"
													className="w-full aspect-square object-cover rounded-lg border"
												/>
												<Button
													variant="destructive"
													size="icon"
													className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
													onClick={() => setSourceFile(null)}
												>
													<X className="h-3 w-3" />
												</Button>
											</div>
										) : (
											<label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
												<Upload className="h-8 w-8 text-muted-foreground mb-2" />
												<span className="text-sm text-muted-foreground">
													{t("faceswap.dialog.uploadSource")}
												</span>
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={(e) => e.target.files?.[0] && handleSourceUpload(e.target.files[0])}
												/>
											</label>
										)}
									</div>

									{/* Target Upload */}
									<div className="space-y-2">
										<label className="text-sm font-medium">{t("faceswap.dialog.targetMedia")}</label>
										{targetFile ? (
											<div className="relative group">
												{targetFile.isVideo ? (
													<div className="w-full aspect-video bg-muted rounded-lg border flex items-center justify-center">
														<Video className="h-12 w-12 text-muted-foreground" />
													</div>
												) : (
													<img
														src={targetFile.preview}
														alt="Target"
														className="w-full aspect-video object-cover rounded-lg border"
													/>
												)}
												<Button
													variant="destructive"
													size="icon"
													className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
													onClick={() => setTargetFile(null)}
												>
													<X className="h-3 w-3" />
												</Button>
												<div className="absolute bottom-2 left-2">
													<Badge variant="secondary" className="text-[10px]">
														{targetFile.isVideo ? t("faceswap.dialog.video") : t("faceswap.dialog.image")}
													</Badge>
												</div>
											</div>
										) : (
											<label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
												<Upload className="h-8 w-8 text-muted-foreground mb-2" />
												<span className="text-sm text-muted-foreground">
													{t("faceswap.dialog.uploadTarget")}
												</span>
												<span className="text-xs text-muted-foreground mt-1">
													{t("faceswap.dialog.supportedFormats")}
												</span>
												<input
													type="file"
													accept="image/*,video/*"
													className="hidden"
													onChange={(e) => e.target.files?.[0] && handleTargetUpload(e.target.files[0])}
												/>
											</label>
										)}
									</div>

									{/* Face Selector */}
									{targetFile && (
										<div className="space-y-2">
											<label className="text-sm font-medium">{t("faceswap.dialog.detectedFaces")}</label>
											<div className="flex gap-2 flex-wrap">
												<button
													className={cn(
														"w-16 h-16 rounded-lg border-2 overflow-hidden transition-colors",
														selectedFaceIndex === 0 ? "border-primary" : "border-transparent"
													)}
													onClick={() => setSelectedFaceIndex(0)}
												>
													<div className="w-full h-full bg-muted flex items-center justify-center">
														<ScanFace className="h-6 w-6 text-muted-foreground" />
													</div>
												</button>
											</div>
											<p className="text-xs text-muted-foreground">
												{t("faceswap.dialog.selectFaceHint")}
											</p>
										</div>
									)}
								</TabsContent>

								<TabsContent value="settings" className="flex-1 overflow-y-auto p-4 space-y-4 m-0 data-[state=inactive]:hidden">
									{/* Model Selection */}
									<div className="space-y-2">
										<label className="text-sm font-medium">{t("faceswap.dialog.model")}</label>
										<select
											value={selectedModel}
											onChange={(e) => setSelectedModel(e.target.value)}
											className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
										>
											{AVAILABLE_MODELS.map((model) => (
												<option key={model.id} value={model.id}>
													{model.name}
												</option>
											))}
										</select>
										<p className="text-xs text-muted-foreground">
											{t("faceswap.dialog.modelHint")}
										</p>
									</div>

									{/* Processing Options */}
									<div className="space-y-3">
										<label className="text-sm font-medium">{t("faceswap.dialog.processingOptions")}</label>
										
										<div className="flex items-center justify-between">
											<span className="text-sm">{t("faceswap.dialog.faceEnhancer")}</span>
											<input type="checkbox" className="h-4 w-4" />
										</div>

										<div className="flex items-center justify-between">
											<span className="text-sm">{t("faceswap.dialog.frameEnhancer")}</span>
											<input type="checkbox" className="h-4 w-4" />
										</div>
									</div>
								</TabsContent>
							</div>
						</Tabs>

						{/* Bottom Action - Fixed at bottom */}
						<div className="p-4 border-t shrink-0 bg-background">
							<Button
								onClick={handleProcess}
								disabled={!canProcess || isProcessing}
								className="w-full gap-2"
							>
								{isProcessing ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										{t("faceswap.dialog.processing")}
									</>
								) : (
									<>
										<Play className="h-4 w-4" />
										{t("faceswap.dialog.startProcess")}
									</>
								)}
							</Button>
						</div>
					</div>

					{/* Right Panel - Preview & Progress */}
					<div className="flex-1 flex flex-col min-h-0">
						{/* Preview Area */}
						<div className="flex-1 p-4 min-h-0">
							<div className="h-full bg-muted/30 rounded-lg border flex items-center justify-center">
								{sourceFile && targetFile ? (
									<div className="text-center">
										<div className="flex items-center justify-center gap-8 mb-4">
											<div className="text-center">
												<img
													src={sourceFile.preview}
													alt="Source"
													className="w-32 h-32 object-cover rounded-lg border mb-2"
												/>
												<span className="text-xs text-muted-foreground">
													{t("faceswap.dialog.source")}
												</span>
											</div>
											<ChevronRight className="h-8 w-8 text-muted-foreground" />
											<div className="text-center">
												{targetFile.isVideo ? (
													<div className="w-48 h-32 bg-muted rounded-lg border flex items-center justify-center mb-2">
														<Video className="h-8 w-8 text-muted-foreground" />
													</div>
												) : (
													<img
														src={targetFile.preview}
														alt="Target"
														className="w-48 h-32 object-cover rounded-lg border mb-2"
													/>
												)}
												<span className="text-xs text-muted-foreground">
													{t("faceswap.dialog.target")}
												</span>
											</div>
										</div>
										<p className="text-sm text-muted-foreground">
											{t("faceswap.dialog.previewHint")}
										</p>
									</div>
								) : (
									<div className="text-center">
										<ScanFace className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
										<p className="text-muted-foreground">
											{t("faceswap.dialog.uploadPrompt")}
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Progress & Logs */}
						{(isProcessing || progress) && (
							<div className="border-t p-4 space-y-3 shrink-0">
								{progress && (
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span>{progress.status}</span>
											<span>{progress.progress}%</span>
										</div>
										<Progress value={progress.progress} />
										{progress.totalFrames > 0 && (
											<div className="flex items-center justify-between text-xs text-muted-foreground">
												<span>{t("faceswap.dialog.frame")}: {progress.currentFrame}/{progress.totalFrames}</span>
												<span>{progress.speed.toFixed(1)} fps</span>
											</div>
										)}
									</div>
								)}

								{/* Terminal Logs */}
								<ScrollArea className="h-32 bg-muted/50 rounded-lg p-2">
									<pre className="text-xs font-mono">
										{logs.map((log, i) => (
											<div key={i} className="text-muted-foreground">
												{log}
											</div>
										))}
									</pre>
								</ScrollArea>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}