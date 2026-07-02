import React, { useRef } from 'react';
import { Download, Upload, BarChart3, Database, Layers, CheckCircle2 } from 'lucide-react';
import { RollKain, Order, SewingAssignment, QCInspection, Logistics } from '../types';
import { exportDatabaseToExcel, parseExcelRolls, parseExcelOrders } from '../utils/excel';
import * as XLSX from 'xlsx';

interface HeaderProps {
  rolls: RollKain[];
  orders: Order[];
  sewing: SewingAssignment[];
  qc: QCInspection[];
  logistics: Logistics[];
  onImportRolls: (rolls: RollKain[]) => void;
  onImportOrders: (orders: Order[]) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  showClientPortal: boolean;
  setShowClientPortal: (show: boolean) => void;
}

export default function Header({
  rolls,
  orders,
  sewing,
  qc,
  logistics,
  onImportRolls,
  onImportOrders,
  currentTab,
  setCurrentTab,
  showClientPortal,
  setShowClientPortal
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats Calculations
  const totalRolls = rolls.length;
  const activeOrders = orders.filter(o => o.status !== 'Selesai').length;
  const piecesCompleted = sewing.reduce((sum, s) => sum + s.qtyCompleted, 0);

  // QC waste rate
  const totalChecked = qc.reduce((sum, q) => sum + q.totalChecked, 0);
  const totalReject = qc.reduce((sum, q) => sum + q.qtyReject, 0);
  const wasteRate = totalChecked > 0 ? ((totalReject / totalChecked) * 100).toFixed(1) : '0.0';

  const pendingLogistics = logistics.filter(l => l.status !== 'Terkirim').length;

  // Handle Excel Sheet Import
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Let the user know we can detect worksheets
        const sheetNames = wb.SheetNames;
        
        // Match sheets
        let importedSomething = false;
        if (sheetNames.includes('Stok Kain')) {
          const ws = wb.Sheets['Stok Kain'];
          const data = XLSX.utils.sheet_to_json(ws);
          const parsed = parseExcelRolls(data);
          onImportRolls(parsed);
          importedSomething = true;
        }
        if (sheetNames.includes('Pesanan')) {
          const ws = wb.Sheets['Pesanan'];
          const data = XLSX.utils.sheet_to_json(ws);
          const parsed = parseExcelOrders(data);
          onImportOrders(parsed);
          importedSomething = true;
        }

        if (importedSomething) {
          alert('Berhasil mengimpor data dari file Excel!');
        } else {
          // fallback to first sheet
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(ws);
          
          if (confirm(`Sheet khusus "Stok Kain" atau "Pesanan" tidak ditemukan. Apakah Anda ingin mengimpor sheet "${firstSheetName}" sebagai data STOK KAIN?`)) {
            const parsed = parseExcelRolls(data);
            onImportRolls(parsed);
          }
        }
      } catch (err) {
        console.error(err);
        alert('Gagal mengimpor file Excel. Pastikan format file sesuai.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleExportAll = () => {
    // Generate dummy/sample lists for tailors if needed or export actual
    exportDatabaseToExcel({
      rolls,
      orders,
      tailors: [
        { id: 'TLR-001', nama: 'Pak Joko Widodo', spesialisasi: 'Badan & Lengan', status: 'Aktif' },
        { id: 'TLR-002', nama: 'Bu Siti Rahma', spesialisasi: 'Kerah & Kantong', status: 'Aktif' },
        { id: 'TLR-003', nama: 'Mas Roni Gunawan', spesialisasi: 'Full Assembly', status: 'Aktif' },
        { id: 'TLR-004', nama: 'Pak Budi Hartono', spesialisasi: 'Full Assembly', status: 'Aktif' }
      ],
      sewing,
      qc,
      packing: [], // will get populated
      logistics
    });
  };

  return (
    <header className="bg-white text-[#141414] p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#141414] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2 py-0.5 border-2 border-[#141414] bg-[#141414] text-white font-mono font-extrabold text-sm tracking-widest">
              NEXUS.SMK
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tighter text-[#141414]">
              Sistem Manajemen Produksi Konveksi
            </h1>
          </div>
          <p className="text-xs font-mono text-[#141414]/60 mt-1 uppercase tracking-wider">
            [SYS_INTEGRATION: OFFLINE-FIRST EXCEL ENGINE] • APP LEVEL V4.2
          </p>
        </div>

        {/* Action Buttons for Database Excel */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setShowClientPortal(!showClientPortal)}
            className={`flex items-center gap-2 px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase border transition-all rounded-none cursor-pointer ${
              showClientPortal 
                ? 'bg-green-600 text-white border-[#141414] hover:bg-green-700'
                : 'bg-[#F1F0ED] hover:bg-[#141414] hover:text-white text-[#141414] border-[#141414]'
            }`}
          >
            <Layers size={14} />
            {showClientPortal ? 'EXIT CLIENT PORTAL [ESC]' : 'CLIENT PORTAL [F1]'}
          </button>

          <button
            onClick={triggerFileInput}
            className="flex items-center gap-2 bg-white hover:bg-[#F1F0ED] border border-[#141414] text-[#141414] px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-all rounded-none cursor-pointer"
            title="Unggah spreadsheet Excel (.xlsx atau .csv) untuk update database otomatis"
          >
            <Upload size={14} />
            IMPORT EXCEL
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelImport}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 bg-[#141414] hover:bg-white hover:text-[#141414] border border-[#141414] text-white px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-all rounded-none cursor-pointer"
            title="Download seluruh database konveksi dalam format multi-sheet Excel (.xlsx)"
          >
            <Download size={14} />
            EXPORT MASTER [F2]
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {!showClientPortal && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          <div className="bg-white p-3.5 border border-[#141414] rounded-none">
            <span className="text-[9px] font-mono font-bold text-[#141414]/60 uppercase tracking-widest block">
              01. STOK BAHAN BAKU
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-mono font-bold text-[#141414]">{totalRolls}</span>
              <span className="text-[#141414]/50 font-mono text-[10px] uppercase">ROLL AVAILABLE</span>
            </div>
          </div>

          <div className="bg-white p-3.5 border border-[#141414] rounded-none">
            <span className="text-[9px] font-mono font-bold text-[#141414]/60 uppercase tracking-widest block">
              02. PESANAN AKTIF
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-mono font-bold text-[#141414]">{activeOrders}</span>
              <span className="text-[#141414]/50 font-mono text-[10px] uppercase">SPK QUEUED</span>
            </div>
          </div>

          <div className="bg-white p-3.5 border border-[#141414] rounded-none">
            <span className="text-[9px] font-mono font-bold text-[#141414]/60 uppercase tracking-widest block">
              03. JAHITAN SELESAI
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-mono font-bold text-[#141414]">{piecesCompleted}</span>
              <span className="text-[#141414]/50 font-mono text-[10px] uppercase">PCS COMPLETE</span>
            </div>
          </div>

          <div className="bg-white p-3.5 border border-[#141414] rounded-none">
            <span className="text-[9px] font-mono font-bold text-[#141414]/60 uppercase tracking-widest block">
              04. WASTE RATE REJECT
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-mono font-bold ${Number(wasteRate) > 3.0 ? 'text-red-600' : 'text-[#141414]'}`}>
                {wasteRate}%
              </span>
              <span className="text-[#141414]/50 font-mono text-[10px] uppercase">MAX 3.0%</span>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-[#141414] p-3.5 border border-[#141414] rounded-none text-white">
            <span className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest block">
              05. DELIVERIES PENDING
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-mono font-bold text-orange-400">{pendingLogistics}</span>
              <span className="text-white/60 font-mono text-[10px] uppercase">SHIPPING</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
