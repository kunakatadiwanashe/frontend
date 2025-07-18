"use client";

import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

export default function Scan() {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [faceapi, setFaceapi] = useState<any>(null);

  const loadModels = async () => {
    if (!faceapi) {
      console.error("faceapi not loaded");
      return;
    }
    const MODEL_URL = "/models";
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  };

  useEffect(() => {
    import("@vladmandic/face-api")
      .then((faceapiModule) => {
        setFaceapi(faceapiModule);
        console.log("face-api loaded", faceapiModule);
        loadModels().catch((error) => {
          console.error("Error loading face-api models:", error);
          alert("Failed to load face detection models.");
        });
      })
      .catch((error) => {
        console.error("Error importing face-api:", error);
        alert("Failed to import face detection library.");
      });
  }, []);

  const captureAndScan = async () => {
    if (!faceapi) {
      alert("Face detection library not loaded yet.");
      return;
    }
    if (!webcamRef.current || !webcamRef.current.video) {
      alert("Webcam not available");
      return;
    }

    setLoading(true);
    try {
      const video = webcamRef.current.video;
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const descriptor = Array.from(detection.descriptor);
        const res = await axios.post(
          "http://localhost:5000/api/attendance/scan",
          { faceDescriptor: descriptor }
        );
        alert(res.data.message);
      } else {
        alert("No face detected");
      }
    } catch (error) {
      console.error("Error during face detection or API call:", error);
      alert("An error occurred during scanning. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md space-y-4">
      <div className="aspect-video rounded-md overflow-hidden border">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover"
        />
      </div>

      <button
        onClick={captureAndScan}
        disabled={loading}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Scanning..." : "Scan Face"}
      </button>
    </div>
  );
}





