'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface EventType {
  id: string;
  title: string;
  description?: string;
  durationMin: number;
  type: string;
}

export default function BookingPage() {
  const params = useParams();
  const eventTypeId = params.eventTypeId as string;
  
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [attendeeInfo, setAttendeeInfo] = useState({
    name: '',
    email: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchEventTypeAndSlots();
  }, [eventTypeId]);

  const fetchEventTypeAndSlots = async () => {
    try {
      // Fetch event type details
      const eventTypeResponse = await fetch(`/api/v1/dates/event-types/${eventTypeId}`);
      if (eventTypeResponse.ok) {
        const eventTypeData = await eventTypeResponse.json();
        setEventType(eventTypeData.data);
      }

      // Fetch availability
      const availabilityResponse = await fetch(`/api/v1/dates/availability/demo-user?days=14`);
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        setTimeSlots(availabilityData.data.slots);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !attendeeInfo.name || !attendeeInfo.email) {
      alert('Please fill in all required fields and select a time slot');
      return;
    }

    setBooking(true);
    try {
      const response = await fetch('/api/v1/dates/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventTypeId,
          organizerId: 'demo-user',
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          attendees: [attendeeInfo],
          metadata: { notes: attendeeInfo.notes }
        }),
      });

      if (response.ok) {
        const bookingData = await response.json();
        alert('Booking confirmed! You will receive a calendar invitation shortly.');
        // Redirect or show success page
      } else {
        alert('Failed to book meeting. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book meeting. Please try again.');
    } finally {
      setBooking(false);
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book: {eventType?.title || 'Meeting'}
          </h1>
          {eventType?.description && (
            <p className="text-gray-600 mb-6">{eventType.description}</p>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Time Slot Selection */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Select a time</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSlot(slot)}
                    disabled={!slot.available}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      selectedSlot?.start === slot.start
                        ? 'border-blue-500 bg-blue-50'
                        : slot.available
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium">
                      {new Date(slot.start).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(slot.start).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} - {new Date(slot.end).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Attendee Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={attendeeInfo.name}
                    onChange={(e) => setAttendeeInfo({ ...attendeeInfo, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={attendeeInfo.email}
                    onChange={(e) => setAttendeeInfo({ ...attendeeInfo, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={attendeeInfo.notes}
                    onChange={(e) => setAttendeeInfo({ ...attendeeInfo, notes: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional information..."
                  />
                </div>
              </div>

              {selectedSlot && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">Selected Time</h3>
                  <p className="text-blue-700">
                    {new Date(selectedSlot.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-blue-700">
                    {new Date(selectedSlot.start).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })} - {new Date(selectedSlot.end).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!selectedSlot || booking}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
