"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { auth, firestore } from "@/fb/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        
        try {
          // Get user profile from Firestore
          const userDocRef = doc(firestore, "users", authUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Create a new user profile if it doesn't exist
            const newUserProfile = {
              displayName: authUser.displayName || authUser.email.split('@')[0],
              email: authUser.email,
              photoURL: authUser.photoURL || '',
              role: 'learner', // Default role
              createdAt: new Date(),
            };
            
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isLearner: userProfile?.role === 'learner',
    isTeacher: userProfile?.role === 'expert',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);