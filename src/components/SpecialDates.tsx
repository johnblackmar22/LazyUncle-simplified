import React, { useState } from 'react';
import { useRecipientStore } from '../store/recipientStore';
import { format } from 'date-fns';
import type { Recipient as BaseRecipient } from '../types';

interface SpecialDate {
  id: string;
  date: string;
  description: string;
  type: 'birthday' | 'anniversary' | 'other';
}

interface Recipient extends BaseRecipient {
  specialDates?: SpecialDate[];
}

export const SpecialDates: React.FC<{ recipientId: string }> = ({ recipientId }) => {
  const { recipients, updateRecipient } = useRecipientStore();
  const extendedRecipients = recipients as Recipient[];
  const recipient = extendedRecipients.find(r => r.id === recipientId);
  const [newDate, setNewDate] = useState<Omit<SpecialDate, 'id'>>({
    date: '',
    description: '',
    type: 'birthday'
  });

  const handleAddDate = () => {
    if (!recipient) return;
    
    const updatedDates = [
      ...((recipient.specialDates as SpecialDate[]) || []),
      { ...newDate, id: Date.now().toString() }
    ];
    
    updateRecipient(recipientId, { specialDates: updatedDates } as Partial<Recipient>);
    setNewDate({ date: '', description: '', type: 'birthday' });
  };

  const handleDeleteDate = (dateId: string) => {
    if (!recipient) return;
    
    const updatedDates = (recipient.specialDates as SpecialDate[] | undefined)?.filter((date: SpecialDate) => date.id !== dateId) || [];
    updateRecipient(recipientId, { specialDates: updatedDates } as Partial<Recipient>);
  };

  if (!recipient) return null;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Special Dates</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Add New Date</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            value={newDate.date}
            onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
            className="border rounded p-2"
          />
          <input
            type="text"
            placeholder="Description"
            value={newDate.description}
            onChange={(e) => setNewDate({ ...newDate, description: e.target.value })}
            className="border rounded p-2"
          />
          <select
            value={newDate.type}
            onChange={(e) => setNewDate({ ...newDate, type: e.target.value as SpecialDate['type'] })}
            className="border rounded p-2"
          >
            <option value="birthday">Birthday</option>
            <option value="anniversary">Anniversary</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          onClick={handleAddDate}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Date
        </button>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Existing Dates</h3>
        <div className="space-y-2">
          {(recipient.specialDates as SpecialDate[] | undefined)?.map((date: SpecialDate) => (
            <div key={date.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <div>
                <span className="font-medium">{format(new Date(date.date), 'MMMM d, yyyy')}</span>
                <span className="ml-2 text-gray-600">({date.description})</span>
                <span className="ml-2 text-sm text-gray-500 capitalize">({date.type})</span>
              </div>
              <button
                onClick={() => handleDeleteDate(date.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 