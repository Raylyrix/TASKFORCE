'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Users, Settings, Trash2, Edit, Eye, Copy, ExternalLink } from 'lucide-react';

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
  createdAt: string;
  updatedAt: string;
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
  }>;
  _count: {
    bookings: number;
  };
}

interface Booking {
  id: string;
  attendeeEmail: string;
  attendeeName?: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  status: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
  confirmationCode?: string;
  createdAt: string;
  eventType: {
    id: string;
    title: string;
    durationMin: number;
  };
  responses: Array<{
    id: string;
    answer: string;
    question: {
      id: string;
      question: string;
    };
  }>;
}

export default function AdminDatesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'event-types' | 'bookings'>('event-types');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchEventTypes();
    fetchBookings();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/dates/event-types`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch event types');
      }
      const data = await response.json();
      if (data.success) {
        setEventTypes(data.data);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/dates/bookings/organizer`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteEventType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event type? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/dates/event-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete event type');
      }

      setEventTypes(prev => prev.filter(et => et.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyBookingLink = async (eventTypeId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const userId = localStorage.getItem('user_id'); // You'll need to store this during login
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/dates/booking-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventTypeId, userId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate booking link');
      }

      const data = await response.json();
      if (data.success) {
        await navigator.clipboard.writeText(data.data.link);
        alert('Booking link copied to clipboard!');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/dates/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dates Admin Dashboard</h1>
          <p className="text-gray-600">Manage your event types and bookings</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('event-types')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'event-types'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Event Types ({eventTypes.length})
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Bookings ({bookings.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Event Types Tab */}
        {activeTab === 'event-types' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Event Types</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Event Type
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventTypes.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No event types yet</h3>
                  <p className="text-gray-600 mb-4">Create your first event type to start accepting bookings.</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Event Type
                  </button>
                </div>
              ) : (
                eventTypes.map((eventType) => (
                  <div key={eventType.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{eventType.title}</h3>
                        <p className="text-gray-600 text-sm">{eventType.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyBookingLink(eventType.id)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Copy booking link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingEventType(eventType)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteEventType(eventType.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{eventType.durationMin} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{eventType._count.bookings} bookings</span>
                      </div>
                      {eventType.price && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">{eventType.currency} {eventType.price}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        eventType.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {eventType.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => window.open(`/book/${eventType.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Booking Page
                      </button>
                    </div>

                    {/* Availability Preview */}
                    {eventType.availability.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Availability</h4>
                        <div className="space-y-1">
                          {eventType.availability.slice(0, 3).map((avail) => (
                            <div key={avail.id} className="text-xs text-gray-600">
                              {dayNames[avail.dayOfWeek]}: {avail.startTime} - {avail.endTime}
                            </div>
                          ))}
                          {eventType.availability.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{eventType.availability.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Bookings</h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No bookings yet
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {booking.attendeeName || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500">{booking.attendeeEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.eventType.title}</div>
                            <div className="text-sm text-gray-500">{booking.eventType.durationMin} min</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatTime(booking.startTime)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {booking.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {booking.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Mark Complete
                                </button>
                              )}
                              <button
                                onClick={() => {/* View booking details */}}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Event Type Modal would go here */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Event Type</h2>
                {/* Event type creation form would go here */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create Event Type
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}