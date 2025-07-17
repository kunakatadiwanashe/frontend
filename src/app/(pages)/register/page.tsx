"use client";

import { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import axios from "axios";

export default function Register() {
  const webcamRef = useRef<Webcam>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face-api models:", error);
        alert("Failed to load face detection models.");
      }
    };
    loadModels();
  }, []);

  const captureAndRegister = async () => {
    if (!modelsLoaded) {
      alert("Face detection models are not loaded yet. Please wait.");
      return;
    }
    const video = webcamRef.current?.video;
    if (!video) {
      alert("Webcam not ready. Please allow camera access and try again.");
      return;
    }
    try {
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const descriptor = Array.from(detection.descriptor);
        await axios.post("http://localhost:5000/api/auth/register", {
          name,
          email,
          studentId,
          faceDescriptor: descriptor,
        });
        alert("User Registered Successfully");
      } else {
        alert("No face detected");
      }
    } catch (error) {
      console.error("Error during face detection or registration:", error);
      alert("An error occurred during registration. Please try again.");
    }
  };

  const isFormValid = () => {
    return name.trim() !== "" && email.trim() !== "" && studentId.trim() !== "";
  };

  return (

        <>
      <form
        className="space-y-6 w-full md:w-1/2 lg:w-1/2 mx-auto mt-10 p-6 bg-white rounded-lg shadow-md"
        onSubmit={(e) => {
          e.preventDefault();
          captureAndRegister();
        }}
      >
        <div>
          <label
            className="block text-gray-700 font-semibold mb-1"
            htmlFor="name"
          >
            Full Name
          </label>
          <input
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="name"
            name="name"
            placeholder="Enter your full name"
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}

          />
        </div>

        <div>
          <label
            className="block text-gray-700 font-semibold mb-1"
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="email"
            name="email"
            placeholder="Enter your email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}

          />
        </div>

        <div>
          <label
            className="block text-gray-700 font-semibold mb-1"
            htmlFor="student_id"
          >
            Student ID
          </label>
          <input
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            id="student_id"
            name="student_id"
            pattern="[A-Za-z]{3}"
            title="Student ID should be 3 letters"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Face Capture
          </label>
          <div className="md:w-1/2 sm: w-full h-74 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden relative">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="object-cover w-full h-full"
              height={240}
              width={320}
            />
            <button
              className="absolute bottom-3 right-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="capture-button"
              type="button"
              onClick={captureAndRegister}
            >
              <i className="fas fa-camera"></i> Capture
            </button>
          </div>
        </div>

        <button
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={captureAndRegister} disabled={!isFormValid()}
        >
       Register 
        </button>
      </form>
    </>

  );
}
