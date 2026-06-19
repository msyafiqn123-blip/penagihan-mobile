'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const maskName = (name: string) => {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.substring(0, 2)}***${trimmed.substring(trimmed.length - 2)}`;
};

export default function DetailNOP() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div></div>}>
      <DetailNOPContent />
    </Suspense>
  );
}

function DetailNOPContent() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [blokFilter, setBlokFilter] = useState('ALL');
  const [kecamatanFilter, setKecamatanFilter] = useState('ALL');
  const [kelurahanFilter, setKelurahanFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterInitialized, setIsFilterInitialized] = useState(false);
  const itemsPerPage = 50;
  const router = useRouter();

  useEffect(() => {
    const fetchNop = async () => {
      try {
        const res = await fetch('/api/nop/records');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        const recs = Array.isArray(data) ? data : [];
        setRecords(recs);

        // Auto-select JATILUHUR and JATIMEKAR if present
        const hasJatiluhur = recs.some(r => r.nm_kecamatan === 'JATILUHUR');
        if (hasJatiluhur) {
          setKecamatanFilter('JATILUHUR');
          const hasJatimekar = recs.some(r => r.nm_kecamatan === 'JATILUHUR' && r.nm_kelurahan === 'JATIMEKAR');
          if (hasJatimekar) {
            setKelurahanFilter('JATIMEKAR');
          }
        }
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
          const data = await res.json();
          if (data.lastUpdate) {
            const date = new Date(data.lastUpdate);
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
    fetchNop();
    fetchLastUpdate();
  }, [router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, blokFilter, kecamatanFilter, kelurahanFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Get unique filters
  const uniqueBloks = Array.from(new Set(records.map(r => r.blok).filter(Boolean))).sort();
  const uniqueKecamatans = Array.from(new Set(records.map(r => r.nm_kecamatan).filter(Boolean))).sort();
  
  // Filter kelurahan based on selected kecamatan
  const availableKelurahans = records
    .filter(r => kecamatanFilter === 'ALL' || r.nm_kecamatan === kecamatanFilter)
    .map(r => r.nm_kelurahan)
    .filter(Boolean);
  const uniqueKelurahans = Array.from(new Set(availableKelurahans)).sort();

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchSearch = record.nop.toLowerCase().includes(search.toLowerCase()) || 
                        record.nm_wp.toLowerCase().includes(search.toLowerCase());
    
    let matchStatus = true;
    if (statusFilter === 'LUNAS') matchStatus = record.status_pembayaran_sppt === 'LUNAS';
    if (statusFilter === 'BELUM') matchStatus = record.status_pembayaran_sppt !== 'LUNAS';

    let matchBlok = true;
    if (blokFilter !== 'ALL') matchBlok = record.blok === blokFilter;

    let matchKecamatan = true;
    if (kecamatanFilter !== 'ALL') matchKecamatan = record.nm_kecamatan === kecamatanFilter;

    let matchKelurahan = true;
    if (kelurahanFilter !== 'ALL') matchKelurahan = record.nm_kelurahan === kelurahanFilter;

    return matchSearch && matchStatus && matchBlok && matchKecamatan && matchKelurahan;
  });


  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Data Piutang 2026</h1>
        {lastUpdate && (
          <p className="text-sm text-slate-500 mt-1.5 font-medium flex items-center">
            Data Tagihan terakhir diupdate pada : <span className="font-bold text-slate-700 ml-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{lastUpdate}</span>
          </p>
        )}
        <p className="text-xs text-red-500 mt-1 font-medium">
          *Disclaimer: Apabila terdapat perbedaan data, data yang valid terdapat pada <a href="https://mapagbumi.purwakartakab.go.id/" target="_blank" rel="noreferrer" className="underline hover:text-red-700">https://mapagbumi.purwakartakab.go.id/</a>
        </p>
      </div>

      <div className="bg-card p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-wrap gap-4">
          
          {/* Search */}
          <div className="relative flex-grow md:flex-grow-0 md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari NOP atau Nama WP..."
              className="pl-10 w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {uniqueKecamatans.length > 1 && (
            <div className="flex-grow md:flex-grow-0 md:w-48">
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition bg-white text-sm" 
                value={kecamatanFilter} 
                onChange={(e) => {
                  setKecamatanFilter(e.target.value);
                  setKelurahanFilter('ALL'); // reset kelurahan
                }}
              >
                <option value="ALL">Semua Kecamatan</option>
                {uniqueKecamatans.map(k => (
                  <option key={k as string} value={k as string}>{k as string}</option>
                ))}
              </select>
            </div>
          )}

          {uniqueKelurahans.length > 1 && (
            <div className="flex-grow md:flex-grow-0 md:w-48">
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition bg-white text-sm" value={kelurahanFilter} onChange={(e) => setKelurahanFilter(e.target.value)}>
                <option value="ALL">Semua Kelurahan</option>
                {uniqueKelurahans.map(k => (
                  <option key={k as string} value={k as string}>{k as string}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex-grow md:flex-grow-0 md:w-40">
            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition bg-white text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Semua Status</option>
              <option value="LUNAS">Lunas</option>
              <option value="BELUM">Belum Lunas</option>
            </select>
          </div>

          {/* Blok Filter */}
          <div className="flex-grow md:flex-grow-0 md:w-40">
            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition bg-white text-sm" value={blokFilter} onChange={(e) => setBlokFilter(e.target.value)}>
              <option value="ALL">Semua Blok</option>
              {uniqueBloks.map(b => (
                <option key={b as string} value={b as string}>{b as string}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 text-center w-16">Blok</th>
                <th className="px-4 py-3">NOP</th>
                <th className="px-4 py-3">Nama WP / Alamat OP</th>
                <th className="px-4 py-3 text-right">Tagihan 2026</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada NOP yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, i) => (
                  <tr key={r.id || i} className={`border-b transition hover:bg-opacity-80 ${
                    r.status_pembayaran_sppt === 'LUNAS' 
                      ? 'bg-emerald-50/40 border-emerald-50 hover:bg-emerald-50/70' 
                      : 'bg-red-50/40 border-red-50 hover:bg-red-50/70'
                  }`}>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                        {r.blok || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.nop}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700">{maskName(r.nm_wp)}</div>
                      <div className="text-xs text-slate-500 flex items-center mt-1">
                        <MapPin size={12} className="mr-1" /> {r.alamat_op}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      Rp {r.pbb_yg_harus_dibayar_sppt?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.status_pembayaran_sppt === 'LUNAS' ? (
                        <div className="inline-flex flex-row items-center justify-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap w-fit mx-auto">
                          <CheckCircle size={14} strokeWidth={2.5} className="shrink-0" />
                          <span>Lunas</span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-row items-center justify-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap w-fit mx-auto">
                          <XCircle size={14} strokeWidth={2.5} className="shrink-0" />
                          <span>Belum</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a 
                        href={`https://mapagbumi.purwakartakab.go.id/nop?nop=${r.nop.replace(/\./g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap ${
                          r.status_pembayaran_sppt === 'LUNAS'
                            ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {r.status_pembayaran_sppt === 'LUNAS' ? 'Cek Tunggakan' : 'Bayar'}
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {paginatedRecords.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm border border-slate-100 rounded-xl bg-slate-50">
              Tidak ada NOP yang ditemukan.
            </div>
          ) : (
            paginatedRecords.map((r, i) => (
              <div key={r.id || i} className={`p-4 rounded-xl border shadow-sm space-y-3 ${
                r.status_pembayaran_sppt === 'LUNAS'
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-red-50 border-red-100'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <span className="px-2 py-1 bg-white/60 text-slate-700 rounded text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                      {r.blok || '-'}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 mb-1">{r.nop}</div>
                      <div className="font-bold text-slate-800 leading-tight">{maskName(r.nm_wp)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start text-xs text-slate-600">
                  <MapPin size={14} className="mr-1 mt-0.5 shrink-0 opacity-70" /> 
                  <span className="line-clamp-2">{r.alamat_op}</span>
                </div>

                <div className={`pt-3 border-t space-y-3 ${
                  r.status_pembayaran_sppt === 'LUNAS' ? 'border-emerald-200/60' : 'border-red-200/60'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold opacity-60 mb-0.5">Tagihan 2026</div>
                      <div className="font-bold text-slate-800 text-base leading-none">Rp {r.pbb_yg_harus_dibayar_sppt?.toLocaleString('id-ID')}</div>
                    </div>
                    <div>
                      {r.status_pembayaran_sppt === 'LUNAS' ? (
                        <div className="inline-flex flex-row items-center justify-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                          <CheckCircle size={12} strokeWidth={2.5} className="shrink-0" />
                          <span>Lunas</span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-row items-center justify-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                          <XCircle size={12} strokeWidth={2.5} className="shrink-0" />
                          <span>Belum</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <a 
                    href={`https://mapagbumi.purwakartakab.go.id/nop?nop=${r.nop.replace(/\./g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`block w-full text-center px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap ${
                      r.status_pembayaran_sppt === 'LUNAS'
                        ? 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {r.status_pembayaran_sppt === 'LUNAS' ? 'Cek Tunggakan' : 'Bayar'}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-slate-100 gap-4">
            <div className="text-xs text-slate-500">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredRecords.length)} dari {filteredRecords.length} data NOP
            </div>
            <div className="flex items-center space-x-1 mt-2 sm:mt-0 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="px-1">
                <select 
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-200 px-2 py-1 rounded-md appearance-none text-center"
                  style={{ textAlignLast: 'center' }}
                >
                  {Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => (
                    <option key={pageNum} value={pageNum}>{pageNum} / {totalPages}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
        
        {totalPages <= 1 && (
          <div className="text-xs text-slate-500 text-right mt-2">
            Menampilkan {filteredRecords.length} data NOP
          </div>
        )}

      </div>
    </div>
  );
}
