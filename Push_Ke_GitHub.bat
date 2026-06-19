@echo off
echo =======================================================
echo     AUTO-PUSH APLIKASI PENAGIHAN PBB KE GITHUB
echo =======================================================
echo.
echo Pastikan Anda sudah menginstal Git. Jika belum, download di:
echo https://git-scm.com/downloads
echo.
set /p url="Silakan masukkan URL / Link Repository GitHub kosong Anda (klik kanan untuk paste): "

echo.
echo Memulai proses sinkronisasi ke GitHub...
git init
git add .
git commit -m "Initial commit - Aplikasi Penagihan PBB 2026"
git branch -M main
git remote add origin %url%
git push -u origin main

echo.
echo =======================================================
echo PROSES SELESAI!
echo Jika tidak ada tulisan error berwarna merah di atas,
echo maka kode Anda sudah berhasil masuk ke GitHub.
echo =======================================================
pause
