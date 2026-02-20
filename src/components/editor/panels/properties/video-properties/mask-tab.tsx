import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    Circle,
    RectangleHorizontal,
    Star,
    Heart,
    Type,
    Brush,
    PenTool,
    Layout,
    Film,
    RefreshCcw,
    ChevronUp,
    ChevronDown,
    Lock,
    Maximize2,
} from "lucide-react";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
} from "../property-item";
import { cn } from "@/utils/ui";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function MaskTab({
    element: _element,
    trackId: _trackId,
}: {
    element: VideoElement | ImageElement;
    /** Reserved for future mask persistence via updateElements */
    trackId: string;
}) {
    const { t } = useTranslation();
    const [selectedShape, setSelectedShape] = useState<string>("rectangle");

    const shapes = [
        { id: "split", label: t("properties.video.mask.shapes.split"), icon: Layout },
        { id: "filmstrip", label: t("properties.video.mask.shapes.filmstrip"), icon: Film },
        { id: "circle", label: t("properties.video.mask.shapes.circle"), icon: Circle },
        { id: "rectangle", label: t("properties.video.mask.shapes.rectangle"), icon: RectangleHorizontal },
        { id: "stars", label: t("properties.video.mask.shapes.stars"), icon: Star },
        { id: "heart", label: t("properties.video.mask.shapes.heart"), icon: Heart },
        { id: "text", label: t("properties.video.mask.shapes.text"), icon: Type },
        { id: "brush", label: t("properties.video.mask.shapes.brush"), icon: Brush },
        { id: "pen", label: t("properties.video.mask.shapes.pen"), icon: PenTool },
    ];

    return (
        <div className="flex flex-col pb-20">
            <PropertyGroup title={t("properties.video.mask.title")} defaultExpanded={true} collapsible={false}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <span className="text-xs font-medium">{t("properties.video.mask.title")}</span>
                    </div>
                </div>

                {/* Selected Mask Badge */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-secondary/50 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                        Mask1 {shapes.find((s) => s.id === selectedShape)?.label}
                    </div>
                    <Button variant="ghost" size="icon" className="size-6 rounded-full">
                        <span className="text-lg leading-none">+</span>
                    </Button>
                </div>

                {/* Shape Grid */}
                <div className="grid grid-cols-6 gap-2 mb-6">
                    {shapes.map((shape) => (
                        <div
                            key={shape.id}
                            className="flex flex-col items-center gap-1 cursor-pointer group"
                            onClick={() => setSelectedShape(shape.id)}
                        >
                            <div
                                className={cn(
                                    "size-10 rounded border flex items-center justify-center transition-colors",
                                    selectedShape === shape.id
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
                <div className="space-y-4">
                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.basic.position")}</PropertyItemLabel>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <span className="text-muted-foreground text-xs">X</span>
                                <div className="flex-1 text-center text-xs">0</div>
                                <div className="flex flex-col -gap-1">
                                    <ChevronUp className="size-2 text-muted-foreground cursor-pointer" />
                                    <ChevronDown className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <span className="text-muted-foreground text-xs">Y</span>
                                <div className="flex-1 text-center text-xs">0</div>
                                <div className="flex flex-col -gap-1">
                                    <ChevronUp className="size-2 text-muted-foreground cursor-pointer" />
                                    <ChevronDown className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.basic.rotate")}</PropertyItemLabel>
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center gap-1 bg-secondary rounded px-2 py-1 w-20">
                                <div className="flex-1 text-center text-xs">0.0°</div>
                                <div className="flex flex-col -gap-1">
                                    <ChevronUp className="size-2 text-muted-foreground cursor-pointer" />
                                    <ChevronDown className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                            <div className="size-6 rounded-full border border-muted-foreground/30 flex items-center justify-center relative cursor-pointer">
                                <div className="absolute top-1/2 left-1/2 w-2 h-0.5 bg-primary -translate-x-1/2 -translate-y-1/2 rotate-45" />
                            </div>
                        </div>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.scale")}</PropertyItemLabel>
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <Maximize2 className="size-3 text-muted-foreground rotate-90" />
                                <div className="flex-1 text-center text-xs">540</div>
                                <div className="flex flex-col -gap-1">
                                    <ChevronUp className="size-2 text-muted-foreground cursor-pointer" />
                                    <ChevronDown className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                            <Lock className="size-3 text-muted-foreground" />
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <Maximize2 className="size-3 text-muted-foreground" />
                                <div className="flex-1 text-center text-xs">540</div>
                                <div className="flex flex-col -gap-1">
                                    <ChevronUp className="size-2 text-muted-foreground cursor-pointer" />
                                    <ChevronDown className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </PropertyItem>

                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>{t("properties.video.mask.feather")}</PropertyItemLabel>
                            <div className="bg-secondary px-2 py-0.5 rounded text-[10px] min-w-[30px] text-center">0</div>
                        </div>
                        <Slider defaultValue={[0]} max={100} step={1} />
                    </PropertyItem>

                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>{t("properties.video.mask.roundCorners")}</PropertyItemLabel>
                            <div className="bg-secondary px-2 py-0.5 rounded text-[10px] min-w-[30px] text-center">0</div>
                        </div>
                        <Slider defaultValue={[0]} max={100} step={1} />
                    </PropertyItem>
                </div>
            </PropertyGroup>

            {/* Track Mask */}
            <PropertyGroup title={t("properties.video.mask.track")} defaultExpanded={false}>
                <div className="space-y-4">
                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.mask.direction")}</PropertyItemLabel>
                        <div className="bg-secondary rounded px-3 py-1.5 text-xs w-full max-w-[200px] flex justify-between items-center cursor-pointer">
                            {t("properties.video.mask.both")}
                            <ChevronDown className="size-3 opacity-50" />
                        </div>
                    </PropertyItem>
                    <div className="flex justify-end">
                        <Button size="sm" className="h-7 px-4">{t("properties.video.mask.trackBtn")}</Button>
                    </div>
                </div>
            </PropertyGroup>
        </div>
    );
}
