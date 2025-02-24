"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, firestore } from "../fb/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user document exists
        const userRef = doc(firestore, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        if (!userSnapshot.exists()) {
          // Create the user document with default values if it doesn't exist
          await setDoc(userRef, {
            role: "learner",
            displayName: user.displayName || user.email,
          });
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
