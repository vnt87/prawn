import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IntegrationsState {
    // Database
    upstashRedisUrl: string;
    upstashRedisToken: string;

    // Assets
    freesoundClientId: string;
    freesoundApiKey: string;

    // Storage
    cloudflareAccountId: string;
    r2AccessKeyId: string;
    r2SecretAccessKey: string;
    r2BucketName: string;

    // AI - Transcription
    modalTranscriptionUrl: string;
    sttServiceUrl: string;

    // AI - Video Generation
    openaiApiKey: string;
    openaiApiBaseUrl: string;
    anthropicApiKey: string;
    anthropicApiBaseUrl: string;
    aiVideoProvider: 'openai' | 'anthropic' | 'custom';
    aiVideoModel: string;

    // FaceFusion - Face Swap
    facefusionServiceUrl: string;
    facefusionEnableModal: boolean;
    facefusionDefaultModel: string;

    // Actions
    setIntegration: (key: keyof Omit<IntegrationsState, "setIntegration" | "facefusionEnableModal">, value: string) => void;
    setFacefusionEnableModal: (value: boolean) => void;
}

export const useIntegrationsStore = create<IntegrationsState>()(
    persist(
        (set) => ({
            upstashRedisUrl: "",
            upstashRedisToken: "",
            freesoundClientId: "",
            freesoundApiKey: "",
            cloudflareAccountId: "",
            r2AccessKeyId: "",
            r2SecretAccessKey: "",
            r2BucketName: "",
            modalTranscriptionUrl: "",
            sttServiceUrl: "",
            
            // AI Video Generation defaults
            openaiApiKey: "",
            openaiApiBaseUrl: "https://api.openai.com/v1",
            anthropicApiKey: "",
            anthropicApiBaseUrl: "https://api.anthropic.com",
            aiVideoProvider: "openai",
            aiVideoModel: "gpt-4o",

            // FaceFusion defaults
            facefusionServiceUrl: "",
            facefusionEnableModal: false,
            facefusionDefaultModel: "inswapper_128",

            setIntegration: (key, value) => {
                set((state) => ({
                    ...state,
                    [key]: value,
                }));
            },

            setFacefusionEnableModal: (value) => {
                set((state) => ({
                    ...state,
                    facefusionEnableModal: value,
                }));
            },
        }),
        {
            name: "nvai-integrations",
        },
    ),
);
