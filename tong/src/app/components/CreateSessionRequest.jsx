// src/app/components/CreateSessionRequest.jsx
"use client";
import { useState } from 'react';
import { firestore } from "@/fb/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function CreateSessionRequest({ userId }) {
  const [sessionRequest, setSessionRequest] = useState({
    title: '',
    date: '',
    time: '',
    duration: 60, // minutes
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const startTime = new Date(`${sessionRequest.date}T${sessionRequest.time}`);
    const endTime = new Date(startTime.getTime() + sessionRequest.duration * 60000);

    try {
      await addDoc(collection(firestore, "sessionRequests"), {
        learnerId: userId,
        title: sessionRequest.title,
        startTime,
        endTime,
        status: 'pending',
        createdAt: new Date(),
      });
      
      setSessionRequest({ title: '', date: '', time: '', duration: 60 });
    } catch (error) {
      console.error("Error creating session request:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Session Title</label>
        <input
          type="text"
          value={sessionRequest.title}
          onChange={(e) => setSessionRequest(prev => ({ ...prev, title: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={sessionRequest.date}
          onChange={(e) => setSessionRequest(prev => ({ ...prev, date: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Time</label>
        <input
          type="time"
          value={sessionRequest.time}
          onChange={(e) => setSessionRequest(prev => ({ ...prev, time: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
        <select
          value={sessionRequest.duration}
          onChange={(e) => setSessionRequest(prev => ({ ...prev, duration: Number(e.target.value) }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Request Session
      </button>
    </form>
  );
}
