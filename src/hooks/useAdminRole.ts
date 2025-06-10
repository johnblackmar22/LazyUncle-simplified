// Hook to check if current user has admin role
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { COLLECTIONS } from '../utils/constants';

export function useAdminRole() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const checkAdminRole = async () => {
      setIsLoading(true);
      
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has admin role in Firebase
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const hasAdminRole = userData?.role && ['admin', 'super_admin'].includes(userData.role);
          setIsAdmin(hasAdminRole);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, isLoading };
} 