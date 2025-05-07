import { useState, useEffect } from 'react';
import type { Recipient } from '../types';
import { initializeDemoData, isDemoMode } from '../services/demoData';

export const useRecipients = () => {
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    // Check for demo mode first
    if (isDemoMode()) {
      const saved = localStorage.getItem('recipients');
      return saved ? JSON.parse(saved) : [];
    }
    
    // Otherwise check for existing data
    const saved = localStorage.getItem('recipients');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('recipients', JSON.stringify(recipients));
  }, [recipients]);

  const addRecipient = (recipient: Omit<Recipient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipient: Recipient = {
      ...recipient,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setRecipients([...recipients, newRecipient]);
  };

  const updateRecipient = (id: string, updates: Partial<Recipient>) => {
    setRecipients(recipients.map(recipient => 
      recipient.id === id ? { 
        ...recipient, 
        ...updates,
        updatedAt: Date.now()
      } : recipient
    ));
  };

  const deleteRecipient = (id: string) => {
    setRecipients(recipients.filter(recipient => recipient.id !== id));
  };

  // Load demo data if there are no recipients
  const loadDemoData = () => {
    const { recipients: demoRecipients } = initializeDemoData();
    setRecipients(demoRecipients);
  };

  return {
    recipients,
    addRecipient,
    updateRecipient,
    deleteRecipient,
    loadDemoData
  };
}; 