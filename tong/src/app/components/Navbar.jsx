// tong/src/components/Navbar.jsx
"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthProvider";
import { auth } from "../../fb/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); // Redirect to homepage after logout
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <nav className="bg-quizlet-blue p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold">
          Tong
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-white hover:text-gray-200">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-white text-quizlet-blue py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="text-white hover:text-gray-200">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}