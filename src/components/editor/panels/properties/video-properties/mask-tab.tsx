"use client";

import type { ClipMask, ImageElement, MaskShape, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    Circle,
    RectangleHorizontal,
    Star,
    Heart,
    Layout,
    Film,
    RefreshCcw,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
} from "../property-item";
import { cn } from "@/utils/ui";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useEditor } from "@/hooks/use-editor";

const DEFAULT_MASK: ClipMask = {
    shape: "rectangle",
    enabled: true,
    x: 0.5,
    y: 0.5,
    scaleX: 0.8,
    scaleY: 0.8,
    rotation: 0,
    feather: 0,
    roundCorners: 0,
    inverted: false,
};

export function MaskTab({
    element,
    trackId,
}: {
    element: VideoElement | ImageElement;
    trackId: string;
}) {
    const { t } = useTranslation();
    const editor = useEditor();

    const mask: ClipMask = element.mask ?? { ...DEFAULT_MASK, enabled: false };

    function updateMask(updates: Partial<ClipMask>) {
        editor.timeline.updateElements({
            updates: [{ trackId, elementId: element.id, updates: { mask: { ...mask, ...updates } } }],
        });
    }

    function removeMask() {
        editor.timeline.updateElements({
            updates: [{ trackId, elementId: element.id, updates: { mask: undefined } }],
        });
    }

    const shapes: { id: MaskShape; label: string; icon: React.ElementType }[] = [
        { id: "split", label: t("properties.video.mask.shapes.split"), icon: Layout },
        { id: "filmstrip", label: t("properties.video.mask.shapes.filmstrip"), icon: Film },
        { id: "circle", label: t("properties.video.mask.shapes.circle"), icon: Circle },
        { id: "rectangle", label: t("properties.video.mask.shapes.rectangle"), icon: RectangleHorizontal },
        { id: "stars", label: t("properties.video.mask.shapes.stars"), icon: Star },
        { id: "heart", label: t("properties.video.mask.shapes.heart"), icon: Heart },
    ];

    return (
        <div className="flex flex-col pb-20">
            <PropertyGroup title={t("properties.video.mask.title")} defaultExpanded={true} collapsible={false}>
                {/* Mask on/off toggle */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={mask.enabled}
                            onCheckedChange={(v) => updateMask({ enabled: v })}
                        />
                        <span className="text-xs font-medium">{t("properties.video.mask.title")}</span>
                    </div>
                    {element.mask && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={removeMask}>
                            <RefreshCcw className="size-3 mr-1" />
                            {t("properties.video.adjust.resetAll")}
                        </Button>
                    )}
                </div>

                {/* Shape Grid */}
                <div className="grid grid-cols-6 gap-2 mb-6">
                    {shapes.map((shape) => (
                        <div
                            key={shape.id}
                            className="flex flex-col items-center gap-1 cursor-pointer group"
                            onClick={() => updateMask({ shape: shape.id, enabled: true })}
                        >
                            <div
                                className={cn(
                                    "size-10 rounded border flex items-center justify-center transition-colors",
                                    mask.shape === shape.id && mask.enabled
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border bg-card text-muted-foreground group-hover:border-primary/50"
                                )}
                            >
                                <shape.icon className="size-5" />
                            </div>
                            <span className="text-[10px] text-muted-foreground text-center">
                                {shape.label}
                            </span>
                        </div>
                    ))}
                </div>
            </PropertyGroup>

            {/* Mask Settings — only editable when enabled */}
            <PropertyGroup title={t("properties.video.mask.settings")} defaultExpanded={true}>
                <div className="space-y-4">
                    {/* Position */}
                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.basic.position")}</PropertyItemLabel>
                        <div className="flex gap-2">
                            <NumericInput
                                label="X"
                                value={Math.round(mask.x * 100)}
                                onChange={(v) => updateMask({ x: v / 100 })}
                                disabled={!mask.enabled}
                            />
                            <NumericInput
                                label="Y"
                                value={Math.round(mask.y * 100)}
                                onChange={(v) => updateMask({ y: v / 100 })}
                                disabled={!mask.enabled}
                            />
                        </div>
                    </PropertyItem>

                    {/* Scale */}
                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.scale")}</PropertyItemLabel>
                        <div className="flex gap-2">
                            <NumericInput
                                label="W"
                                value={Math.round(mask.scaleX * 100)}
                                onChange={(v) => updateMask({ scaleX: v / 100 })}
                                disabled={!mask.enabled}
                            />
                            <NumericInput
                                label="H"
                                value={Math.round(mask.scaleY * 100)}
                                onChange={(v) => updateMask({ scaleY: v / 100 })}
                                disabled={!mask.enabled}
                            />
                        </div>
                    </PropertyItem>

                    {/* Rotation */}
                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.basic.rotate")}</PropertyItemLabel>
                        <NumericInput
                            label="°"
                            value={mask.rotation}
                            onChange={(v) => updateMask({ rotation: v })}
                            disabled={!mask.enabled}
                        />
                    </PropertyItem>

                    {/* Feather */}
                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>{t("properties.video.mask.feather")}</PropertyItemLabel>
                            <div className="bg-secondary px-2 py-0.5 rounded text-[10px] min-w-[30px] text-center">{mask.feather}</div>
                        </div>
                        <Slider
                            value={[mask.feather]}
                            min={0}
                            max={50}
                            step={1}
                            disabled={!mask.enabled}
                            onValueChange={([v]) => updateMask({ feather: v })}
                        />
                    </PropertyItem>

                    {/* Round Corners (rectangle only) */}
                    {mask.shape === "rectangle" && (
                        <PropertyItem direction="column" className="items-stretch gap-2">
                            <div className="flex justify-between">
                                <PropertyItemLabel>{t("properties.video.mask.roundCorners")}</PropertyItemLabel>
                                <div className="bg-secondary px-2 py-0.5 rounded text-[10px] min-w-[30px] text-center">{mask.roundCorners}</div>
                            </div>
                            <Slider
                                value={[mask.roundCorners]}
                                min={0}
                                max={100}
                                step={1}
                                disabled={!mask.enabled}
                                onValueChange={([v]) => updateMask({ roundCorners: v })}
                            />
                        </PropertyItem>
                    )}

                    {/* Invert toggle */}
                    <PropertyItem>
                        <PropertyItemLabel>Invert</PropertyItemLabel>
                        <Switch
                            checked={mask.inverted}
                            disabled={!mask.enabled}
                            onCheckedChange={(v) => updateMask({ inverted: v })}
                        />
                    </PropertyItem>
                </div>
            </PropertyGroup>
        </div>
    );
}

// ── Tiny numeric input helper ──────────────────────────────────────────────

function NumericInput({
    label,
    value,
    onChange,
    disabled = false,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
}) {
    return (
        <div className={cn("flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1", disabled && "opacity-50")}>
            <span className="text-muted-foreground text-xs">{label}</span>
            <input
                type="number"
                value={value}
                disabled={disabled}
                className="flex-1 text-center text-xs bg-transparent border-none outline-none w-0 min-w-0"
                onChange={(e) => {
                    const n = parseFloat(e.target.value);
                    if (!isNaN(n)) onChange(n);
                }}
            />
            <div className="flex flex-col gap-0">
                <ChevronUp className="size-2 text-muted-foreground cursor-pointer" onClick={() => !disabled && onChange(value + 1)} />
                <ChevronDown className="size-2 text-muted-foreground cursor-pointer" onClick={() => !disabled && onChange(value - 1)} />
            </div>
        </div>
    );
}
