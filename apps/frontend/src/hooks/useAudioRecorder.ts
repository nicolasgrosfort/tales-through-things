import { useEffect, useRef, useState } from "react";

export interface AudioRecorderHook {
  isReady: boolean;
  isRecording: boolean;
  audioBlob: Blob | null;
  recordingTime: number;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  formatTime: (seconds: number) => string;
}

export function useAudioRecorder(maxDuration = 240): AudioRecorderHook {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!audioStream) {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error(
          "getUserMedia is not available. Ensure the page is served over HTTPS or localhost.",
        );
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setAudioStream(stream);

          const mimeType = MediaRecorder.isTypeSupported("audio/wav")
            ? "audio/wav"
            : "";
          const recorder = new MediaRecorder(
            stream,
            mimeType ? { mimeType } : {},
          );
          setMediaRecorder(recorder);
          setIsReady(true);

          recorder.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, {
              type: recorder.mimeType,
            });
            setAudioBlob(blob);
            audioChunksRef.current = [];
          };
        })
        .catch((err: unknown) =>
          console.error("Error accessing microphone:", err),
        );
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioStream]);

  const startRecording = (): void => {
    if (!mediaRecorder) return;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    setAudioBlob(null);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= maxDuration - 1) {
          stopRecording();
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = (): void => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleRecording = (): void => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  return {
    isReady,
    isRecording,
    audioBlob,
    recordingTime,
    startRecording,
    stopRecording,
    toggleRecording,
    formatTime,
  };
}
