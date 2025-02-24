import { firestore } from '@/fb/firebase';
import { collection, addDoc, onSnapshot, doc } from 'firebase/firestore';

export const initializePeerConnection = () => {
  return new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
};

export const setupFirestoreSignaling = (pc, roomId) => {
  const callDoc = doc(firestore, 'calls', roomId);
  
  // Add error handling for ICE candidates
  pc.onicecandidateerror = (error) => {
    console.error("ICE candidate error:", error);
  };

  // Listen for remote ICE candidates with error handling
  const unsubscribeAnswer = onSnapshot(collection(callDoc, 'answerCandidates'), 
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          try {
            pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          } catch (error) {
            console.error("Error adding answer ICE candidate:", error);
          }
        }
      });
    },
    (error) => {
      console.error("Answer candidates snapshot error:", error);
    }
  );

  // Send local ICE candidates with error handling
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(collection(callDoc, 'offerCandidates'), event.candidate.toJSON())
        .catch(error => console.error("Error sending ICE candidate:", error));
    }
  };

  return () => unsubscribeAnswer();
};