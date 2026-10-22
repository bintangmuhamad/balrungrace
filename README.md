# 🏁 Sack Race Spinner - Balapan Lompat Karung Penentu Pemenang Online

**Sack Race Spinner** adalah aplikasi web interaktif penentu pemenang undian (giveaway / doorprize / raffle) berbasis animasi balapan lompat karung 2D real-time. Aplikasi ini berfungsi sebagai alternatif yang lebih seru, menegangkan, dan menghibur dibanding *spin wheel* atau *duck race stopwatch*.

Dirancang khusus dengan estetika khas pesta lomba rakyat yang ceria, modern, dan performa tinggi (~60 FPS) bahkan hingga 100 peserta dalam satu layar.

---

## ✨ Fitur Utama

1. **Input Peserta Fleksibel (Hingga 100 Peserta)**
   - Masukkan daftar nama di textarea (1 nama per baris).
   - Indikator kuota real-time (`X / 100`) dengan pemotongan otomatis jika melebihi batas.
   - Tombol **Acak Urutan** (Fisher-Yates shuffle kriptografis).
   - Tombol **Hapus Duplikat** & **Hapus Semua**.
   - Pilihan template cepat (10 Peserta Lomba 17-an, 25 Doorprize Kantor, 50 Peserta Komunitas).
   - Tersimpan otomatis di `localStorage` peramban.

2. **Pengaturan Durasi Presisi (Stopwatch)**
   - Atur durasi balapan dari 3 hingga 120 detik via slider atau input angka presisi.
   - Pemenang dijamin melewati garis finish tepat pada detik yang diatur (±0.05 detik).
   - Tombol shortcut durasi: `3s (Kilat)`, `10s (Standar)`, `30s (Tegang)`, `120s (Epik)`.

3. **Animasi Balapan Lompat Karung 2D (HTML5 Canvas)**
   - Karakter kartun lucu berada di dalam karung goni (*burlap sack*) dengan tekstur jahitan dan tambalan warna-warni.
   - Animasi fisika lompatan realistis (busur parabolik naik-turun, efek *squash & stretch* saat mendarat dan melayang).
   - Efek partikel debu saat mendarat di atas rumput.
   - Latar belakang dinamis: langit gradien, awan bergerak pelan (parallax), bendera karnaval segitiga, dan garis finish checkered.
   - Skala otomatis (*auto-scale*) lane dan karakter sesuai jumlah peserta (tetap rapi untuk 2 hingga 100 peserta).
   - Mode kamera pintar: **Fokus Pemimpin** (otomatis mengikuti peserta terdepan) atau **Lihat Semua**.
   - Navigasi scroll mouse wheel langsung di atas canvas.

4. **100% Adil & Acak (Web Crypto API)**
   - Pemenang dipilih secara acak murni menggunakan `crypto.getRandomValues` sebelum balapan dimulai.
   - Lintasan animasi dihitung menggunakan kurva *Catmull-Rom spline* dengan variasi kecepatan, fluktuasi, dan aksi saling menyalip yang menegangkan hingga detik-detik terakhir.

5. **Efek Suara Sintetis (Web Audio API)**
   - Suara hitung mundur 3-2-1 dan peluit start *GO!*.
   - Efek suara *boing/spring* lompatan dan hentakan pendaratan debu.
   - Fanfare kemenangan saat pemenang melintasi garis finish.
   - Tidak memerlukan file audio eksternal dan dilengkapi tombol bisukan (*mute/unmute*).

6. **Kontrol Balapan & Presentasi Proyektor**
   - Hitung mundur 3-2-1-GO visual dramatis.
   - Stopwatch real-time running counter.
   - Mode **Layar Penuh (Fullscreen)** khusus untuk ditayangkan pada proyektor seminar, gathering kantor, atau live streaming.
   - Opsi **Eliminasi Pemenang**: otomatis mengeluarkan pemenang dari daftar untuk ronde undian berikutnya.

