import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const schools = [
  { name: 'SD Negeri 01 Banda Aceh', province: 'Aceh', city: 'Banda Aceh' },
  { name: 'SMP Negeri 01 Medan', province: 'Sumatera Utara', city: 'Medan' },
  { name: 'SMA Negeri 01 Padang', province: 'Sumatera Barat', city: 'Padang' },
  { name: 'SD Negeri 01 Pekanbaru', province: 'Riau', city: 'Pekanbaru' },
  { name: 'SMP Negeri 01 Jambi', province: 'Jambi', city: 'Jambi' },
  { name: 'SMA Negeri 01 Palembang', province: 'Sumatera Selatan', city: 'Palembang' },
  { name: 'SD Negeri 01 Bengkulu', province: 'Bengkulu', city: 'Bengkulu' },
  { name: 'SMP Negeri 01 Bandar Lampung', province: 'Lampung', city: 'Bandar Lampung' },
  { name: 'SMA Negeri 01 Pangkal Pinang', province: 'Kepulauan Bangka Belitung', city: 'Pangkal Pinang' },
  { name: 'SD Negeri 01 Tanjung Pinang', province: 'Kepulauan Riau', city: 'Tanjung Pinang' },
  { name: 'SMP Negeri 01 Jakarta Pusat', province: 'DKI Jakarta', city: 'Jakarta Pusat' },
  { name: 'SMA Negeri 01 Bandung', province: 'Jawa Barat', city: 'Bandung' },
  { name: 'SD Negeri 01 Semarang', province: 'Jawa Tengah', city: 'Semarang' },
  { name: 'SMP Negeri 01 Yogyakarta', province: 'DI Yogyakarta', city: 'Yogyakarta' },
  { name: 'SMA Negeri 01 Surabaya', province: 'Jawa Timur', city: 'Surabaya' },
  { name: 'SD Negeri 01 Serang', province: 'Banten', city: 'Serang' },
  { name: 'SMP Negeri 01 Denpasar', province: 'Bali', city: 'Denpasar' },
  { name: 'SMA Negeri 01 Mataram', province: 'Nusa Tenggara Barat', city: 'Mataram' },
  { name: 'SD Negeri 01 Kupang', province: 'Nusa Tenggara Timur', city: 'Kupang' },
  { name: 'SMP Negeri 01 Pontianak', province: 'Kalimantan Barat', city: 'Pontianak' },
  { name: 'SMA Negeri 01 Palangkaraya', province: 'Kalimantan Tengah', city: 'Palangkaraya' },
  { name: 'SD Negeri 01 Banjarmasin', province: 'Kalimantan Selatan', city: 'Banjarmasin' },
  { name: 'SMP Negeri 01 Samarinda', province: 'Kalimantan Timur', city: 'Samarinda' },
  { name: 'SMA Negeri 01 Tanjung Selor', province: 'Kalimantan Utara', city: 'Tanjung Selor' },
  { name: 'SD Negeri 01 Manado', province: 'Sulawesi Utara', city: 'Manado' },
  { name: 'SMP Negeri 01 Palu', province: 'Sulawesi Tengah', city: 'Palu' },
  { name: 'SMA Negeri 01 Makassar', province: 'Sulawesi Selatan', city: 'Makassar' },
  { name: 'SD Negeri 01 Kendari', province: 'Sulawesi Tenggara', city: 'Kendari' },
  { name: 'SMP Negeri 01 Gorontalo', province: 'Gorontalo', city: 'Gorontalo' },
  { name: 'SMA Negeri 01 Mamuju', province: 'Sulawesi Barat', city: 'Mamuju' },
  { name: 'SD Negeri 01 Ambon', province: 'Maluku', city: 'Ambon' },
  { name: 'SMP Negeri 01 Sofifi', province: 'Maluku Utara', city: 'Sofifi' },
  { name: 'SMA Negeri 01 Manokwari', province: 'Papua Barat', city: 'Manokwari' },
  { name: 'SD Negeri 01 Jayapura', province: 'Papua', city: 'Jayapura' },
  { name: 'SMP Negeri 01 Merauke', province: 'Papua Selatan', city: 'Merauke' },
  { name: 'SMA Negeri 01 Nabire', province: 'Papua Tengah', city: 'Nabire' },
  { name: 'SD Negeri 01 Wamena', province: 'Papua Pegunungan', city: 'Wamena' },
  { name: 'SMP Negeri 01 Sorong', province: 'Papua Barat Daya', city: 'Sorong' },
];

