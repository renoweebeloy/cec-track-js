import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard() {
  const [studentId, setStudentId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('profiles')
      .insert([{ school_id: studentId, email: studentEmail }]);

    if (error) setStatusMsg(`Error: ${error.message}`);
    else {
      setStatusMsg("Student na-add na sa database!");
      setStudentId(''); setStudentEmail('');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('events')
      .insert([{ title: eventTitle, description: eventDesc, date: eventDate, status: 'active' }]);

    if (error) setStatusMsg(`Error: ${error.message}`);
    else {
      setStatusMsg("Event na-publish na!");
      setEventTitle(''); setEventDesc(''); setEventDate('');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard - Miya</h1>
      {statusMsg && <p className="p-3 mb-4 bg-blue-100 text-blue-800 rounded">{statusMsg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Student Section */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Add Student (Whitelist)</h2>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <input type="text" placeholder="School ID (e.g. 2024-001)" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full p-2 border rounded" required />
            <input type="email" placeholder="Student Gmail" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="w-full p-2 border rounded" required />
            <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">Register Student</button>
          </form>
        </div>

        {/* Add Event Section */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <input type="text" placeholder="Event Title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full p-2 border rounded" required />
            <textarea placeholder="Event Description" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} className="w-full p-2 border rounded" required />
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full p-2 border rounded" required />
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Publish Event</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Gi-add ni aron dili mag-pre-render / static collection ang Vercel sa build phase
export async function getServerSideProps() {
  return {
    props: {},
  };
}
