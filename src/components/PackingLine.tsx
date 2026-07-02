import React, { useState } from 'react';
import { Package, Printer, CheckSquare, Plus, Scale, Tag, Trash2, Box } from 'lucide-react';
import { Order, PackingJob, PackingBox, SizeMatrix, QCInspection } from '../types';

interface PackingLineProps {
  orders: Order[];
  packing: PackingJob[];
  qc: QCInspection[];
  onAddPackingBox: (orderId: string, box: PackingBox) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export default function PackingLine({ orders, packing, qc, onAddPackingBox, onUpdateOrderStatus }: PackingLineProps) {
  // Helper to calculate QC and Packing metrics per order
  const getOrderQCMetrics = (orderId: string) => {
    const orderInspections = qc.filter(q => q.orderId === orderId);
    const totalPassedQC = orderInspections.reduce((sum, q) => sum + q.qtyPassed, 0);
    
    const currentPackingJob = packing.find(p => p.orderId === orderId);
    const totalAlreadyPacked = currentPackingJob?.boxes.reduce((sum, b) => sum + b.qty, 0) || 0;
    
    return {
      totalPassedQC,
      totalAlreadyPacked,
      remainingUnpacked: Math.max(0, totalPassedQC - totalAlreadyPacked)
    };
  };

  // Orders are selectable if they are explicitly marked as Packing, or if they have at least some items that have passed QC
  const activePackingOrders = orders.filter(o => {
    const { totalPassedQC } = getOrderQCMetrics(o.id);
    return o.status === 'Packing' || o.status === 'QC' || (o.status === 'Jahit' && totalPassedQC > 0);
  });

  // Input states
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [boxQty, setBoxQty] = useState(50);
  const [boxKeterangan, setBoxKeterangan] = useState('Karung 2 - Ukuran Campur Lolos QC');
  const [printBox, setPrintBox] = useState<PackingBox | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  
  // Calculate average weight of garment based on category
  const getEstimatedUnitWeight = (modelName: string) => {
    const name = modelName.toLowerCase();
    if (name.includes('hoodie') || name.includes('jaket')) return 0.52; // 520 grams
    if (name.includes('kemeja') || name.includes('pdl')) return 0.28; // 280 grams
    return 0.185; // T-shirt: 185 grams
  };

  const handlePackBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) {
      alert('Pilih SPK yang siap di-pack!');
      return;
    }

    const { remainingUnpacked } = getOrderQCMetrics(selectedOrder.id);
    if (boxQty > remainingUnpacked && remainingUnpacked > 0) {
      const confirmExceed = window.confirm(`Peringatan: Jumlah pack (${boxQty} pcs) melebihi jumlah barang yang lolos QC belum ter-pack (${remainingUnpacked} pcs). Tetap lanjutkan?`);
      if (!confirmExceed) return;
    }

    // Get current packing job for this order, or check total boxes packed
    const currentPackingJob = packing.find(p => p.orderId === selectedOrder.id);
    const boxNumber = currentPackingJob ? currentPackingJob.boxes.length + 1 : 1;

    // Simulate standard breakdown inside this box (e.g., evenly distributing or copying the order matrix in miniature)
    const boxBreakdown: SizeMatrix = {};
    Object.entries(selectedOrder.matrix).forEach(([warna, sizes]) => {
      boxBreakdown[warna] = {};
      Object.entries(sizes).forEach(([ukuran, qty]) => {
        // distribute roughly matching the box ratio
        boxBreakdown[warna][ukuran] = Math.ceil((qty / selectedOrder.totalQty) * boxQty);
      });
    });

    const weight = Number((boxQty * getEstimatedUnitWeight(selectedOrder.model)).toFixed(1));

    const newBox: PackingBox = {
      id: `BOX-${Date.now()}`,
      boxNo: boxNumber,
      qty: boxQty,
      breakdown: boxBreakdown,
      beratKg: weight,
      keterangan: boxKeterangan
    };

    onAddPackingBox(selectedOrder.id, newBox);

    // If fully packed, offer to move status to 'Dikirim'
    const totalPackedSoFar = (currentPackingJob?.boxes.reduce((sum, b) => sum + b.qty, 0) || 0) + boxQty;
    if (totalPackedSoFar >= selectedOrder.totalQty) {
      onUpdateOrderStatus(selectedOrder.id, 'Dikirim');
      alert(`Semua barang SPK ${selectedOrder.spkNo} telah selesai dimasukkan ke karung packing! Status otomatis didorong ke Lini Pengiriman (Logistics).`);
    }

