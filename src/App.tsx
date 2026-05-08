import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { User } from './types';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageSchools from './pages/ManageSchools';
import ManageSPPGs from './pages/ManageSPPGs';
import SubmitReport from './pages/SubmitReport';
import Layout from './components/Layout';
import { seedData } from './lib/seed';

import CompleteProfile from './pages/CompleteProfile';
import CommunityGuidelines from './pages/CommunityGuidelines';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      
      if (fUser) {
        // Only seed if user is the designated admin to avoid permission errors for others
        if (fUser.email === 'hokkyjoshua@gmail.com') {
          seedData();
        }

        // Listen to user profile document for real-time updates (faster dashboard transitions)
        const unsubscribeProfile = onSnapshot(doc(db, 'users', fUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // Force admin role for the owner email and sync with DB if needed
            if (fUser.email === 'hokkyjoshua@gmail.com') {
              if (userData.role !== 'admin') {
                import('firebase/firestore').then(({ updateDoc }) => {
                  updateDoc(doc(db, 'users', fUser.uid), { role: 'admin' }).catch(console.error);
                });
              }
              userData.role = 'admin';
            }
            setUser({ id: fUser.uid, ...userData } as User);
          } else {
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUser(null);
          setLoading(false);
        });

        // Store the profile unsubscribe to clean up if the auth user changes or component unmounts
        return unsubscribeProfile;
      } else {
        setUser(null);
        setLoading(false);
        return () => {}; // return empty cleanup for consistency
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary-sky border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Determine if user needs to complete profile
  const needsProfile = firebaseUser && !user;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/complete-profile" element={firebaseUser ? (user ? <Navigate to="/dashboard" /> : <CompleteProfile />) : <Navigate to="/login" />} />
      <Route path="/guidelines" element={<CommunityGuidelines />} />
      
      <Route element={<Layout user={user} />}>
        <Route 
          path="/admin" 
          element={firebaseUser ? (needsProfile ? <Navigate to="/complete-profile" /> : (user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />)) : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin/schools" 
          element={firebaseUser ? (needsProfile ? <Navigate to="/complete-profile" /> : (user?.role === 'admin' ? <ManageSchools /> : <Navigate to="/dashboard" />)) : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin/sppgs" 
          element={firebaseUser ? (needsProfile ? <Navigate to="/complete-profile" /> : (user?.role === 'admin' ? <ManageSPPGs /> : <Navigate to="/dashboard" />)) : <Navigate to="/login" />} 
        />
        <Route 
          path="/dashboard" 
          element={firebaseUser ? (needsProfile ? <Navigate to="/complete-profile" /> : (user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard user={user!} />)) : <Navigate to="/login" />} 
        />
        <Route 
          path="/submit-report" 
          element={<SubmitReport user={user} />} 
        />
        <Route 
          path="/settings" 
          element={firebaseUser ? (needsProfile ? <Navigate to="/complete-profile" /> : <SettingsPage user={user} />) : <Navigate to="/login" />} 
        />
        {/* Add more protected routes here */}
      </Route>
    </Routes>
  );
}
