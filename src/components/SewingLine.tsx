import React, { useState } from 'react';
import { Shirt, UserPlus, DollarSign, ListTodo, CheckCircle2, FileText, Plus, Trash2, Printer, X, Loader2, RefreshCw } from 'lucide-react';
import { Order, Tailor, SewingAssignment } from '../types';

interface SewingLineProps {
  orders: Order[];
  tailors: Tailor[];
  sewing: SewingAssignment[];
  onAddTailor: (tailor: Tailor) => void;
  onAddSewingAssignment: (assignment: SewingAssignment) => void;
  onUpdateSewingProgress: (assignmentId: string, delta: number) => void;
  onDeleteAssignment: (id: string) => void;
}

export default function SewingLine({
  orders,
  tailors,
  sewing,
  onAddTailor,
  onAddSewingAssignment,
  onUpdateSewingProgress,
  onDeleteAssignment
}: SewingLineProps) {
  const activeOrders = orders.filter(o => o.status === 'Jahit');

  // Input states for Tailor
  const [showTailorForm, setShowTailorForm] = useState(false);
  const [tailorNama, setTailorNama] = useState('');
  const [tailorSpec, setTailorSpec] = useState('Full Assembly');

  // Input states for Sewing Assignment
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedTailorId, setSelectedTailorId] = useState('');
  const [bagian, setBagian] = useState<'Kerah' | 'Lengan' | 'Badan' | 'Full'>('Full');
  const [ratePerPcs, setRatePerPcs] = useState(8000); // default Rp 8.000 per pcs
  const [qtyTarget, setQtyTarget] = useState(100);

  // Custom Delete Confirmation State
  const [assignmentToDelete, setAssignmentToDelete] = useState<SewingAssignment | null>(null);

  // Custom Payroll Print State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isPrintingPayroll, setIsPrintingPayroll] = useState(false);
  const [printPayrollSuccess, setPrintPayrollSuccess] = useState(false);

  // Simulation for sound and progress bar
  const startPrintPayrollSimulation = () => {
    setIsPrintingPayroll(true);
    setPrintPayrollSuccess(false);
    
    // Play thermal sound simulation
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let now = ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220 + i * 20, now);
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        now += 0.12;
      }
    } catch (e) {}

    setTimeout(() => {
      setIsPrintingPayroll(false);
      setPrintPayrollSuccess(true);
    }, 2000);
  };

  const triggerPayrollPrint = (payrollsList: any[], ordersList: Order[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup Blocker Terdeteksi! Silakan izinkan popup/tab baru pada browser Anda untuk mencetak.');
      return;
    }

    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const totalAllWages = payrollsList.reduce((sum, p) => sum + p.totalWages, 0);
    const totalAllPcs = payrollsList.reduce((sum, p) => sum + p.totalPcsCompleted, 0);

    let htmlContent = `
      <html>
        <head>
          <title>REKAP_BORONGAN_PENJAHIT_${new Date().toISOString().split('T')[0]}</title>
          <style>
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 40px;
              color: #141414;
              background-color: #ffffff;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #141414;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin: 0 0 5px 0;
              letter-spacing: 1px;
            }
            .subtitle {
              font-size: 11px;
              text-transform: uppercase;
              color: #555;
              margin: 0;
            }
            .meta-info {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 20px;
            }
            .tailor-block {
              border: 1px solid #141414;
              padding: 15px;
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .tailor-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px dashed #141414;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .tailor-name {
              font-size: 14px;
              font-weight: bold;
            }
            .tailor-id {
              font-size: 11px;
              color: #555;
            }
            .assignment-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin-bottom: 10px;
            }
            .assignment-table th {
              border-bottom: 1px solid #141414;
              text-align: left;
              padding: 4px;
              font-weight: bold;
            }
            .assignment-table td {
              padding: 6px 4px;
              border-bottom: 1px dotted #ccc;
            }
            .tailor-total {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              font-size: 12px;
              border-top: 1px dashed #141414;
              padding-top: 8px;
              margin-top: 10px;
            }
            .summary-box {
              background-color: #f9f9f9;
              border: 2px solid #141414;
              padding: 15px;
              margin-top: 40px;
              font-size: 13px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .summary-row.total {
              border-top: 2px dashed #141414;
              padding-top: 8px;
              margin-top: 8px;
              font-weight: bold;
              font-size: 15px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              font-size: 11px;
              text-align: center;
            }
            .signature-box {
              width: 200px;
            }
            .signature-line {
              border-bottom: 1px solid #141414;
              margin-top: 50px;
              margin-bottom: 5px;
            }
            .print-btn-container {
              text-align: center;
              margin-bottom: 20px;
            }
            .print-btn {
              background-color: #141414;
              color: #ffffff;
              border: none;
              padding: 10px 20px;
              font-family: inherit;
              font-weight: bold;
              cursor: pointer;
              text-transform: uppercase;
            }
            @media print {
              .print-btn-container {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-btn-container">
            <button class="print-btn" onclick="window.print()">CETAK SEKARANG</button>
          </div>

          <div class="header">
            <div class="title">KONVEKSI MATRIX SYSTEM</div>
            <div class="subtitle">SLIP REKAP GAJI BORONGAN PENJAHIT (PIECE-RATE PAYROLL)</div>
          </div>

          <div class="meta-info">
            <div>TANGGAL CETAK: ${currentDate}</div>
            <div>STATUS LAPORAN: FINAL</div>
          </div>
    `;

    payrollsList.forEach(p => {
      htmlContent += `
        <div class="tailor-block">
          <div class="tailor-header">
            <div class="tailor-name">${p.tailor.nama} <span style="font-weight: normal; font-size: 11px;">(${p.tailor.spesialisasi})</span></div>
            <div class="tailor-id">${p.tailor.id}</div>
          </div>

          <table class="assignment-table">
            <thead>
              <tr>
                <th>SPK NO</th>
                <th>CLIENT</th>
                <th>BAGIAN</th>
                <th>TARGET</th>
                <th>SELESAI</th>
                <th>TARIF/PCS</th>
                <th style="text-align: right;">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
      `;

      if (p.assignments.length === 0) {
        htmlContent += `
          <tr>
            <td colspan="7" style="text-align: center; color: #888; padding: 10px;">TIDAK ADA TUGAS JAHIT AKTIF</td>
          </tr>
        `;
      } else {
        p.assignments.forEach((a: any) => {
          const ord = ordersList.find(o => o.id === a.orderId);
          const clientName = ord ? ord.klien : '-';
          const spkNo = ord ? ord.spkNo : '-';
          htmlContent += `
            <tr>
              <td>${spkNo}</td>
              <td>${clientName}</td>
              <td>${a.bagian.toUpperCase()}</td>
              <td>${a.qtyTarget} PCS</td>
              <td>${a.qtyCompleted} PCS</td>
              <td>Rp ${a.ratePerPcs.toLocaleString('id-ID')}</td>
              <td style="text-align: right; font-weight: bold;">Rp ${(a.qtyCompleted * a.ratePerPcs).toLocaleString('id-ID')}</td>
            </tr>
          `;
        });
      }

      htmlContent += `
            </tbody>
          </table>

          <div class="tailor-total">
            <div>TOTAL SELESAI: ${p.totalPcsCompleted} PCS</div>
            <div>GAJI BERHAK: Rp ${p.totalWages.toLocaleString('id-ID')}</div>
          </div>
        </div>
      `;
    });

    htmlContent += `
      <div class="summary-box">
        <div class="summary-row">
          <span>TOTAL TENAGA PENJAHIT AKTIF</span>
          <span>${payrollsList.length} ORANG</span>
        </div>
        <div class="summary-row">
          <span>TOTAL PCS TUNTAS DIJAHIT</span>
          <span>${totalAllPcs} PCS</span>
        </div>
        <div class="summary-row total">
          <span>TOTAL AKUMULASI GAJI BORONGAN</span>
          <span>Rp ${totalAllWages.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div>Dibuat Oleh,</div>
          <div class="signature-line"></div>
          <div>Kepala Produksi</div>
        </div>
        <div class="signature-box">
          <div>Disetujui Oleh,</div>
          <div class="signature-line"></div>
          <div>Owner / Manajemen</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          // Auto trigger print after resource load
          setTimeout(function() {
            window.print();
          }, 500);
        }
      </script>
    </body>
  </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Add Tailor
  const handleCreateTailor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tailorNama.trim()) return;

    onAddTailor({
      id: `TLR-${String(tailors.length + 1).padStart(3, '0')}`,
      nama: tailorNama,
      spesialisasi: tailorSpec,
      status: 'Aktif'
    });

    setTailorNama('');
    setShowTailorForm(false);
    alert('Penjahit baru terdaftar!');
  };

  // Add Assignment
  const handleAssignSewing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedTailorId) {
      alert('Pilihlah SPK dan Penjahit terlebih dahulu!');
      return;
    }

    onAddSewingAssignment({
      id: `SEW-${Date.now()}`,
      orderId: selectedOrderId,
      tailorId: selectedTailorId,
      bagian,
      qtyTarget,
      qtyCompleted: 0,
      ratePerPcs,
      sewingDate: new Date().toISOString().split('T')[0]
    });

    // Reset Form
    setSelectedOrderId('');
    setSelectedTailorId('');
    setQtyTarget(100);
    alert('Tugas jahit berhasil ditambahkan ke lini kerja!');
  };

  // Calculate Tailor Salary Breakdown
  const payrolls = tailors.map(t => {
    const assignments = sewing.filter(s => s.tailorId === t.id);
    const totalPcsCompleted = assignments.reduce((sum, a) => sum + a.qtyCompleted, 0);
    const totalWages = assignments.reduce((sum, a) => sum + (a.qtyCompleted * a.ratePerPcs), 0);

    return {
      tailor: t,
      assignments,
      totalPcsCompleted,
      totalWages
    };
  });

  return (
    <div className="space-y-6 font-mono">
      
      {/* Title */}
      <div className="border-b border-[#141414] pb-4">
        <h2 className="text-base font-mono font-extrabold text-[#141414] uppercase tracking-wider">[05. LINI PENJAHITAN & GAJI BORONGAN]</h2>
        <p className="text-[#141414]/60 font-mono text-[11px] uppercase">Penunjukan penjahit per bagian pakaian (kerah, lengan, badan) dan kalkulator otomatis akumulasi gaji borongan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Input Assignments */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-[#141414] pb-2">
            <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider flex items-center gap-2">
              <Shirt size={14} />
              [05.1 TUGASKAN PENJAHIT - SEWING ASSIGNMENT]
            </h3>
            <span className="text-[10px] font-mono font-extrabold border border-[#141414] bg-[#F1F0ED] text-[#141414] px-2.5 py-0.5 rounded-none uppercase">
              LINE_SEWING_ACTIVE
            </span>
          </div>

          <form onSubmit={handleAssignSewing} className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-[#141414]">
            
            {/* Choose SPK */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Pilih SPK Lini Jahit</label>
              <select
                required
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  const o = orders.find(ord => ord.id === e.target.value);
                  if (o) setQtyTarget(o.totalQty);
                }}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="">-- Pilih SPK --</option>
                {activeOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.spkNo} - {o.klien} ({o.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Choose Tailor */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Pilih Penjahit (Operator)</label>
              <select
                required
                value={selectedTailorId}
                onChange={(e) => setSelectedTailorId(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="">-- Pilih Penjahit --</option>
                {tailors.filter(t => t.status === 'Aktif').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nama} ({t.spesialisasi})
                  </option>
                ))}
              </select>
            </div>

            {/* Bagian jahit */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Bagian Kerja</label>
              <select
                value={bagian}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setBagian(val);
                  // adjust standard rates based on part
                  if (val === 'Kerah') setRatePerPcs(2500);
                  else if (val === 'Lengan') setRatePerPcs(2000);
                  else if (val === 'Badan') setRatePerPcs(4000);
                  else setRatePerPcs(8500);
                }}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="Full">Full Assembly (Seluruh Baju)</option>
                <option value="Kerah">Pasang Kerah / Leher (Rib)</option>
                <option value="Lengan">Pasang Lengan</option>
                <option value="Badan">Jahit Badan (Samping & Bawah)</option>
              </select>
            </div>

            {/* Rate Per Pcs (Borongan Rate) */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Harga Borongan Per Pcs (Rate / pcs)</label>
              <div className="flex">
                <span className="bg-[#F1F0ED] border-y border-l border-[#141414] text-[#141414] text-xs px-2.5 flex items-center font-bold">
                  RP
                </span>
                <input
                  type="number"
                  required
                  value={ratePerPcs}
                  onChange={(e) => setRatePerPcs(Number(e.target.value))}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
                />
              </div>
            </div>

            {/* Qty Target */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Target Jahit (Pcs)</label>
              <input
                type="number"
                required
                value={qtyTarget}
                onChange={(e) => setQtyTarget(Number(e.target.value))}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                className="w-full bg-[#141414] hover:bg-white hover:text-[#141414] text-white border border-[#141414] font-mono text-xs font-bold py-2.5 rounded-none uppercase transition-colors cursor-pointer"
              >
                Tugaskan Penjahit Sekarang [F6]
              </button>
            </div>

          </form>
        </div>

        {/* Right: Quick Register Tailor */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-4 font-mono text-xs text-[#141414]">
          <div className="flex justify-between items-center border-b border-[#141414] pb-2">
            <h3 className="font-mono font-extrabold text-xs flex items-center gap-1.5 uppercase">
              <UserPlus size={14} />
              [05.2 PENJAHIT BARU]
            </h3>
            <button
              onClick={() => setShowTailorForm(!showTailorForm)}
              className="text-[9px] border border-[#141414] bg-[#F1F0ED] px-2.5 py-1 rounded-none font-bold uppercase cursor-pointer hover:bg-white transition-colors"
            >
              {showTailorForm ? 'CLOSE' : 'REGISTER'}
            </button>
          </div>

          {showTailorForm ? (
            <form onSubmit={handleCreateTailor} className="space-y-3">
              <div>
                <label className="text-[9px] text-[#141414]/60 font-bold uppercase block mb-0.5">Nama Lengkap Penjahit</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bu Minah"
                  value={tailorNama}
                  onChange={(e) => setTailorNama(e.target.value)}
                  className="w-full text-xs border border-[#141414] rounded-none px-2.5 py-1.5 bg-white text-[#141414] outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-[#141414]/60 font-bold uppercase block mb-0.5">Spesialisasi Jahit</label>
                <select
                  value={tailorSpec}
                  onChange={(e) => setTailorSpec(e.target.value)}
                  className="w-full text-xs border border-[#141414] rounded-none px-2.5 py-1.5 bg-white text-[#141414] outline-none"
                >
                  <option value="Full Assembly">Full Assembly (Obras/Kelim)</option>
                  <option value="Kerah & Manset">Bagian Kerah & Manset</option>
                  <option value="Lengan & Kerung">Lengan & Kerung Lengan</option>
                  <option value="Bordir / Aplikasi">Aplikasi Kancing / Kantong</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#141414] hover:bg-white hover:text-[#141414] text-white border border-[#141414] text-[10px] font-bold py-2 rounded-none transition-colors cursor-pointer uppercase"
              >
                Simpan Penjahit
              </button>
            </form>
          ) : (
            <div className="divide-y divide-[#E4E3E0] max-h-48 overflow-y-auto">
              {tailors.map(t => (
                <div key={t.id} className="py-2 flex justify-between items-center font-mono">
                  <div>
                    <span className="font-bold text-[#141414] block text-xs">{t.nama}</span>
                    <span className="text-[9px] text-[#141414]/50 block uppercase">{t.spesialisasi}</span>
                  </div>
                  <span className="bg-[#F1F0ED] text-[#141414] text-[9px] font-bold px-2 py-0.5 border border-[#141414] uppercase">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Sewing Progress Active Tracker */}
      <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-[#141414] pb-2">
          <ListTodo size={14} />
          [05.3 PROGRES SEWING & LOGGING HARIAN MANDIRI]
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#141414]">
            <thead>
              <tr className="bg-[#F1F0ED] border-b border-[#141414] text-[#141414] font-mono uppercase font-bold text-[10px]">
                <th className="p-3">Klien & Model</th>
                <th className="p-3">Nama Penjahit</th>
                <th className="p-3">Bagian Kerja</th>
                <th className="p-3 text-right">Harga Borongan</th>
                <th className="p-3 text-center">Progress (Selesai / Target)</th>
                <th className="p-3 text-right">Akumulasi Gaji</th>
                <th className="p-3 text-center">Input Qty Harian</th>
                <th className="p-3 text-center">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3E0] font-mono">
              {sewing.map(assignment => {
                const ord = orders.find(o => o.id === assignment.orderId);
                const tlr = tailors.find(t => t.id === assignment.tailorId);
                const isFinished = assignment.qtyCompleted >= assignment.qtyTarget;

                return (
                  <tr key={assignment.id} className="hover:bg-[#F9F9F8] transition-colors">
                    <td className="p-3">
                      <span className="font-sans font-bold text-[#141414] block text-sm">{ord ? ord.klien : 'Klien'}</span>
                      <span className="text-[10px] text-[#141414]/50 block uppercase">{ord ? ord.model : 'Kaos'}</span>
                    </td>
                    <td className="p-3 font-bold text-[#141414]">{tlr ? tlr.nama : 'Penjahit'}</td>
                    <td className="p-3">
                      <span className="bg-[#F1F0ED] text-[#141414] px-2 py-0.5 border border-[#141414]/30 font-bold text-[9px] uppercase">
                        {assignment.bagian}
                      </span>
                    </td>
                    <td className="p-3 text-right text-[#141414]/80 font-bold">
                      Rp {assignment.ratePerPcs.toLocaleString('id-ID')} / pcs
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-center gap-1 w-44 mx-auto">
                        <div className="w-full bg-[#E4E3E0] h-3 border border-[#141414] rounded-none overflow-hidden">
                          <div 
                            className="bg-green-600 h-full transition-all"
                            style={{ width: `${Math.min(100, (assignment.qtyCompleted / assignment.qtyTarget) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[9px] font-bold text-[#141414]/80 uppercase">
                          {assignment.qtyCompleted} / {assignment.qtyTarget} PCS ({((assignment.qtyCompleted / assignment.qtyTarget) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-extrabold text-green-700">
                      Rp {(assignment.qtyCompleted * assignment.ratePerPcs).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          disabled={assignment.qtyCompleted <= 0}
                          onClick={() => onUpdateSewingProgress(assignment.id, -10)}
                          className="border border-[#141414] bg-[#F1F0ED] hover:bg-white text-[#141414] px-2 py-1 rounded-none font-bold text-[10px] disabled:opacity-30 cursor-pointer"
                        >
                          -10
                        </button>
                        <button
                          disabled={isFinished}
                          onClick={() => onUpdateSewingProgress(assignment.id, 10)}
                          className="border border-[#141414] bg-[#F1F0ED] hover:bg-white text-[#141414] px-2 py-1 rounded-none font-bold text-[10px] disabled:opacity-30 cursor-pointer"
                        >
                          +10
                        </button>
                        <button
                          disabled={isFinished}
                          onClick={() => onUpdateSewingProgress(assignment.id, assignment.qtyTarget - assignment.qtyCompleted)}
                          className="border border-[#141414] bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded-none text-[9px] font-mono font-bold disabled:opacity-30 cursor-pointer uppercase"
                        >
                          Lunas
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setAssignmentToDelete(assignment);
                        }}
                        className="text-[#141414]/50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sewing.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#141414]/50 uppercase font-bold">
                    [NO ACTIVE SEWING ASSIGNMENTS FOUND]
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Piece-Rate Payroll (Gaji Borongan) Monthly Breakdown */}
      <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#141414] pb-3">
          <div>
            <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={14} />
              [05.4 BUKU REKAP BORONGAN PENJAHIT - PIECE-RATE PAYROLL]
            </h3>
            <p className="text-[10px] text-[#141414]/60 uppercase">Akumulasi gaji yang berhak dibawa pulang oleh penjahit berdasarkan jatah pcs yang tuntas</p>
          </div>

          <button
            onClick={() => {
              setShowPrintModal(true);
              setPrintPayrollSuccess(false);
            }}
            className="flex items-center gap-2 border border-[#141414] bg-[#F1F0ED] hover:bg-white text-[#141414] px-4 py-2 rounded-none font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <Printer size={13} />
            PRINT REKAP BORONGAN
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {payrolls.map(({ tailor, totalPcsCompleted, totalWages }) => (
            <div key={tailor.id} className="bg-[#F1F0ED]/60 p-4 border border-[#141414] rounded-none">
              <span className="text-[9px] text-[#141414]/50 block font-bold">{tailor.id}</span>
              <span className="font-bold text-[#141414] block text-sm mt-0.5">{tailor.nama}</span>
              <span className="text-[9px] text-[#141414]/60 block mt-1 uppercase">Spesialisasi: {tailor.spesialisasi}</span>

              <div className="mt-4 pt-3 border-t border-[#141414]/30 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-[#141414]/50 block uppercase">Selesai</span>
                  <span className="font-bold text-[#141414] text-xs">{totalPcsCompleted} PCS</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-[#141414]/50 block uppercase">Borongan</span>
                  <span className="font-extrabold text-amber-700 text-xs">Rp {totalWages.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sewing Assignment Delete Confirmation Modal */}
      {assignmentToDelete && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-white text-[#141414] rounded-none p-6 max-w-sm w-full border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-center">
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-2 text-red-600">[KONFIRMASI HAPUS TUGAS JAHIT]</h3>
            <p className="text-[11px] uppercase mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus tugas jahit SPK <span className="font-extrabold text-[#141414] bg-[#F1F0ED] px-1">{assignmentToDelete.spkNo}</span> ({assignmentToDelete.bagian}) untuk penjahit?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAssignmentToDelete(null)}
                className="w-full bg-[#F1F0ED] border border-[#141414] hover:bg-white text-[#141414] py-2 px-3 font-bold text-xs uppercase rounded-none cursor-pointer transition-colors"
              >
                BATAL
              </button>
              <button
                onClick={() => {
                  onDeleteAssignment(assignmentToDelete.id);
                  setAssignmentToDelete(null);
                }}
                className="w-full bg-red-600 border border-red-600 hover:bg-white hover:text-red-600 text-white py-2 px-3 font-bold text-xs uppercase rounded-none cursor-pointer transition-colors"
              >
                YA, HAPUS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Rekap Borongan Preview Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono overflow-y-auto">
          <div className="bg-white text-[#141414] rounded-none p-5 max-w-2xl w-full border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-[#141414] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Printer size={16} />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">[PREVIEW STRIP REKAP GAJI BORONGAN]</h3>
              </div>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="text-[#141414] hover:bg-[#F1F0ED] p-1 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Receipt Preview */}
            <div className="flex-1 overflow-y-auto border border-[#141414] bg-[#F1F0ED]/30 p-4 mb-4 space-y-4 text-xs select-none">
              
              {/* Slip Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#141414]">
                <div className="font-extrabold text-sm uppercase tracking-wider">KONVEKSI MATRIX SYSTEM</div>
                <div className="text-[10px] text-[#141414]/70 uppercase">SLIP REKAP GAJI BORONGAN PENJAHIT</div>
                <div className="text-[9px] text-[#141414]/50 font-mono">TGL: {new Date().toLocaleDateString('id-ID')} · STATUS: FINAL</div>
              </div>

              {/* Loop and render payroll details */}
              <div className="space-y-4">
                {payrolls.map((p) => (
                  <div key={p.tailor.id} className="border border-[#141414] p-3 bg-white space-y-2">
                    <div className="flex justify-between items-center border-b border-dashed border-[#141414]/20 pb-1.5 font-bold">
                      <span className="uppercase text-[11px]">{p.tailor.nama} ({p.tailor.spesialisasi})</span>
                      <span className="font-mono text-[10px]">{p.tailor.id}</span>
                    </div>

                    <div className="space-y-1.5 text-[10px]">
                      {p.assignments.length === 0 ? (
                        <div className="text-[#141414]/40 uppercase py-1 text-center">[TIDAK ADA TUGAS JAHIT AKTIF]</div>
                      ) : (
                        p.assignments.map((a) => {
                          const ord = orders.find(o => o.id === a.orderId);
                          const client = ord ? ord.klien : '-';
                          const spkNo = ord ? ord.spkNo : '-';
                          return (
                            <div key={a.id} className="flex justify-between items-start font-mono text-[9px]">
                              <div>
                                <div className="font-bold text-[#141414]">{spkNo} ({client})</div>
                                <div className="text-[#141414]/60 uppercase">{a.bagian} · {a.qtyCompleted}/{a.qtyTarget} PCS</div>
                              </div>
                              <div className="text-right">
                                <div>Rp {a.ratePerPcs.toLocaleString('id-ID')}/PCS</div>
                                <div className="font-bold">Rp {(a.qtyCompleted * a.ratePerPcs).toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="border-t border-dashed border-[#141414]/30 pt-1.5 flex justify-between items-center font-bold text-[10px]">
                      <span>TOTAL PCS: {p.totalPcsCompleted} PCS</span>
                      <span className="text-amber-700">SUBTOTAL: Rp {p.totalWages.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary Slip Card */}
              <div className="border-2 border-dashed border-[#141414] p-3 bg-white space-y-1 text-xs">
                <div className="flex justify-between uppercase">
                  <span>TOTAL TENAGA PENJAHIT</span>
                  <span className="font-bold">{payrolls.length} ORANG</span>
                </div>
                <div className="flex justify-between uppercase">
                  <span>TOTAL JAHIT TUNTAS</span>
                  <span className="font-bold">{payrolls.reduce((sum, p) => sum + p.totalPcsCompleted, 0)} PCS</span>
                </div>
                <div className="flex justify-between border-t border-[#141414]/20 pt-1.5 font-bold uppercase text-sm text-[#141414]">
                  <span>TOTAL GAJI WAJIB BAYAR</span>
                  <span className="text-amber-800">Rp {payrolls.reduce((sum, p) => sum + p.totalWages, 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Paper slot decorative footer line */}
              <div className="w-full h-1 bg-[#141414] opacity-20 mt-4"></div>
            </div>

            {/* Printing simulation feedback */}
            {isPrintingPayroll && (
              <div className="mb-4 bg-[#F1F0ED] border border-[#141414]/30 p-2.5 text-center text-[10px] uppercase font-bold text-amber-700 animate-pulse flex items-center justify-center gap-2">
                <Loader2 size={12} className="animate-spin" />
                Mencetak Slip Rekap Gaji (Zzzt... Zzzt...)...
              </div>
            )}

            {printPayrollSuccess && (
              <div className="mb-4 bg-green-50 border border-green-600 p-2.5 text-center text-[10px] uppercase font-bold text-green-700">
                ✓ Slip Rekap Borongan selesai dicetak secara visual! Silakan periksa baki printer.
              </div>
            )}

            {/* Actions Footer */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShowPrintModal(false)}
                disabled={isPrintingPayroll}
                className="bg-[#F1F0ED] hover:bg-[#141414] hover:text-white border border-[#141414] text-[#141414] py-2 px-3 font-bold text-xs uppercase rounded-none cursor-pointer disabled:opacity-50 transition-colors"
              >
                TUTUP
              </button>
              <button
                onClick={startPrintPayrollSimulation}
                disabled={isPrintingPayroll}
                className="flex items-center justify-center gap-1.5 bg-[#141414] hover:bg-white hover:text-[#141414] border border-[#141414] text-white py-2 px-3 font-bold text-xs uppercase rounded-none cursor-pointer disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={12} className={isPrintingPayroll ? 'animate-spin' : ''} />
                SIMULASI SUARA
              </button>
              <button
                onClick={() => {
                  triggerPayrollPrint(payrolls, orders);
                }}
                disabled={isPrintingPayroll}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-white hover:text-emerald-700 border border-emerald-600 text-white py-2 px-3 font-bold text-xs uppercase rounded-none cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Printer size={12} />
                CETAK ASLI (PDF)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
