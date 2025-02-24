"use client";
import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { firestore } from "@/fb/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import "./Calendar.css";

export default function SessionCalendar({ userId, role }) {
  const [date, setDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const field = role === "learner" ? "learnerId" : "expertId";
    const q = query(collection(firestore, "sessions"), where(field, "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        roomId: doc.data().roomId,
      }));
      setSessions(sessionsData);
    });
    return () => unsubscribe();
  }, [userId, role]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  // Filter sessions for the selected date
  const sessionsForDate = sessions.filter(
    (session) => session.startTime.toDateString() === date.toDateString()
  );

  // Determine if the session is active
  const isSessionActive = (session) => {
    const now = new Date();
    return now >= session.startTime && now <= session.endTime;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Scheduled Sessions</h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          <Calendar
            onChange={handleDateChange}
            value={date}
            className="custom-calendar"
            formatMonthYear={(locale, date) =>
              date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
            }
          />
        </div>
        <div className="lg:w-1/2">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Sessions on {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </h3>
          {sessionsForDate.length > 0 ? (
            <ul className="space-y-2">
              {sessionsForDate.map((session) => (
                <li
                  key={session.id}
                  className="p-4 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{session.title}</p>
                    <p className="text-sm text-gray-700">
                      {session.startTime.toLocaleTimeString()} - {session.endTime.toLocaleTimeString()}
                    </p>
                  </div>
                  {isSessionActive(session) && (
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => router.push(`/call/${session.roomId}`)}
                    >
                      Join Call
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No sessions scheduled for this date.</p>
          )}
        </div>
      </div>
    </div>
  );
}