'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, KeyRound, Search, Trash2, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AccountsManagementPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const router = useRouter();

  // Create account states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('KOLEKTOR');
  const [newKecamatan, setNewKecamatan] = useState('');
  const [newKelurahan, setNewKelurahan] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [locations, setLocations] = useState<{kecamatan: string, kelurahan: string[]}[]>([]);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch(e) { console.error(e) }
  };

  // Modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetId, setResetTargetId] = useState('');
  const [resetTargetName, setResetTargetName] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/admin/accounts');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setAccounts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchLocations();
  }, [router]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch('/api/admin/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
          nm_kecamatan: newKecamatan,
          nm_kelurahan: newKelurahan
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Akun berhasil dibuat!');
        setNewUsername('');
        setNewPassword('');
        setNewKecamatan('');
        setNewKelurahan('');
        fetchAccounts();
      } else {
        alert('Gagal: ' + data.error);
      }
    } catch (e) {
      alert('Terjadi kesalahan');
    } finally {
      setCreateLoading(false);
    }
  };

  const openResetModal = (id: string, username: string) => {
    setResetTargetId(id);
    setResetTargetName(username);
    setResetPasswordValue('');
    setResetModalOpen(true);
  };

  const submitResetPassword = async () => {
    if (resetPasswordValue.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch('/api/admin/accounts/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: resetTargetId,
          newPassword: resetPasswordValue
        })
      });
      if (res.ok) {
        alert('Password berhasil diubah!');
        setResetModalOpen(false);
      } else {
        const data = await res.json();
        alert('Gagal: ' + data.error);
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDownload = () => {
    const dataToExport = filteredAccounts.map(acc => ({
      'Username': acc.username,
      'Role': acc.role || 'PENAGIHAN',
      'Kecamatan': acc.nm_kecamatan || '',
      'Kelurahan': acc.nm_kelurahan || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Akun');
    XLSX.writeFile(workbook, 'Laporan_Akun_Penagihan.xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const kecamatans = Array.from(new Set(accounts.filter(a => a.nm_kecamatan).map(a => a.nm_kecamatan as string))).sort();

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = (acc.nm_kelurahan || '').toLowerCase().includes(search.toLowerCase()) || 
                          (acc.nm_kecamatan || '').toLowerCase().includes(search.toLowerCase()) ||
                          acc.username.toLowerCase().includes(search.toLowerCase());
    const matchesKecamatan = filterKecamatan ? acc.nm_kecamatan === filterKecamatan : true;
    return matchesSearch && matchesKecamatan;
  });

  return (
    <div className="space-y-6">
      
      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Reset Password</h3>
            <p className="text-sm text-slate-500 mb-4">Ganti password untuk akun <strong className="text-blue-600">{resetTargetName}</strong></p>
            <input
              type="password"
              placeholder="Password baru (min. 6 karakter)"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              className="mb-4"
            />
            <div className="flex space-x-3">
              <button onClick={() => setResetModalOpen(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition">Batal</button>
              <button onClick={submitResetPassword} disabled={resetLoading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                {resetLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Manajemen Akun</h1>
        <p className="text-sm text-slate-500">Buat akun untuk Penagih atau tambah Admin baru.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Column: Create Account */}
        <div className="w-full xl:w-1/3">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center text-slate-800 font-bold mb-6">
              <Plus size={18} className="text-blue-600 mr-2" />
              Buat Akun Baru
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Misal: Taufik"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Peran (Role)</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition"
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="KOLEKTOR">Kolektor</option>
                  <option value="PENAGIHAN">Penagihan</option>
                  <option value="PENAGIHAN_PERUSAHAAN">Penagihan Perusahaan (>2 Jt)</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {(newRole === 'KOLEKTOR' || newRole === 'PENAGIHAN') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Kecamatan</label>
                    <select
                      value={newKecamatan}
                      onChange={(e) => {
                        setNewKecamatan(e.target.value);
                        setNewKelurahan(''); // reset kelurahan
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition bg-white"
                      required
                    >
                      <option value="" disabled>Pilih Kecamatan</option>
                      {locations.map(loc => (
                        <option key={loc.kecamatan} value={loc.kecamatan}>{loc.kecamatan}</option>
                      ))}
                    </select>
                  </div>
                  {newRole === 'KOLEKTOR' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Kelurahan</label>
                      <select
                        value={newKelurahan}
                        onChange={(e) => setNewKelurahan(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition bg-white"
                        required
                        disabled={!newKecamatan}
                      >
                        <option value="" disabled>Pilih Kelurahan</option>
                        {newKecamatan && locations.find(l => l.kecamatan === newKecamatan)?.kelurahan.map(kel => (
                          <option key={kel} value={kel}>{kel}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition disabled:opacity-50 mt-2"
              >
                {createLoading ? 'Menyimpan...' : 'Simpan Akun'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: User List */}
        <div className="w-full xl:w-2/3">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-full">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-bold text-slate-800">Daftar Pengguna</h2>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <select
                  className="py-1.5 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition"
                  value={filterKecamatan}
                  onChange={(e) => setFilterKecamatan(e.target.value)}
                >
                  <option value="">Semua Kecamatan</option>
                  {kecamatans.map(kec => (
                    <option key={kec} value={kec}>{kec}</option>
                  ))}
                </select>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari..."
                    className="pl-9 py-1.5 text-sm border border-slate-200 rounded-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button onClick={handleDownload} className="flex items-center justify-center py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-medium transition text-sm">
                  <Download size={16} className="mr-2" />
                  Download Excel
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th>USERNAME</th>
                    <th>ROLE</th>
                    <th>WILAYAH</th>
                    <th className="text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((acc) => (
                      <tr key={acc.id}>
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="user-initial-circle flex-shrink-0">
                              {acc.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800">{acc.username}</span>
                          </div>
                        </td>
                        <td>
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold tracking-wider">
                            {acc.role || 'KOLEKTOR'}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                          {acc.nm_kecamatan ? `${acc.nm_kecamatan} - ${acc.nm_kelurahan}` : '-'}
                        </td>
                        <td className="text-right">
                          <button 
                            onClick={() => openResetModal(acc.id, acc.username)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition mr-1"
                            title="Reset Password"
                          >
                            <KeyRound size={16} />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Akun"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-500">
                        Tidak ada akun yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
