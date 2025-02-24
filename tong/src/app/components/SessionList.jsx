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
      // Query for sessions where user is either learner or expert
      const q = query(
        collection(firestore, "sessions"),
        where("learnerId", "==", user.uid)
      );
      const q2 = query(
        collection(firestore, "sessions"),
        where("expertId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sessionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
        }));
        setSessions(prev => [...prev, ...sessionsData]);
      });

      const unsubscribe2 = onSnapshot(q2, (snapshot) => {
        const sessionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
        }));
        setSessions(prev => [...prev, ...sessionsData]);
      });

      return () => {
        unsubscribe();
        unsubscribe2();
      };
    }
  }, [user]);

  // Remove duplicate sessions
  const uniqueSessions = [...new Map(sessions.map(session => 
    [session.id, session])).values()];

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Sessions: </h2>
      {uniqueSessions.length > 0 ? (
        uniqueSessions.map((session) => (
          <div
            key={session.id}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900">{session.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {session.startTime.toLocaleString()} - {session.endTime.toLocaleString()}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-600">No upcoming sessions.</p>
      )}
    </div>
  );
}