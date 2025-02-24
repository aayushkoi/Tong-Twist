"use client";

import { useAuth } from "../../context/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/fb/firebase";
import SessionList from "../components/SessionList";
import SessionCalendar from "../components/Calendar";
import CreateSessionRequest from "../components/CreateSessionRequest";
import SessionRequests from "../components/SessionRequests";

export default function Dashboard() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("learner");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      // First clear any state that might try to use user
      setActiveTab(null);
      
      // Then sign out
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-quizlet-gray flex items-center justify-center">
        <p className="text-gray-900">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Return null while redirecting to prevent error
  }

  return (
    <div className="min-h-screen bg-quizlet-gray p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-quizlet-blue">
                Welcome, {userProfile?.displayName || user?.email}!
              </h1>
              <p className="mt-2 text-gray-700">
                {activeTab === "learner"
                  ? "Improve your language skills with expert teachers"
                  : "Help learners improve their language proficiency"}
              </p>
            </div>
            {/* <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button> */}
          </div>
          
          {/* Tab Switching */}
          <div className="mt-6 border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("learner")}
                className={`py-2 font-medium ${
                  activeTab === "learner"
                    ? "text-quizlet-blue border-b-2 border-quizlet-blue"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Learner Dashboard
              </button>
              <button
                onClick={() => setActiveTab("expert")}
                className={`py-2 font-medium ${
                  activeTab === "expert"
                    ? "text-quizlet-blue border-b-2 border-quizlet-blue"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Teacher Dashboard
              </button>
            </div>
          </div>
        </div>

        {activeTab === "learner" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Request New Session</h2>
              <CreateSessionRequest userId={user.uid} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Sessions</h2>
              <SessionCalendar userId={user.uid} role="learner" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow col-span-2">
              {/* <h2 className="text-xl font-semibold mb-4 text-gray-900">Upcoming Sessions</h2> */}
              <SessionList />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Session Requests</h2>
              <SessionRequests role="expert" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Schedule</h2>
              <SessionCalendar userId={user.uid} role="expert" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow col-span-2">
              {/* <h2 className="text-xl font-semibold mb-4 text-gray-900">Upcoming Sessions</h2> */}
              <SessionList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}