import { useState, useEffect } from 'react';
import type { Recipient } from '../types';

export const useRecipients = () => {
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
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

  return {
    recipients,
    addRecipient,
    updateRecipient,
    deleteRecipient
  };
}; 