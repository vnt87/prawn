import { useState, useRef, useCallback, useEffect } from "react";
import { getSupportedMimeType } from "@/lib/recording/utils";

export type RecordingStatus = "idle" | "recording" | "paused" | "stopped";

export interface UseMediaRecorderProps {
    onStop?: (blob: Blob) => void;
    onError?: (error: Error) => void;
}

export function useMediaRecorder({
    onStop,
    onError,
}: UseMediaRecorderProps = {}) {
    const [status, setStatus] = useState<RecordingStatus>("idle");
    const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<Error | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    const startTimer = useCallback(() => {
        startTimeRef.current = Date.now() - duration * 1000;
        timerRef.current = window.setInterval(() => {
            setDuration((Date.now() - startTimeRef.current) / 1000);
        }, 100);
    }, [duration]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startRecording = useCallback(
        (stream: MediaStream, type: "audio" | "video" = "audio") => {
            try {
                const mimeType = getSupportedMimeType(type);
                const recorder = new MediaRecorder(stream, { mimeType });

                chunksRef.current = [];
                mediaRecorderRef.current = recorder;

                recorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        chunksRef.current.push(event.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: mimeType });
                    setMediaBlob(blob);
                    setStatus("stopped");
                    stopTimer();
                    if (onStop) {
                        onStop(blob);
                    }
                };

                recorder.onerror = (event) => {
                    const err = new Error("Recording error occurred");
                    setError(err);
                    setStatus("idle");
                    stopTimer();
                    if (onError) {
                        onError(err);
                    }
                };

                recorder.start(100); // Collect 100ms chunks
                setStatus("recording");
                setDuration(0);
                startTimer();
            } catch (err) {
                const errorObj =
                    err instanceof Error ? err : new Error("Failed to start recording");
                setError(errorObj);
                if (onError) {
                    onError(errorObj);
                }
            }
        },
        [onStop, onError, startTimer, stopTimer],
    );

    const stopRecording = useCallback(() => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const pauseRecording = useCallback(() => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            mediaRecorderRef.current.pause();
            setStatus("paused");
            stopTimer();
        }
    }, [stopTimer]);

    const resumeRecording = useCallback(() => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "paused"
        ) {
            mediaRecorderRef.current.resume();
            setStatus("recording");
            startTimer();
        }
    }, [startTimer]);

    const resetRecording = useCallback(() => {
        setMediaBlob(null);
        setDuration(0);
        setStatus("idle");
        setError(null);
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        stopTimer();
    }, [stopTimer]);

    useEffect(() => {
        return () => {
            stopTimer();
            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state !== "inactive"
            ) {
                mediaRecorderRef.current.stop();
            }
        };
    }, [stopTimer]);

    return {
        status,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
        mediaBlob,
        duration,
        error,
    };
}
