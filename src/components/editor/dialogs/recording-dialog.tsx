import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AudioMeter } from "@/components/ui/audio-meter";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import {
    blobToFile,
    enumerateDevices,
    getMediaStream,
} from "@/lib/recording/utils";
import {
    Mic,
    RotateCcw,
    CircleStop,
    Play,
    Pause,
    Disc,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/ui";

interface RecordingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (file: File) => void;
    mode: "audio" | "video";
}

export function RecordingDialog({
    isOpen,
    onClose,
    onSave,
    mode,
}: RecordingDialogProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
    const [countdown, setCountdown] = useState<number | null>(null);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);

    const {
        status,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
        mediaBlob,
        duration,
        error,
    } = useMediaRecorder({
        onError: (err) => toast.error(`Recording error: ${err.message}`),
    });

    // Initialize devices
    useEffect(() => {
        if (isOpen) {
            const loadDevices = async () => {
                try {
                    // Request permission first to get labels
                    const tempStream = await navigator.mediaDevices.getUserMedia(
                        mode === "audio" ? { audio: true } : { audio: true, video: true },
                    );
                    tempStream.getTracks().forEach((t) => t.stop());

                    const audioDevs = await enumerateDevices("audioinput");
                    const videoDevs = await enumerateDevices("videoinput");

                    setAudioDevices(audioDevs);
                    setVideoDevices(videoDevs);

                    if (audioDevs.length > 0)
                        setSelectedAudioDevice(audioDevs[0].deviceId);
                    if (videoDevs.length > 0)
                        setSelectedVideoDevice(videoDevs[0].deviceId);
                } catch (err) {
                    console.error("Failed to load devices", err);
                    toast.error("Failed to access media devices. Please check permissions.");
                }
            };
            loadDevices();
        } else {
            // Cleanup on close
            stopStream();
            resetRecording();
            setRecordedUrl(null);
        }
    }, [isOpen, mode]);

    // Initialize stream when devices change or dialog opens
    useEffect(() => {
        if (!isOpen || status !== "idle" || recordedUrl) return;

        const initStream = async () => {
            stopStream();
            try {
                const newStream = await getMediaStream({
                    audio: true,
                    video: mode === "video",
                    deviceId:
                        mode === "video" ? selectedVideoDevice : selectedAudioDevice,
                });
                setStream(newStream);
                if (videoRef.current && mode === "video") {
                    videoRef.current.srcObject = newStream;
                }
            } catch (err) {
                console.error("Failed to get stream", err);
                toast.error("Failed to start stream");
            }
        };

        initStream();

        return () => {
            // cleanup is handled by stopStream called at start of effect or on unmount helpers
        };
    }, [isOpen, selectedAudioDevice, selectedVideoDevice, mode, status, recordedUrl]);

    // Handle Blob creation
    useEffect(() => {
        if (mediaBlob) {
            const url = URL.createObjectURL(mediaBlob);
            setRecordedUrl(url);
            stopStream(); // Stop camera/mic when reviewing
        }
    }, [mediaBlob]);

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const handleStartRecording = () => {
        let count = 3;
        setCountdown(count);
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
            } else {
                clearInterval(interval);
                setCountdown(null);
                if (stream) {
                    startRecording(stream, mode);
                }
            }
        }, 1000);
    };

    const handleSave = () => {
        if (mediaBlob) {
            const ext = mode === 'audio' ? 'webm' : 'mp4';
            const fileName = `Recording ${new Date().toLocaleString()}.${ext}`;
            const file = blobToFile(mediaBlob, fileName);
            onSave(file);
            onClose();
        }
    };

    const handleRetake = () => {
        setRecordedUrl(null);
        resetRecording();
        setSelectedAudioDevice(audioDevices[0]?.deviceId || ""); // Trigger stream re-init
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "audio" ? "Record Voiceover" : "Record Video"}
                    </DialogTitle>
                    <DialogDescription>
                        {status === "idle" && !recordedUrl
                            ? "Select input device and start recording"
                            : status === "recording"
                                ? "Recording in progress..."
                                : "Review and save your recording"
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Device Selection */}
                    {status === 'idle' && !recordedUrl && (
                        <div className="flex flex-col gap-2">
                            {mode === "video" && (
                                <Select
                                    value={selectedVideoDevice}
                                    onValueChange={setSelectedVideoDevice}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Camera" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {videoDevices.map((device) => (
                                            <SelectItem key={device.deviceId} value={device.deviceId}>
                                                {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Select
                                value={selectedAudioDevice}
                                onValueChange={setSelectedAudioDevice}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Microphone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {audioDevices.map((device) => (
                                        <SelectItem key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Preview / Recording Area */}
                    <div className="bg-muted/30 relative flex aspect-video items-center justify-center overflow-hidden rounded-md border">
                        {/* Video Preview (Recording) */}
                        {mode === "video" && !recordedUrl && (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="h-full w-full object-cover transform scale-x-[-1]" // Mirror effect
                            />
                        )}

                        {/* Video Preview (Playback) */}
                        {mode === "video" && recordedUrl && (
                            <video
                                ref={previewVideoRef}
                                src={recordedUrl}
                                controls
                                className="h-full w-full object-cover"
                            />
                        )}

                        {/* Audio Visualization */}
                        {mode === "audio" && !recordedUrl && (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
                                <Mic
                                    className={cn("size-16 transition-colors", status === 'recording' ? "text-red-500 animate-pulse" : "text-muted-foreground")}
                                />
                                <AudioMeter stream={stream} className="h-12 w-full rounded" />
                            </div>
                        )}

                        {/* Audio Playback */}
                        {mode === "audio" && recordedUrl && (
                            <div className="flex w-full flex-col items-center gap-4 p-4">
                                <audio src={recordedUrl} controls className="w-full" />
                            </div>
                        )}

                        {/* Countdown Overlay */}
                        {countdown !== null && (
                            <div className="bg-background/80 absolute inset-0 flex items-center justify-center text-6xl font-bold">
                                {countdown}
                            </div>
                        )}
                    </div>

                    {/* Timer */}
                    {(status === 'recording' || status === 'paused') && (
                        <div className="flex items-center justify-center gap-2">
                            <div className={cn("size-3 rounded-full bg-red-500", status === 'recording' && "animate-pulse")} />
                            <span className="font-mono text-xl">{formatDuration(duration)}</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    {/* Controls */}
                    {status === 'idle' && !recordedUrl && (
                        <>
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleStartRecording} className="gap-2 bg-red-500 hover:bg-red-600 text-white">
                                <Disc className="size-4" /> Start Recording
                            </Button>
                        </>
                    )}

                    {status === 'recording' && (
                        <div className="flex w-full items-center justify-center gap-4">
                            <Button variant="outline" size="icon" onClick={pauseRecording}>
                                <Pause />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={stopRecording}>
                                <CircleStop />
                            </Button>
                        </div>
                    )}

                    {status === 'paused' && (
                        <div className="flex w-full items-center justify-center gap-4">
                            <Button variant="outline" size="icon" onClick={resumeRecording}>
                                <Play />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={stopRecording}>
                                <CircleStop />
                            </Button>
                        </div>
                    )}

                    {recordedUrl && (
                        <>
                            <Button variant="ghost" onClick={handleRetake} className="gap-2">
                                <RotateCcw className="size-4" /> Retake
                            </Button>
                            <Button onClick={handleSave}>Save Recording</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
