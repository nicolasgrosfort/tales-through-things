import { useEffect, useRef } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

export const PushToTalk = ({
  onSubmit,
  onRecordStart,
  onRecordEnd,
}: {
  onSubmit?: (audio: Blob) => void;
  onRecordStart?: () => void;
  onRecordEnd?: () => void;
}) => {
  const { isRecording, isReady, audioBlob, startRecording, stopRecording } =
    useAudioRecorder(240);

  const onSubmitRef = useRef(onSubmit);
  const lastAudioBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isReady || e.repeat || isRecording) return;

      if (e.key === " ") {
        e.preventDefault();
        onRecordStart?.();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isReady || !isRecording) return;

      if (e.key === " ") {
        e.preventDefault();
        onRecordEnd?.();
        stopRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isReady, isRecording]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    if (!audioBlob) return;

    // évite de retraiter exactement le même blob
    if (lastAudioBlobRef.current === audioBlob) return;
    lastAudioBlobRef.current = audioBlob;

    onSubmitRef.current?.(audioBlob);
  }, [audioBlob]);

  return null;
};
