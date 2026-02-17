import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    CircleIcon,
    RectangularIcon,
    StarIcon,
    FavouriteIcon,
    TextIcon,
    PaintBoardIcon,
    PencilEdit02Icon,
    Layout01Icon,
    Film02Icon,
    RefreshIcon,
    ArrowUp01Icon,
    ArrowDown01Icon,
    SquareLock02Icon,
    MaximizeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
} from "../property-item";
import { cn } from "@/utils/ui";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MaskTab({ element }: { element: VideoElement | ImageElement }) {
    const [selectedShape, setSelectedShape] = useState<string>("rectangle");

    const shapes = [
        { id: "split", label: "Split", icon: Layout01Icon },
        { id: "filmstrip", label: "Filmstrip", icon: Film02Icon },
        { id: "circle", label: "Circle", icon: CircleIcon },
        { id: "rectangle", label: "Rectangle", icon: RectangularIcon },
        { id: "stars", label: "Stars", icon: StarIcon },
        { id: "heart", label: "Heart", icon: FavouriteIcon },
        { id: "text", label: "Text", icon: TextIcon },
        { id: "brush", label: "Brush", icon: PaintBoardIcon },
        { id: "pen", label: "Pen", icon: PencilEdit02Icon },
    ];

    return (
        <div className="flex flex-col pb-20">
            <PropertyGroup title="Mask" defaultExpanded={true} collapsible={false}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <span className="text-xs font-medium">Mask</span>
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
                                <HugeiconsIcon icon={shape.icon} className="size-5" />
                            </div>
                            <span className="text-[10px] text-muted-foreground text-center">
                                {shape.label}
                            </span>
                        </div>
                    ))}
                </div>
            </PropertyGroup>

            {/* Mask Settings */}
            <PropertyGroup title="Mask settings" defaultExpanded={true}>
                <div className="space-y-4">
                    <PropertyItem>
                        <PropertyItemLabel>Position</PropertyItemLabel>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <span className="text-muted-foreground text-xs">X</span>
                                <div className="flex-1 text-center text-xs">0</div>
                                <div className="flex flex-col -gap-1">
                                    <HugeiconsIcon icon={ArrowUp01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <span className="text-muted-foreground text-xs">Y</span>
                                <div className="flex-1 text-center text-xs">0</div>
                                <div className="flex flex-col -gap-1">
                                    <HugeiconsIcon icon={ArrowUp01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Rotation</PropertyItemLabel>
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center gap-1 bg-secondary rounded px-2 py-1 w-20">
                                <div className="flex-1 text-center text-xs">0.0°</div>
                                <div className="flex flex-col -gap-1">
                                    <HugeiconsIcon icon={ArrowUp01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                            <div className="size-6 rounded-full border border-muted-foreground/30 flex items-center justify-center relative cursor-pointer">
                                <div className="absolute top-1/2 left-1/2 w-2 h-0.5 bg-primary -translate-x-1/2 -translate-y-1/2 rotate-45" />
                            </div>
                        </div>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Size</PropertyItemLabel>
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <HugeiconsIcon icon={MaximizeIcon} className="size-3 text-muted-foreground rotate-90" />
                                <div className="flex-1 text-center text-xs">540</div>
                                <div className="flex flex-col -gap-1">
                                    <HugeiconsIcon icon={ArrowUp01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                            <HugeiconsIcon icon={SquareLock02Icon} className="size-3 text-muted-foreground" />
                            <div className="flex items-center gap-2 bg-secondary rounded px-2 py-1 flex-1">
                                <HugeiconsIcon icon={MaximizeIcon} className="size-3 text-muted-foreground" />
                                <div className="flex-1 text-center text-xs">540</div>
                                <div className="flex flex-col -gap-1">
                                    <HugeiconsIcon icon={ArrowUp01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-2 text-muted-foreground cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </PropertyItem>

                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>Feather</PropertyItemLabel>
                            <div className="bg-secondary px-2 py-0.5 rounded text-[10px] min-w-[30px] text-center">0</div>
                        </div>
                        <Slider defaultValue={[0]} max={100} step={1} />
                    </PropertyItem>

                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>Round corners</PropertyItemLabel>
                            <div className="bg-secondary px-2 py-0.5 rounded text-[10px] min-w-[30px] text-center">0</div>
                        </div>
                        <Slider defaultValue={[0]} max={100} step={1} />
                    </PropertyItem>
                </div>
            </PropertyGroup>

            {/* Track Mask */}
            <PropertyGroup title="Track mask" defaultExpanded={false}>
                <div className="space-y-4">
                    <PropertyItem>
                        <PropertyItemLabel>Direction</PropertyItemLabel>
                        <div className="bg-secondary rounded px-3 py-1.5 text-xs w-full max-w-[200px] flex justify-between items-center cursor-pointer">
                            Both
                            <HugeiconsIcon icon={ArrowDown01Icon} className="size-3 opacity-50" />
                        </div>
                    </PropertyItem>
                    <div className="flex justify-end">
                        <Button size="sm" className="h-7 px-4">Track</Button>
                    </div>
                </div>
            </PropertyGroup>
        </div>
    );
}
