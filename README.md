# README — Aplikasi Informasi Cuaca (Tugas Akhir Pemrograman Web)



## 1. Fitur Utama
- ✔ Pencarian cuaca berdasarkan **nama kota**
- ✔ Menampilkan informasi cuaca realtime:
  - Suhu (°C)
  - Kecepatan angin
  - Kode cuaca → otomatis dikonversi menjadi teks
- ✔ Menggunakan API tanpa API key
- ✔ Desain minimalis & responsif
- ✔ Menggunakan minimal **3 file terpisah** (HTML, CSS, JS)

## 2. Teknologi yang Digunakan
| Teknologi | Fungsi |
|----------|--------|
| **HTML5** | Struktur halaman |
| **CSS3** | Tampilan dan styling |
| **JavaScript** | Logika aplikasi & fetch API |
| **Open-Meteo API** | Penyedia data cuaca realtime |

## 3. Struktur Folder / File
```
/weather-app
│── index.html      → Halaman utama aplikasi
│── styles.css      → Mengatur tampilan & desain
│── script.js       → Mengambil API & menampilkan data cuaca
│── README.md       → Dokumentasi proyek
```

## 4. Cara Menjalankan Program
1. Unduh folder project.
2. Buka file **index.html** di browser (Chrome/Edge/Firefox).
3. Masukkan nama kota.
4. Klik **Search**.
5. Cuaca akan tampil secara realtime.

> Tidak membutuhkan API key, backend, PHP, atau server.

## 5. Tampilan Web
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/23eab5a4-df6b-4d11-a3cb-c4444c435991" />



## 6. Alur Kerja Aplikasi
1. User memasukkan nama kota.
2. Script memanggil Geocoding API untuk mendapatkan koordinat.
3. Script memanggil Weather API untuk mendapatkan data cuaca.
4. Data JSON dikonversi menjadi teks.
5. Hasil ditampilkan dalam halaman HTML.

