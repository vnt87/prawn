import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export function DeleteProjectDialog({
	isOpen,
	onOpenChange,
	onConfirm,
	projectNames,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	projectNames: string[];
}) {
	const { t } = useTranslation();
	const [confirmValue, setConfirmValue] = useState("");
	const count = projectNames.length;
	const isSingle = count === 1;
	const singleName = isSingle ? projectNames[0] : null;

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					event.stopPropagation();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{singleName ? (
							t("dialogs.delete.titleSingle", { name: singleName })
						) : (
							t("dialogs.delete.titlePlural", { count })
						)}
					</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<Alert variant="destructive">
						<AlertTitle>{t("dialogs.delete.warning")}</AlertTitle>
						<AlertDescription>
							{singleName ? (
								t("dialogs.delete.descriptionSingle", { name: singleName })
							) : (
								t("dialogs.delete.descriptionPlural", { count })
							)}
						</AlertDescription>
					</Alert>
					<div className="flex flex-col gap-3">
						<Label className="text-xs font-semibold text-slate-500">
							{t("dialogs.delete.confirmLabel")}
						</Label>
						<Input
							type="text"
							placeholder={t("dialogs.delete.confirmPlaceholder")}
							size="lg"
							variant="destructive"
							value={confirmValue}
							onChange={(e) => setConfirmValue(e.target.value)}
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={confirmValue !== "DELETE"}
					>
						{t("dialogs.delete.confirmButton")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
