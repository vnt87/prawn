import type { ImageElement, VideoElement } from "@/types/timeline";
import { useEditor } from "@/hooks/use-editor";
import {
    PropertyGroup,
    PropertyItem,
    PropertyItemLabel,
    PropertyItemValue,
} from "../property-item";
import { useTranslation } from "react-i18next";

function formatDuration(duration: number) {
    const min = Math.floor(duration / 60);
    const sec = Math.floor(duration % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function InfoTab({ element }: { element: VideoElement | ImageElement }) {
    const editor = useEditor();
    const { t } = useTranslation();
    const asset = editor.media.getAssets().find((a) => a.id === element.mediaId);

    if (!asset) {
        return <div className="p-4 text-muted-foreground text-sm">{t("properties.video.info.assetNotFound")}</div>;
    }

    return (
        <div className="flex flex-col">
            <PropertyGroup title={t("properties.video.info.details")} defaultExpanded={true} collapsible={false}>
                <div className="space-y-4">
                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.info.name")}</PropertyItemLabel>
                        <PropertyItemValue className="text-right truncate pl-4">
                            {asset.name}
                        </PropertyItemValue>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.info.resolution")}</PropertyItemLabel>
                        <PropertyItemValue className="text-right">
                            {asset.width && asset.height
                                ? `${asset.width}x${asset.height}`
                                : "Unknown"}
                        </PropertyItemValue>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.info.frameRate")}</PropertyItemLabel>
                        <PropertyItemValue className="text-right">
                            {asset.fps ? `${asset.fps.toFixed(2)}fps` : "Unknown"}
                        </PropertyItemValue>
                    </PropertyItem>

                    <PropertyItem>
                        <PropertyItemLabel>{t("properties.video.info.duration")}</PropertyItemLabel>
                        <PropertyItemValue className="text-right">
                            {asset.duration ? formatDuration(asset.duration) : "Unknown"}
                        </PropertyItemValue>
                    </PropertyItem>
                </div>
            </PropertyGroup>
        </div>
    );
}
