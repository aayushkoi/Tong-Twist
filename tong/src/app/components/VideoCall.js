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
    setCallId(callDoc.id);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);
    await setDoc(callDoc, { offer: offerDescription });

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
    <div style={{ color: "black" }}>
      <h2>1. Start your Webcam</h2>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <video ref={localVideoRef} autoPlay playsInline></video>
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video ref={remoteVideoRef} autoPlay playsInline></video>
        </span>
      </div>

      <button onClick={startWebcam} disabled={isWebcamStarted}>
        Start webcam
      </button>

      <h2>2. Create a new Call</h2>
      <button onClick={createCall} disabled={!isWebcamStarted}>
        Create Call (offer)
      </button>

      <h2>3. Join a Call</h2>
      <p>Answer the call from a different browser window or device</p>

      <input
        value={callId}
        onChange={(e) => setCallId(e.target.value)}
        placeholder="Enter Call ID"
      />
      <button onClick={answerCall} disabled={!isWebcamStarted}>
        Answer
      </button>

      <h2>4. Hangup</h2>
      <button disabled>Hangup</button>
    </div>
  );
}
