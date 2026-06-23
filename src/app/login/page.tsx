'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push(data.redirect);
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#edf5fd' }}>
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg w-full box-border" style={{ maxWidth: '420px' }}>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight mb-2">
            <span style={{ color: '#005c8a' }}>Monitoring DHKP</span>{' '}
            <span style={{ color: '#f97316' }}>PBB</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: '#475569' }}>Silakan masuk ke akun Anda</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-[#002542]">Username</label>
            <div 
              className="flex items-center border rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-[#005c8a] focus-within:bg-white focus-within:border-[#005c8a]"
              style={{ backgroundColor: '#eef4ff', borderColor: '#b6ccee' }}
            >
              <div className="pl-4 pr-3 flex items-center justify-center">
                <User size={20} className="text-[#8aa6ce]" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full py-3.5 pr-4 bg-transparent outline-none text-[#002542] font-semibold placeholder-slate-400"
                placeholder="Masukkan username"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-[#002542]">Password</label>
              <a href="#" className="text-xs font-bold text-[#005c8a] hover:underline">Lupa password?</a>
            </div>
            <div 
              className="flex items-center border rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-[#005c8a] focus-within:bg-white focus-within:border-[#005c8a]"
              style={{ backgroundColor: '#eef4ff', borderColor: '#b6ccee' }}
            >
              <div className="pl-4 pr-3 flex items-center justify-center">
                <Lock size={20} className="text-[#8aa6ce]" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full py-3.5 pr-2 bg-transparent outline-none text-[#002542] font-semibold placeholder-slate-400 ${password && !showPassword ? 'tracking-[0.2em]' : ''}`}
                placeholder="Masukkan password"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="px-4 flex items-center justify-center text-[#8aa6ce] hover:text-[#005c8a] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ backgroundColor: '#005c8a' }}
            className="w-full py-4 hover:opacity-90 text-white rounded-xl font-bold transition disabled:opacity-50 mt-6 text-lg shadow-md box-border"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
