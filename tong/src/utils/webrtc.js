import { firestore } from '@/fb/firebase';
import { collection, addDoc, onSnapshot, doc } from 'firebase/firestore';

export const initializePeerConnection = () => {
  return new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
};

export const setupFirestoreSignaling = (pc, roomId) => {
  const callDoc = doc(firestore, 'calls', roomId);
  
  // Listen for remote ICE candidates
  onSnapshot(collection(callDoc, 'answerCandidates'), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });

  // Send local ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(collection(callDoc, 'offerCandidates'), event.candidate.toJSON());
    }
  };
};