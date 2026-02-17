import type { ImageElement, VideoElement } from "@/types/timeline";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
} from "../property-item";

export function SpeedTab({ element }: { element: VideoElement | ImageElement }) {
    return (
        <div className="flex flex-col pb-20">
            <PropertyGroup title="Standard" defaultExpanded={true}>
                <div className="space-y-6">
                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>Speed</PropertyItemLabel>
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                                1.00x
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Slider defaultValue={[1]} min={0.1} max={100} step={0.1} />
                        </div>
                    </PropertyItem>

                    <PropertyItem direction="column" className="items-stretch gap-2">
                        <div className="flex justify-between">
                            <PropertyItemLabel>Duration</PropertyItemLabel>
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                                5.0s
                            </span>
                        </div>
                        <div className="h-1 bg-secondary rounded w-full overflow-hidden">
                            <div className="h-full bg-primary/20 w-full" />
                        </div>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>Change audio pitch</PropertyItemLabel>
                        <Switch />
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel className="opacity-50">
                            Smooth slow-mo
                        </PropertyItemLabel>
                        <Switch disabled />
                    </PropertyItem>
                </div>
            </PropertyGroup>
        </div>
    );
}
