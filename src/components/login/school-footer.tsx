/**
 * Footer halaman login (design.md §6 & PRD §8.1).
 * Pada mobile/HP, menampilkan jam layanan, alamat, dan kontak yang ringkas.
 */
export function SchoolFooter() {
  return (
    <footer className="mt-8 text-center font-plex-sans text-xs text-[#333842]">
      <div className="mb-2 space-y-1 text-xs text-[#333842] lg:hidden">
        <p className="font-medium text-[#161B26]">Jam Layanan: Sen – Jum 07.00 – 15.00 WIB</p>
        <p>Sabtu, Minggu & Hari Libur: Tutup</p>
        <p>Jl. Komp. Pamulang Permai I Rt. 3 Rw. 10, Pamulang Barat, Kec. Pamulang, Kota Tangerang Selatan, Prov. Banten</p>
        <p>Kontak: perpustakaan@smpn17tangsel.sch.id</p>
      </div>
      <p className="font-medium text-[#161B26]">Smart Library — SMP Negeri 17 Tangerang Selatan</p>
      <p className="mt-0.5 text-xs text-[#4A5160]">© 2026 SMP Negeri 17 Tangerang Selatan</p>
    </footer>
  );
}