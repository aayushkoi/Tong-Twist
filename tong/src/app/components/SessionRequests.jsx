"use client";
import { useState, useEffect } from 'react';
import { firestore } from "@/fb/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthProvider";

export default function SessionRequests({ role }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (user && role === 'expert') {
      const q = query(
        collection(firestore, "sessionRequests"),
        where("status", "==", "pending") // Only show pending requests
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate() || new Date(),
          endTime: doc.data().endTime?.toDate() || new Date(),
        }));
        setRequests(requestsData);
        setLoading(false);
      }, error => {
        console.error("Error fetching session requests:", error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user, role]);

  const handleAccept = async (request) => {
    if (!user) return;
    
    try {
      // Create a new session in the "sessions" collection
      await addDoc(collection(firestore, "sessions"), {
        title: request.title,
        startTime: request.startTime,
        endTime: request.endTime,
        learnerId: request.learnerId,
        expertId: user.uid,
        roomId: `room-${crypto.randomUUID()}`, // Generate a unique room ID
        status: 'scheduled',
        createdAt: new Date()
      });

      // Update the request status to "accepted"
      await updateDoc(doc(firestore, "sessionRequests", request.id), {
        status: 'accepted',
        expertId: user.uid,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  if (loading) {
    return <p className="text-gray-600">Loading requests...</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium text-gray-900">{request.title}</h3>
          <p className="text-sm text-gray-700">
            {request.startTime.toLocaleString()} - {request.endTime.toLocaleString()}
          </p>
          {user && role === 'expert' && (
            <button
              onClick={() => handleAccept(request)}
              className="mt-2 bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Accept Request
            </button>
          )}
        </div>
      ))}
      {requests.length === 0 && (
        <p className="text-gray-600">No pending session requests.</p>
      )}
    </div>
  );
}