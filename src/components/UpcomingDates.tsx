import React from 'react';
import { useRecipients } from '../hooks/useRecipients';
import { format, isAfter, isBefore, addDays, parseISO } from 'date-fns';

interface SpecialDate {
  id: string;
  date: string;
  description: string;
  type: 'birthday' | 'anniversary' | 'other';
}

export const UpcomingDates: React.FC = () => {
  const { recipients } = useRecipients();
  
  const getUpcomingDates = () => {
    const today = new Date();
    const next30Days = addDays(today, 30);
    
    const allDates: Array<SpecialDate & { recipientName: string }> = [];
    
    recipients.forEach(recipient => {
      recipient.specialDates?.forEach(date => {
        const dateObj = parseISO(date.date);
        const thisYear = new Date(today.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        
        if (isAfter(thisYear, today) && isBefore(thisYear, next30Days)) {
          allDates.push({
            ...date,
            recipientName: recipient.name
          });
        }
      });
    });
    
    return allDates.sort((a, b) => 
      parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );
  };

  const upcomingDates = getUpcomingDates();

  if (upcomingDates.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upcoming Special Dates</h2>
        <p className="text-gray-500">No upcoming special dates in the next 30 days.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Upcoming Special Dates</h2>
      <div className="space-y-3">
        {upcomingDates.map((date) => (
          <div key={date.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
            <div>
              <span className="font-medium">{format(parseISO(date.date), 'MMMM d')}</span>
              <span className="ml-2 text-gray-600">({date.description})</span>
              <span className="ml-2 text-sm text-gray-500 capitalize">({date.type})</span>
            </div>
            <span className="text-blue-600">{date.recipientName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 