const sppgs = [
  { name: 'Dapur Sehat Serambi', province: 'Aceh', city: 'Banda Aceh', average_rating: 4.5, total_reports: 45 },
  { name: 'PT Gizi Medan Jaya', province: 'Sumatera Utara', city: 'Medan', average_rating: 4.2, total_reports: 80 },
  { name: 'Catering Minang Sehat', province: 'Sumatera Barat', city: 'Padang', average_rating: 3.9, total_reports: 55 },
  { name: 'Unit Gizi Riau Mandiri', province: 'Riau', city: 'Pekanbaru', average_rating: 4.0, total_reports: 30 },
  { name: 'Koperasi Pangan Jambi', province: 'Jambi', city: 'Jambi', average_rating: 4.3, total_reports: 25 },
  { name: 'PT Sriwijaya Food', province: 'Sumatera Selatan', city: 'Palembang', average_rating: 4.6, total_reports: 110 },
  { name: 'Yayasan Gizi Bengkulu', province: 'Bengkulu', city: 'Bengkulu', average_rating: 3.7, total_reports: 15 },
  { name: 'Berkah Catering Lampung', province: 'Lampung', city: 'Bandar Lampung', average_rating: 4.1, total_reports: 65 },
  { name: 'Tim Pangan Babel', province: 'Kepulauan Bangka Belitung', city: 'Pangkal Pinang', average_rating: 4.4, total_reports: 40 },
  { name: 'Kepri Nutrisi Center', province: 'Kepulauan Riau', city: 'Tanjung Pinang', average_rating: 4.2, total_reports: 50 },
  { name: 'PT Ibu Kota Gizi', province: 'DKI Jakarta', city: 'Jakarta Pusat', average_rating: 4.9, total_reports: 250 },
  { name: 'Pasundan Food Service', province: 'Jawa Barat', city: 'Bandung', average_rating: 4.7, total_reports: 180 },
  { name: 'Solo Raya Catering', province: 'Jawa Tengah', city: 'Solo', average_rating: 4.5, total_reports: 140 },
  { name: 'Jogja Gizi Utama', province: 'DI Yogyakarta', city: 'Yogyakarta', average_rating: 4.8, total_reports: 210 },
  { name: 'Jatim Makmur Pangan', province: 'Jawa Timur', city: 'Surabaya', average_rating: 4.6, total_reports: 190 },
  { name: 'Banten Sejahtera Food', province: 'Banten', city: 'Serang', average_rating: 4.0, total_reports: 70 },
  { name: 'Dewata Nutrition Hub', province: 'Bali', city: 'Denpasar', average_rating: 4.3, total_reports: 95 },
  { name: 'Lombok Food Program', province: 'Nusa Tenggara Barat', city: 'Mataram', average_rating: 4.1, total_reports: 60 },
  { name: 'Timur Gizi Kupang', province: 'Nusa Tenggara Timur', city: 'Kupang', average_rating: 3.8, total_reports: 40 },
  { name: 'Borneo Food West', province: 'Kalimantan Barat', city: 'Pontianak', average_rating: 4.2, total_reports: 55 },
  { name: 'Kalteng Mandiri Gizi', province: 'Kalimantan Tengah', city: 'Palangkaraya', average_rating: 4.4, total_reports: 35 },
  { name: 'Banua Food Service', province: 'Kalimantan Selatan', city: 'Banjarmasin', average_rating: 4.3, total_reports: 45 },
  { name: 'Kaltim Pangan Utama', province: 'Kalimantan Timur', city: 'Samarinda', average_rating: 4.5, total_reports: 120 },
  { name: 'Kaltara Gizi Sehat', province: 'Kalimantan Utara', city: 'Tanjung Selor', average_rating: 3.9, total_reports: 20 },
  { name: 'Sulut Nutrition Center', province: 'Sulawesi Utara', city: 'Manado', average_rating: 4.4, total_reports: 80 },
  { name: 'Tadulako Food Program', province: 'Sulawesi Tengah', city: 'Palu', average_rating: 4.0, total_reports: 40 },
  { name: 'Anging Mammiri Food', province: 'Sulawesi Selatan', city: 'Makassar', average_rating: 4.8, total_reports: 160 },
  { name: 'Sultra Gizi Mandiri', province: 'Sulawesi Tenggara', city: 'Kendari', average_rating: 4.1, total_reports: 30 },
  { name: 'Serambi Gorontalo Food', province: 'Gorontalo', city: 'Gorontalo', average_rating: 4.2, total_reports: 25 },
  { name: 'Sulbar Pangan Lestari', province: 'Sulawesi Barat', city: 'Mamuju', average_rating: 3.7, total_reports: 15 },
  { name: 'Manise Food Service', province: 'Maluku', city: 'Ambon', average_rating: 4.3, total_reports: 50 },
  { name: 'Malut Nutrition Hub', province: 'Maluku Utara', city: 'Sofifi', average_rating: 3.9, total_reports: 20 },
  { name: 'Cendrawasih West Gizi', province: 'Papua Barat', city: 'Manokwari', average_rating: 4.0, total_reports: 30 },
  { name: 'Papua Gizi Center', province: 'Papua', city: 'Jayapura', average_rating: 4.5, total_reports: 60 },
  { name: 'Anim Ha Nutrition', province: 'Papua Selatan', city: 'Merauke', average_rating: 3.8, total_reports: 25 },
  { name: 'Papua Tengah Mandiri', province: 'Papua Tengah', city: 'Nabire', average_rating: 4.1, total_reports: 35 },
  { name: 'Lembah Gizi Wamena', province: 'Papua Pegunungan', city: 'Wamena', average_rating: 3.6, total_reports: 10 },
  { name: 'Malaumkarta Food', province: 'Papua Barat Daya', city: 'Sorong', average_rating: 4.2, total_reports: 40 },
];

