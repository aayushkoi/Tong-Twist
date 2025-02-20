// tong/src/app/dashboard/page.jsx
"use client";

import { useAuth } from "../../context/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import VideoCall from "../components/VideoCall";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-quizlet-gray flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold text-quizlet-blue">Welcome to your Dashboard</h1>
        <p className="mt-4 text-gray-700">Hello, {user?.email}!</p>
      </div>
      <VideoCall />
    </div>
  );
}