import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react'; // Tigbuhat sa QR Code

export default function MyDigitalID() {
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('email', user.email).single();
      setProfile(data);
    }
  };

  const uploadPhoto = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.school_id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload sa Supabase Storage
      let { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Kuhaon ang public URL sa photo
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);

      // I-update ang profile sa database
      await supabase.from('profiles').update({ photo_url: publicUrl }).eq('id', profile.id);
      
      fetchProfile(); // I-refresh ang data
    } catch (error) {
      alert('Error sa pag-upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="flex flex-col items-center p-8 bg-orange-100 min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-lg w-80 text-center border-t-8 border-orange-500">
        <h2 className="text-xl font-bold mb-4">Official Digital ID</h2>
        
        {/* Profile Photo Area */}
        <div className="mb-4">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="Profile" className="w-32 h-32 mx-auto rounded-md object-cover border-4 border-gray-200" />
          ) : (
            <div className="w-32 h-32 mx-auto bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-sm text-gray-500">No Photo</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} className="mt-2 text-xs" />
        </div>

        <h3 className="text-2xl font-bold text-gray-800">{profile.email}</h3>
        <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mt-1">Student ID: {profile.school_id}</p>

        {/* Automatic QR Code Generation */}
        <div className="mt-6 p-4 bg-gray-50 border rounded-xl flex justify-center">
          <QRCodeCanvas value={profile.school_id} size={150} />
        </div>
        <p className="text-xs text-gray-500 mt-2 font-semibold">SCAN FOR ATTENDANCE</p>
      </div>
    </div>
  );
}
