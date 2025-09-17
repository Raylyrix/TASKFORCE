'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, User, MapPin, Video, CheckCircle, AlertCircle } from 'lucide-react';

interface EventType {
  id: string;
  title: string;
  description?: string;
  durationMin: number;
  type: string;
  bufferBefore: number;
  bufferAfter: number;
  isActive: boolean;
  requiresConfirmation: boolean;
  maxBookings?: number;
  price?: number;
  currency: string;
  settings?: any;
  owner: {
    id: string;
    name?: string;
    email: string;
  };
  availability: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    timeZone: string;
  }>;
  questions: Array<{
    id: string;
    question: string;
    type: string;
    isRequired: boolean;
    options: string[];
    placeholder?: string;
  }>;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface BookingForm {
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
  responses: Array<{
    questionId: string;
    answer: string;
  }>;
}

export default function BookingPage() {
  const { eventTypeId } = useParams();
  const router = useRouter();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    attendeeName: '',
    attendeeEmail: '',
    notes: '',
    responses: []
  });
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const fetchEventType = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/dates/event-types/${eventTypeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event type');
      }
      const data = await response.json();
      if (data.success) {
        setEventType(data.data);
        // Set default date to today
        setSelectedDate(new Date().toISOString().split('T')[0]);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventTypeId]);

  useEffect(() => {
    if (eventTypeId) {
      fetchEventType();
    }
  }, [eventTypeId, fetchEventType]);

  const fetchAvailableSlots = useCallback(async (date: string) => {
    if (!eventType) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/dates/availability/${eventType.owner.id}?date=${date}&days=1`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      const data = await response.json();
      if (data.success) {
        // Filter slots for this event type
        const slots = data.data.slots.filter((slot: any) => slot.eventTypeId === eventType.id);
        setAvailableSlots(slots);
      }
    } catch (err: any) {
      console.error('Error fetching slots:', err);
      setAvailableSlots([]);
    }
  }, [eventType]);

  useEffect(() => {
    if (selectedDate && eventType) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, eventType, fetchAvailableSlots]);

  const handleFormChange = (field: keyof BookingForm, value: string) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionResponse = (questionId: string, answer: string) => {
    setBookingForm(prev => ({
      ...prev,
      responses: prev.responses.filter(r => r.questionId !== questionId).concat({
        questionId,
        answer
      })
    }));
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBooking = async () => {
    if (!selectedSlot || !eventType || !bookingForm.attendeeName || !bookingForm.attendeeEmail) {
      return;
    }

    setIsBooking(true);
    try {
      const slot = availableSlots.find(s => s.start === selectedSlot);
      if (!slot) {
        throw new Error('Selected slot not found');
      }

      const bookingData = {
        eventTypeId: eventType.id,
        attendeeName: bookingForm.attendeeName,
        attendeeEmail: bookingForm.attendeeEmail,
        startTime: slot.start,
        endTime: slot.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: bookingForm.notes,
        responses: bookingForm.responses
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/dates/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const data = await response.json();
      if (data.success) {
        setBookingSuccess(true);
      } else {
        throw new Error(data.error || 'Booking failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600">The event type you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-4">
            Your meeting has been successfully booked. You&apos;ll receive a confirmation email shortly.
          </p>
          <button
            onClick={() => window.close()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{eventType.title}</h1>
            <p className="text-blue-100">{eventType.description}</p>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{eventType.durationMin} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>with {eventType.owner.name || eventType.owner.email}</span>
              </div>
              {eventType.price && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{eventType.currency} {eventType.price}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Left Column - Date & Time Selection */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Date & Time
              </h2>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Time Slots */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available times for {selectedDate && formatDate(selectedDate)}
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {availableSlots.length === 0 ? (
                    <p className="text-gray-500 col-span-2 text-center py-4">
                      No available slots for this date
                    </p>
                  ) : (
                    availableSlots.map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot.start)}
                        disabled={!slot.available}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          selectedSlot === slot.start
                            ? 'bg-blue-600 text-white border-blue-600'
                            : slot.available
                            ? 'bg-white text-gray-900 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Meeting Details */}
              {selectedSlot && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Meeting Details</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{selectedDate && formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(selectedSlot)} - {formatTime(availableSlots.find(s => s.start === selectedSlot)?.end || '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <span>Google Meet link will be provided</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Form */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Book Your Meeting</h2>

              <div className="space-y-4">
                {/* Attendee Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={bookingForm.attendeeName}
                    onChange={(e) => handleFormChange('attendeeName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={bookingForm.attendeeEmail}
                    onChange={(e) => handleFormChange('attendeeEmail', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                {/* Questions */}
                {eventType.questions.map((question) => (
                  <div key={question.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {question.question} {question.isRequired && '*'}
                    </label>
                    {question.type === 'TEXT' && (
                      <input
                        type="text"
                        value={bookingForm.responses.find(r => r.questionId === question.id)?.answer || ''}
                        onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={question.placeholder}
                        required={question.isRequired}
                      />
                    )}
                    {question.type === 'TEXTAREA' && (
                      <textarea
                        value={bookingForm.responses.find(r => r.questionId === question.id)?.answer || ''}
                        onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder={question.placeholder}
                        required={question.isRequired}
                      />
                    )}
                    {question.type === 'SELECT' && (
                      <select
                        value={bookingForm.responses.find(r => r.questionId === question.id)?.answer || ''}
                        onChange={(e) => handleQuestionResponse(question.id, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={question.isRequired}
                      >
                        <option value="">Select an option</option>
                        {question.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Any additional information you&apos;d like to share..."
                  />
                </div>

                {/* Booking Button */}
                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot || !bookingForm.attendeeName || !bookingForm.attendeeEmail || isBooking}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isBooking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}