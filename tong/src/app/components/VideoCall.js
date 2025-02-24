"use client";
import { useState, useRef, useEffect } from "react";
import { firestore } from "@/fb/firebase";
import { collection, doc, setDoc, getDoc, onSnapshot, addDoc, deleteDoc, getDocs } from "firebase/firestore";
import { initializePeerConnection, setupFirestoreSignaling } from "@/utils/webrtc";

export default function VideoCall({ roomId }) {
  const [pc, setPc] = useState(null);
  const [callId, setCallId] = useState(roomId || "");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isWebcamStarted, setIsWebcamStarted] = useState(false);

  // Initialize PeerConnection and setup signaling on mount
  useEffect(() => {
    if (!roomId) return;
    const peerConnection = initializePeerConnection();
    setPc(peerConnection);
    // Set up signaling with Firestore using the roomId
    setupFirestoreSignaling(peerConnection, roomId);
  }, [roomId]);

  // Set remote video stream when available
  useEffect(() => {
    if (pc) {
      pc.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };
    }
  }, [pc]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setIsWebcamStarted(true);
    } catch (error) {
      console.error("Error starting webcam:", error);
    }
  };

  const joinCall = async () => {
    if (!pc || !isWebcamStarted || !roomId) return;
    const callDocRef = doc(firestore, "calls", roomId);
    const callSnapshot = await getDoc(callDocRef);
    if (callSnapshot.exists()) {
      // If a call exists, answer it
      await answerCall();
    } else {
      // If not, create a new call document (first caller)
      await createCall();
    }
  };

  const createCall = async () => {
    const callDoc = doc(firestore, "calls", roomId);
    setCallId(callDoc.id);
    const answerCandidates = collection(callDoc, "answerCandidates");

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);
    await setDoc(callDoc, { offer: offerDescription });

    // Listen for remote answer
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !pc.currentRemoteDescription) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    // Listen for remote ICE candidates (answerer)
    onSnapshot(answerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };

  const answerCall = async () => {
    const callDoc = doc(firestore, "calls", roomId);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    const callSnapshot = await getDoc(callDoc);
    if (!callSnapshot.exists()) return;
    const offerDescription = callSnapshot.data().offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);
    await setDoc(callDoc, { answer: answerDescription }, { merge: true });

    // Listen for ICE candidates from the offerer
    onSnapshot(offerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });

    // Send our ICE candidates to Firestore
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };
  };

  const hangupCall = async () => {
    // Stop all streams
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    pc.close();
    setIsWebcamStarted(false);
    // Optionally, reset or reinitialize the connection
    const newPc = initializePeerConnection();
    setPc(newPc);

    // Delete call document and its subcollections
    if (roomId) {
      const callDoc = doc(firestore, "calls", roomId);
      const offerCandidates = collection(callDoc, "offerCandidates");
      const answerCandidates = collection(callDoc, "answerCandidates");

      const offerSnapshot = await getDocs(offerCandidates);
      offerSnapshot.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });
      const answerSnapshot = await getDocs(answerCandidates);
      answerSnapshot.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });
      await deleteDoc(callDoc);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Local Stream</h2>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 md:h-96 rounded-lg bg-gray-200"
            />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Remote Stream</h2>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-64 md:h-96 rounded-lg bg-gray-200"
            />
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center space-y-4">
          {!isWebcamStarted && (
            <button
              onClick={startWebcam}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Start Webcam
            </button>
          )}
          {isWebcamStarted && (
            <button
              onClick={joinCall}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Join Call
            </button>
          )}
          <button
            onClick={hangupCall}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Hangup
          </button>
        </div>
      </div>
    </div>
  );
}