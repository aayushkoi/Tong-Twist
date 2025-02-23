// src/app/components/SessionRequests.jsx
"use client";
import { useState, useEffect } from 'react';
import { firestore } from "@/fb/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";

export default function SessionRequests({ userId, role }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const q = query(
      collection(firestore, "sessionRequests"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
      }));
      setRequests(requestsData);
    });

    return () => unsubscribe();
  }, []);

  const handleAccept = async (request) => {
    try {
      // Create a new session
      await addDoc(collection(firestore, "sessions"), {
        title: request.title,
        startTime: request.startTime,
        endTime: request.endTime,
        learnerId: request.learnerId,
        expertId: userId,
        roomId: `room-${Date.now()}`, // Generate a unique room ID
      });

      // Update request status
      await updateDoc(doc(firestore, "sessionRequests", request.id), {
        status: 'accepted',
        expertId: userId,
      });
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium">{request.title}</h3>
          <p className="text-sm text-gray-600">
            {request.startTime.toLocaleString()} - {request.endTime.toLocaleString()}
          </p>
          {role === 'expert' && (
            <button
              onClick={() => handleAccept(request)}
              className="mt-2 bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600"
            >
              Accept Request
            </button>
          )}
        </div>
      ))}
      {requests.length === 0 && (
        <p className="text-gray-500">No pending session requests.</p>
      )}
    </div>
  );
}