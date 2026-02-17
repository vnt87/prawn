import type { AudioElement } from "@/types/timeline";
import { useTranslation } from "react-i18next";

export function AudioProperties({ _element }: { _element: AudioElement }) {
	const { t } = useTranslation();
	return <div className="space-y-4 p-5">{t("properties.audio")}</div>;
}
