import { useState, useEffect } from 'react';
import type { Gift } from '../types';
import { isDemoMode, initializeDemoData } from '../services/demoData';

export const useGifts = () => {
  const [gifts, setGifts] = useState<Gift[]>(() => {
    // Check for demo mode first
    if (isDemoMode()) {
      const saved = localStorage.getItem('gifts');
      return saved ? JSON.parse(saved) : [];
    }
    
    // Otherwise check for existing data
    const saved = localStorage.getItem('gifts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('gifts', JSON.stringify(gifts));
  }, [gifts]);

  const addGift = (gift: Omit<Gift, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newGift: Gift = {
      ...gift,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setGifts([...gifts, newGift]);
    return newGift;
  };

  const updateGift = (id: string, updates: Partial<Gift>) => {
    setGifts(gifts.map(gift => 
      gift.id === id ? { 
        ...gift, 
        ...updates,
        updatedAt: Date.now()
      } : gift
    ));
  };

  const deleteGift = (id: string) => {
    setGifts(gifts.filter(gift => gift.id !== id));
  };

  const getGiftsByRecipient = (recipientId: string) => {
    return gifts.filter(gift => gift.recipientId === recipientId);
  };

  const getGiftById = (id: string) => {
    return gifts.find(gift => gift.id === id);
  };

  // Load demo data if there are no gifts
  const loadDemoData = () => {
    const { gifts: demoGifts } = initializeDemoData();
    setGifts(demoGifts);
  };

  return {
    gifts,
    addGift,
    updateGift,
    deleteGift,
    getGiftsByRecipient,
    getGiftById,
    loadDemoData
  };
}; 