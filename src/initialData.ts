import { RollKain, Order, Tailor, SewingAssignment, QCInspection, PackingJob, Logistics } from './types';

export const INITIAL_ROLLS: RollKain[] = [
  {
    id: 'ROL-001',
    jenis: 'Katun Combed 30s',
    warna: 'Hitam',
    lebar: 150,
    panjang: 100,
    satuan: 'yard',
    qrCode: 'KNV-FAB-ROL-001',
    status: 'Tersedia',
    keterangan: 'Kondisi bagus, lembut.'
  },
  {
    id: 'ROL-002',
    jenis: 'Katun Combed 30s',
    warna: 'Putih',
    lebar: 150,
    panjang: 120,
    satuan: 'yard',
    qrCode: 'KNV-FAB-ROL-002',
    status: 'Tersedia',
    keterangan: 'Bahan premium.'
  },
  {
    id: 'ROL-003',
    jenis: 'Cotton Fleece',
    warna: 'Abu Misty',
    lebar: 160,
    panjang: 80,
    satuan: 'yard',
    qrCode: 'KNV-FAB-ROL-003',
    status: 'Tersedia',
    keterangan: 'Untuk jaket hoodie.'
  },
  {
    id: 'ROL-004',
    jenis: 'American Drill',
    warna: 'Navy',
    lebar: 150,
    panjang: 75,
    satuan: 'meter',
    qrCode: 'KNV-FAB-ROL-004',
    status: 'Tersedia',
    keterangan: 'Bahan seragam kaku kuat.'
  },
  {
    id: 'ROL-005',
    jenis: 'Katun Combed 30s',
    warna: 'Merah Maroon',
    lebar: 150,
    panjang: 90,
    satuan: 'yard',
    qrCode: 'KNV-FAB-ROL-005',
    status: 'Tersedia',
    keterangan: 'Sisa produksi bulan lalu.'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    spkNo: 'SPK/2026/06/012',
    klien: 'PT Sukses Mandiri',
    model: 'Kaos Polos Combed 30s',
    consumpPerPcs: 0.35, // 0.35 yard per pcs
    satuanConsump: 'yard',
    deadline: '2026-07-15', // active, standard time
    totalQty: 250,
    status: 'Jahit',
    matrix: {
      'Hitam': { 'S': 30, 'M': 50, 'L': 40, 'XL': 10 },
      'Putih': { 'S': 20, 'M': 40, 'L': 50, 'XL': 10 }
    },
    hargaJualPerPcs: 45000,
    biayaKainPerUnit: 28000, // per yard
    biayaAksesorisPerPcs: 2000, // label, tag
    biayaPackingPerPcs: 1500,
    biayaPotongPerPcs: 1000,
    createdAt: '2026-06-25'
  },
  {
    id: 'ORD-002',
    spkNo: 'SPK/2026/06/013',
    klien: 'Komunitas Motor Bandung',
    model: 'Jaket Hoodie Fleece',
    consumpPerPcs: 1.2, // 1.2 yard per hoodie
    satuanConsump: 'yard',
    deadline: '2026-07-06', // URGENT, CLOSE DEADLINE
    totalQty: 80,
    status: 'Potong',
    matrix: {
      'Abu Misty': { 'M': 30, 'L': 40, 'XL': 10 }
    },
    hargaJualPerPcs: 135000,
    biayaKainPerUnit: 48000,
    biayaAksesorisPerPcs: 12000, // zipper, tali, logo
    biayaPackingPerPcs: 2500,
    biayaPotongPerPcs: 2000,
    createdAt: '2026-06-28'
  },
  {
    id: 'ORD-003',
    spkNo: 'SPK/2026/06/014',
    klien: 'Universitas Indonesia',
    model: 'Kemeja PDL Drill',
    consumpPerPcs: 1.5, // 1.5 meter per kemeja
    satuanConsump: 'meter',
    deadline: '2026-07-28', // comfortable deadline
    totalQty: 100,
    status: 'Antrean',
    matrix: {
      'Navy': { 'S': 15, 'M': 35, 'L': 40, 'XL': 10 }
    },
    hargaJualPerPcs: 95000,
    biayaKainPerUnit: 35000,
    biayaAksesorisPerPcs: 5000, // kancing, velcro, bordir
    biayaPackingPerPcs: 2000,
    biayaPotongPerPcs: 1500,
    createdAt: '2026-06-30'
  }
];

