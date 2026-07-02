import * as XLSX from 'xlsx';
import { RollKain, Order, Tailor, SewingAssignment, QCInspection, PackingJob, Logistics } from '../types';

// Helper to download any workbook
export function downloadWorkbook(wb: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(wb, fileName);
}

/**
 * EXPORT DATABASE TO MULTI-SHEET EXCEL
 */
export function exportDatabaseToExcel(data: {
  rolls: RollKain[];
  orders: Order[];
  tailors: Tailor[];
  sewing: SewingAssignment[];
  qc: QCInspection[];
  packing: PackingJob[];
  logistics: Logistics[];
}) {
  const wb = XLSX.utils.book_new();

  // 1. Stok Kain Sheet
  const rollsData = data.rolls.map(r => ({
    'ID Gulung': r.id,
    'Jenis Kain': r.jenis,
    'Warna': r.warna,
    'Lebar (cm)': r.lebar,
    'Panjang': r.panjang,
    'Satuan': r.satuan,
    'QR Code': r.qrCode,
    'Status': r.status,
    'Keterangan': r.keterangan || ''
  }));
  const wsRolls = XLSX.utils.json_to_sheet(rollsData);
  XLSX.utils.book_append_sheet(wb, wsRolls, 'Stok Kain');

  // 2. Daftar Pesanan Sheet
  const ordersData = data.orders.map(o => ({
    'ID Order': o.id,
    'No SPK': o.spkNo,
    'Klien': o.klien,
    'Model Baju': o.model,
    'Consump/pcs': o.consumpPerPcs,
    'Satuan Consump': o.satuanConsump,
    'Total Qty': o.totalQty,
    'Harga Jual/pcs': o.hargaJualPerPcs,
    'Biaya Kain/yard': o.biayaKainPerUnit,
    'Biaya Aksesoris/pcs': o.biayaAksesorisPerPcs,
    'Biaya Packing/pcs': o.biayaPackingPerPcs,
    'Biaya Potong/pcs': o.biayaPotongPerPcs,
    'Deadline': o.deadline,
    'Status': o.status,
    'Tanggal Order': o.createdAt
  }));
  const wsOrders = XLSX.utils.json_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Pesanan');

  // 3. Penjahit Sheet
  const tailorsData = data.tailors.map(t => ({
    'ID Penjahit': t.id,
    'Nama Penjahit': t.nama,
    'Spesialisasi': t.spesialisasi,
    'Status': t.status
  }));
  const wsTailors = XLSX.utils.json_to_sheet(tailorsData);
  XLSX.utils.book_append_sheet(wb, wsTailors, 'Penjahit (Borongan)');

  // 4. Lini Jahit Sheet
  const sewingData = data.sewing.map(s => ({
    'ID Sewing': s.id,
    'ID Order': s.orderId,
    'ID Penjahit': s.tailorId,
    'Bagian Jahit': s.bagian,
    'Qty Target': s.qtyTarget,
    'Qty Selesai': s.qtyCompleted,
    'Harga Borongan/pcs': s.ratePerPcs,
    'Tanggal Jahit': s.sewingDate
  }));
  const wsSewing = XLSX.utils.json_to_sheet(sewingData);
  XLSX.utils.book_append_sheet(wb, wsSewing, 'Gaji & Kerja Sewing');

  // 5. QC Sheet
  const qcData = data.qc.map(q => ({
    'ID QC': q.id,
    'ID Order': q.orderId,
    'No SPK': q.spkNo,
    'Model': q.model,
    'Lini Jahit (Penjahit)': q.tailorIdAssigned,
    'Bagian': q.bagian,
    'Total Dicek': q.totalChecked,
    'Lolos (PASSED)': q.qtyPassed,
    'Perbaikan (REWORK)': q.qtyRework,
    'Gagal (REJECT)': q.qtyReject,
    'Catatan Perbaikan': q.reworkNotes || '',
    'Waktu QC': q.inspectedAt,
    'Keputusan': q.status
  }));
  const wsQC = XLSX.utils.json_to_sheet(qcData);
  XLSX.utils.book_append_sheet(wb, wsQC, 'Quality Control');

  // 6. Packing Sheet
  const packingData = data.packing.map(p => ({
    'ID Packing': p.id,
    'ID Order': p.orderId,
    'No SPK': p.spkNo,
    'Klien': p.klien,
    'Model': p.model,
    'Total Qty': p.totalQty,
    'Packed Qty': p.packedQty,
    'Status': p.status
  }));
  const wsPacking = XLSX.utils.json_to_sheet(packingData);
  XLSX.utils.book_append_sheet(wb, wsPacking, 'Finishing & Packing');

  // 7. Pengiriman Sheet
  const logisticsData = data.logistics.map(l => ({
    'ID Logistik': l.id,
    'No SPK': l.spkNo,
    'Klien': l.klien,
    'Kurir / Driver': l.kurirNama,
    'Tipe': l.tipePengiriman,
    'No Resi': l.resiNo || '',
    'Status Pengiriman': l.status
  }));
  const wsLogistics = XLSX.utils.json_to_sheet(logisticsData);
  XLSX.utils.book_append_sheet(wb, wsLogistics, 'Pengiriman Logistics');

  downloadWorkbook(wb, 'Database_Sistem_Konveksi_Master.xlsx');
}

/**
 * IMPORT FROM EXCEL - STOK KAIN
 */
