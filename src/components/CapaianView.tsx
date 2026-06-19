'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MapPin, Target, CheckCircle, AlertCircle, Building2, Trophy } from 'lucide-react';

export default function CapaianView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKecamatan, setExpandedKecamatan] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapaian = async () => {
      try {
        const res = await fetch('/api/stats/capaian');
        if (res.ok) {
          const json = await res.json();
          setData(json.kecamatans || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCapaian();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const toggleKecamatan = (name: string) => {
    setExpandedKecamatan(expandedKecamatan === name ? null : name);
  };

  const top20Kelurahans = data
    .flatMap(kec => kec.kelurahans.map((kel: any) => ({ ...kel, kecamatanName: kec.name })))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 20);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Capaian Komprehensif</h1>
        <p className="text-sm text-slate-500 mt-1">Ranking pelunasan PBB per Kecamatan dan Top 20 Kelurahan.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Kecamatan List */}
        <div className="w-full lg:w-3/5 space-y-4">
          <h2 className="font-bold text-slate-700 flex items-center mb-2">
            <MapPin size={18} className="mr-2 text-blue-600" /> 
            Daftar Kecamatan
          </h2>
          {data.map((kec, index) => (
          <div key={kec.name} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Header Kecamatan */}
            <div 
              className={`p-5 cursor-pointer hover:bg-slate-50 transition ${expandedKecamatan === kec.name ? 'bg-slate-50 border-b border-slate-100' : ''}`}
              onClick={() => toggleKecamatan(kec.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border ${
                    index === 0 ? 'bg-amber-100 text-amber-600 border-amber-200' : 
                    index === 1 ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                    index === 2 ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                      <MapPin size={18} className="text-slate-400 mr-1.5" />
                      KECAMATAN {kec.name}
                    </h2>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1 font-medium">
                      <span className="flex items-center"><Target size={12} className="mr-1" /> {kec.totalNop.toLocaleString()} NOP</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-2xl font-black text-emerald-600">
                      {kec.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lunas</div>
                  </div>
                  <div className="text-slate-400">
                    {expandedKecamatan === kec.name ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>
              <div className="mt-4 hidden sm:block">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-500">Progress Pencapaian</span>
                  <span className="text-xs font-bold text-slate-700">{kec.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${kec.percentage >= 80 ? 'bg-emerald-500' : kec.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                    style={{ width: `${kec.percentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Mobile Percentage */}
              <div className="mt-3 sm:hidden bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">Pencapaian Lunas</span>
                  <span className={`text-lg font-black ${kec.percentage >= 80 ? 'text-emerald-600' : kec.percentage >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {kec.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${kec.percentage >= 80 ? 'bg-emerald-500' : kec.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                    style={{ width: `${kec.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Konten Kelurahan */}
            {expandedKecamatan === kec.name && (
              <div className="p-0 bg-slate-50/50">
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-y border-slate-200">
                        <tr>
                          <th className="px-6 py-3 w-16 text-center">Rank</th>
                          <th className="px-6 py-3">Kelurahan</th>
                          <th className="px-6 py-3 text-center">Persentase</th>
                          <th className="px-6 py-3 text-center">Lunas / Total NOP</th>
                          <th className="px-6 py-3 text-right">Nominal Belum Lunas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {kec.kelurahans.map((kel: any, kIdx: number) => (
                          <tr key={kel.name} className="hover:bg-white transition">
                            <td className="px-6 py-3.5 text-center font-bold text-slate-400">{kIdx + 1}</td>
                            <td className="px-6 py-3.5 font-bold text-slate-800">{kel.name}</td>
                            <td className="px-6 py-3.5 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <span className={`font-black w-12 text-right ${kel.percentage >= 80 ? 'text-emerald-600' : kel.percentage >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                  {kel.percentage.toFixed(1)}%
                                </span>
                                <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden ml-2">
                                  <div 
                                    className={`h-1.5 rounded-full ${kel.percentage >= 80 ? 'bg-emerald-500' : kel.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                    style={{ width: `${kel.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-center text-slate-600 font-medium">
                              <span className="text-emerald-600 font-bold">{kel.lunasNop.toLocaleString()}</span> 
                              <span className="mx-1 text-slate-300">/</span> 
                              {kel.totalNop.toLocaleString()}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                Rp {kel.totalBelumLunas.toLocaleString('id-ID')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stack View */}
                  <div className="sm:hidden flex flex-col divide-y divide-slate-100">
                    {kec.kelurahans.map((kel: any, kIdx: number) => (
                      <div key={kel.name} className="p-4 hover:bg-white transition flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                              {kIdx + 1}
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{kel.name}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-black ${kel.percentage >= 80 ? 'text-emerald-600' : kel.percentage >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                              {kel.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${kel.percentage >= 80 ? 'bg-emerald-500' : kel.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                            style={{ width: `${kel.percentage}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1">
                          <div className="text-slate-500">
                            Lunas: <span className="font-bold text-emerald-600">{kel.lunasNop.toLocaleString()}</span> / {kel.totalNop.toLocaleString()}
                          </div>
                          <div className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            Rp {kel.totalBelumLunas.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        </div>

        {/* Right Column - Top 20 Kelurahan */}
        <div className="w-full lg:w-2/5">
          <h2 className="font-bold text-slate-700 flex items-center mb-4">
            <Trophy size={18} className="mr-2 text-amber-500" /> 
            Top 20 Kelurahan (Realisasi)
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex flex-col divide-y divide-slate-100">
              {top20Kelurahans.map((kel, idx) => (
                <div key={kel.name + kel.kecamatanName} className="p-4 hover:bg-slate-50 transition flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${
                        idx === 0 ? 'bg-amber-100 text-amber-600 border-amber-200' : 
                        idx === 1 ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                        idx === 2 ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-sm block leading-tight">{kel.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{kel.kecamatanName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${kel.percentage >= 80 ? 'text-emerald-600' : kel.percentage >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {kel.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${kel.percentage >= 80 ? 'bg-emerald-500' : kel.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      style={{ width: `${kel.percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div className="text-slate-500">
                      Lunas: <span className="font-bold text-emerald-600">{kel.lunasNop.toLocaleString()}</span> / {kel.totalNop.toLocaleString()}
                    </div>
                    <div className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      Rp {kel.totalBelumLunas.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
              
              {top20Kelurahans.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm font-medium">
                  Belum ada data capaian Kelurahan.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