export const INITIAL_TAILORS: Tailor[] = [
  { id: 'TLR-001', nama: 'Pak Joko Widodo', spesialisasi: 'Badan & Lengan', status: 'Aktif' },
  { id: 'TLR-002', nama: 'Bu Siti Rahma', spesialisasi: 'Kerah & Kantong', status: 'Aktif' },
  { id: 'TLR-003', nama: 'Mas Roni Gunawan', spesialisasi: 'Full Assembly', status: 'Aktif' },
  { id: 'TLR-004', nama: 'Pak Budi Hartono', spesialisasi: 'Full Assembly', status: 'Aktif' }
];

export const INITIAL_SEWING: SewingAssignment[] = [
  {
    id: 'SEW-001',
    orderId: 'ORD-001',
    tailorId: 'TLR-001',
    bagian: 'Badan',
    qtyTarget: 250,
    qtyCompleted: 150,
    ratePerPcs: 4000, // Rp 4.000 per pcs badan
    sewingDate: '2026-06-29'
  },
  {
    id: 'SEW-002',
    orderId: 'ORD-001',
    tailorId: 'TLR-002',
    bagian: 'Kerah',
    qtyTarget: 250,
    qtyCompleted: 180,
    ratePerPcs: 2500, // Rp 2.500 per pcs kerah
    sewingDate: '2026-06-29'
  },
  {
    id: 'SEW-003',
    orderId: 'ORD-001',
    tailorId: 'TLR-003',
    bagian: 'Lengan',
    qtyTarget: 250,
    qtyCompleted: 140,
    ratePerPcs: 2000, // Rp 2.000 per pcs lengan
    sewingDate: '2026-06-30'
  }
];

export const INITIAL_QC: QCInspection[] = [
  {
    id: 'QC-001',
    orderId: 'ORD-001',
    spkNo: 'SPK/2026/06/012',
    model: 'Kaos Polos Combed 30s',
    tailorIdAssigned: 'TLR-001',
    bagian: 'Jahitan Samping',
    totalChecked: 50,
    qtyPassed: 46,
    qtyRework: 3,
    qtyReject: 1,
    reworkNotes: 'Jahitan samping kiri lepas sepanjang 5cm',
    inspectedAt: '2026-06-30T14:30:00Z',
    status: 'REWORK'
  },
  {
    id: 'QC-002',
    orderId: 'ORD-001',
    spkNo: 'SPK/2026/06/012',
    model: 'Kaos Polos Combed 30s',
    tailorIdAssigned: 'TLR-002',
    bagian: 'Pemasangan Rib Leher',
    totalChecked: 100,
    qtyPassed: 100,
    qtyRework: 0,
    qtyReject: 0,
    inspectedAt: '2026-06-30T16:00:00Z',
    status: 'PASSED'
  }
];

export const INITIAL_PACKING: PackingJob[] = [
  {
    id: 'PCK-001',
    orderId: 'ORD-001',
    spkNo: 'SPK/2026/06/012',
    klien: 'PT Sukses Mandiri',
    model: 'Kaos Polos Combed 30s',
    totalQty: 250,
    packedQty: 100,
    status: 'Proses',
    boxes: [
      {
        id: 'BOX-001',
        boxNo: 1,
        qty: 100,
        breakdown: {
          'Hitam': { 'S': 20, 'M': 30, 'L': 30, 'XL': 5 },
          'Putih': { 'S': 5, 'M': 5, 'L': 5 } // some parts packed
        },
        beratKg: 18.5,
        keterangan: 'Karung 1 - Kaos Hitam & Putih Campur'
      }
    ]
  }
];

export const INITIAL_LOGISTICS: Logistics[] = [
  {
    id: 'LOG-001',
    orderId: 'ORD-001',
    spkNo: 'SPK/2026/06/012',
    klien: 'PT Sukses Mandiri',
    tipePengiriman: '3PL',
    kurirNama: 'Indah Cargo',
    resiNo: 'IND-981273917ID',
    status: 'Dalam Perjalanan',
    history: [
      { time: '2026-07-01T08:00:00Z', lokasi: 'Pool Bandung', keterangan: 'Paket diserahkan ke kurir Indah Cargo.' },
      { time: '2026-07-01T12:30:00Z', lokasi: 'Sorting Hub Jakarta', keterangan: 'Paket sedang disortir.' }
    ]
  },
  {
    id: 'LOG-002',
    orderId: 'ORD-002',
    spkNo: 'SPK/2026/06/013',
    klien: 'Komunitas Motor Bandung',
    tipePengiriman: 'Armada Sendiri',
    kurirNama: 'Pak Ujang (Driver Konveksi)',
    status: 'Belum Kirim',
    history: []
  }
];