export function parseExcelRolls(sheetData: any[]): RollKain[] {
  return sheetData.map((row, idx) => {
    const id = row['ID Gulung'] || row['id'] || `ROL-${Date.now()}-${idx}`;
    const jenis = row['Jenis Kain'] || row['jenis'] || 'Katun';
    const warna = row['Warna'] || row['warna'] || 'Hitam';
    const lebar = Number(row['Lebar (cm)'] || row['lebar'] || 150);
    const panjang = Number(row['Panjang'] || row['panjang'] || 100);
    const satuan = (row['Satuan'] || row['satuan'] || 'yard').toLowerCase() === 'meter' ? 'meter' : 'yard';
    const qrCode = row['QR Code'] || row['qrCode'] || `KNV-FAB-${id}`;
    const status = row['Status'] || row['status'] || 'Tersedia';
    const keterangan = row['Keterangan'] || row['keterangan'] || '';

    return { id, jenis, warna, lebar, panjang, satuan, qrCode, status, keterangan };
  });
}

/**
 * IMPORT FROM EXCEL - ORDERS
 */
export function parseExcelOrders(sheetData: any[]): Order[] {
  return sheetData.map((row, idx) => {
    const id = row['ID Order'] || row['id'] || `ORD-${Date.now()}-${idx}`;
    const spkNo = row['No SPK'] || row['spkNo'] || `SPK-${Date.now()}-${idx}`;
    const klien = row['Klien'] || row['klien'] || 'Klien Baru';
    const model = row['Model Baju'] || row['model'] || 'Kaos Polos';
    const consumpPerPcs = Number(row['Consump/pcs'] || row['consumpPerPcs'] || 0.35);
    const satuanConsump = (row['Satuan Consump'] || row['satuanConsump'] || 'yard').toLowerCase() === 'meter' ? 'meter' : 'yard';
    const totalQty = Number(row['Total Qty'] || row['totalQty'] || 100);
    const hargaJualPerPcs = Number(row['Harga Jual/pcs'] || row['hargaJualPerPcs'] || 45000);
    const biayaKainPerUnit = Number(row['Biaya Kain/yard'] || row['biayaKainPerUnit'] || 25000);
    const biayaAksesorisPerPcs = Number(row['Biaya Aksesoris/pcs'] || row['biayaAksesorisPerPcs'] || 2000);
    const biayaPackingPerPcs = Number(row['Biaya Packing/pcs'] || row['biayaPackingPerPcs'] || 1500);
    const biayaPotongPerPcs = Number(row['Biaya Potong/pcs'] || row['biayaPotongPerPcs'] || 1000);
    const deadline = row['Deadline'] || row['deadline'] || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const status = row['Status'] || row['status'] || 'Antrean';
    const createdAt = row['Tanggal Order'] || row['createdAt'] || new Date().toISOString().split('T')[0];

    // default template breakdown matrix
    const matrix = {
      'Umum': { 'S': Math.floor(totalQty * 0.2), 'M': Math.floor(totalQty * 0.3), 'L': Math.floor(totalQty * 0.3), 'XL': Math.floor(totalQty * 0.2) }
    };

    return {
      id,
      spkNo,
      klien,
      model,
      consumpPerPcs,
      satuanConsump,
      totalQty,
      status,
      deadline,
      matrix,
      hargaJualPerPcs,
      biayaKainPerUnit,
      biayaAksesorisPerPcs,
      biayaPackingPerPcs,
      biayaPotongPerPcs,
      createdAt
    };
  });
}

/**
 * EXPORT TEMPLATE FOR STOCK KAIN
 */
export function downloadRollsTemplate() {
  const wb = XLSX.utils.book_new();
  const template = [
    {
      'ID Gulung': 'ROL-006',
      'Jenis Kain': 'Katun Combed 30s',
      'Warna': 'Hijau Army',
      'Lebar (cm)': 150,
      'Panjang': 110,
      'Satuan': 'yard',
      'QR Code': 'KNV-FAB-ROL-006',
      'Status': 'Tersedia',
      'Keterangan': 'Bahan tebal lembut'
    },
    {
      'ID Gulung': 'ROL-007',
      'Jenis Kain': 'Linen Premium',
      'Warna': 'Beige',
      'Lebar (cm)': 140,
      'Panjang': 85,
      'Satuan': 'meter',
      'QR Code': 'KNV-FAB-ROL-007',
      'Status': 'Tersedia',
      'Keterangan': 'Bahan serat alami'
    }
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  XLSX.utils.book_append_sheet(wb, ws, 'Template Stok Kain');
  downloadWorkbook(wb, 'Template_Import_Stok_Kain.xlsx');
}

/**
 * EXPORT TEMPLATE FOR ORDERS
 */
export function downloadOrdersTemplate() {
  const wb = XLSX.utils.book_new();
  const template = [
    {
      'ID Order': 'ORD-004',
      'No SPK': 'SPK/2026/07/001',
      'Klien': 'PT Bank Mandiri',
      'Model Baju': 'Polo Shirt Pique',
      'Consump/pcs': 0.4,
      'Satuan Consump': 'yard',
      'Total Qty': 150,
      'Harga Jual/pcs': 65000,
      'Biaya Kain/yard': 38000,
      'Biaya Aksesoris/pcs': 4000,
      'Biaya Packing/pcs': 2000,
      'Biaya Potong/pcs': 1500,
      'Deadline': '2026-07-20',
      'Status': 'Antrean',
      'Tanggal Order': '2026-07-01'
    }
  ];
  const ws = XLSX.utils.json_to_sheet(template);
  XLSX.utils.book_append_sheet(wb, ws, 'Template Pesanan');
  downloadWorkbook(wb, 'Template_Import_Pesanan.xlsx');
}
