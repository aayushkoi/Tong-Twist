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
  getDocs, 
  deleteDoc,
} from "firebase/firestore";
const servers = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  iceCandidatePoolSize: 10,
};

export default function VideoCall() {
  const [pc, setPc] = useState(new RTCPeerConnection(servers));
  const [callId, setCallId] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isWebcamStarted, setIsWebcamStarted] = useState(false);

  // Reset ontrack event when peer connection changes
  useEffect(() => {
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  }, [pc]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setIsWebcamStarted(true);
    } catch (error) {
      console.error("Error starting webcam:", error);
    }
  };

  const createCall = async () => {
    const callDoc = doc(collection(firestore, "calls"));
    setCallId(callDoc.id);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    // Send ICE candidates to Firestore
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    // Create offer and update call document
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);
    await setDoc(callDoc, { offer: offerDescription });

    // Listen for remote answer SDP
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !pc.currentRemoteDescription) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    // Listen for remote ICE candidates (from answerer)
    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };

  const answerCall = async () => {
    if (!callId) return;
    const callDoc = doc(firestore, "calls", callId);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    const callSnapshot = await getDoc(callDoc);
    if (!callSnapshot.exists()) return;

    const offerDescription = callSnapshot.data().offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    await setDoc(callDoc, { answer: answerDescription }, { merge: true });

    // Listen for ICE candidates from caller (offerCandidates)
    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });

    // Send answer ICE candidates to Firestore
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };
  };

  const hangupCall = async () => {
    // Stop all local stream tracks
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    // Stop all remote stream tracks
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const tracks = remoteVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    // Close the peer connection
    pc.close();
    // Reset state
    setCallId("");
    setIsWebcamStarted(false);
    // Reinitialize the peer connection for future calls
    setPc(new RTCPeerConnection(servers));
  
    // Delete Firestore documents related to the call
    if (callId) {
      const callDoc = doc(firestore, "calls", callId);
      const offerCandidates = collection(callDoc, "offerCandidates");
      const answerCandidates = collection(callDoc, "answerCandidates");
  
      // Delete all offer candidates
      const offerSnapshot = await getDocs(offerCandidates);
      offerSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
  
      // Delete all answer candidates
      const answerSnapshot = await getDocs(answerCandidates);
      answerSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
  
      // Delete the call document itself
      await deleteDoc(callDoc);
    }
  };
  
  const copyCallId = async () => {
    try {
      await navigator.clipboard.writeText(callId);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="min-h-screen bg-quizlet-gray flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-quizlet-blue text-center mb-6">
          Video Call
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-quizlet-blue mb-2">
              Local Stream
            </h2>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-96 rounded-lg bg-transparent object-cover"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-quizlet-blue mb-2">
              Remote Stream
            </h2>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-96 rounded-lg bg-transparent object-cover"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
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

          {callId && (
            <div className="bg-gray-800 text-white p-4 rounded-lg flex items-center justify-between">
              <span className="font-mono text-lg">{callId}</span>
              <button
                onClick={copyCallId}
                className="ml-4 bg-quizlet-blue p-2 rounded hover:bg-blue-700 transition-colors"
              >
                📋
              </button>
              {copySuccess && (
                <span className="ml-2 text-sm text-green-400">{copySuccess}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <input
              value={callId}
              onChange={(e) => setCallId(e.target.value)}
              placeholder="Enter Call ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={answerCall}
              disabled={!isWebcamStarted}
              className="bg-quizlet-blue text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Answer
            </button>
          </div>

          <button
            onClick={hangupCall}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Hangup
          </button>
        </div>
      </div>
    </div>
  );
}
