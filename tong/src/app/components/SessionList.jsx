"use client";
import { useState, useEffect } from "react";
import { firestore } from "@/fb/firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthProvider";

export default function SessionList() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe1 = () => {};
    let unsubscribe2 = () => {};

    const fetchSessions = async () => {
      if (!user) {
        setSessions([]);
        setLoading(false);
        return;
      }

      try {
        // Query for sessions where user is either learner or expert
        const q1 = query(
          collection(firestore, "sessions"),
          where("learnerId", "==", user.uid)
        );
        
        const q2 = query(
          collection(firestore, "sessions"),
          where("expertId", "==", user.uid)
        );

        unsubscribe1 = onSnapshot(q1, (snapshot) => {
          const sessionsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            startTime: doc.data().startTime?.toDate() || new Date(),
            endTime: doc.data().endTime?.toDate() || new Date(),
          }));
          
          setSessions(prev => {
            // Filter out any sessions from this query that might already exist
            const existingIds = new Set(sessionsData.map(s => s.id));
            const filteredPrev = prev.filter(s => !existingIds.has(s.id));
            return [...filteredPrev, ...sessionsData];
          });
          
          setLoading(false);
        });

        unsubscribe2 = onSnapshot(q2, (snapshot) => {
          const sessionsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            startTime: doc.data().startTime?.toDate() || new Date(),
            endTime: doc.data().endTime?.toDate() || new Date(),
          }));
          
          setSessions(prev => {
            // Filter out any sessions from this query that might already exist
            const existingIds = new Set(sessionsData.map(s => s.id));
            const filteredPrev = prev.filter(s => !existingIds.has(s.id));
            return [...filteredPrev, ...sessionsData];
          });
          
          setLoading(false);
        });
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setLoading(false);
      }
    };

    fetchSessions();

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user]);

  if (loading) {
    return <p className="text-gray-600">Loading sessions...</p>;
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Sessions: </h2>
      {sessions.length > 0 ? (
        sessions.map((session) => (
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