import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptyView() {
	const { t } = useTranslation();

	return (
		<div className="bg-background flex h-full flex-col items-center justify-center gap-3 p-4">
			<Settings
				className="text-muted-foreground/75 size-10"
				strokeWidth={1}
			/>
			<div className="flex flex-col gap-2 text-center">
				<p className="text-lg font-medium ">{t("properties.empty.title")}</p>
				<p className="text-muted-foreground text-sm text-balance">
					{t("properties.empty.description")}
				</p>
			</div>
		</div>
	);
}