"use client";

import { useState, useRef, useEffect } from "react";
import { firestore } from "@/fb/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  addDoc,
} from "firebase/firestore";

const servers = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  iceCandidatePoolSize: 10,
};

export default function VideoCall() {
  const [pc] = useState(new RTCPeerConnection(servers));
  const [callId, setCallId] = useState("");
  const [remoteCallId, setRemoteCallId] = useState(""); // Separate state for answering calls
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isWebcamStarted, setIsWebcamStarted] = useState(false);

  useEffect(() => {
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  }, [pc]);

  const startWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    setIsWebcamStarted(true);
  };

  const createCall = async () => {
    const callDoc = doc(collection(firestore, "calls"));
    setCallId(callDoc.id); // Set the call ID for the creator
    const offerCandidates = collection(firestore, "calls", callDoc.id, "offerCandidates");
    const answerCandidates = collection(firestore, "calls", callDoc.id, "answerCandidates");

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDoc, { offer });

    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !pc.currentRemoteDescription) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };

  const answerCall = async () => {
    if (!remoteCallId) return;

    const callDoc = doc(firestore, "calls", remoteCallId);
    const offerCandidates = collection(firestore, "calls", remoteCallId, "offerCandidates");
    const answerCandidates = collection(firestore, "calls", remoteCallId, "answerCandidates");

    const callSnapshot = await getDoc(callDoc);
    if (!callSnapshot.exists()) {
      alert("Call not found!");
      return;
    }

    const offerDescription = callSnapshot.data().offer;
    if (!offerDescription) {
      alert("No offer found in the call document!");
      return;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await setDoc(callDoc, { answer }, { merge: true });

    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };
  };

  return (
    <div className="min-h-screen bg-quizlet-gray flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-quizlet-blue text-center mb-6">Video Call</h1>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-quizlet-blue mb-2">Your Video</h2>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-quizlet-blue mb-2">Remote Video</h2>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-4">
          <button
            onClick={startWebcam}
            disabled={isWebcamStarted}
            className="w-full bg-quizlet-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Start Webcam
          </button>

          <button
            onClick={createCall}
            disabled={!isWebcamStarted}
            className="w-full bg-quizlet-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Create Call (Offer)
          </button>

          <div className="flex items-center gap-4">
            <input
              value={remoteCallId}
              onChange={(e) => setRemoteCallId(e.target.value)}
              placeholder="Enter Call ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-quizlet-blue focus:border-quizlet-blue outline-none transition"
            />
            <button
              onClick={answerCall}
              disabled={!isWebcamStarted}
              className="bg-quizlet-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}