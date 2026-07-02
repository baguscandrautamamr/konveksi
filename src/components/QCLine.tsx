import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCcw, Trash2, HelpCircle, Ban, Hammer } from 'lucide-react';
import { Order, Tailor, QCInspection, SewingAssignment } from '../types';

interface QCLineProps {
  orders: Order[];
  tailors: Tailor[];
  sewing: SewingAssignment[];
  qc: QCInspection[];
  onAddQCInspection: (inspection: QCInspection) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onDeleteQCLog: (id: string) => void;
}

export default function QCLine({
  orders,
  tailors,
  sewing,
  qc,
  onAddQCInspection,
  onUpdateOrderStatus,
  onDeleteQCLog
}: QCLineProps) {
  const activeOrdersForQC = orders.filter(o => o.status === 'Jahit' || o.status === 'QC');

  // Input states
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedTailorId, setSelectedTailorId] = useState('');
  const [bagianDefect, setBagianDefect] = useState('Jahitan Samping');
  const [qtyDicek, setQtyDicek] = useState(10);
  const [qtyLolos, setQtyLolos] = useState(10);
  const [qtyPerbaikan, setQtyPerbaikan] = useState(0);
  const [qtyGagal, setQtyGagal] = useState(0);
  const [catatanRework, setCatatanRework] = useState('');

  // Custom Delete Confirmation State
  const [qcLogToDelete, setQcLogToDelete] = useState<QCInspection | null>(null);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Calculate Cumulative Reject % for a selected order
  const getOrderRejectStats = (orderId: string) => {
    const orderInspections = qc.filter(q => q.orderId === orderId);
    const totalChecked = orderInspections.reduce((sum, q) => sum + q.totalChecked, 0);
    const totalRejected = orderInspections.reduce((sum, q) => sum + q.qtyReject, 0);
    const totalPassed = orderInspections.reduce((sum, q) => sum + q.qtyPassed, 0);

    const rejectRate = totalChecked > 0 ? (totalRejected / totalChecked) * 100 : 0;
    return {
      totalChecked,
      totalRejected,
      totalPassed,
      rejectRate
    };
  };

  const handleCreateQCReport = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrderId) {
      alert('Pilih SPK yang sedang diperiksa!');
      return;
    }

    if (qtyDicek !== (qtyLolos + qtyPerbaikan + qtyGagal)) {
      alert(`Gagal! Penjumlahan hasil (Lolos: ${qtyLolos} + Rework: ${qtyPerbaikan} + Reject: ${qtyGagal}) harus tepat bernilai sama dengan Jumlah Dicek (${qtyDicek})!`);
      return;
    }

    // Determine primary decision status
    let decisionStatus: 'PASSED' | 'REWORK' | 'REJECT' = 'PASSED';
    if (qtyPerbaikan > 0) decisionStatus = 'REWORK';
    else if (qtyGagal > 0 && qtyLolos === 0) decisionStatus = 'REJECT';

    const newQCReport: QCInspection = {
      id: `QC-${Date.now()}`,
      orderId: selectedOrderId,
      spkNo: selectedOrder?.spkNo || '',
      model: selectedOrder?.model || '',
      tailorIdAssigned: selectedTailorId || 'TLR-004', // default to General
      bagian: bagianDefect,
      totalChecked: qtyDicek,
      qtyPassed: qtyLolos,
      qtyRework: qtyPerbaikan,
      qtyReject: qtyGagal,
      reworkNotes: catatanRework,
      inspectedAt: new Date().toISOString(),
      status: decisionStatus
    };

    onAddQCInspection(newQCReport);

    // If lots of items passed, let's offer to move the SPK status to Packing!
    const stats = getOrderRejectStats(selectedOrderId);
    const updatedPassed = stats.totalPassed + qtyLolos;
    if (selectedOrder && updatedPassed >= selectedOrder.totalQty * 0.8) {
      // automatically promote to packing if 80% is inspected & passed
      onUpdateOrderStatus(selectedOrderId, 'Packing');
      alert(`Selamat! 80%+ baju SPK ${selectedOrder.spkNo} telah sukses melewati QC dan status didorong ke Lini Packing (Finishing).`);
    }

    // Reset Form
    setSelectedOrderId('');
    setSelectedTailorId('');
    setQtyDicek(10);
    setQtyLolos(10);
    setQtyPerbaikan(0);
    setQtyGagal(0);
    setCatatanRework('');
    alert('Inspeksi QC Berhasil disimpan!');
  };

  const selectedOrderStats = selectedOrderId ? getOrderRejectStats(selectedOrderId) : null;
  const activeReworkTickets = qc.filter(q => q.qtyRework > 0);

  return (
    <div className="space-y-6 font-mono">
      
      {/* Title */}
      <div className="border-b border-[#141414] pb-4">
        <h2 className="text-base font-mono font-extrabold text-[#141414] uppercase tracking-wider">[06. LINI QUALITY CONTROL (QC & REWORK)]</h2>
        <p className="text-[#141414]/60 font-mono text-[11px] uppercase">Pemeriksaan kualitas akhir produk dengan sistem jahit borongan kembali (rework) ke penjahit terkait</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* QC Action Card */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} />
              [06.1 SISTEM LOGIKA INSPEKSI 3-ARAH - THREE-WAY LOGIC]
            </h3>
            <span className="text-[10px] font-mono font-extrabold border border-[#141414] bg-[#F1F0ED] text-[#141414] px-2 py-0.5 rounded-none uppercase">
              PASSED • REWORK • REJECT
            </span>
          </div>

          <form onSubmit={handleCreateQCReport} className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-[#141414]">
            
            {/* Choose SPK */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Pilih SPK untuk Di-QC</label>
              <select
                required
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="">-- Pilih SPK Aktif --</option>
                {activeOrdersForQC.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.spkNo} - {o.klien} ({o.model} | {o.totalQty} pcs)
                  </option>
                ))}
              </select>
            </div>

            {/* Trace back to Tailor */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">
                Lacak Penjahit Bagian Ini
              </label>
              <select
                required
                value={selectedTailorId}
                onChange={(e) => setSelectedTailorId(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="">-- Pilih Penjahit Terkait --</option>
                {tailors.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nama} ({t.spesialisasi})
                  </option>
                ))}
              </select>
            </div>

            {/* Bagian inspected */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Sisi / Bagian yang Diperiksa</label>
              <input
                type="text"
                required
                placeholder="Misal: Sambungan Obras Leher"
                value={bagianDefect}
                onChange={(e) => setBagianDefect(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
            </div>

            {/* Total checked */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Jumlah Dicek (Pcs)</label>
              <input
                type="number"
                required
                value={qtyDicek || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQtyDicek(val);
                  setQtyLolos(val); // default assume all pass
                  setQtyPerbaikan(0);
                  setQtyGagal(0);
                }}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
            </div>

            {/* Three Logic inputs side by side */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-3 bg-[#F1F0ED] p-4 border border-[#141414] rounded-none">
              
              <div>
                <label className="text-[9px] text-[#141414]/70 font-bold block mb-1 uppercase">1. Lolos (PASSED)</label>
                <input
                  type="number"
                  required
                  value={qtyLolos}
                  onChange={(e) => {
                    const l = Number(e.target.value);
                    setQtyLolos(l);
                    setQtyPerbaikan(Math.max(0, qtyDicek - l - qtyGagal));
                  }}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-green-700 font-extrabold"
                />
              </div>

              <div>
                <label className="text-[9px] text-[#141414]/70 font-bold block mb-1 uppercase">2. Revisi (REWORK)</label>
                <input
                  type="number"
                  required
                  value={qtyPerbaikan}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setQtyPerbaikan(r);
                    setQtyLolos(Math.max(0, qtyDicek - r - qtyGagal));
                  }}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-amber-700 font-extrabold"
                />
              </div>

              <div>
                <label className="text-[9px] text-[#141414]/70 font-bold block mb-1 uppercase">3. Gagal (REJECT)</label>
                <input
                  type="number"
                  required
                  value={qtyGagal}
                  onChange={(e) => {
                    const g = Number(e.target.value);
                    setQtyGagal(g);
                    setQtyLolos(Math.max(0, qtyDicek - g - qtyPerbaikan));
                  }}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-rose-700 font-extrabold"
                />
              </div>

            </div>

            {/* Rework notes (if REWORK > 0) */}
            {qtyPerbaikan > 0 && (
              <div className="col-span-1 md:col-span-2 animate-fade-in">
                <label className="text-[10px] text-amber-700 font-bold block mb-1">CATATAN DEFECT REWORK</label>
                <input
                  type="text"
                  required
                  placeholder="Sebutkan cacatnya, contoh: Kerah melintir, obras lengan jebol..."
                  value={catatanRework}
                  onChange={(e) => setCatatanRework(e.target.value)}
                  className="w-full text-xs border border-amber-600 rounded-none px-3 py-1.5 bg-amber-50 text-amber-900 outline-none"
                />
              </div>
            )}

            {/* Cumulative warning alert inside the form */}
            {selectedOrder && selectedOrderStats && (
              <div className="col-span-1 md:col-span-2 bg-[#F1F0ED] p-3.5 border border-[#141414] rounded-none flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#141414]/50 block font-bold text-[9px] uppercase">Beban Reject Akumulatif SPK:</span>
                  <span className="font-bold text-[#141414]">
                    {selectedOrderStats.totalRejected} PCS DARI {selectedOrderStats.totalChecked} CHECKED ({selectedOrderStats.rejectRate.toFixed(1)}% Rejection)
                  </span>
                </div>

                {selectedOrderStats.rejectRate > 3.0 ? (
                  <span className="bg-rose-100 text-rose-700 font-bold px-2.5 py-1 border border-rose-600 flex items-center gap-1 animate-pulse shrink-0 uppercase text-[9px]">
                    <AlertTriangle size={11} />
                    Melebihi 3% Toleransi!
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-700 font-bold px-2.5 py-1 border border-green-600 text-[9px] uppercase shrink-0">
                    Aman (&lt; 3%)
                  </span>
                )}
              </div>
            )}

            <div className="col-span-1 md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                className="w-full bg-[#141414] hover:bg-white hover:text-[#141414] text-white border border-[#141414] font-mono text-xs font-bold py-2.5 rounded-none uppercase transition-colors cursor-pointer"
              >
                SUBMIT LAPORAN QC & UPDATE SPK STATUS
              </button>
            </div>

          </form>
        </div>

        {/* Rework tickets board */}
        <div className="space-y-4">
          <div className="bg-[#141414] text-white p-4 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <h3 className="font-mono font-extrabold text-xs mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <RefreshCcw size={14} />
              [06.2 REWORK TICKETS BOARD]
            </h3>
            <p className="text-[10px] font-mono text-white/60 uppercase">Daftar revisi jahit jaminan mutu yang sedang dikerjakan kembali oleh penjahit</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {activeReworkTickets.map(t => {
              const tailor = tailors.find(tlr => tlr.id === t.tailorIdAssigned);
              return (
                <div key={t.id} className="bg-white p-4 border border-[#141414] rounded-none flex flex-col justify-between hover:border-slate-800 transition-all font-mono">
                  <div className="flex justify-between items-start border-b border-[#141414]/10 pb-2 mb-2">
                    <div>
                      <span className="font-mono text-[9px] font-bold text-blue-700 block">{t.spkNo}</span>
                      <span className="font-sans font-bold text-[#141414] text-xs block">{t.model}</span>
                    </div>
                    <span className="bg-amber-50 text-amber-700 font-bold text-[9px] px-2 py-0.5 border border-amber-500 uppercase">
                      REWORK ({t.qtyRework} Pcs)
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-800 italic bg-amber-50/50 p-2 border border-amber-200 mb-3">
                    &ldquo;{t.reworkNotes || 'Cacat jahit'}&rdquo;
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-[#141414]/50">
                    <span>Penjahit: <b className="text-[#141414]">{tailor ? tailor.nama : 'Penjahit'}</b></span>
                    <button
                      onClick={() => alert('Tiket diselesaikan! Penjahit telah selesai memperbaiki bagian cacat ini.')}
                      className="bg-[#F1F0ED] hover:bg-white text-[#141414] font-bold px-2 py-1 border border-[#141414] transition-all flex items-center gap-1 text-[9px] uppercase cursor-pointer"
                    >
                      <Hammer size={10} />
                      Selesai Revisi
                    </button>
                  </div>
                </div>
              );
            })}
            {activeReworkTickets.length === 0 && (
              <div className="text-center py-8 text-[#141414]/50 font-mono text-xs uppercase">[ZERO DEFECTS TICKETS ACTIVE]</div>
            )}
          </div>
        </div>

      </div>

      {/* QC logs and history */}
      <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider mb-4 border-b border-[#141414] pb-2">
          [06.3 LOG INSPEKSI QUALITY CONTROL HARIAN]
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#141414]">
            <thead>
              <tr className="bg-[#F1F0ED] border-b border-[#141414] text-[#141414] font-mono uppercase font-bold text-[10px]">
                <th className="p-3">SPK No & Klien</th>
                <th className="p-3">Sisi Dicek</th>
                <th className="p-3">Penjahit Bertanggungjawab</th>
                <th className="p-3 text-right">Dicek</th>
                <th className="p-3 text-right text-green-700">Passed</th>
                <th className="p-3 text-right text-amber-700">Rework</th>
                <th className="p-3 text-right text-rose-700">Reject</th>
                <th className="p-3 text-center">Keputusan</th>
                <th className="p-3 text-center">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3E0] font-mono">
              {qc.map(log => {
                const tailor = tailors.find(t => t.id === log.tailorIdAssigned);
                return (
                  <tr key={log.id} className="hover:bg-[#F9F9F8] transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-blue-700 block">{log.spkNo}</span>
                      <span className="text-[10px] text-[#141414]/50 block uppercase">{log.model}</span>
                    </td>
                    <td className="p-3 font-bold text-[#141414]">{log.bagian}</td>
                    <td className="p-3 text-[#141414]/70">{tailor ? tailor.nama : 'Penjahit'}</td>
                    <td className="p-3 text-right font-bold text-[#141414]">{log.totalChecked} pcs</td>
                    <td className="p-3 text-right text-green-700 font-extrabold">{log.qtyPassed} pcs</td>
                    <td className="p-3 text-right text-amber-700 font-extrabold">{log.qtyRework} pcs</td>
                    <td className="p-3 text-right text-rose-700 font-extrabold">{log.qtyReject} pcs</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 border uppercase rounded-none ${
                        log.status === 'PASSED' ? 'bg-green-50 text-green-700 border-green-600' :
                        log.status === 'REWORK' ? 'bg-amber-50 text-amber-700 border-amber-600' : 'bg-rose-50 text-rose-700 border-rose-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setQcLogToDelete(log);
                        }}
                        className="text-[#141414]/50 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {qc.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#141414]/50 uppercase font-bold">
                    [NO QC INSPECTION LOGS FOUND TODAY]
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QC Log Delete Confirmation Modal */}
      {qcLogToDelete && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-white text-[#141414] rounded-none p-6 max-w-sm w-full border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-center">
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-2 text-red-600">[KONFIRMASI HAPUS LOG QC]</h3>
            <p className="text-[11px] uppercase mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data log inspeksi QC untuk SPK <span className="font-extrabold text-[#141414] bg-[#F1F0ED] px-1">{qcLogToDelete.spkNo}</span> bagian <span className="font-bold">{qcLogToDelete.bagian}</span>?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setQcLogToDelete(null)}
                className="w-full bg-[#F1F0ED] border border-[#141414] hover:bg-white text-[#141414] py-2 px-3 font-bold text-xs uppercase rounded-none cursor-pointer transition-colors"
              >
                BATAL
              </button>
              <button
                onClick={() => {
                  onDeleteQCLog(qcLogToDelete.id);
                  setQcLogToDelete(null);
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
