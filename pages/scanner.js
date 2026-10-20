import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { supabase } from '../lib/supabaseClient';

export default function Scanner() {
  const [scanResult, setScanResult] = useState('');
  const [message, setMessage] = useState('');

  const handleScan = async (result, error) => {
    if (!!result) {
      const scannedId = result?.text;
      setScanResult(scannedId);
      
      // I-record ang attendance sa database (pananglitan event_id 1)
      const { error: dbError } = await supabase
        .from('event_registrations')
        .update({ status: 'attended' }) // I-mark as attended
        .eq('student_school_id', scannedId) // Basi sa school_id nga na-scan sa QR
        .eq('event_id', 1); 

      if (dbError) setMessage('Error sa pag-record.');
      else setMessage(`Success! Attendance recorded for ID: ${scannedId}`);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Event Scanner (Admin/Staff)</h1>
      
      <div className="border-4 border-orange-500 rounded-lg overflow-hidden">
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: 'environment' }} // Gamiton ang back camera sa phone
          style={{ width: '100%' }}
        />
      </div>

      {scanResult && <p className="mt-4 text-lg font-semibold text-gray-700">Na-scan nga ID: {scanResult}</p>}
      {message && <p className="mt-2 font-bold text-green-600">{message}</p>}
    </div>
  );
}
       
export async function getServerSideProps() {
  return {
    props: {},
  };
}
