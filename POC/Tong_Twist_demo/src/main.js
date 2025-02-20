// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, addDoc } from "firebase/firestore"; // Import Firestore functions

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQcYllNAVKOjJihCvh5T6kjmbt0YNPUK0",
  authDomain: "tong-twist.firebaseapp.com",
  projectId: "tong-twist",
  storageBucket: "tong-twist.firebasestorage.app",
  messagingSenderId: "806768994110",
  appId: "1:806768994110:web:18bb7e1db0205c3c9c2e6f",
  measurementId: "G-R169EMKKJC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app); // Initialize Firestore

const servers = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302","stun:stun2.1.google.com:19302"]
    },
  ],
  iceCandidatePoolSize: 10,
}
let pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo'); 
const hangupButton = document.getElementById('hangupButton');

webcamButton.onclick = async () => {
  console.log("Starting webcam...");
  localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
  remoteStream = new MediaStream();
  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
  };

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false; // Enable the call button after starting the webcam
  answerButton.disabled = false; // Enable the answer button after starting the webcam
  console.log("Webcam started.");
}

callButton.onclick = async () => {
  console.log("Creating call...");
  const callDoc = doc(collection(firestore, 'calls'));
  const offerCandidates = collection(callDoc, 'offerCandidates');
  const answerCandidates = collection(callDoc, 'answerCandidates');

  callInput.value = callDoc.id;

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(offerCandidates, event.candidate.toJSON());
      console.log("ICE candidate added:", event.candidate);
    }
  }

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await setDoc(callDoc, {offer});
  console.log("Call created with ID:", callDoc.id);

  onSnapshot(callDoc, (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
      console.log("Remote description set:", answerDescription);
    }
  });

  onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
        console.log("Answer candidate added:", candidate);
      }
    });
  });
};

answerButton.onclick = async () => {
  console.log("Answering call...");
  const callId = callInput.value;
  console.log("Call ID:", callId);

  const callDoc = doc(firestore, 'calls', callId);
  const answerCandidates = collection(callDoc, 'answerCandidates');
  const offerCandidates = collection(callDoc, 'offerCandidates');

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(answerCandidates, event.candidate.toJSON());
      console.log("ICE candidate added:", event.candidate);
    }
  }

  const callDocSnapshot = await getDoc(callDoc);
  if (!callDocSnapshot.exists()) {
    console.error("Call document does not exist!");
    return;
  }

  const callData = callDocSnapshot.data();
  console.log("Call data:", callData);

  const offerDescription = callData.offer;
  if (!offerDescription) {
    console.error("Offer description is missing!");
    return;
  }

  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
  console.log("Remote description set:", offerDescription);

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);
  console.log("Local description set:", answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await setDoc(callDoc, {answer}, {merge: true});
  console.log("Call answered with ID:", callId);

  onSnapshot(offerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
        console.log("Offer candidate added:", data);
      }
    });
  });
}