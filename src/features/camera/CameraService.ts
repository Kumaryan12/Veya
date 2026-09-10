export class CameraError extends Error {
  constructor(
    message: string,
    readonly kind: "denied" | "unavailable",
  ) {
    super(message);
  }
}

export class CameraService {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;

  async start(): Promise<HTMLVideoElement> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new CameraError("Camera capture is not supported in this environment.", "unavailable");
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
        audio: false,
      });
      const video = document.createElement("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = this.stream;
      await video.play();
      this.video = video;
      return video;
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        throw new CameraError("Camera access was not granted.", "denied");
      }
      throw new CameraError("No available camera could be started.", "unavailable");
    }
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    if (this.video) this.video.srcObject = null;
    this.stream = null;
    this.video = null;
  }
}