7. **Modal Pemenang & Riwayat Ronde**
   - Pop-up pemenang dengan nama besar, trofi emas, dan pesta kembang api confetti (*canvas-confetti*).
   - Panel riwayat pemenang ronde-ke-ronde dengan fitur **Salin Riwayat** ke clipboard dalam satu klik.

---

## 🛠️ Tech Stack

- **Framework**: [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Confetti**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Audio Engine**: Web Audio API (100% kode synthesizer, tanpa file mp3/wav eksternal)
- **Graphics**: HTML5 Canvas 2D + `requestAnimationFrame`
- **Backend / Database**: **Tidak ada** (100% client-side, zero backend, zero external API)

---

## 🚀 Cara Menjalankan Secara Lokal

Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (versi 18 atau lebih baru).

1. **Clone atau buka direktori proyek**:
   ```bash
   git clone <URL_REPO_ANDA>
   cd stopwatchrace
   ```

2. **Instal seluruh dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```

4. **Buka di browser**:
   Kunjungi URL lokal yang muncul di terminal (biasanya `http://localhost:5173/`).

---

## 📦 Build untuk Produksi

Untuk menghasilkan bundle statis yang telah dioptimasi:

```bash
npm run build
```

Hasil build akan tersimpan di dalam folder `dist/`. Anda dapat mengujinya secara lokal dengan:

```bash
npm run preview
```

---

## 🌐 Cara Deploy ke Vercel

Aplikasi ini siap di-deploy langsung ke Vercel tanpa konfigurasi tambahan atau environment variable apa pun:

### Opsi A: Lewat Vercel Dashboard (Paling Mudah)
1. Push repository Anda ke GitHub / GitLab / Bitbucket.
2. Buka [vercel.com](https://vercel.com/) dan login ke akun Anda.
3. Klik tombol **"Add New..."** lalu pilih **"Project"**.
4. Import repository GitHub Anda.
5. Vercel akan otomatis mendeteksi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Klik **"Deploy"**. Dalam hitungan detik, aplikasi Anda sudah online!

### Opsi B: Lewat Vercel CLI
```bash
npx vercel
```
Ikuti instruksi singkat di terminal untuk menghubungkan dan mendeploy.

---

## 📁 Struktur Folder

```
stopwatchrace/
├── public/
│   └── favicon.svg           # Ikon SVG karakter lompat karung
├── src/
│   ├── components/
│   │   ├── CountdownOverlay.tsx  # Overlay hitung mundur 3-2-1-GO
│   │   ├── Header.tsx            # Header aplikasi, tombol audio & fullscreen
│   │   ├── Leaderboard.tsx       # Klasemen Top 5 live real-time
│   │   ├── ParticipantInput.tsx  # Form input nama, tombol acak & preset
│   │   ├── RaceCanvas.tsx        # Render 2D canvas arena, karakter & partikel
│   │   ├── SettingsPanel.tsx     # Pengaturan durasi & opsi eliminasi
│   │   ├── WinnerHistory.tsx     # Panel riwayat pemenang per ronde
│   │   └── WinnerModal.tsx       # Pop-up juara dengan animasi confetti
│   ├── types/
│   │   └── race.ts               # Definisi antarmuka TypeScript
│   ├── utils/
│   │   ├── raceEngine.ts         # Logika fisika lompatan & trajektori Catmull-Rom
│   │   ├── random.ts             # Web Crypto random & Fisher-Yates shuffle
│   │   └── soundEngine.ts        # Synthesizer Web Audio API
│   ├── App.tsx                   # Komponen utama & state management
│   ├── index.css                 # Konfigurasi Tailwind & utilitas CSS
│   └── main.tsx                  # Titik masuk React DOM
├── index.html                    # Dokumen HTML utama & font Google
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vercel.json                   # Konfigurasi rewrite SPA Vercel
└── README.md
```

---

## 📄 Lisensi
MIT License. Bebas digunakan untuk acara gathering, komunitas, lomba 17 Agustus, maupun kebutuhan giveaway komersial.
