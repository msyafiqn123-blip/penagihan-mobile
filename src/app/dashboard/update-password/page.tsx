'use client';

import { useState } from 'react';
import { KeyRound, CheckCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (newPassword !== confirmPassword) {
      setResult({ error: 'Konfirmasi password baru tidak cocok' });
      return;
    }

    if (newPassword.length < 6) {
      setResult({ error: 'Password baru minimal 6 karakter' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setResult({ success: true });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResult({ error: data.error || 'Gagal mengubah password' });
      }
    } catch (e) {
      setResult({ error: 'Terjadi kesalahan jaringan' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800">Update Password</h1>

      <div className="bg-card p-6 rounded-2xl shadow-sm border">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password Lama</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="bg-slate-50 border border-slate-200"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="bg-slate-50 border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-slate-50 border border-slate-200"
            />
          </div>

          {result && (
            <div className={`p-3 rounded-lg text-sm font-medium ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {result.success ? (
                <span className="flex items-center"><CheckCircle size={16} className="mr-2" /> Password berhasil diubah!</span>
              ) : (
                result.error
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-bold flex justify-center items-center transition ${loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}`}
          >
            <KeyRound size={18} className="mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}
