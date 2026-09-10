import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export class FaceLandmarkerService {
  private landmarker: FaceLandmarker | null = null;

  async load(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks("/mediapipe");
    this.landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.55,
      minFacePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
      outputFaceBlendshapes: false,
    });
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

