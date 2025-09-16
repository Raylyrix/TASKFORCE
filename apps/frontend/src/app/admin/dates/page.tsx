'use client';

import { useState, useEffect } from 'react';

interface EventType {
  id: string;
  title: string;
  description?: string;
  durationMin: number;
  type: string;
  bufferBefore: number;
  bufferAfter: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  id: string;
  eventTypeId: string;
  organizerId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  attendees: { email: string; name?: string }[];
  location: string;
  createdAt: string;
}

export default function DatesAdminPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEventType, setNewEventType] = useState({
    title: '',
    description: '',
    durationMin: 30,
    type: 'ONE_ON_ONE',
    bufferBefore: 5,
    bufferAfter: 5,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch event types
      const eventTypesResponse = await fetch('/api/v1/dates/event-types');
      if (eventTypesResponse.ok) {
        const eventTypesData = await eventTypesResponse.json();
        setEventTypes(eventTypesData.data);
      }

      // Fetch bookings
      const bookingsResponse = await fetch('/api/v1/dates/bookings');
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/dates/event-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEventType),
      });

      if (response.ok) {
        const eventTypeData = await response.json();
        setEventTypes([...eventTypes, eventTypeData.data]);
        setNewEventType({
          title: '',
          description: '',
          durationMin: 30,
          type: 'ONE_ON_ONE',
          bufferBefore: 5,
          bufferAfter: 5,
          isActive: true
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating event type:', error);
      alert('Failed to create event type');
    }
  };

  const generateBookingLink = async (eventTypeId: string) => {
    try {
      const response = await fetch('/api/v1/dates/booking-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventTypeId, userId: 'demo-user' }),
      });

      if (response.ok) {
        const linkData = await response.json();
        navigator.clipboard.writeText(linkData.data.link);
        alert('Booking link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error generating booking link:', error);
      alert('Failed to generate booking link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dates Admin</h1>
          <p className="text-gray-600">Manage your scheduling and event types</p>
        </div>

        {/* Event Types Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Event Types</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showCreateForm ? 'Cancel' : 'Create Event Type'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateEventType} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newEventType.title}
                    onChange={(e) => setNewEventType({ ...newEventType, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={newEventType.durationMin}
                    onChange={(e) => setNewEventType({ ...newEventType, durationMin: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newEventType.type}
                    onChange={(e) => setNewEventType({ ...newEventType, type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ONE_ON_ONE">One-on-One</option>
                    <option value="GROUP">Group</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="COLLECTIVE">Collective</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buffer Before (minutes)
                  </label>
                  <input
                    type="number"
                    value={newEventType.bufferBefore}
                    onChange={(e) => setNewEventType({ ...newEventType, bufferBefore: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newEventType.description}
                    onChange={(e) => setNewEventType({ ...newEventType, description: e.target.value })}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Event Type
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventTypes.map((eventType) => (
              <div key={eventType.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{eventType.title}</h3>
                {eventType.description && (
                  <p className="text-gray-600 text-sm mb-3">{eventType.description}</p>
                )}
                <div className="space-y-1 text-sm text-gray-500">
                  <p>Duration: {eventType.durationMin} minutes</p>
                  <p>Type: {eventType.type.replace('_', ' ')}</p>
                  <p>Buffer: {eventType.bufferBefore}min before, {eventType.bufferAfter}min after</p>
                  <p>Status: {eventType.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <button
                  onClick={() => generateBookingLink(eventType.id)}
                  className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Copy Booking Link
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Bookings</h2>
          
          {bookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.eventTypeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(booking.startTime).toLocaleDateString()} at{' '}
                        {new Date(booking.startTime).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.attendees.map(a => a.email).join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
