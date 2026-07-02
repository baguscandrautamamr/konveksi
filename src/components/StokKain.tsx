import React, { useState } from 'react';
import { Search, Plus, QrCode, ClipboardList, Camera, Check, FileSpreadsheet, Download, RefreshCw, Trash2, X, Printer, Loader2 } from 'lucide-react';
import { RollKain } from '../types';
import { downloadRollsTemplate } from '../utils/excel';

// Deterministic QR Code mock generator
const generateMockQR = (text: string) => {
  const size = 15;
  const grid = Array(size).fill(0).map(() => Array(size).fill(false));
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isTopLeft = r < 4 && c < 4;
      const isTopRight = r < 4 && c >= size - 4;
      const isBottomLeft = r >= size - 4 && c < 4;
      
      if (isTopLeft) {
        grid[r][c] = r === 0 || r === 3 || c === 0 || c === 3 || (r >= 1 && r <= 2 && c >= 1 && c <= 2);
      } else if (isTopRight) {
        grid[r][c] = r === 0 || r === 3 || c === size - 4 || c === size - 1 || (r >= 1 && r <= 2 && c >= size - 3 && c <= size - 2);
      } else if (isBottomLeft) {
        grid[r][c] = r === size - 4 || r === size - 1 || c === 0 || c === 3 || (r >= size - 3 && r <= size - 2 && c >= 1 && c <= 2);
      } else {
        const val = Math.abs(Math.sin(hash + r * 13 + c * 37));
        grid[r][c] = val > 0.45;
      }
    }
  }
  return grid;
};

// Play thermal printing sound simulation with Web Audio API
const playPrintSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    let now = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180 + i * 15, now);
      
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
      now += 0.12;
    }
  } catch (e) {}
};

// Map Indonesian/custom color names to CSS colors or hex codes
export const resolveColor = (colorName: string): string => {
  if (!colorName) return '#888888';
  const normalized = colorName.trim().toLowerCase();
  
  const indonesianColors: Record<string, string> = {
    'hitam': '#000000',
    'putih': '#ffffff',
    'merah': '#e53e3e',
    'merah muda': '#fc8181',
    'merah maroon': '#800000',
    'maroon': '#800000',
    'biru': '#3182ce',
    'biru dongker': '#000080',
    'biru laut': '#4299e1',
    'kuning': '#ecc94b',
    'hijau': '#38a169',
    'hijau botol': '#0f5132',
    'hijau daun': '#2f855a',
    'oranye': '#dd6b20',
    'orange': '#dd6b20',
    'jingga': '#dd6b20',
    'pink': '#ed64a6',
    'merah jambu': '#ed64a6',
    'abu-abu': '#a0aec0',
    'abu': '#a0aec0',
    'abu abu': '#a0aec0',
    'grey': '#a0aec0',
    'gray': '#a0aec0',
    'abu misty': '#cbd5e0',
    'cokelat': '#744210',
    'coklat': '#744210',
    'brown': '#744210',
    'ungu': '#805ad5',
    'purple': '#805ad5',
    'navy': '#000080',
    'tosca': '#319795',
    'toska': '#319795',
    'turquoise': '#319795',
    'lilac': '#d6bcfa',
    'cream': '#fefcbf',
    'krem': '#fefcbf',
    'mocca': '#b7791f',
    'moka': '#b7791f',
    'khaki': '#ecc94b',
    'kaki': '#ecc94b',
    'mustard': '#ecc94b',
    'salem': '#fbd38d',
    'fuchsia': '#d53f8c',
    'magenta': '#d53f8c',
    'cyan': '#00b5d8',
    'teal': '#319795'
  };

  if (indonesianColors[normalized]) {
    return indonesianColors[normalized];
  }

  // Check if it looks like a hex code
  if (/^#([0-9a-f]{3}){1,2}$/i.test(normalized)) {
    return normalized;
  }
  if (/^[0-9a-f]{3,6}$/i.test(normalized)) {
    return `#${normalized}`;
  }

  // Return normalized (supports English colors like 'orange', 'yellow' natively)
  return normalized;
};

