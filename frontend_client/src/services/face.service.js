import * as faceapi from "@vladmandic/face-api";
import { MODEL_PATHS } from "../utils/constants";

export { faceapi };

export function areFaceModelsLoaded() {
  return Boolean(faceapi.nets.tinyFaceDetector.params);
}

export async function loadFaceModels(modelPaths = MODEL_PATHS) {
  for (const p of modelPaths) {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(p),
        faceapi.nets.faceLandmark68Net.loadFromUri(p),
        faceapi.nets.faceRecognitionNet.loadFromUri(p),
      ]);
      return p;
    } catch (err) {
      console.warn("Load models failed from", p);
    }
  }
  return null;
}
