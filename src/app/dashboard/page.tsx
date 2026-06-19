'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Trophy, Target, CheckCircle, XCircle } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showKecamatanRank, setShowKecamatanRank] = useState(false);
  const [showKabupatenRank, setShowKabupatenRank] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats/dashboard');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!data || data.error) {
    return <div className="flex items-center justify-center h-64">Gagal memuat data.</div>;
  }

  const { type, summary, stats, ranking } = data;

  const pieData = [
    { name: 'Lunas', value: summary.totalLunas, color: '#10b981' },
    { name: 'Belum Lunas', value: summary.totalBelum, color: '#ef4444' }
  ];

  const barData = stats.map((item: any) => ({
    name: item.name,
    Lunas: item.percentageLunas,
    Belum: 100 - item.percentageLunas
  }));

  const labelLevel1 = ranking.labelLevel1 || 'Kecamatan';
  const labelLevel2 = ranking.labelLevel2 || 'Kabupaten';
  const labelStats = type === 'KOLEKTOR' ? 'Blok' : 'Kelurahan';

  let kabRankSlice: any[] = [];
  if (ranking?.allLevel2 && ranking?.rankLevel2) {
    const currentIdx = ranking.rankLevel2 - 1;
    const startIdx = Math.max(0, currentIdx - 5);
    const endIdx = Math.min(ranking.allLevel2.length, currentIdx + 6);
    kabRankSlice = ranking.allLevel2.slice(startIdx, endIdx).map((r: any, i: number) => ({
      ...r,
      actualRank: startIdx + i + 1
    }));
  }

  let congratsText = '';
  if (type === 'KOLEKTOR') {
    const titleKecamatan = data.userKecamatan 
      ? data.userKecamatan.toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : '';
      
    if (ranking.rankLevel2 <= 3 && ranking.rankLevel1 <= 3) {
      congratsText = `Ranking ${ranking.rankLevel2} se-Kabupaten Purwakarta dan Ranking ${ranking.rankLevel1} se-Kecamatan ${titleKecamatan}`;
    } else if (ranking.rankLevel2 <= 3) {
      congratsText = `Ranking ${ranking.rankLevel2} se-Kabupaten Purwakarta`;
    } else if (ranking.rankLevel1 <= 3) {
      congratsText = `Ranking ${ranking.rankLevel1} se-Kecamatan ${titleKecamatan}`;
    }
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Congrats Banner */}
      {congratsText && (
        <div className="bg-gradient-to-r from-amber-100 to-yellow-200 p-4 md:p-5 rounded-2xl shadow-sm border border-amber-300 flex flex-row items-center space-x-4 md:space-x-5 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white p-3 rounded-full shadow-sm text-3xl shrink-0">
            🏆
          </div>
          <div>
            <h3 className="font-extrabold text-amber-900 text-lg md:text-xl leading-tight mb-1">Selamat & Sukses!</h3>
            <p className="text-amber-800 text-sm md:text-base font-medium leading-snug">
              Luar biasa! Kelurahan Anda berhasil meraih <strong className="font-black bg-white/40 px-1.5 py-0.5 rounded">{congratsText}</strong>. Pertahankan terus prestasi gemilang ini!
            </p>
          </div>
        </div>
      )}

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ranking.rankLevel1 !== null && (
          <div className="flex flex-col gap-2">
            <div 
              className="bg-gradient-rank1 p-6 rounded-2xl shadow-xl flex items-center space-x-4 relative overflow-hidden cursor-pointer hover:opacity-95 transition"
              onClick={() => setShowKecamatanRank(!showKecamatanRank)}
            >
              <div className="absolute -right-4 -top-4 opacity-20">
                <Trophy size={100} />
              </div>
              <div>
                <p className="text-blue-100 text-xs uppercase tracking-wider font-semibold">Ranking {labelLevel1}</p>
                <h2 className="text-4xl font-black text-white mt-1">#{ranking.rankLevel1} <span className="text-sm font-normal text-blue-200">/ {ranking.totalLevel1}</span></h2>
              </div>
            </div>
            
            {showKecamatanRank && ranking.allLevel1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 max-h-60 overflow-y-auto mt-2">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Daftar Ranking Kelurahan</h3>
                <div className="space-y-2">
                  {ranking.allLevel1.map((r: any, idx: number) => (
                    <div key={r.kel} className={`flex justify-between items-center p-2 rounded-lg text-sm ${r.kel === data.userKelurahan ? 'bg-blue-50 border border-blue-100 font-bold text-blue-800' : 'hover:bg-slate-50 text-slate-600'}`}>
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${idx < 3 ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                          {idx + 1}
                        </span>
                        <span>{r.kel}</span>
                      </div>
                      <span>{r.percent.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div 
            className={`bg-gradient-rank2 p-6 rounded-2xl shadow-xl flex items-center space-x-4 relative overflow-hidden cursor-pointer hover:opacity-95 transition ${ranking.rankLevel1 === null ? 'md:col-span-2 h-fit' : 'h-fit'}`}
            onClick={() => setShowKabupatenRank(!showKabupatenRank)}
          >
            <div className="absolute -right-4 -top-4 opacity-20">
              <Trophy size={100} />
            </div>
            <div>
              <p className="text-teal-100 text-xs uppercase tracking-wider font-semibold">Ranking {labelLevel2}</p>
              <h2 className="text-4xl font-black text-white mt-1">#{ranking.rankLevel2} <span className="text-sm font-normal text-teal-200">/ {ranking.totalLevel2}</span></h2>
            </div>
          </div>

          {showKabupatenRank && kabRankSlice.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 max-h-72 overflow-y-auto mt-2">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Daftar Ranking di {labelLevel2}</h3>
              <div className="space-y-2">
                {kabRankSlice.map((r: any) => {
                  const isCurrentUser = type === 'KOLEKTOR' ? r.kel === data.userKelurahan : r.kec === data.userKecamatan;
                  const name = r.kel || r.kec;
                  return (
                    <div key={name} className={`flex justify-between items-center p-2 rounded-lg text-sm ${isCurrentUser ? 'bg-teal-50 border border-teal-100 font-bold text-teal-800' : 'hover:bg-slate-50 text-slate-600'}`}>
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs ${isCurrentUser ? 'bg-teal-600 text-white font-bold shadow' : 'bg-slate-100 text-slate-500 font-semibold'}`}>
                          #{r.actualRank}
                        </span>
                        <span>{name}</span>
                      </div>
                      <span>{r.percent.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="bg-card p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="mb-4 text-slate-800"><Target size={20} className="mr-2 text-blue-600"/> Ringkasan Keseluruhan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 font-semibold mb-1">Total NOP</p>
            <p className="text-2xl font-bold text-slate-800">{summary.total.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 font-semibold mb-1">Pencapaian</p>
            <p className="text-2xl font-bold text-blue-600">{summary.percentage.toFixed(1)}%</p>
          </div>
          <div 
            className={`p-4 bg-emerald-50 rounded-xl border border-emerald-100 ${type === 'KOLEKTOR' ? 'cursor-pointer hover:bg-emerald-100 transition' : ''}`}
            onClick={() => type === 'KOLEKTOR' && router.push('/dashboard/detail-nop?status=LUNAS')}
          >
            <p className="text-xs text-emerald-600 font-semibold flex items-center mb-1"><CheckCircle size={12} className="mr-1"/> Lunas</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.totalLunas.toLocaleString()}</p>
          </div>
          <div 
            className={`p-4 bg-red-50 rounded-xl border border-red-100 ${type === 'KOLEKTOR' ? 'cursor-pointer hover:bg-red-100 transition' : ''}`}
            onClick={() => type === 'KOLEKTOR' && router.push('/dashboard/detail-nop?status=BELUM')}
          >
            <p className="text-xs text-red-600 font-semibold flex items-center mb-1"><XCircle size={12} className="mr-1"/> Belum</p>
            <p className="text-2xl font-bold text-red-600">{summary.totalBelum.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Diagrams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="mb-4 text-center justify-center text-slate-800">Proporsi Pembayaran</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="mb-4 text-center justify-center text-slate-800">Persentase Lunas per {labelStats} (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData.slice(0, 10)} 
                margin={{ top: 20, right: 0, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b' }}
                />
                <Bar dataKey="Lunas" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Belum" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {barData.length > 10 && (
            <p className="text-center text-xs text-slate-500 mt-2">* Menampilkan 10 {labelStats.toLowerCase()} pertama</p>
          )}
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-card p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="mb-4 text-slate-800">Rincian per {labelStats}</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
          {stats.map((b: any) => (
            <div key={b.name} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-700">{type === 'KOLEKTOR' ? `Blok ${b.name}` : b.name}</span>
                <span className="text-sm font-bold text-slate-800">{b.percentageLunas.toFixed(1)}%</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${b.percentageLunas}%` }}></div>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-600">{b.lunas.toLocaleString()} Lunas</span>
                <span className="text-red-500">{b.belumLunas.toLocaleString()} Belum Lunas</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
