import { useEffect, useRef } from "react";

interface AudioMeterProps {
    stream: MediaStream | null;
    className?: string;
}

export function AudioMeter({ stream, className }: AudioMeterProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        if (!stream || !canvasRef.current) return;

        const startMeter = async () => {
            const AudioContextConstructor =
                window.AudioContext ||
                (window as typeof window & {
                    webkitAudioContext?: typeof AudioContext;
                }).webkitAudioContext;

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContextConstructor();
            }
            const audioContext = audioContextRef.current;

            if (audioContext.state === "suspended") {
                await audioContext.resume();
            }

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                if (!canvasRef.current) return;

                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                const width = canvas.width;
                const height = canvas.height;

                analyser.getByteFrequencyData(dataArray);

                ctx.clearRect(0, 0, width, height);

                const barWidth = (width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = (dataArray[i] / 255) * height;

                    // Draw rounded bars
                    ctx.fillStyle = `rgb(50, 205, 50)`; // Green color
                    if (barHeight > height * 0.8) {
                        ctx.fillStyle = `rgb(255, 69, 0)`; // Red for clipping
                    } else if (barHeight > height * 0.6) {
                        ctx.fillStyle = `rgb(255, 215, 0)`; // Yellow for high
                    }

                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                    x += barWidth + 1;
                }

                animationRef.current = requestAnimationFrame(draw);
            };

            draw();
        };

        startMeter();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            // Don't close AudioContext as it might be reused or global, 
            // but if it's local to this component we could. 
            // For safety in this specific component:
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.suspend();
            }
        };
    }, [stream]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            width={300}
            height={50}
        />
    );
}