const triggerBrowserPrint = (roll: RollKain) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup Blocker Terdeteksi! Silakan izinkan popup/tab baru pada browser Anda untuk mencetak label fisik.');
    return;
  }
  
  const qrGrid = generateMockQR(roll.qrCode);
  const qrHtml = qrGrid.map(row => 
    `<div style="display: flex; justify-content: center;">${row.map(cell => 
      `<div style="width: 6px; height: 6px; background-color: ${cell ? '#000000' : '#ffffff'}; border-radius: 0;"></div>`
    ).join('')}</div>`
  ).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>CETAK_LABEL_${roll.id}</title>
        <style>
          @page {
            size: auto;
            margin: 0;
          }
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            font-family: 'Courier New', Courier, monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .label-container {
            border: 3px double #000;
            padding: 15px;
            width: 260px;
            box-sizing: border-box;
            background: #fff;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
            margin: auto;
          }
          .title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 3px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            letter-spacing: 1px;
          }
          .qr-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 10px 0;
          }
          .info-table {
            width: 100%;
            font-size: 11px;
            text-align: left;
            border-collapse: collapse;
            margin-top: 10px;
            border-top: 1px dashed #000;
            padding-top: 8px;
          }
          .info-table td {
            padding: 3px 0;
          }
          .info-table td.label {
            font-weight: bold;
            text-transform: uppercase;
            width: 40%;
          }
          .footer {
            margin-top: 12px;
            font-size: 9px;
            border-top: 2px solid #000;
            padding-top: 6px;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="title">GUDANG FABRIC</div>
          <div style="font-size: 10px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">ROLL ID: ${roll.id}</div>
          <div class="qr-box">
            <div style="border: 2px solid #000; padding: 4px; background: #fff; display: inline-block; line-height: 0;">
              ${qrHtml}
            </div>
            <div style="font-size: 9px; font-weight: bold; margin-top: 6px; letter-spacing: 1px;">${roll.qrCode}</div>
          </div>
          <table class="info-table">
            <tr>
              <td class="label">Bahan:</td>
              <td>${roll.jenis}</td>
            </tr>
            <tr>
              <td class="label">Warna:</td>
              <td>${roll.warna}</td>
            </tr>
            <tr>
              <td class="label">Ukuran:</td>
              <td>Lebar ${roll.lebar} cm</td>
            </tr>
            <tr>
              <td class="label">Panjang:</td>
              <td><strong>${roll.panjang} ${roll.satuan.toUpperCase()}</strong></td>
            </tr>
            <tr>
              <td class="label">Status:</td>
              <td>${roll.status.toUpperCase()}</td>
            </tr>
          </table>
          <div class="footer">
            SISTEM INVENTARIS TEKSTIL
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

interface StokKainProps {
  rolls: RollKain[];
  onAddRoll: (roll: RollKain) => void;
  onUpdateRoll: (roll: RollKain) => void;
  onDeleteRoll: (id: string) => void;
}

export default function StokKain({ rolls, onAddRoll, onUpdateRoll, onDeleteRoll }: StokKainProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scannerMode, setScannerMode] = useState<'simulation' | 'camera'>('simulation');

  // Label Printer State
  const [selectedPrintRoll, setSelectedPrintRoll] = useState<RollKain | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Custom Delete Confirmation State
  const [rollToDelete, setRollToDelete] = useState<RollKain | null>(null);

  // New Roll State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoll, setNewRoll] = useState({
    jenis: 'Katun Combed 30s',
    warna: 'Hitam',
    lebar: 150,
    panjang: 100,
    satuan: 'yard' as 'yard' | 'meter',
    status: 'Tersedia' as 'Tersedia' | 'Terpakai' | 'Sisa Perca',
    keterangan: ''
  });

  const uniqueJenis = Array.from(new Set(rolls.map(r => r.jenis)));

  // Filter rolls
  const filteredRolls = rolls.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.jenis.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.warna.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.qrCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJenis = filterJenis === '' || r.jenis === filterJenis;
    const matchesStatus = filterStatus === '' || r.status === filterStatus;
    return matchesSearch && matchesJenis && matchesStatus;
  });

  // Handle Scan Simulation
  const handleSimulateScan = (qrCodeStr: string) => {
    const matchedRoll = rolls.find(r => r.qrCode === qrCodeStr || r.id === qrCodeStr);
    if (matchedRoll) {
      setScanResult(`BERHASIL SCAN: ${matchedRoll.jenis} (${matchedRoll.warna}) - ${matchedRoll.panjang} ${matchedRoll.satuan}`);
      // reduce length by 5 as simulation
      if (matchedRoll.panjang > 5) {
        const updated = {
          ...matchedRoll,
          panjang: matchedRoll.panjang - 5,
          keterangan: `${matchedRoll.keterangan || ''} (Scan potong 5 ${matchedRoll.satuan} tgl 1 Juli)`
        };
        onUpdateRoll(updated);
        // Play audio alert (web synth fallback)
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
      } else {
        alert('Stok kain roll ini tinggal sedikit! Tidak bisa dikurangi otomatis.');
      }
    } else {
      setScanResult('ERROR: Kode QR tidak terdaftar di sistem!');
    }
  };

  const handleAddNewRoll = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `ROL-${String(rolls.length + 1).padStart(3, '0')}`;
    const qrCode = `KNV-FAB-${id}`;
    
    onAddRoll({
      id,
      ...newRoll,
      qrCode
    });

    setNewRoll({
      jenis: 'Katun Combed 30s',
      warna: 'Hitam',
      lebar: 150,
      panjang: 100,
      satuan: 'yard',
      status: 'Tersedia',
      keterangan: ''
    });
    setShowAddForm(false);
  };

  const startPrintSimulation = () => {
    if (!selectedPrintRoll) return;
    setIsPrinting(true);
    setPrintSuccess(false);
    
    playPrintSound();
    
    setTimeout(() => {
      setIsPrinting(false);
      setPrintSuccess(true);
    }, 1200);
  };

  const handlePhysicalPrint = () => {
    if (!selectedPrintRoll) return;
    triggerBrowserPrint(selectedPrintRoll);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Scanner Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Statistics & Scanner Box */}
        <div className="bg-[#141414] text-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3 border-b border-white/20 pb-2">
              <span className="p-1 border border-white bg-white text-[#141414]">
                <QrCode size={18} />
              </span>
              <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider">Scanner Lini Cutting</h3>
            </div>
            <p className="text-white/70 font-mono text-[11px] leading-relaxed uppercase">
              [DEVICES READY: PORT_CAM_01] Scan sticker QR pada roll kain saat akan digelar atau dipotong di meja potong. Sistem akan otomatis mendeteksi bahan baku dan memperbarui sisa panjang kain.
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              onClick={() => {
                setIsScanning(true);
                setScanResult(null);
              }}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#F1F0ED] text-[#141414] font-mono text-xs font-black tracking-wider py-2 px-3 rounded-none uppercase transition-all cursor-pointer border border-white"
            >
              <Camera size={14} />
              OPEN SCANNER [F3]
            </button>
            <button
              onClick={downloadRollsTemplate}
              className="w-full flex items-center justify-center gap-2 bg-[#141414] hover:bg-white/10 border border-white/30 text-white font-mono text-xs py-2 px-3 rounded-none uppercase transition-all cursor-pointer"
            >
              <FileSpreadsheet size={12} />
              DOWNLOAD TEMPLATE EXCEL
            </button>
          </div>
        </div>

        {/* Form Add New Roll (Toggleable) */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] lg:col-span-2">
          <div className="flex justify-between items-center mb-4 border-b border-[#141414] pb-2">
            <h3 className="font-mono font-extrabold text-sm text-[#141414] uppercase tracking-wider flex items-center gap-2">
              <ClipboardList size={16} />
              [01. REGISTER NEW ROLL]
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs font-mono font-bold border border-[#141414] bg-[#F1F0ED] hover:bg-white text-[#141414] px-2.5 py-1 rounded-none uppercase"
            >
              {showAddForm ? 'COLLAPSE FORM' : 'EXPAND FORM'}
            </button>
          </div>

          {showAddForm ? (
            <form onSubmit={handleAddNewRoll} className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Jenis Bahan Kain</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Katun Combed 30s"
                  value={newRoll.jenis}
                  onChange={(e) => setNewRoll({ ...newRoll, jenis: e.target.value })}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Warna Kain</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hitam Jetblack"
                  value={newRoll.warna}
                  onChange={(e) => setNewRoll({ ...newRoll, warna: e.target.value })}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Lebar Kain (cm)</label>
                  <input
                    type="number"
                    required
                    value={newRoll.lebar}
                    onChange={(e) => setNewRoll({ ...newRoll, lebar: Number(e.target.value) })}
                    className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Panjang</label>
                  <input
                    type="number"
                    required
                    value={newRoll.panjang}
                    onChange={(e) => setNewRoll({ ...newRoll, panjang: Number(e.target.value) })}
                    className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Satuan</label>
                  <select
                    value={newRoll.satuan}
                    onChange={(e) => setNewRoll({ ...newRoll, satuan: e.target.value as 'yard' | 'meter' })}
                    className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
                  >
                    <option value="yard">Yard (Umum)</option>
                    <option value="meter">Meter</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Status Kain</label>
                  <select
                    value={newRoll.status}
                    onChange={(e) => setNewRoll({ ...newRoll, status: e.target.value as 'Tersedia' | 'Terpakai' | 'Sisa Perca' })}
                    className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Terpakai">Terpakai</option>
                    <option value="Sisa Perca">Sisa Perca</option>
                  </select>
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Kondisi roll, supplier, lokasi rak..."
                  value={newRoll.keterangan}
                  onChange={(e) => setNewRoll({ ...newRoll, keterangan: e.target.value })}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
                />
              </div>

              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 border border-[#141414] bg-white hover:bg-[#F1F0ED] font-mono text-xs font-bold rounded-none uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#141414] hover:bg-white hover:text-[#141414] border border-[#141414] text-white font-mono text-xs font-bold rounded-none uppercase cursor-pointer"
                >
                  Save Roll
                </button>
              </div>
            </form>
          ) : (
            <div className="h-44 bg-[#F1F0ED] rounded-none border border-dashed border-[#141414]/30 flex flex-col justify-center items-center text-center p-4">
              <span className="text-[#141414]/70 text-xs font-mono font-bold uppercase mb-1">[INPUT GUDANG SECURE FORM]</span>
              <p className="text-[10px] font-mono text-[#141414]/60 max-w-sm uppercase">Klik "EXPAND FORM" untuk mendaftarkan kain gulung baru yang masuk ke gudang konveksi.</p>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal simulation */}
      {isScanning && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-[#141414] rounded-none p-6 max-w-lg w-full border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex justify-between items-center mb-5 border-b border-[#141414] pb-3">
              <div>
                <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider">[SYS_BARCODE: DEVIATION DETECTOR]</h3>
                <p className="text-[10px] font-mono text-[#141414]/60 uppercase">Pilih mode scanner untuk mulai mendeteksi roll kain</p>
              </div>
              <button
                onClick={() => setIsScanning(false)}
                className="text-[#141414] hover:opacity-60 font-mono font-bold text-xs uppercase"
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Toggle Modes */}
            <div className="grid grid-cols-2 bg-[#F1F0ED] p-1 border border-[#141414] mb-5 text-xs font-mono">
              <button
                onClick={() => setScannerMode('simulation')}
                className={`py-1.5 rounded-none transition-all cursor-pointer ${scannerMode === 'simulation' ? 'bg-[#141414] text-white font-bold' : 'text-[#141414]'}`}
              >
                SIMULATION SCANNER
              </button>
              <button
                onClick={() => setScannerMode('camera')}
                className={`py-1.5 rounded-none transition-all cursor-pointer ${scannerMode === 'camera' ? 'bg-[#141414] text-white font-bold' : 'text-[#141414]'}`}
              >
                HARDWARE CAMERA
              </button>
            </div>

            {scannerMode === 'simulation' ? (
              <div className="space-y-4">
                <p className="text-[10px] font-mono text-[#141414]/60 uppercase">Simulasikan aktivitas bagian cutting dengan memilih roll kain di bawah ini untuk di-scan dan ditarik panjangnya (otomatis dipotong 5 yard/meter):</p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-[#E4E3E0] font-mono text-xs">
                  {rolls.filter(r => r.status === 'Tersedia').map(r => (
                    <div key={r.id} className="flex justify-between items-center pt-2 text-xs first:pt-0">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-700">{r.qrCode}</span>
                        <div className="font-bold text-[#141414]">{r.jenis} • {r.warna}</div>
                      </div>
                      <button
                        onClick={() => handleSimulateScan(r.qrCode)}
                        className="bg-[#141414] hover:bg-white hover:text-[#141414] border border-[#141414] text-white text-[10px] px-2.5 py-1 font-bold uppercase rounded-none cursor-pointer"
                      >
                        SIMULATE SCAN
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center font-mono">
                <div className="relative border-2 border-dashed border-[#141414] w-full h-56 rounded-none flex items-center justify-center bg-[#F1F0ED] overflow-hidden">
                  <div className="absolute inset-0 bg-[#F1F0ED] flex flex-col justify-center items-center p-4">
                    <Camera size={32} className="text-[#141414] animate-pulse mb-3" />
                    <span className="text-xs font-bold uppercase text-[#141414]">ACCESSING DEVICE CAMERA...</span>
                    <p className="text-[10px] text-[#141414]/60 max-w-xs mt-1 uppercase">Stiker QR terdeteksi di area bidikan akan langsung mengurangi stok kain.</p>
                  </div>
                  {/* Virtual green scanning line */}
                  <div className="absolute left-0 right-0 h-[2px] bg-red-600 top-1/2 animate-bounce"></div>
                </div>
                <div className="bg-amber-100 border border-amber-400 p-3 text-[10px] text-amber-900 uppercase">
                  <span className="font-bold">NOTICE:</span> Di lingkungan iFrame AI Studio, silakan gunakan "SIMULATION SCANNER" di atas untuk mencoba flow jahit otomatis 100% tanpa kendala perizinan kamera browser.
                </div>
              </div>
            )}

            {scanResult && (
              <div className={`mt-5 p-3 text-xs text-center font-mono font-bold border ${scanResult.includes('ERROR') ? 'bg-red-50 text-red-700 border-red-600' : 'bg-green-50 text-green-700 border-green-600'}`}>
                {scanResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table: Stok Kain */}
      <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 border-b border-[#141414] pb-3">
          <h3 className="font-mono font-extrabold text-sm text-[#141414] uppercase tracking-wider flex items-center gap-2">
            [02. GUDANG GULUNGAN BAHAN BAKU]
            <span className="text-xs font-mono font-normal text-[#141414]/60">({filteredRolls.length} ROLLS SYSTEM)</span>
          </h3>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
            <div className="relative w-full md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#141414]/50" size={14} />
              <input
                type="text"
                placeholder="Cari kain, warna, QR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none pl-8 pr-3 py-1.5 bg-white text-[#141414] outline-none"
              />
            </div>

            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
            >
              <option value="">Semua Jenis Bahan</option>
              {uniqueJenis.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
            >
              <option value="">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Terpakai">Terpakai</option>
              <option value="Sisa Perca">Sisa Perca</option>
            </select>
          </div>
        </div>

        {/* Inventory List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#141414]">
            <thead>
              <tr className="bg-[#F1F0ED] border-b border-[#141414] text-[#141414] font-mono uppercase font-bold text-[10px]">
                <th className="p-3">ID & KODE QR</th>
                <th className="p-3">JENIS BAHAN</th>
                <th className="p-3">WARNA</th>
                <th className="p-3">LEBAR</th>
                <th className="p-3 text-right">SISA PANJANG</th>
                <th className="p-3 text-center">STATUS</th>
                <th className="p-3">KETERANGAN</th>
                <th className="p-3 text-center">LABEL STICKER</th>
                <th className="p-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3E0] font-mono">
              {filteredRolls.map(r => (
                <tr key={r.id} className="hover:bg-[#F9F9F8] transition-colors">
                  <td className="p-3 font-bold">
                    <span className="text-[#141414] block">{r.id}</span>
                    <span className="text-[10px] text-[#141414]/50 block">{r.qrCode}</span>
                  </td>
                  <td className="p-3 font-sans font-bold text-[#141414]">{r.jenis}</td>
                  <td className="p-3 font-sans font-bold">
                    <span className="inline-flex items-center gap-1.5 text-[#141414]">
                      <span className="w-3 h-3 rounded-none border border-[#141414] inline-block shrink-0" style={{ backgroundColor: resolveColor(r.warna) }} />
                      {r.warna}
                    </span>
                  </td>
                  <td className="p-3 text-[#141414]/70">{r.lebar} cm</td>
                  <td className="p-3 text-right">
                    <span className="font-bold text-[#141414]">{r.panjang}</span>
                    <span className="text-[10px] text-[#141414]/50 ml-1 uppercase">{r.satuan}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block text-[9px] px-2 py-0.5 font-extrabold uppercase border ${r.status === 'Tersedia' ? 'bg-green-50 text-green-700 border-green-600' : r.status === 'Terpakai' ? 'bg-gray-100 text-gray-500 border-gray-400' : 'bg-amber-50 text-amber-700 border-amber-600'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-[#141414]/70 text-[11px] max-w-xs truncate">{r.keterangan || '-'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedPrintRoll(r);
                        setPrintSuccess(false);
                        setIsPrinting(false);
                      }}
                      className="text-[#141414] hover:bg-[#141414] hover:text-white p-1 border border-[#141414] bg-[#F1F0ED] inline-flex items-center gap-1.5 text-[9px] font-bold uppercase rounded-none cursor-pointer transition-colors"
                      title="Klik untuk cetak sticker label roll"
                    >
                      <QrCode size={11} />
                      CETAK LABEL
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        setRollToDelete(r);
                      }}
                      className="p-1 text-[#141414]/50 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRolls.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#141414]/50 font-mono">
                    [NO DATA DETECTED IN STORAGE SEARCH]
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Label Printer Modal */}
      {selectedPrintRoll && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white text-[#141414] rounded-none p-6 max-w-md w-full border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col font-mono">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#141414] pb-3 mb-4">
              <div>
                <h3 className="font-mono font-extrabold text-xs uppercase tracking-wider">[03. THERMAL LABEL PRINTER SYSTEM]</h3>
                <p className="text-[9px] text-[#141414]/60 uppercase">Unit: Epson TM-T88VI Thermal Printer (Online)</p>
              </div>
              <button
                onClick={() => setSelectedPrintRoll(null)}
                className="text-[#141414] hover:opacity-60 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sticker Live Preview Sheet */}
            <div className="bg-[#F1F0ED] p-4 border border-[#141414]/30 mb-5 relative overflow-hidden flex flex-col items-center">
              {/* Decorative paper tears or teeth on top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(45deg,transparent_25%,#fff_25%,#fff_50%,transparent_50%,transparent_75%,#fff_75%)] bg-[length:8px_8px] opacity-100"></div>
              
              {/* Real paper card inside */}
              <div className={`bg-white border-2 border-[#141414] p-5 w-64 shadow-md text-center transition-all duration-1000 transform ${isPrinting ? 'translate-y-4 opacity-50' : 'translate-y-0 opacity-100'}`}>
                {/* Title */}
                <div className="font-extrabold text-xs uppercase border-b-2 border-[#141414] pb-1.5 tracking-wider">
                  GUDANG FABRIC
                </div>
                <div className="text-[10px] font-bold text-[#141414]/50 mt-1 uppercase">
                  ROLL ID: {selectedPrintRoll.id}
                </div>

                {/* QR Vector Pattern */}
                <div className="my-4 flex flex-col items-center">
                  <div className="border border-[#141414] p-2 bg-white inline-block">
                    {generateMockQR(selectedPrintRoll.qrCode).map((row, rIdx) => (
                      <div key={rIdx} className="flex">
                        {row.map((cell, cIdx) => (
                          <div
                            key={cIdx}
                            className={`w-2.5 h-2.5 ${cell ? 'bg-black' : 'bg-white'}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] font-bold mt-1.5 tracking-wider text-[#141414]">
                    {selectedPrintRoll.qrCode}
                  </div>
                </div>

                {/* Meta details list */}
                <div className="border-t border-dashed border-[#141414] pt-2 text-left text-[10px] uppercase space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#141414]/60">Bahan:</span>
                    <span className="font-bold">{selectedPrintRoll.jenis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141414]/60">Warna:</span>
                    <span className="font-bold">{selectedPrintRoll.warna}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141414]/60">Ukuran:</span>
                    <span className="font-bold">Lebar {selectedPrintRoll.lebar} cm</span>
                  </div>
                  <div className="flex justify-between border-t border-[#141414]/10 pt-1">
                    <span className="text-[#141414]/60">Sisa Stok:</span>
                    <span className="font-extrabold text-blue-700">{selectedPrintRoll.panjang} {selectedPrintRoll.satuan.toUpperCase()}</span>
                  </div>
                </div>

                {/* Footer text */}
                <div className="border-t-2 border-[#141414] mt-3 pt-1 text-[8px] font-extrabold text-[#141414]/40 tracking-wider">
                  SISTEM INVENTARIS TEKSTIL
                </div>
              </div>
              
              {/* Paper slot decorative footer line */}
              <div className="w-full h-1.5 bg-[#141414] mt-4 rounded-none"></div>
            </div>

            {/* Printing simulator feedback */}
            {isPrinting && (
              <div className="mb-4 bg-[#F1F0ED] border border-[#141414]/30 p-2.5 text-center text-[10px] uppercase font-bold text-amber-700 animate-pulse flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin" />
                Mencetak label stiker (Zzzt... Zzzt...)...
              </div>
            )}

            {printSuccess && (
              <div className="mb-4 bg-green-50 border border-green-600 p-2.5 text-center text-[10px] uppercase font-bold text-green-700">
                ✓ Cetak stiker thermal selesai! Silakan tempel pada roll kain.
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startPrintSimulation}
                disabled={isPrinting}
                className="w-full flex items-center justify-center gap-2 bg-[#141414] hover:bg-white hover:text-[#141414] border border-[#141414] text-white py-2 px-3 font-mono font-bold text-xs uppercase rounded-none cursor-pointer disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={12} className={isPrinting ? 'animate-spin' : ''} />
                SIMULASI CETAK
              </button>
              <button
                onClick={handlePhysicalPrint}
                disabled={isPrinting}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-white hover:text-emerald-700 border border-emerald-600 text-white py-2 px-3 font-mono font-bold text-xs uppercase rounded-none cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Printer size={12} />
                CETAK ASLI (PDF)
              </button>
            </div>

            <p className="text-[9px] text-[#141414]/40 text-center mt-3 uppercase font-medium">
              Gunakan "CETAK ASLI (PDF)" untuk mencetak menggunakan printer kertas fisik yang terhubung ke PC/Handphone.
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {rollToDelete && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-white text-[#141414] rounded-none p-6 max-w-sm w-full border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-center">
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-2 text-red-600">[KONFIRMASI HAPUS DATA ROLL]</h3>
            <p className="text-[11px] uppercase mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data gulungan kain <span className="font-extrabold text-[#141414] bg-[#F1F0ED] px-1">{rollToDelete.id}</span> ({rollToDelete.jenis} - {rollToDelete.warna}) dari inventaris?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRollToDelete(null)}
                className="w-full bg-[#F1F0ED] border border-[#141414] hover:bg-white text-[#141414] py-2 px-3 font-bold text-xs uppercase rounded-none cursor-pointer transition-colors"
              >
                BATAL
              </button>
              <button
                onClick={() => {
                  onDeleteRoll(rollToDelete.id);
                  setRollToDelete(null);
                }}
                className="w-full bg-red-600 border border-red-600 hover:bg-white hover:text-red-600 text-white py-2 px-3 font-bold text-xs uppercase rounded-none cursor-pointer transition-colors"
              >
                YA, HAPUS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
