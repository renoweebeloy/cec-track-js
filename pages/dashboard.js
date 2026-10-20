import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function StudentDashboard() {
  const [events, setEvents] = useState([]);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Kuhaon ang email sa naka-login nga user
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);
    };
    
    // Kuhaon ang tanang "active" events
    const fetchEvents = async () => {
      const { data } = await supabase.from('events').select('*').eq('status', 'active');
      if (data) setEvents(data);
    };

    fetchUser();
    fetchEvents();
  }, []);

  const handleRegisterEvent = async (eventId) => {
    const { error } = await supabase
      .from('event_registrations')
      .insert([{ event_id: eventId, student_email: userEmail }]);

    if (error) {
      alert("Naka-register naka daan ani nga event o adunay error.");
    } else {
      alert("Success! Na-register naka sa event.");
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-orange-600">Active Organization Events</h1>
      
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-500">Walay active events sa pagkakaron.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-bold">{event.title}</h2>
              <p className="text-sm text-gray-500 mb-2">
                Date: {new Date(event.date).toLocaleString()}
              </p>
              <p className="text-gray-700 mb-4">{event.description}</p>
              
              <button 
                onClick={() => handleRegisterEvent(event.id)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-medium">
                Register for Event
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
