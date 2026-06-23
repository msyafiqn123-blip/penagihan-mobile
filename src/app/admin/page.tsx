'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, CheckCircle, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { DollarSign, Percent, TrendingUp } from 'lucide-react';

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

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

  const { overall, kecamatanStats, kelurahanStats, topUnpaid, bukuStats } = data;
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
        <h3 className="mb-4 text-slate-700"><Target size={20} className="mr-2 text-blue-600 inline"/> Pencapaian Berdasarkan SPPT</h3>
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

      <div className="bg-card p-5 rounded-2xl shadow-xl mt-6">
        <h3 className="mb-4 text-slate-700"><DollarSign size={20} className="mr-2 text-indigo-600 inline"/> Pencapaian Berdasarkan Ketetapan PBB</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-xs text-slate-500">Total Nominal Ketetapan PBB</p>
            <p className="text-lg md:text-xl font-bold text-slate-800 break-words">{formatRupiah(overall.totalNominal)}</p>
          </div>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-xs text-indigo-600 flex items-center"><TrendingUp size={12} className="mr-1"/> Pencapaian (%)</p>
            <p className="text-lg md:text-xl font-bold text-indigo-700 break-words">{(overall.totalNominal > 0 ? (overall.totalNominalLunas / overall.totalNominal) * 100 : 0).toFixed(2)}%</p>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-xs text-emerald-600 flex items-center"><CheckCircle size={12} className="mr-1"/> Nominal Lunas</p>
            <p className="text-lg md:text-xl font-bold text-emerald-700 break-words">{formatRupiah(overall.totalNominalLunas)}</p>
          </div>
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
            <p className="text-xs text-rose-600 flex items-center"><XCircle size={12} className="mr-1"/> Nominal Belum</p>
            <p className="text-lg md:text-xl font-bold text-rose-700 break-words">{formatRupiah(overall.totalNominalBelum)}</p>
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

      {/* Rincian Nominal per Kecamatan Table */}
      <div className="bg-card p-5 rounded-2xl shadow-xl overflow-hidden mt-6">
        <h3 className="mb-4 text-slate-700 font-bold">Rincian Nominal per Kecamatan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold w-12 text-center">No</th>
                <th className="px-4 py-3 font-semibold">Kecamatan</th>
                <th className="px-4 py-3 font-semibold text-right">Ketetapan (Total PBB)</th>
                <th className="px-4 py-3 font-semibold text-right">Sudah Lunas</th>
                <th className="px-4 py-3 font-semibold text-right">Belum Lunas</th>
                <th className="px-4 py-3 font-semibold text-center">Pencapaian (%)</th>
              </tr>
            </thead>
            <tbody>
              {[...kecamatanStats].sort((a: any, b: any) => {
                const percentA = a.nominalTotal > 0 ? (a.nominalLunas / a.nominalTotal) * 100 : 0;
                const percentB = b.nominalTotal > 0 ? (b.nominalLunas / b.nominalTotal) * 100 : 0;
                return percentB - percentA;
              }).map((k: any, idx: number) => {
                const percent = k.nominalTotal > 0 ? (k.nominalLunas / k.nominalTotal) * 100 : 0;
                return (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{k.name}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(k.nominalTotal)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatRupiah(k.nominalLunas)}</td>
                    <td className="px-4 py-3 text-right text-rose-600 font-medium">{formatRupiah(k.nominalBelum)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${percent >= 70 ? 'bg-emerald-100 text-emerald-700' : percent >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {percent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ulasan Lunas per Buku */}
      <div className="bg-card p-5 rounded-2xl shadow-xl overflow-hidden mt-6">
        <h3 className="mb-4 text-slate-700 font-bold">Ulasan Lunas per Buku</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Buku (Range Nominal)</th>
                <th className="px-4 py-3 font-semibold text-right">SPPT Lunas</th>
                <th className="px-4 py-3 font-semibold text-right">SPPT Belum Lunas</th>
                <th className="px-4 py-3 font-semibold text-right">Nominal Lunas</th>
                <th className="px-4 py-3 font-semibold text-right">Nominal Belum Lunas</th>
                <th className="px-4 py-3 font-semibold text-center">Pencapaian (%)</th>
              </tr>
            </thead>
            <tbody>
              {bukuStats && bukuStats.map((buku: any, idx: number) => {
                const percent = buku.nominalTotal > 0 ? (buku.nominalLunas / buku.nominalTotal) * 100 : 0;
                return (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{buku.name}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{buku.spptLunas.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-rose-600 font-medium">{buku.spptBelum.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatRupiah(buku.nominalLunas)}</td>
                    <td className="px-4 py-3 text-right text-rose-600 font-medium">{formatRupiah(buku.nominalBelum)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${percent >= 70 ? 'bg-emerald-100 text-emerald-700' : percent >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {percent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 10 Belum Lunas Tertinggi */}
      <div className="bg-card p-5 rounded-2xl shadow-xl overflow-hidden mt-6">
        <h3 className="mb-4 text-slate-700 font-bold">10 NOP dengan Tagihan Belum Lunas Tertinggi</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold w-12 text-center">No</th>
                <th className="px-4 py-3 font-semibold">NOP</th>
                <th className="px-4 py-3 font-semibold">Nama WP</th>
                <th className="px-4 py-3 font-semibold">Kecamatan</th>
                <th className="px-4 py-3 font-semibold">Kelurahan</th>
                <th className="px-4 py-3 font-semibold text-right">Tagihan</th>
              </tr>
            </thead>
            <tbody>
              {topUnpaid && topUnpaid.map((nopItem: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{nopItem.nop}</td>
                  <td className="px-4 py-3 text-slate-600">{nopItem.nm_wp}</td>
                  <td className="px-4 py-3 text-slate-600">{nopItem.nm_kecamatan}</td>
                  <td className="px-4 py-3 text-slate-600">{nopItem.nm_kelurahan}</td>
                  <td className="px-4 py-3 text-right text-rose-600 font-bold">{formatRupiah(nopItem.pbb_yg_harus_dibayar_sppt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
