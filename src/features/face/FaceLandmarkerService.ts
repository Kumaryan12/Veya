import type { FaceLandmarker, FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export class FaceLandmarkerService {
  private landmarker: FaceLandmarker | null = null;

  async load(): Promise<void> {
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks("/mediapipe");
    const options = {
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.55,
      minFacePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
      outputFaceBlendshapes: false,
    } as const;
    try {
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate: "GPU" },
      });
    } catch {
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate: "CPU" },
      });
    }
  }

  detect(video: HTMLVideoElement, timestamp: number): FaceLandmarkerResult {
    if (!this.landmarker) throw new Error("Face Landmarker has not loaded.");
    return this.landmarker.detectForVideo(video, timestamp);
  }

  close(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
