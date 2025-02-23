// src/app/dashboard/page.jsx
"use client";
import { useAuth } from "../../context/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionList from "../components/SessionList";
import SessionCalendar from "../components/Calendar";
import CreateSessionRequest from "../components/CreateSessionRequest";
import SessionRequests from "../components/SessionRequests";
import { getDoc, doc } from "firebase/firestore";
import { firestore } from "@/fb/firebase";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState("learner");
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setRole(userDoc.data().role || "learner");
        }
      }
    };

    if (!loading && user) {
      fetchUserData();
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-quizlet-gray flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quizlet-gray p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h1 className="text-2xl font-bold text-quizlet-blue">
            Welcome {role === "learner" ? "Learner" : "Teacher"},{" "}
            {userData?.displayName || user?.email}!
          </h1>
          <p className="mt-2 text-gray-600">
            {role === "learner"
              ? "Improve your language skills with expert teachers"
              : "Help learners improve their language proficiency"}
          </p>
        </div>

        {role === "learner" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Request New Session</h2>
              <CreateSessionRequest userId={user.uid} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>
              <SessionCalendar userId={user.uid} role={role} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow col-span-2">
              <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
              <SessionList />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Session Requests</h2>
              <SessionRequests userId={user.uid} role={role} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Your Schedule</h2>
              <SessionCalendar userId={user.uid} role={role} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow col-span-2">
              <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
              <SessionList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}