    // Reset Form
    setSelectedOrderId('');
    setBoxQty(50);
    setBoxKeterangan('Karung Baru - Ukuran Lolos QC');
    alert(`Berhasil membuat Karung #${boxNumber} berisi ${boxQty} pcs!`);
  };

  return (
    <div className="space-y-6 font-mono">
      
      {/* Title */}
      <div className="border-b border-[#141414] pb-4">
        <h2 className="text-base font-mono font-extrabold text-[#141414] uppercase tracking-wider">[07. LINI FINISHING, GOSOK UAP & PACKING]</h2>
        <p className="text-[#141414]/60 font-mono text-[11px] uppercase">Pembersihan sisa benang (stripping), gosok uap (steam), pelipatan, pelabelan karung otomatis, dan kalkulator berat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Interactive Sack packing */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="flex justify-between items-center border-b border-[#141414] pb-2">
            <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider flex items-center gap-2">
              <Package size={14} />
              [07.1 BUNGKUS KARUNG BARU - AUTOMATIC SACKING]
            </h3>
            <span className="text-[10px] font-mono font-extrabold border border-[#141414] bg-[#F1F0ED] text-[#141414] px-2 py-0.5 rounded-none uppercase">
              LINE_PACKING_ACTIVE
            </span>
          </div>

          <form onSubmit={handlePackBox} className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-[#141414]">
            
            {/* SPK Selector */}
            <div className="col-span-1 md:col-span-2">
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Pilih SPK yang Sudah Lolos QC</label>
              <select
                required
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  const o = orders.find(ord => ord.id === e.target.value);
                  if (o) {
                    const { remainingUnpacked } = getOrderQCMetrics(o.id);
                    setBoxQty(remainingUnpacked > 0 ? remainingUnpacked : o.totalQty);
                  }
                }}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="">-- Pilih SPK --</option>
                {activePackingOrders.map(o => {
                  const { totalPassedQC, totalAlreadyPacked } = getOrderQCMetrics(o.id);
                  return (
                    <option key={o.id} value={o.id}>
                      {o.spkNo} - {o.klien} ({o.model} | Lolos QC: {totalPassedQC} pcs | Ter-pack: {totalAlreadyPacked}/{o.totalQty} pcs)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sacking Quantity */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Jumlah Pcs dalam Karung</label>
              <input
                type="number"
                required
                value={boxQty}
                onChange={(e) => setBoxQty(Number(e.target.value))}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
              {selectedOrder && (
                <span className="text-[9px] text-[#141414]/50 mt-1 block uppercase">Total Target SPK: {selectedOrder.totalQty} pcs</span>
              )}
            </div>

            {/* Sacking Details */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Identitas / Keterangan Karung</label>
              <input
                type="text"
                required
                placeholder="Contoh: Karung #1"
                value={boxKeterangan}
                onChange={(e) => setBoxKeterangan(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
            </div>

            {/* QC Linkage Status Info */}
            {selectedOrder && (() => {
              const { totalPassedQC, totalAlreadyPacked, remainingUnpacked } = getOrderQCMetrics(selectedOrder.id);
              return (
                <div className="col-span-1 md:col-span-2 border border-[#141414] p-3 bg-blue-50/50 space-y-1.5 font-mono text-[10px]">
                  <span className="font-bold text-[9px] text-[#141414]/70 block uppercase tracking-wider flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    🔗 KONEKSI HASIL QC - REAL-TIME STATUS
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-white p-2 border border-[#141414]/15">
                    <div>
                      <span className="text-[9px] text-[#141414]/50 block">TOTAL LOLOS QC</span>
                      <span className="font-bold text-green-700">{totalPassedQC} PCS</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#141414]/50 block">SUDAH TER-PACK</span>
                      <span className="font-bold text-blue-700">{totalAlreadyPacked} PCS</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#141414]/50 block">BELUM TER-PACK</span>
                      <span className={`font-extrabold ${remainingUnpacked > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                        {remainingUnpacked} PCS
                      </span>
                    </div>
                  </div>
                  {boxQty > remainingUnpacked && remainingUnpacked > 0 && (
                    <div className="text-[9px] text-amber-700 font-extrabold uppercase bg-amber-50 p-1.5 border border-amber-300">
                      ⚠️ PERINGATAN: Jumlah pack ({boxQty} pcs) melebihi barang yang tersisa lolos QC ({remainingUnpacked} pcs)!
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Dynamic Sacking Estimators */}
            {selectedOrder && (
              <div className="col-span-1 md:col-span-2 bg-[#F1F0ED] border border-[#141414] p-4 rounded-none flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] text-[#141414]/50 block font-bold uppercase">Estimasi Berat Otomatis Karung:</span>
                  <span className="font-mono font-bold text-[#141414] text-sm">
                    {(boxQty * getEstimatedUnitWeight(selectedOrder.model)).toFixed(1)} KG
                  </span>
                  <span className="text-[9px] text-[#141414]/50 block uppercase mt-0.5">FORMULA: {boxQty} PCS X {getEstimatedUnitWeight(selectedOrder.model) * 1000} GRAM</span>
                </div>

                <div className="bg-white px-3 py-1.5 border border-[#141414] font-bold text-[#141414] flex items-center gap-1.5 text-[10px]">
                  <Scale size={13} />
                  WEIGHT_RATE: {getEstimatedUnitWeight(selectedOrder.model) * 1000}G
                </div>
              </div>
            )}

            <button
              type="submit"
              className="col-span-1 md:col-span-2 bg-[#141414] hover:bg-white hover:text-[#141414] text-white border border-[#141414] font-mono text-xs font-bold py-2.5 rounded-none uppercase transition-colors cursor-pointer"
            >
              SAVE & PRINT SACK LABEL [F7]
            </button>

          </form>
        </div>

        {/* Packing workflow checklist */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-4 font-mono text-xs text-[#141414]">
          <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#141414] pb-2">
            <CheckSquare size={14} />
            [07.2 FINISHING SOP CHECKLIST]
          </h3>
          <p className="text-[10px] text-[#141414]/60 uppercase leading-relaxed">Selesaikan checklist standarisasi mutu sebelum pakaian dikirim ke klien:</p>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2.5 bg-[#F1F0ED] p-2.5 border border-[#141414]/20 rounded-none cursor-pointer hover:bg-white transition-colors">
              <input type="checkbox" defaultChecked className="mt-1 accent-[#141414]" />
              <div>
                <span className="font-bold block text-xs uppercase">1. Stripping Benang</span>
                <span className="text-[9px] text-[#141414]/60 block uppercase">Memotong sisa-sisa benang jahit yang menjuntai.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 bg-[#F1F0ED] p-2.5 border border-[#141414]/20 rounded-none cursor-pointer hover:bg-white transition-colors">
              <input type="checkbox" defaultChecked className="mt-1 accent-[#141414]" />
              <div>
                <span className="font-bold block text-xs uppercase">2. Gosok Uap (Iron Steam)</span>
                <span className="text-[9px] text-[#141414]/60 block uppercase">Menyetrika uap agar serat kain rapi dan licin.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 bg-[#F1F0ED] p-2.5 border border-[#141414]/20 rounded-none cursor-pointer hover:bg-white transition-colors">
              <input type="checkbox" className="mt-1 accent-[#141414]" />
              <div>
                <span className="font-bold block text-xs uppercase">3. Pelipatan & Plastik OPP</span>
                <span className="text-[9px] text-[#141414]/60 block uppercase">Melipat baju presisi lalu dibungkus plastik OPP satu-satu.</span>
              </div>
            </label>
          </div>
        </div>

      </div>

      {/* Active boxes packing board / history */}
      <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider mb-4 border-b border-[#141414] pb-2">
          [07.3 DAFTAR KARUNG & SACKS SIAP JALAN - ACTIVE STORAGE]
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packing.map(job => (
            <div key={job.id} className="bg-white p-4 border border-[#141414] rounded-none flex flex-col justify-between font-mono">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[9px] font-bold text-blue-700">{job.spkNo}</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-600 uppercase">
                    PACKED
                  </span>
                </div>
                <h4 className="font-sans font-bold text-[#141414] text-sm leading-tight block">{job.klien}</h4>
                <span className="text-xs text-[#141414]/60 block mt-0.5 uppercase">{job.model}</span>

                <div className="mt-4 space-y-2">
                  {job.boxes.map(b => (
                    <div key={b.id} className="bg-[#F1F0ED]/50 p-2.5 border border-[#141414]/20 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="font-bold text-[#141414]">Karung #{b.boxNo}</span>
                        <span className="text-[9px] text-[#141414]/60 block uppercase">{b.keterangan}</span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="font-bold text-[#141414] block">{b.qty} PCS</span>
                          <span className="text-[9px] text-amber-700 block font-bold">{b.beratKg} KG</span>
                        </div>
                        <button
                          onClick={() => {
                            const orderObj = orders.find(o => o.id === job.orderId);
                            setPrintBox(b);
                            setPrintOrder(orderObj || null);
                          }}
                          className="text-[#141414] hover:bg-white border border-[#141414] p-1 cursor-pointer bg-white transition-colors"
                          title="Klik untuk cetak label karung pengiriman"
                        >
                          <Printer size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {packing.length === 0 && (
            <div className="col-span-3 text-center py-8 text-[#141414]/50 font-mono text-xs uppercase">[NO KARUNG SACKS BUILT TODAY]</div>
          )}
        </div>
      </div>

      {/* Sacking printable label preview modal */}
      {printBox && printOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-[#141414] rounded-none p-6 max-w-md w-full border-4 border-double border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] font-mono">
            <div className="flex justify-between items-center border-b-2 border-dashed border-[#141414] pb-3 mb-4">
              <div>
                <span className="font-mono text-[9px] font-bold text-[#141414]/50 uppercase">SMK PACKING LABEL</span>
                <h3 className="font-extrabold text-base text-[#141414] uppercase tracking-wider">[LABEL KARUNG PENGIRIMAN]</h3>
              </div>
              <button
                onClick={() => {
                  setPrintBox(null);
                  setPrintOrder(null);
                }}
                className="text-[#141414] hover:underline font-mono font-bold text-xs uppercase cursor-pointer"
              >
                TUTUP
              </button>
            </div>

            {/* Printable Label Layout */}
            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4 bg-[#F1F0ED] p-3 border border-[#141414]">
                <div>
                  <span className="text-[9px] text-[#141414]/50 block uppercase">No SPK</span>
                  <span className="font-extrabold text-[#141414]">{printOrder.spkNo}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#141414]/50 block uppercase">SACK NUMBER</span>
                  <span className="font-extrabold text-[#141414]">#{printBox.boxNo}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-[#141414]/50 block uppercase font-bold">KLIEN TUJUAN</span>
                <span className="font-sans font-bold text-[#141414] text-sm">{printOrder.klien}</span>
              </div>

              <div>
                <span className="text-[9px] text-[#141414]/50 block uppercase font-bold">NAMA MODEL BARANG</span>
                <span className="font-extrabold text-[#141414] uppercase">{printOrder.model}</span>
              </div>

              <div className="border-t border-b border-dashed border-[#141414] py-3 my-2">
                <span className="text-[9px] text-[#141414]/50 block uppercase mb-1 font-bold">Rincian Ukuran di Karung Ini</span>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="bg-[#F1F0ED] p-1.5 border border-[#141414]/20">
                    <span className="text-[9px] text-[#141414]/50 block">S</span>
                    <span className="font-extrabold text-[#141414]">MIX</span>
                  </div>
                  <div className="bg-[#F1F0ED] p-1.5 border border-[#141414]/20">
                    <span className="text-[9px] text-[#141414]/50 block">M</span>
                    <span className="font-extrabold text-[#141414]">MIX</span>
                  </div>
                  <div className="bg-[#F1F0ED] p-1.5 border border-[#141414]/20">
                    <span className="text-[9px] text-[#141414]/50 block">L</span>
                    <span className="font-extrabold text-[#141414]">MIX</span>
                  </div>
                  <div className="bg-[#F1F0ED] p-1.5 border border-[#141414]/20">
                    <span className="text-[9px] text-[#141414]/50 block">XL</span>
                    <span className="font-extrabold text-[#141414]">MIX</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#141414] text-white p-3">
                <div>
                  <span className="text-[9px] text-white/50 block uppercase font-bold">JUMLAH TOTAL</span>
                  <span className="font-extrabold block text-sm">{printBox.qty} PCS</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-white/50 block uppercase font-bold">TOTAL BERAT SACK</span>
                  <span className="font-extrabold block text-sm text-amber-400">{printBox.beratKg} KG</span>
                </div>
              </div>

              <p className="text-[10px] text-[#141414]/60 italic text-center pt-2">
                &ldquo;Kemasan lolos standarisasi QC Konveksi.&rdquo;
              </p>
            </div>

            <button
              onClick={() => {
                alert('Mencetak label karung...');
                setPrintBox(null);
                setPrintOrder(null);
              }}
              className="w-full bg-[#141414] hover:bg-[#F1F0ED] hover:text-[#141414] text-white border border-[#141414] font-mono text-xs font-bold py-3 mt-6 transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase"
            >
              <Printer size={14} />
              PRINT CARGO SACK LABEL
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
