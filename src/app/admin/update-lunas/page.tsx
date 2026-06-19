'use client';

import { useState } from 'react';
import { UploadCloud, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function UpdateLunasPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewResult(null);
      setUploadResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setPreviewResult(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/preview-lunas', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      setPreviewResult(result);
    } catch (e) {
      console.error('Preview failed', e);
      setPreviewResult({ error: 'Terjadi kesalahan saat memuat preview' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      setUploadResult(result);
      if (res.ok) {
        setFile(null);
        setPreviewResult(null);
        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) input.value = '';
      }
    } catch (e) {
      console.error('Upload failed', e);
      setUploadResult({ error: 'Terjadi kesalahan saat mengunggah' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async () => {
    if (!file) return;
    if (!confirm('Apakah Anda yakin ingin MEMBATALKAN LUNAS untuk semua NOP dalam file ini? Status NOP akan dikembalikan menjadi BELUM LUNAS.')) return;
    
    setLoading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/revert-lunas', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      setUploadResult(result);
      if (res.ok) {
        setFile(null);
        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) input.value = '';
      }
    } catch (e) {
      console.error('Revert failed', e);
      setUploadResult({ error: 'Terjadi kesalahan saat mengembalikan status' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFormat = () => {
    const ws = XLSX.utils.json_to_sheet([
      { nop: '321411122233344455', status: 'LUNAS' },
      { nop: '321411122233344456', status: 'BELUM LUNAS' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Update_Lunas.xlsx');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Update Pembayaran Lunas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-card p-5 rounded-2xl shadow-xl w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <p className="text-sm text-slate-500 max-w-lg">
              Unggah file Excel (.xlsx) atau CSV yang berisi daftar NOP yang telah lunas. 
              Sistem akan memindai kolom bernama <strong>nop</strong> dan mengubah statusnya menjadi LUNAS di dalam database.
            </p>
            <button
              onClick={handleDownloadFormat}
              className="flex items-center justify-center py-2 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg font-bold transition text-sm flex-shrink-0"
            >
              <Download size={16} className="mr-2" />
              Download Format Excel
            </button>
          </div>

          <div className="bg-black-20 border p-8 border-dashed rounded-xl flex flex-col items-center justify-center space-y-4">
            <UploadCloud size={48} className="text-blue-500 mb-2" />
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white transition px-6 py-3 rounded-lg font-semibold flex items-center shadow-lg">
              <FileText size={18} className="mr-2" />
              Pilih File Data
              <input 
                id="file-upload"
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange}
              />
            </label>
            {file && <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mt-2">File terpilih: {file.name}</p>}
            
            <div className="flex flex-col gap-3 w-full mt-4">
              <button 
                onClick={handlePreview} 
                disabled={!file || loading}
                className={`w-full px-6 py-3 rounded-lg font-bold transition shadow-lg ${!file || loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {loading && !previewResult && !uploadResult ? 'Memproses...' : 'Preview Data Lunas'}
              </button>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button 
                  onClick={handleUpload} 
                  disabled={!previewResult || previewResult.error || loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold transition shadow-lg ${!previewResult || previewResult.error || loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                >
                  Konfirmasi Update
                </button>
                
                <button 
                  onClick={handleRevert} 
                  disabled={!file || loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold transition shadow-lg ${!file || loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                >
                  Batalkan Update
                </button>
              </div>
            </div>
          </div>

          {previewResult && !uploadResult && (
            <div className={`mt-6 p-5 rounded-xl border ${previewResult.success ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              {previewResult.error ? (
                <p className="text-red-600 text-sm font-semibold">{previewResult.error}</p>
              ) : (
                <>
                  <p className="text-blue-700 font-bold mb-2 flex items-center"><FileText size={18} className="mr-2"/> Siap Diupdate</p>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-700">Total baris diproses: <strong>{previewResult.processed} NOP</strong></p>
                    <p className="text-sm text-slate-700">NOP yang akan diubah ke LUNAS: <strong className="text-blue-600">{previewResult.willUpdate} NOP</strong></p>
                    {previewResult.notFound > 0 && <p className="text-sm text-amber-600">NOP tidak ditemukan di database: <strong>{previewResult.notFound}</strong></p>}
                  </div>
                </>
              )}
            </div>
          )}

          {uploadResult && (
            <div className={`mt-6 p-5 rounded-xl border ${uploadResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {uploadResult.error ? (
                <p className="text-red-600 text-sm font-semibold">{uploadResult.error}</p>
              ) : (
                <>
                  <p className="text-emerald-700 font-bold mb-2 flex items-center"><CheckCircle size={18} className="mr-2"/> Update Berhasil!</p>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-700">Total baris diproses: <strong>{uploadResult.processed} NOP</strong></p>
                    <p className="text-sm text-slate-700">Berhasil diubah ke LUNAS: <strong className="text-emerald-600">{uploadResult.updated} NOP</strong></p>
                    {uploadResult.notFound > 0 && <p className="text-sm text-amber-600">NOP tidak ditemukan di database: <strong>{uploadResult.notFound}</strong></p>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {(previewResult?.preview || uploadResult?.preview) && (
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-100 w-full h-full max-h-[600px] overflow-hidden flex flex-col">
            <div className="mb-4">
              <h2 className="font-bold text-lg text-slate-800">
                {uploadResult ? 'Preview NOP Diupdate' : 'Preview NOP Akan Diupdate'}
              </h2>
              <p className="text-xs text-slate-500">
                Menampilkan {(previewResult?.preview || uploadResult?.preview).length} data 
                {uploadResult ? ' terbaru' : ' teratas dari file'}
              </p>
            </div>
            
            <div className="overflow-y-auto flex-1 rounded-lg border border-slate-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="px-4 py-3">NOP</th>
                    <th className="px-4 py-3">Nama WP</th>
                    <th className="px-4 py-3 text-center">Status Lunas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(previewResult?.preview || uploadResult?.preview).map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{r.nop}</td>
                      <td className="px-4 py-3 text-slate-600">{r.nm_wp}</td>
                      <td className="px-4 py-3 text-center">
                        {uploadResult ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-700 whitespace-nowrap">
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-700 whitespace-nowrap">
                            Akan Lunas
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal dummy for CheckCircle since it's not imported at top
function CheckCircle({ size, className }: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
}
