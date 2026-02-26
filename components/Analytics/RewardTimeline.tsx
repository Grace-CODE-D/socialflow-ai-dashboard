import React, { useState } from 'react';

interface RewardEvent {
  id: string;
  date: string;
  amount: number;
  recipient: string;
  campaign: string;
}

export const RewardTimeline: React.FC<{ events: RewardEvent[] }> = ({ events }) => {
  const [filter, setFilter] = useState('');

  const filteredEvents = events.filter(e => 
    e.campaign.toLowerCase().includes(filter.toLowerCase())
  );

  const cumulative = filteredEvents.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Reward Distribution Timeline</h3>
        <input 
          type="text" 
          placeholder="Filter by campaign..."
          className="border rounded-lg px-3 py-1 text-sm"
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="mb-4 p-3 bg-green-50 rounded-lg">
        <p className="text-sm text-green-700 font-semibold">
          Cumulative Rewards: {cumulative.toFixed(2)} XLM/Tokens
        </p>
      </div>

      <div className="relative border-l-2 border-indigo-200 ml-3 space-y-8">
        {filteredEvents.map((event) => (
          <div key={event.id} className="relative pl-8">
            <div className="absolute -left-2.5 top-1 w-5 h-5 bg-indigo-600 rounded-full border-4 border-white"></div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-mono">{event.date}</span>
              <span className="font-bold text-gray-800">{event.amount} XLM Distributed</span>
              <span className="text-sm text-gray-600">Campaign: **{event.campaign}**</span>
              <span className="text-xs text-indigo-500 truncate">To: {event.recipient}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};