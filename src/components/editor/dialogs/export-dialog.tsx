"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { getExportMimeType, getExportFileExtension } from "@/lib/export";
import { Check, Copy, Download, RotateCcw } from "lucide-react";
import {
    EXPORT_FORMAT_VALUES,
    EXPORT_QUALITY_VALUES,
    type ExportFormat,
    type ExportQuality,
    type ExportResult,
} from "@/types/export";
import { PropertyGroup } from "@/components/editor/panels/properties/property-item";
import { useEditor } from "@/hooks/use-editor";
import { DEFAULT_EXPORT_OPTIONS } from "@/constants/export-constants";

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
    const editor = useEditor();
    const activeProject = editor.project.getActive();
    const [format, setFormat] = useState<ExportFormat>(
        DEFAULT_EXPORT_OPTIONS.format,
    );
    const [quality, setQuality] = useState<ExportQuality>(
        DEFAULT_EXPORT_OPTIONS.quality,
    );
    const [includeAudio, setIncludeAudio] = useState<boolean>(
        DEFAULT_EXPORT_OPTIONS.includeAudio || true,
    );
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [exportResult, setExportResult] = useState<ExportResult | null>(null);
    const cancelRequestedRef = useRef(false);

    const handleExport = async () => {
        if (!activeProject) return;

        cancelRequestedRef.current = false;
        setIsExporting(true);
        setProgress(0);
        setExportResult(null);

        const result = await editor.project.export({
            options: {
                format,
                quality,
                fps: activeProject.settings.fps,
                includeAudio,
                onProgress: ({ progress }) => setProgress(progress),
                onCancel: () => cancelRequestedRef.current,
            },
        });

        setIsExporting(false);

        if (result.cancelled) {
            setExportResult(null);
            setProgress(0);
            return;
        }

        setExportResult(result);

        if (result.success && result.buffer) {
            const mimeType = getExportMimeType({ format });
            const extension = getExportFileExtension({ format });
            const blob = new Blob([result.buffer], { type: mimeType });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${activeProject.metadata.name}${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onOpenChange(false);
            setExportResult(null);
            setProgress(0);
        }
    };

    const handleCancel = () => {
        cancelRequestedRef.current = true;
    };

    if (!activeProject) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isExporting ? "Exporting project" : "Export project"}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {exportResult && !exportResult.success ? (
                        <ExportError
                            error={exportResult.error || "Unknown error occurred"}
                            onRetry={handleExport}
                        />
                    ) : (
                        <>
                            {!isExporting && (
                                <>
                                    <div className="flex flex-col gap-4">
                                        <PropertyGroup
                                            title="Format"
                                            defaultExpanded={true}
                                            hasBorderTop={false}
                                        >
                                            <RadioGroup
                                                value={format}
                                                onValueChange={(value) => {
                                                    if (isExportFormat(value)) {
                                                        setFormat(value);
                                                    }
                                                }}
                                                className="gap-2"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="mp4" id="mp4" />
                                                    <Label htmlFor="mp4">
                                                        MP4 (H.264) - Better compatibility
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="webm" id="webm" />
                                                    <Label htmlFor="webm">
                                                        WebM (VP9) - Smaller file size
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </PropertyGroup>

                                        <PropertyGroup title="Quality" defaultExpanded={false}>
                                            <RadioGroup
                                                value={quality}
                                                onValueChange={(value) => {
                                                    if (isExportQuality(value)) {
                                                        setQuality(value);
                                                    }
                                                }}
                                                className="gap-2"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="low" id="low" />
                                                    <Label htmlFor="low">Low</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="medium" id="medium" />
                                                    <Label htmlFor="medium">Medium</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="high" id="high" />
                                                    <Label htmlFor="high">High</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="very_high" id="very_high" />
                                                    <Label htmlFor="very_high">Very High</Label>
                                                </div>
                                            </RadioGroup>
                                        </PropertyGroup>

                                        <PropertyGroup title="Audio" defaultExpanded={false}>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-audio"
                                                    checked={includeAudio}
                                                    onCheckedChange={(checked) =>
                                                        setIncludeAudio(!!checked)
                                                    }
                                                />
                                                <Label htmlFor="include-audio">
                                                    Include audio in export
                                                </Label>
                                            </div>
                                        </PropertyGroup>
                                    </div>

                                    <div className="pt-2">
                                        <Button onClick={handleExport} className="w-full gap-2">
                                            <Download className="size-4" />
                                            Export
                                        </Button>
                                    </div>
                                </>
                            )}

                            {isExporting && (
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between text-center">
                                            <p className="text-muted-foreground mb-2 text-sm">
                                                {Math.round(progress * 100)}%
                                            </p>
                                            <p className="text-muted-foreground mb-2 text-sm">100%</p>
                                        </div>
                                        <Progress value={progress * 100} className="w-full" />
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function isExportFormat(value: string): value is ExportFormat {
    return EXPORT_FORMAT_VALUES.some((formatValue) => formatValue === value);
}

function isExportQuality(value: string): value is ExportQuality {
    return EXPORT_QUALITY_VALUES.some((qualityValue) => qualityValue === value);
}

function ExportError({
    error,
    onRetry,
}: {
    error: string;
    onRetry: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(error);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
                <p className="text-destructive text-sm font-medium">Export failed</p>
                <p className="text-muted-foreground text-xs">{error}</p>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 text-xs"
                    onClick={handleCopy}
                >
                    {copied ? <Check className="text-constructive" /> : <Copy />}
                    Copy
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 text-xs"
                    onClick={onRetry}
                >
                    <RotateCcw />
                    Retry
                </Button>
            </div>
        </div>
    );
}
