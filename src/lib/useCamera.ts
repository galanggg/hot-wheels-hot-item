import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal rear-camera hook for the live scanner. Owns the MediaStream, wires it
 * to a <video>, and always stops every track on stop()/unmount so the camera
 * light goes off and the battery isn't drained after the scanner closes.
 */

export type CameraStatus = "idle" | "starting" | "live" | "error";

export type CameraErrorKind = "denied" | "notfound" | "insecure" | "unknown";

export interface CameraError {
  kind: CameraErrorKind;
  message: string;
}

const MESSAGES: Record<CameraErrorKind, string> = {
  denied: "Camera permission denied. Enable it in your browser settings and retry.",
  notfound: "No camera found on this device.",
  insecure: "Camera needs a secure connection (HTTPS or localhost).",
  unknown: "Could not start the camera. Try again.",
};

export interface UseCamera {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error: CameraError | null;
  start: () => Promise<void>;
  stop: () => void;
}

export function useCamera(): UseCamera {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<CameraError | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  const fail = useCallback((kind: CameraErrorKind) => {
    setError({ kind, message: MESSAGES[kind] });
    setStatus("error");
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      fail(window.isSecureContext ? "notfound" : "insecure");
      return;
    }
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // play() can reject on some browsers if not user-gesture-driven; the
        // stream is still attached, so swallow it rather than error the UI.
        await video.play().catch(() => {});
      }
      setStatus("live");
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") fail("denied");
      else if (name === "NotFoundError" || name === "OverconstrainedError") fail("notfound");
      else fail("unknown");
    }
  }, [fail]);

  // Guarantee teardown if the component unmounts while live.
  useEffect(() => stop, [stop]);

  return { videoRef, status, error, start, stop };
}
