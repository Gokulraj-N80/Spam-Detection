import React, { createContext, useContext, useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider, useMockAuth } from "../firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state
  useEffect(() => {
    if (useMockAuth) {
      // Mock Authentication Flow
      const cachedUser = localStorage.getItem("scamshield_mock_user");
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
      setLoading(false);
    } else if (auth) {
      // Real Firebase Auth Flow
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "Firebase User",
            photoURL: firebaseUser.photoURL || "https://api.dicebear.com/7.x/identicon/svg?seed=shield"
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    if (useMockAuth) {
      // Mock Sign In
      const mockUser = {
        uid: "mock_user_123",
        email: "demo.user@scamshield.local",
        displayName: "Demo User",
        photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=scamshield"
      };
      localStorage.setItem("scamshield_mock_user", JSON.stringify(mockUser));
      setUser(mockUser);
      setLoading(false);
      return mockUser;
    } else if (auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "Firebase User",
          photoURL: firebaseUser.photoURL || "https://api.dicebear.com/7.x/identicon/svg?seed=shield"
        };
        setUser(profile);
        setLoading(false);
        return profile;
      } catch (error) {
        setLoading(false);
        console.error("Google Sign-In failed:", error);
        throw error;
      }
    }
  };

  const logout = async () => {
    setLoading(true);
    if (useMockAuth) {
      localStorage.removeItem("scamshield_mock_user");
      setUser(null);
      setLoading(false);
    } else if (auth) {
      try {
        await signOut(auth);
        setUser(null);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Sign-Out failed:", error);
      }
    }
  };

  const getToken = async () => {
    if (useMockAuth) {
      if (!user) return null;
      // Encode user info as a mock token: mock_uid|email|displayName
      return `mock_${user.uid}|${user.email}|${user.displayName}`;
    } else if (auth && auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken();
      } catch (error) {
        console.error("Failed to fetch Firebase ID token:", error);
        return null;
      }
    }
    return null;
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    logout,
    getToken,
    isMock: useMockAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
