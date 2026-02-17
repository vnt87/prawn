import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIntegrationsStore } from "@/stores/integrations-store";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Music, Cloud, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

export function IntegrationsDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation();
    const store = useIntegrationsStore();
    const [values, setValues] = useState(store);

    useEffect(() => {
        if (open) {
            setValues(store);
        }
    }, [open, store]);

    const handleChange = (key: keyof typeof values, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        Object.entries(values).forEach(([key, value]) => {
            if (typeof value === 'string' && key !== 'setIntegration') {
                store.setIntegration(key as any, value);
            }
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[600px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{t("integrations.title")}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="database" orientation="vertical" className="flex h-full">
                        <TabsList className="flex flex-col h-full w-48 justify-start gap-1 p-2 bg-muted/30 border-r">
                            <TabsTrigger value="database" className="w-full justify-start gap-2 px-3">
                                <Database size={16} />
                                {t("integrations.database")}
                            </TabsTrigger>
                            <TabsTrigger value="assets" className="w-full justify-start gap-2 px-3">
                                <Music size={16} />
                                {t("integrations.assets")}
                            </TabsTrigger>
                            <TabsTrigger value="storage" className="w-full justify-start gap-2 px-3">
                                <Cloud size={16} />
                                {t("integrations.storage")}
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="w-full justify-start gap-2 px-3">
                                <Bot size={16} />
                                {t("integrations.ai")}
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto p-6">
                            <TabsContent value="database" className="mt-0 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Database className="text-muted-foreground" />
                                        <h3 className="text-lg font-medium">{t("integrations.upstash.title")}</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="upstashRedisUrl">{t("integrations.upstash.url")}</Label>
                                            <Input
                                                id="upstashRedisUrl"
                                                value={values.upstashRedisUrl}
                                                onChange={(e) => handleChange("upstashRedisUrl", e.target.value)}
                                                placeholder="https://gusc1-fitting-catfish-31079.upstash.io"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="upstashRedisToken">{t("integrations.upstash.token")}</Label>
                                            <Input
                                                id="upstashRedisToken"
                                                type="password"
                                                value={values.upstashRedisToken}
                                                onChange={(e) => handleChange("upstashRedisToken", e.target.value)}
                                                placeholder="AAT_ASQgNmNmZj..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="assets" className="mt-0 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Music className="text-muted-foreground" />
                                        <h3 className="text-lg font-medium">{t("integrations.freesound.title")}</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="freesoundClientId">{t("integrations.freesound.clientId")}</Label>
                                            <Input
                                                id="freesoundClientId"
                                                value={values.freesoundClientId}
                                                onChange={(e) => handleChange("freesoundClientId", e.target.value)}
                                                placeholder="17239"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="freesoundApiKey">{t("integrations.freesound.apiKey")}</Label>
                                            <Input
                                                id="freesoundApiKey"
                                                type="password"
                                                value={values.freesoundApiKey}
                                                onChange={(e) => handleChange("freesoundApiKey", e.target.value)}
                                                placeholder="abc123xyz..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="storage" className="mt-0 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Cloud className="text-muted-foreground" />
                                        <h3 className="text-lg font-medium">{t("integrations.cloudflare.title")}</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="cloudflareAccountId">{t("integrations.cloudflare.accountId")}</Label>
                                            <Input
                                                id="cloudflareAccountId"
                                                value={values.cloudflareAccountId}
                                                onChange={(e) => handleChange("cloudflareAccountId", e.target.value)}
                                                placeholder="a1b2c3d4e5f6..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="r2AccessKeyId">{t("integrations.cloudflare.accessKeyId")}</Label>
                                                <Input
                                                    id="r2AccessKeyId"
                                                    value={values.r2AccessKeyId}
                                                    onChange={(e) => handleChange("r2AccessKeyId", e.target.value)}
                                                    placeholder="AKIA..."
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="r2SecretAccessKey">{t("integrations.cloudflare.secretAccessKey")}</Label>
                                                <Input
                                                    id="r2SecretAccessKey"
                                                    type="password"
                                                    value={values.r2SecretAccessKey}
                                                    onChange={(e) => handleChange("r2SecretAccessKey", e.target.value)}
                                                    placeholder="secret_key..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="r2BucketName">{t("integrations.cloudflare.bucketName")}</Label>
                                            <Input
                                                id="r2BucketName"
                                                value={values.r2BucketName}
                                                onChange={(e) => handleChange("r2BucketName", e.target.value)}
                                                placeholder="prawn-assets"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="ai" className="mt-0 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Bot className="text-muted-foreground" />
                                        <h3 className="text-lg font-medium">{t("integrations.modal.title")}</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="modalTranscriptionUrl">{t("integrations.modal.transcriptionUrl")}</Label>
                                            <Input
                                                id="modalTranscriptionUrl"
                                                value={values.modalTranscriptionUrl}
                                                onChange={(e) => handleChange("modalTranscriptionUrl", e.target.value)}
                                                placeholder="https://user-modal-app.modal.run"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="sttServiceUrl">{t("integrations.stt.url")}</Label>
                                            <Input
                                                id="sttServiceUrl"
                                                value={values.sttServiceUrl}
                                                onChange={(e) => handleChange("sttServiceUrl", e.target.value)}
                                                placeholder="http://localhost:8000"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {t("integrations.stt.description")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <div className="px-6 py-4 border-t flex justify-end gap-2 bg-background">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t("common.cancel")}
                    </Button>
                    <Button onClick={handleSave}>{t("common.saveChanges")}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
