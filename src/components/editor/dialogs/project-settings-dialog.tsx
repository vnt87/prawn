import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RefreshCw, Monitor, Play, User, FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
    PropertyItemValue,
} from "@/components/editor/panels/properties/property-item";
import { useEditor } from "@/hooks/use-editor";
import { useEditorStore } from "@/stores/editor-store";
import { dimensionToAspectRatio } from "@/utils/geometry";
import {
    FPS_PRESETS,
    FILMSTRIP_INTERVAL_PRESETS,
    DEFAULT_FILMSTRIP_INTERVAL,
} from "@/constants/project-constants";
import { regenerateFilmstripThumbnails } from "@/lib/media/processing";

interface ProjectSettingsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProjectSettingsDialog({
    isOpen,
    onOpenChange,
}: ProjectSettingsDialogProps) {
    const { t } = useTranslation();
    const editor = useEditor();
    const activeProject = editor.project.getActiveOrNull();
    const { canvasPresets } = useEditorStore();
    const [isRegenerating, setIsRegenerating] = useState(false);

    if (!activeProject) return null;

    const handleRename = (name: string) => {
        editor.project.renameProject({
            id: activeProject.metadata.id,
            name,
        });
    };

    const handleUpdateMetadata = (updates: { author?: string; description?: string }) => {
        // Since we don't have a direct updateMetadata yet, we can use the existing save logic or add it to ProjectManager
        // For now, let's assume we'll add updateMetadata to ProjectManager or use a command if available.
        // I'll add an updateMetadata to ProjectManager in the next step.
        (editor.project as any).updateMetadata?.(updates);
    };

    const currentCanvasSize = activeProject.settings.canvasSize;
    const currentAspectRatio = dimensionToAspectRatio(currentCanvasSize);
    const originalCanvasSize = activeProject.settings.originalCanvasSize ?? null;

    const findPresetIndexByAspectRatio = ({
        presets,
        targetAspectRatio,
    }: {
        presets: Array<{ width: number; height: number }>;
        targetAspectRatio: string;
    }) => {
        for (let index = 0; index < presets.length; index++) {
            const preset = presets[index];
            const presetAspectRatio = dimensionToAspectRatio({
                width: preset.width,
                height: preset.height,
            });
            if (presetAspectRatio === targetAspectRatio) {
                return index;
            }
        }
        return -1;
    };

    const presetIndex = findPresetIndexByAspectRatio({
        presets: canvasPresets,
        targetAspectRatio: currentAspectRatio,
    });
    const originalPresetValue = "original";
    const selectedPresetValue =
        presetIndex !== -1 ? presetIndex.toString() : originalPresetValue;

    const handleAspectRatioChange = (value: string) => {
        if (value === originalPresetValue) {
            const canvasSize = originalCanvasSize ?? currentCanvasSize;
            editor.project.updateSettings({
                settings: { canvasSize },
            });
            return;
        }
        const index = parseInt(value, 10);
        const preset = canvasPresets[index];
        if (preset) {
            editor.project.updateSettings({ settings: { canvasSize: preset } });
        }
    };

    const handleFpsChange = (value: string) => {
        const fps = parseFloat(value);
        editor.project.updateSettings({ settings: { fps } });
    };

    const handleFilmstripIntervalChange = (value: string) => {
        const filmstripInterval = parseFloat(value) as 0.5 | 1 | 2;
        editor.project.updateSettings({ settings: { filmstripInterval } });
    };

    const currentFilmstripInterval =
        activeProject.settings.filmstripInterval ?? DEFAULT_FILMSTRIP_INTERVAL;
    const isDenseThumbnails = currentFilmstripInterval === 0.5;

    const mediaAssets = editor.media.getAssets();
    const videoAssets = useMemo(
        () =>
            mediaAssets.filter(
                (asset) =>
                    asset.type === "video" &&
                    asset.file &&
                    asset.duration &&
                    (asset.filmstripInterval === undefined ||
                        asset.filmstripInterval !== currentFilmstripInterval),
            ),
        [mediaAssets, currentFilmstripInterval],
    );

    const hasVideosToRegenerate = videoAssets.length > 0;

    const handleRegenerateThumbnails = async () => {
        if (!hasVideosToRegenerate || isRegenerating) return;

        setIsRegenerating(true);
        const projectId = activeProject.metadata.id;
        let successCount = 0;
        let failCount = 0;

        for (const asset of videoAssets) {
            try {
                const result = await regenerateFilmstripThumbnails({
                    videoFile: asset.file,
                    duration: asset.duration!,
                    filmstripInterval: currentFilmstripInterval,
                });

                await editor.media.updateMediaAsset({
                    projectId,
                    id: asset.id,
                    updates: {
                        filmstripThumbnails: result.filmstripThumbnails,
                        filmstripInterval: result.filmstripInterval,
                    },
                });
                successCount++;
            } catch (error) {
                console.error(
                    `Failed to regenerate thumbnails for \${asset.name}:`,
                    error,
                );
                failCount++;
            }
        }

        setIsRegenerating(false);

        if (successCount > 0 && failCount === 0) {
            toast.success(
                `Regenerated thumbnails for ${successCount} video${successCount > 1 ? "s" : ""}`,
            );
        } else if (successCount > 0 && failCount > 0) {
            toast.warning(
                `Regenerated ${successCount} video${successCount > 1 ? "s" : ""}, failed for ${failCount}`,
            );
        } else if (failCount > 0) {
            toast.error(
                `Failed to regenerate thumbnails for ${failCount} video${failCount > 1 ? "s" : ""}`,
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("projectSettings.title")}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <PropertyGroup title={t("projectSettings.general")} hasBorderTop={false}>
                        <div className="flex flex-col gap-4">
                            <PropertyItem direction="column">
                                <PropertyItemLabel>{t("projectSettings.name")}</PropertyItemLabel>
                                <PropertyItemValue>
                                    <Input
                                        value={activeProject.metadata.name}
                                        onChange={(e) => handleRename(e.target.value)}
                                    />
                                </PropertyItemValue>
                            </PropertyItem>

                            <PropertyItem direction="column">
                                <PropertyItemLabel>{t("projectSettings.author")}</PropertyItemLabel>
                                <PropertyItemValue>
                                    <div className="relative">
                                        <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-8"
                                            placeholder={t("projectSettings.authorPlaceholder")}
                                            value={activeProject.metadata.author || ""}
                                            onChange={(e) => handleUpdateMetadata({ author: e.target.value })}
                                        />
                                    </div>
                                </PropertyItemValue>
                            </PropertyItem>

                            <PropertyItem direction="column">
                                <PropertyItemLabel>{t("projectSettings.description")}</PropertyItemLabel>
                                <PropertyItemValue>
                                    <div className="relative">
                                        <FileText className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Textarea
                                            className="pl-8 min-h-[80px] resize-none"
                                            placeholder={t("projectSettings.descriptionPlaceholder")}
                                            value={activeProject.metadata.description || ""}
                                            onChange={(e) => handleUpdateMetadata({ description: e.target.value })}
                                        />
                                    </div>
                                </PropertyItemValue>
                            </PropertyItem>
                        </div>
                    </PropertyGroup>

                    <PropertyGroup title={t("projectSettings.canvas")}>
                        <div className="flex flex-col gap-4">
                            <PropertyItem direction="column">
                                <PropertyItemLabel>{t("projectSettings.aspectRatio")}</PropertyItemLabel>
                                <PropertyItemValue>
                                    <Select
                                        value={selectedPresetValue}
                                        onValueChange={handleAspectRatioChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={originalPresetValue}>Original</SelectItem>
                                            {canvasPresets.map((preset, index) => {
                                                const label = dimensionToAspectRatio({
                                                    width: preset.width,
                                                    height: preset.height,
                                                });
                                                return (
                                                    <SelectItem key={label} value={index.toString()}>
                                                        {label}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </PropertyItemValue>
                            </PropertyItem>

                            <PropertyItem direction="column">
                                <PropertyItemLabel>{t("projectSettings.frameRate")}</PropertyItemLabel>
                                <PropertyItemValue>
                                    <div className="relative">
                                        <Play className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Select
                                            value={activeProject.settings.fps.toString()}
                                            onValueChange={handleFpsChange}
                                        >
                                            <SelectTrigger className="pl-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FPS_PRESETS.map((preset) => (
                                                    <SelectItem key={preset.value} value={preset.value}>
                                                        {preset.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </PropertyItemValue>
                            </PropertyItem>
                        </div>
                    </PropertyGroup>

                    <PropertyGroup title={t("projectSettings.interface")}>
                        <div className="flex flex-col gap-4">
                            <PropertyItem direction="column">
                                <PropertyItemLabel>{t("projectSettings.thumbnailDensity")}</PropertyItemLabel>
                                <PropertyItemValue>
                                    <div className="relative">
                                        <Monitor className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Select
                                            value={currentFilmstripInterval.toString()}
                                            onValueChange={handleFilmstripIntervalChange}
                                        >
                                            <SelectTrigger className="pl-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FILMSTRIP_INTERVAL_PRESETS.map((preset) => (
                                                    <SelectItem key={preset.value} value={preset.value}>
                                                        {preset.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </PropertyItemValue>
                                {isDenseThumbnails && (
                                    <p className="mt-2 text-[11px] text-amber-500 leading-tight">
                                        ⚠️ Dense thumbnails use more memory. May affect performance on large projects.
                                    </p>
                                )}
                                {hasVideosToRegenerate && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 w-full text-xs h-8"
                                        onClick={handleRegenerateThumbnails}
                                        disabled={isRegenerating}
                                    >
                                        <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                                        {isRegenerating
                                            ? "Regenerating..."
                                            : `${t("projectSettings.regenerateThumbnails")} (${videoAssets.length})`}
                                    </Button>
                                )}
                            </PropertyItem>
                        </div>
                    </PropertyGroup>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        {t("common.saveChanges")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
