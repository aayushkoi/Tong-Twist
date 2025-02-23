// src/app/call/[roomId]/page.jsx
"use client";
import { useParams } from "next/navigation";
import VideoCall from "@/app/components/VideoCall";

export default function CallRoomPage() {
  const { roomId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold">Video Call Room</h1>
        <p>Room ID: {roomId}</p>
      </header>
      <VideoCall roomId={roomId} />
    </div>
  );
}