export async function seedData() {
  console.log('Attempting to seed data...');
  try {
    const [schoolSnap, sppgSnap] = await Promise.all([
      getDocs(collection(db, 'schools')),
      getDocs(collection(db, 'sppgs'))
    ]);
    
    console.log(`Current counts - Schools: ${schoolSnap.size}, SPPGs: ${sppgSnap.size}`);

    // If we have fewer schools than our seed list, add the defaults
    // Note: This is an idempotent-ish check for demo purposes
    if (schoolSnap.size < schools.length) {
      console.log('Supplementing schools data...');
      const existingNames = new Set(schoolSnap.docs.map(d => d.data().name));
      const newSchools = schools.filter(s => !existingNames.has(s.name));
      if (newSchools.length > 0) {
        await Promise.all(newSchools.map(school => addDoc(collection(db, 'schools'), school)));
        console.log(`Added ${newSchools.length} new schools.`);
      }
    }

    if (sppgSnap.size < sppgs.length) {
      console.log('Supplementing SPPGs data...');
      const existingNames = new Set(sppgSnap.docs.map(d => d.data().name));
      const newSppgs = sppgs.filter(s => !existingNames.has(s.name));
      if (newSppgs.length > 0) {
         await Promise.all(newSppgs.map(sppg => addDoc(collection(db, 'sppgs'), sppg)));
         console.log(`Added ${newSppgs.length} new SPPGs.`);
      }
    }
    console.log('Seeding process finished.');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}
