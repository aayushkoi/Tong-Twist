"use client";
import { useState, useEffect } from "react";
import { firestore } from "@/fb/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthProvider";

export default function SessionList() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (user) {
      const q = query(collection(firestore, "sessions"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sessionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
        }));
        setSessions(sessionsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="p-4 bg-gray-100 rounded">
          <h3 className="font-medium">{session.title}</h3>
          <p className="text-sm text-gray-600">
            {session.startTime.toLocaleString()} - {session.endTime.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}