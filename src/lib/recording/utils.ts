export interface MediaRecorderOptions {
    audio?: boolean;
    video?: boolean;
    deviceId?: string;
}

export async function getMediaStream({
    audio = true,
    video = false,
    deviceId,
}: MediaRecorderOptions): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
        audio: audio
            ? {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            }
            : false,
        video: video
            ? {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
            }
            : false,
    };

    return navigator.mediaDevices.getUserMedia(constraints);
}

export function getSupportedMimeType(type: "audio" | "video"): string {
    const types =
        type === "audio"
            ? [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg;codecs=opus",
                "audio/mp4",
            ]
            : [
                "video/webm;codecs=vp9",
                "video/webm;codecs=vp8",
                "video/webm",
                "video/mp4",
            ];

    for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
            return t;
        }
    }

    return type === "audio" ? "audio/webm" : "video/webm";
}

export function blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, {
        type: blob.type,
        lastModified: Date.now(),
    });
}

export async function enumerateDevices(
    kind: MediaDeviceKind,
): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === kind);
}
