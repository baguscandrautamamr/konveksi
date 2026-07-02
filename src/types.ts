export interface RollKain {
  id: string;
  jenis: string;
  warna: string;
  lebar: number; // in cm
  panjang: number; // in meter/yard
  satuan: 'yard' | 'meter';
  qrCode: string;
  status: 'Tersedia' | 'Terpakai' | 'Sisa Perca';
  keterangan?: string;
}

export interface SizeMatrix {
  [warna: string]: {
    [ukuran: string]: number; // e.g. { 'Hitam': { 'S': 50, 'M': 100 } }
  };
}

export interface Order {
  id: string;
  spkNo: string;
  klien: string;
  model: string;
  consumpPerPcs: number; // estimation of fabric per pcs in yard/meter
  satuanConsump: 'yard' | 'meter';
  deadline: string; // YYYY-MM-DD
  totalQty: number;
  status: 'Antrean' | 'Potong' | 'Jahit' | 'QC' | 'Packing' | 'Dikirim' | 'Selesai';
  matrix: SizeMatrix;
  hargaJualPerPcs: number;
  biayaKainPerUnit: number; // cost of fabric per yard/meter
  biayaAksesorisPerPcs: number;
  biayaPackingPerPcs: number;
  biayaPotongPerPcs: number;
  createdAt: string;
  allocatedRolls?: Record<string, string>; // color -> rollId
}

export interface CuttingJob {
  id: string;
  orderId: string;
  spkNo: string;
  model: string;
  rollIdUsed: string[]; // fabric rolls used
  panjangBahanUsed: number; // length of fabric rolls used
  qtyProduced: number; // actual pieces cut
  wasteScrapLength: number; // scrap fabric length
  isSisaSaved: boolean; // did we save it to "Stok Kain Sisa"?
  cuttingDate: string;
  operator: string;
}

export interface Tailor {
  id: string;
  nama: string;
  spesialisasi: string; // e.g., 'Kerah', 'Lengan', 'Badan', 'Umum'
  status: 'Aktif' | 'Cuti';
}

export interface SewingAssignment {
  id: string;
  orderId: string;
  tailorId: string;
  bagian: 'Kerah' | 'Lengan' | 'Badan' | 'Full';
  qtyTarget: number;
  qtyCompleted: number;
  ratePerPcs: number; // piece-rate salary per completed item
  sewingDate: string;
}

export interface QCInspection {
  id: string;
  orderId: string;
  spkNo: string;
  model: string;
  tailorIdAssigned: string; // linked sewing operator
  bagian: string;
  totalChecked: number;
  qtyPassed: number;
  qtyRework: number;
  qtyReject: number;
  reworkNotes?: string;
  inspectedAt: string;
  status: 'PASSED' | 'REWORK' | 'REJECT';
}

export interface PackingJob {
  id: string;
  orderId: string;
  spkNo: string;
  klien: string;
  model: string;
  totalQty: number;
  packedQty: number;
  boxes: PackingBox[];
  status: 'Proses' | 'Selesai';
}

export interface PackingBox {
  id: string;
  boxNo: number;
  qty: number;
  breakdown: { [warna: string]: { [ukuran: string]: number } };
  beratKg: number;
  keterangan: string;
}

export interface Logistics {
  id: string;
  orderId: string;
  spkNo: string;
  klien: string;
  tipePengiriman: '3PL' | 'Armada Sendiri';
  kurirNama: string; // 3PL name (e.g., JNE, Cargo) or Driver name
  resiNo?: string; // Tracking code
  signatureDriver?: string; // base64 canvas signature
  signaturePenerima?: string; // base64 canvas signature
  namaPenerima?: string;
  status: 'Belum Kirim' | 'Dalam Perjalanan' | 'Terkirim';
  history: Array<{ time: string; lokasi: string; keterangan: string }>;
}
