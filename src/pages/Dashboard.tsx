import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipients } from '../hooks/useRecipients';
import { UpcomingDates } from '../components/UpcomingDates';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { recipients } = useRecipients();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => navigate('/recipients/new')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Recipient
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Recipients Overview</h2>
          <p className="text-gray-600">Total Recipients: {recipients.length}</p>
          <button
            onClick={() => navigate('/recipients')}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            View All Recipients →
          </button>
        </div>

        <UpcomingDates />
      </div>
    </div>
  );
}; 