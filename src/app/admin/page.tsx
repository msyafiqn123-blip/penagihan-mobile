'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, CheckCircle, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats/admin');
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

    const fetchLastUpdate = async () => {
      try {
        const res = await fetch('/api/stats/last-update');
        if (res.ok) {
          const d = await res.json();
          if (d.lastUpdate) {
            const date = new Date(d.lastUpdate);
            setLastUpdate(date.toLocaleString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }) + ' WIB');
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchStats();
    fetchLastUpdate();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border"></div>
      </div>
    );
  }

  if (!data) return null;

  const { overall, kecamatanStats, kelurahanStats } = data;
  const pieData = [
    { name: 'Lunas', value: overall.totalLunas, color: '#10b981' },
    { name: 'Belum Lunas', value: overall.totalBelum, color: '#ef4444' }
  ];

  const barDataKec = kecamatanStats.map((k: any) => ({
    name: k.name,
    Lunas: Number(k.percentageLunas.toFixed(1)),
    Belum: Number((100 - k.percentageLunas).toFixed(1))
  }));

  const barDataKel = kelurahanStats.slice(0, 15).map((k: any) => ({
    name: `${k.name} (${k.kecamatan})`,
    Lunas: Number(k.percentageLunas.toFixed(1)),
    Belum: Number((100 - k.percentageLunas).toFixed(1))
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ringkasan Kabupaten</h1>
        {lastUpdate && (
          <p className="text-sm text-slate-500 mt-1.5 font-medium flex items-center">
            Data Tagihan terakhir diupdate pada : <span className="font-bold text-slate-700 ml-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{lastUpdate}</span>
          </p>
        )}
        <p className="text-xs text-red-500 mt-1 font-medium">
          *Disclaimer: Apabila terdapat perbedaan data, data yang valid terdapat pada <a href="https://mapagbumi.purwakartakab.go.id/" target="_blank" rel="noreferrer" className="underline hover:text-red-700">https://mapagbumi.purwakartakab.go.id/</a>
        </p>
      </div>

      {/* Overview Stats */}
      <div className="bg-card p-5 rounded-2xl shadow-xl">
        <h3 className="mb-4 text-slate-700"><Target size={20} className="mr-2 text-blue-600"/> Pencapaian Total</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-black-20">
            <p className="text-xs text-slate-500">Total NOP</p>
            <p className="text-2xl font-bold text-slate-800">{overall.totalCount.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-black-20">
            <p className="text-xs text-slate-500">Pencapaian (%)</p>
            <p className="text-2xl font-bold text-blue-600">{(overall.totalCount > 0 ? (overall.totalLunas / overall.totalCount) * 100 : 0).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-emerald-10">
            <p className="text-xs text-emerald-600 flex items-center"><CheckCircle size={12} className="mr-1"/> Lunas</p>
            <p className="text-2xl font-bold text-emerald-600">{overall.totalLunas.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-red-10">
            <p className="text-xs text-red-600 flex items-center"><XCircle size={12} className="mr-1"/> Belum</p>
            <p className="text-2xl font-bold text-red-600">{overall.totalBelum.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-5 rounded-2xl shadow-xl md:col-span-1">
          <h3 className="mb-4 text-center justify-center text-slate-700">Proporsi Keseluruhan</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl shadow-xl md:col-span-2">
          <h3 className="mb-4 text-center justify-center text-slate-700">Perbandingan per Kecamatan (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barDataKec} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} formatter={(value: any) => `${value}%`} />
                <Bar dataKey="Lunas" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Belum" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kelurahan comparison */}
      <div className="bg-card p-5 rounded-2xl shadow-xl">
        <h3 className="mb-4 text-center justify-center text-slate-700">Top 15 Kelurahan (Berdasarkan % Lunas)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barDataKel} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={100} />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} formatter={(value: any) => `${value}%`} />
              <Bar dataKey="Lunas" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
