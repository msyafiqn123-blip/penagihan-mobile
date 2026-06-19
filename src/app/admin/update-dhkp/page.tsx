'use client';

import { useState } from 'react';
import { UploadCloud, FileText, Download, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function UpdateDHKPPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload-dhkp', {
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
      console.error('Upload failed', e);
      setUploadResult({ error: 'Terjadi kesalahan saat mengunggah' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFormat = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 
        nm_kecamatan: 'PURWAKARTA', 
        nm_kelurahan: 'NAGRIKIDUL', 
        nop: '32.16.010.001.0001.0', 
        nm_wp: 'BAPAK DUMMY', 
        alamat_op: 'JL. DUMMY NO 1', 
        pbb_yg_harus_dibayar_sppt: 150000, 
        status_pembayaran_sppt: 'BELUM LUNAS' 
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template DHKP');
    XLSX.writeFile(wb, 'Template_Update_DHKP.xlsx');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Update DHKP</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-card p-5 rounded-2xl shadow-xl w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <p className="text-sm text-slate-500 max-w-lg">
              Unggah file Excel atau CSV yang berisi data DHKP terbaru. Sistem akan mencocokkan NOP untuk menambah data baru atau memperbarui data yang sudah ada.
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
                onClick={handleUpload} 
                disabled={!file || loading}
                className={`w-full px-6 py-3 rounded-lg font-bold transition shadow-lg ${!file || loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {loading ? 'Memproses Data...' : 'Mulai Update DHKP'}
              </button>
            </div>
          </div>

          {uploadResult && (
            <div className={`mt-6 p-5 rounded-xl border ${uploadResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {uploadResult.error ? (
                <p className="text-red-600 text-sm font-semibold">{uploadResult.error}</p>
              ) : (
                <>
                  <p className="text-emerald-700 font-bold mb-2 flex items-center"><CheckCircle size={18} className="mr-2"/> Update DHKP Berhasil!</p>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-700">Total baris diproses: <strong>{uploadResult.processed} baris</strong></p>
                    <p className="text-sm text-slate-700">NOP Baru Ditambahkan: <strong className="text-blue-600">{uploadResult.created} NOP</strong></p>
                    <p className="text-sm text-slate-700">NOP Lama Diperbarui: <strong className="text-emerald-600">{uploadResult.updated} NOP</strong></p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {uploadResult?.preview && uploadResult.preview.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-100 w-full h-full max-h-[600px] overflow-hidden flex flex-col">
            <div className="mb-4">
              <h2 className="font-bold text-lg text-slate-800">Preview Data DHKP Terbaru</h2>
              <p className="text-xs text-slate-500">Menampilkan {(uploadResult?.preview).length} data teratas dari hasil pemrosesan</p>
            </div>
            
            <div className="overflow-y-auto flex-1 rounded-lg border border-slate-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="px-4 py-3">NOP</th>
                    <th className="px-4 py-3">Nama WP</th>
                    <th className="px-4 py-3">Kelurahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uploadResult.preview.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{r.nop}</td>
                      <td className="px-4 py-3 text-slate-600">{r.nm_wp}</td>
                      <td className="px-4 py-3 text-slate-600">{r.nm_kelurahan}</td>
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
