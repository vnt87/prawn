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
    Move,
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

    function updateMaskLive(updates: Partial<ClipMask>) {
        editor.timeline.updateElements({
            updates: [{ trackId, elementId: element.id, updates: { mask: { ...mask, ...updates } } }],
            pushHistory: false,
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

            {/* Mask Settings */}
            <PropertyGroup title={t("properties.video.mask.settings")} defaultExpanded={true}>
                <div className="space-y-5">
                    {/* Position X */}
                    <MaskSlider
                        label={`${t("properties.video.basic.position")} X`}
                        value={Math.round(mask.x * 100)}
                        min={0} max={100}
                        disabled={!mask.enabled}
                        onChange={(v) => updateMaskLive({ x: v / 100 })}
                        onCommit={(v) => updateMask({ x: v / 100 })}
                    />

                    {/* Position Y */}
                    <MaskSlider
                        label={`${t("properties.video.basic.position")} Y`}
                        value={Math.round(mask.y * 100)}
                        min={0} max={100}
                        disabled={!mask.enabled}
                        onChange={(v) => updateMaskLive({ y: v / 100 })}
                        onCommit={(v) => updateMask({ y: v / 100 })}
                    />

                    {/* Scale X (Width) */}
                    <MaskSlider
                        label={`${t("properties.video.scale")} W`}
                        value={Math.round(mask.scaleX * 100)}
                        min={5} max={200}
                        disabled={!mask.enabled}
                        onChange={(v) => updateMaskLive({ scaleX: v / 100 })}
                        onCommit={(v) => updateMask({ scaleX: v / 100 })}
                    />

                    {/* Scale Y (Height) */}
                    <MaskSlider
                        label={`${t("properties.video.scale")} H`}
                        value={Math.round(mask.scaleY * 100)}
                        min={5} max={200}
                        disabled={!mask.enabled}
                        onChange={(v) => updateMaskLive({ scaleY: v / 100 })}
                        onCommit={(v) => updateMask({ scaleY: v / 100 })}
                    />

                    {/* Rotation */}
                    <MaskSlider
                        label={t("properties.video.basic.rotate")}
                        value={mask.rotation}
                        min={-180} max={180}
                        suffix="°"
                        disabled={!mask.enabled}
                        onChange={(v) => updateMaskLive({ rotation: v })}
                        onCommit={(v) => updateMask({ rotation: v })}
                    />

                    {/* Round Corners (rectangle only) */}
                    {mask.shape === "rectangle" && (
                        <MaskSlider
                            label={t("properties.video.mask.roundCorners")}
                            value={mask.roundCorners}
                            min={0} max={100}
                            disabled={!mask.enabled}
                            onChange={(v) => updateMaskLive({ roundCorners: v })}
                            onCommit={(v) => updateMask({ roundCorners: v })}
                        />
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

            {/* Edit Mask on Preview */}
            {mask.enabled && (
                <div className="px-4 pt-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs gap-1.5"
                        onClick={() => {
                            // Center & reset mask scale to make it clearly visible for editing
                            updateMask({ x: 0.5, y: 0.5 });
                        }}
                    >
                        <Move size={12} />
                        {t("properties.video.mask.editMask")}
                    </Button>
                </div>
            )}
        </div>
    );
}

// ── Reusable slider for mask properties ───────────────────────────────────

function MaskSlider({
    label,
    value,
    min,
    max,
    suffix = "",
    disabled = false,
    onChange,
    onCommit,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    suffix?: string;
    disabled?: boolean;
    onChange: (v: number) => void;
    onCommit: (v: number) => void;
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className={cn("text-xs", disabled ? "text-muted-foreground/60" : "text-muted-foreground")}>
                    {label}
                </span>
                <div className="bg-secondary/50 rounded px-2 py-0.5 text-[10px] w-14 text-center">
                    {value}{suffix}
                </div>
            </div>
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={1}
                disabled={disabled}
                onValueChange={([v]) => onChange(v)}
                onPointerUp={() => onCommit(value)}
            />
        </div>
    );
}
