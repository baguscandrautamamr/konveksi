import React, { useState } from 'react';
import { Scissors, Scale, AlertCircle, Sparkles, Plus, CheckCircle, Database } from 'lucide-react';
import { Order, RollKain, CuttingJob } from '../types';
import { resolveColor } from './StokKain';

interface CuttingLineProps {
  orders: Order[];
  rolls: RollKain[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onAddRoll: (roll: RollKain) => void;
  onUpdateRoll: (roll: RollKain) => void;
}

export default function CuttingLine({ orders, rolls, onUpdateOrderStatus, onAddRoll, onUpdateRoll }: CuttingLineProps) {
  const potongQueue = orders.filter(o => o.status === 'Antrean' || o.status === 'Potong');

  // Input state for Cutting Job
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedRollId, setSelectedRollId] = useState('');
  const [panjangDipakai, setPanjangDipakai] = useState(0); // length of fabric rolls used
  const [qtyHasilPotong, setQtyHasilPotong] = useState(0); // actual pieces produced
  const [panjangSisaPerca, setPanjangSisaPerca] = useState(0); // scrap length
  const [operator, setOperator] = useState('Mas Agus');

  // Completed Cutting Jobs list state for visual history
  const [cuttingJobs, setCuttingJobs] = useState<CuttingJob[]>([]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const selectedRoll = rolls.find(r => r.id === selectedRollId);

  // Auto calculate theoretical yield as user types
  let theoreticalYield = 0;
  let yieldPercentage = 0;
  if (selectedOrder && panjangDipakai > 0) {
    theoreticalYield = Math.floor(panjangDipakai / selectedOrder.consumpPerPcs);
    if (theoreticalYield > 0 && qtyHasilPotong > 0) {
      yieldPercentage = (qtyHasilPotong / theoreticalYield) * 100;
    }
  }

  const handleExecuteCutting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedRoll) {
      alert('Silakan pilih SPK dan Roll Kain yang digunakan!');
      return;
    }

    if (panjangDipakai > selectedRoll.panjang) {
      alert(`Gagal! Panjang kain yang dipakai (${panjangDipakai}) melebihi panjang roll kain (${selectedRoll.panjang} ${selectedRoll.satuan})!`);
      return;
    }

    // 1. Reduce the length of the selected roll kain
    const sisaRollPanjang = selectedRoll.panjang - panjangDipakai;
    const isRollUsedUp = sisaRollPanjang <= 1; // if less than 1 yard, mark used up

    onUpdateRoll({
      ...selectedRoll,
      panjang: isRollUsedUp ? 0 : Number(sisaRollPanjang.toFixed(1)),
      status: isRollUsedUp ? 'Terpakai' : 'Tersedia',
      keterangan: `${selectedRoll.keterangan || ''} (Dipakai potong ${panjangDipakai} ${selectedRoll.satuan} SPK ${selectedOrder.spkNo})`
    });

    // 2. If user registers a significant remnant, create a new "Sisa Perca" roll kain
    let sisaSaved = false;
    if (panjangSisaPerca >= 2) {
      sisaSaved = true;
      const sisaId = `ROL-SISA-${Date.now().toString().slice(-4)}`;
      onAddRoll({
        id: sisaId,
        jenis: `${selectedRoll.jenis} (Sisa Perca)`,
        warna: selectedRoll.warna,
        lebar: selectedRoll.lebar,
        panjang: panjangSisaPerca,
        satuan: selectedRoll.satuan,
        qrCode: `KNV-SISA-${sisaId}`,
        status: 'Sisa Perca',
        keterangan: `Sisa kain dari pengerjaan SPK ${selectedOrder.spkNo}`
      });
      alert(`Sisa bahan sebesar ${panjangSisaPerca} ${selectedRoll.satuan} berhasil diselamatkan dan dimasukkan ke "Stok Kain Sisa" untuk saku/kombinasi.`);
    }

    // 3. Create the cutting job
    const newJob: CuttingJob = {
      id: `CUT-${Date.now()}`,
      orderId: selectedOrder.id,
      spkNo: selectedOrder.spkNo,
      model: selectedOrder.model,
      rollIdUsed: [selectedRoll.id],
      panjangBahanUsed: panjangDipakai,
      qtyProduced: qtyHasilPotong,
      wasteScrapLength: panjangSisaPerca,
      isSisaSaved: sisaSaved,
      cuttingDate: new Date().toISOString().split('T')[0],
      operator
    };

    setCuttingJobs([newJob, ...cuttingJobs]);

    // 4. Update order status to 'Jahit'
    onUpdateOrderStatus(selectedOrder.id, 'Jahit');

    // Reset Inputs
    setSelectedOrderId('');
    setSelectedRollId('');
    setPanjangDipakai(0);
    setQtyHasilPotong(0);
    setPanjangSisaPerca(0);

    alert('Proses pemotongan selesai! SPK otomatis dilanjutkan ke Lini Penjahitan (Sewing Line).');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Stats */}
      <div className="border-b border-[#141414] pb-4">
        <h2 className="text-base font-mono font-extrabold text-[#141414] uppercase tracking-wider">[04. MEJA POTONG & ANTREAN CUTTING]</h2>
        <p className="text-[#141414]/60 font-mono text-[11px] uppercase">Pencatatan efisiensi pemotongan bahan baku gulung menjadi potongan pola baju siap jahit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Execution Card: Efficiency & Yield Calculator */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider flex items-center gap-2">
              <Scissors size={14} />
              [04.1 EFFICIENCY & YIELD CALCULATOR]
            </h3>
            <span className="text-[10px] font-mono font-extrabold border border-[#141414] bg-[#F1F0ED] text-[#141414] px-2 py-0.5 rounded-none uppercase">
              LINE_CUT_ACTIVE
            </span>
          </div>

          <form onSubmit={handleExecuteCutting} className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            
            {/* SPK Selector */}
            <div className="col-span-1 md:col-span-2">
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Pilih SPK Antrean Potong</label>
              <select
                required
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  const o = orders.find(ord => ord.id === e.target.value);
                  if (o) {
                    setQtyHasilPotong(o.totalQty); // default matches target
                    setPanjangDipakai(Number((o.totalQty * o.consumpPerPcs).toFixed(1)));
                    
                    // Auto-select first allocated roll if available
                    if (o.allocatedRolls) {
                      const firstAllocatedRollId = Object.values(o.allocatedRolls).find(id => id && id !== 'AUTO_CREATE');
                      if (firstAllocatedRollId) {
                        setSelectedRollId(firstAllocatedRollId);
                      } else {
                        setSelectedRollId('');
                      }
                    } else {
                      setSelectedRollId('');
                    }
                  } else {
                    setSelectedRollId('');
                  }
                }}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="">-- Pilih SPK --</option>
                {potongQueue.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.spkNo} - {o.klien} ({o.model} | {o.totalQty} pcs)
                  </option>
                ))}
              </select>
            </div>

            {/* Connection Info Area for Allocated Fabric Rolls */}
            {selectedOrder && (
              <div className="col-span-1 md:col-span-2 border border-[#141414] p-3 bg-[#F1F0ED]/30 space-y-2">
                <span className="font-bold text-[9px] uppercase tracking-wider text-[#141414]/70 block flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                  🔗 KONEKSI ALOKASI STOK KAIN (DARI ORDER MATRIX)
                </span>
                
                {selectedOrder.allocatedRolls && Object.keys(selectedOrder.allocatedRolls).length > 0 ? (
                  <div className="space-y-1.5">
                    {Object.entries(selectedOrder.matrix).map(([warna, sizes]) => {
                      const totalWarnaQty = Object.values(sizes).reduce((sum, q) => sum + q, 0);
                      const required = totalWarnaQty * selectedOrder.consumpPerPcs;
                      const allocatedId = selectedOrder.allocatedRolls?.[warna];
                      const matchedRoll = rolls.find(r => r.id === allocatedId);
                      
                      return (
                        <div key={warna} className="flex justify-between items-center text-[10px] font-mono border-b border-[#141414]/10 pb-1 last:border-0 last:pb-0">
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-none border border-[#141414]" style={{ backgroundColor: resolveColor(warna) }} />
                            {warna.toUpperCase()} ({totalWarnaQty} pcs)
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[#141414]/60">Butuh: <b>{required.toFixed(1)} {selectedOrder.satuanConsump.toUpperCase()}</b></span>
                            {allocatedId === 'AUTO_CREATE' ? (
                              <span className="bg-blue-100 text-blue-800 px-1 py-0.5 border border-blue-200 text-[8px] font-black uppercase">[BUAT ROLL BARU]</span>
                            ) : matchedRoll ? (
                              <button
                                type="button"
                                onClick={() => setSelectedRollId(matchedRoll.id)}
                                className={`px-1.5 py-0.5 border text-[8px] font-black uppercase cursor-pointer transition-colors ${selectedRollId === matchedRoll.id ? 'bg-[#141414] text-white border-[#141414]' : 'bg-white hover:bg-[#F1F0ED] text-[#141414] border-[#141414]'}`}
                              >
                                {matchedRoll.id} (SISA {matchedRoll.panjang} {matchedRoll.satuan.toUpperCase()})
                              </button>
                            ) : (
                              <span className="bg-red-100 text-red-800 px-1 py-0.5 border border-red-200 text-[8px] font-black uppercase">[BELUM DIALOKASIKAN]</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#141414]/50 italic">[SPK ini tidak memiliki alokasi stok kain dari Order Matrix. Pilih roll secara manual di bawah.]</p>
                )}
              </div>
            )}

            {/* Fabric Roll Selector */}
            <div className="col-span-1 md:col-span-2">
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Pilih Roll Kain Gudang</label>
              <select
                required
                value={selectedRollId}
                onChange={(e) => setSelectedRollId(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="">-- Pilih Gulungan Kain --</option>
                {rolls.filter(r => r.status === 'Tersedia' || r.status === 'Sisa Perca').map(r => {
                  const isAllocated = selectedOrder?.allocatedRolls && Object.values(selectedOrder.allocatedRolls).includes(r.id);
                  const allocatedWarna = selectedOrder?.allocatedRolls 
                    ? Object.entries(selectedOrder.allocatedRolls).find(([w, id]) => id === r.id)?.[0]
                    : null;
                  
                  return (
                    <option key={r.id} value={r.id}>
                      {r.id} - {r.jenis} {r.warna} ({r.panjang} {r.satuan} sisa) {isAllocated ? `⭐ [ALOKASI WARNA: ${allocatedWarna?.toUpperCase()}]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Roll length consumed */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">
                Kain Terpakai ({selectedRoll ? selectedRoll.satuan.toUpperCase() : 'YARD/METER'})
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={panjangDipakai || ''}
                onChange={(e) => setPanjangDipakai(Number(e.target.value))}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
              {selectedRoll && (
                <span className="text-[9px] text-[#141414]/50 mt-1 block uppercase">Tersedia: {selectedRoll.panjang} {selectedRoll.satuan}</span>
              )}
            </div>

            {/* Pieces Produced */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Actual Qty (Hasil Potong)</label>
              <input
                type="number"
                required
                value={qtyHasilPotong || ''}
                onChange={(e) => setQtyHasilPotong(Number(e.target.value))}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
              {selectedOrder && (
                <span className="text-[9px] text-[#141414]/50 mt-1 block uppercase">Target Pesanan: {selectedOrder.totalQty} pcs</span>
              )}
            </div>

            {/* Remnant / Scrap Kain */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">
                Sisa Kain Perca ({selectedRoll ? selectedRoll.satuan.toUpperCase() : 'YARD'})
              </label>
              <input
                type="number"
                step="0.1"
                value={panjangSisaPerca || ''}
                onChange={(e) => setPanjangSisaPerca(Number(e.target.value))}
                placeholder="Misal: 5"
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
            </div>

            {/* Operator Name */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Nama Operator</label>
              <input
                type="text"
                required
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
            </div>

            {/* Interactive Calculator Overlay */}
            {selectedOrder && panjangDipakai > 0 && (
              <div className="col-span-1 md:col-span-2 bg-[#F1F0ED] border border-[#141414] p-4 rounded-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full">
                  <h4 className="font-mono font-extrabold text-[9px] text-[#141414]/50 uppercase tracking-wider mb-2">[LIVE PERFORMANCE MATRIX]</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 border border-[#141414]/30">
                      <span className="text-[9px] text-[#141414]/50 block font-bold uppercase">Ideal Output</span>
                      <span className="font-mono font-bold text-[#141414] text-xs">{theoreticalYield} Pcs</span>
                    </div>
                    <div className="bg-white p-2 border border-[#141414]/30">
                      <span className="text-[9px] text-[#141414]/50 block font-bold uppercase">Actual Qty</span>
                      <span className="font-mono font-bold text-[#141414] text-xs">{qtyHasilPotong} Pcs</span>
                    </div>
                    <div className="bg-white p-2 border border-[#141414]/30">
                      <span className="text-[9px] text-[#141414]/50 block font-bold uppercase">Waste Scrap</span>
                      <span className="font-mono font-bold text-[#141414] text-xs">
                        {Math.max(0, Number((panjangDipakai - (qtyHasilPotong * selectedOrder.consumpPerPcs)).toFixed(1)))} {selectedOrder.satuanConsump.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white px-4 py-3 border border-[#141414] text-center shrink-0 w-full md:w-auto">
                  <span className="text-[9px] text-[#141414]/50 block font-bold uppercase">Yield Efficiency</span>
                  <span className={`text-lg font-mono font-extrabold block mt-0.5 ${yieldPercentage >= 95 ? 'text-green-600' : 'text-amber-600'}`}>
                    {yieldPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            <div className="col-span-1 md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                className="w-full bg-[#141414] hover:bg-white hover:text-[#141414] text-white border border-[#141414] font-mono text-xs font-bold py-2.5 px-3 rounded-none uppercase transition-colors cursor-pointer"
              >
                CONFIRM CUTTING COMPLETE & SEND TO SEWING LINI
              </button>
            </div>

          </form>
        </div>

        {/* Live Queue Cards */}
        <div className="space-y-4">
          <div className="bg-[#141414] text-white p-4 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <h3 className="font-mono font-extrabold text-xs mb-1 flex items-center gap-2 uppercase tracking-wider">
              <Scale size={14} />
              [04.2 ANTREAN MEJA POTONG]
            </h3>
            <p className="text-[10px] font-mono text-white/60 uppercase">Total {potongQueue.length} pesanan menanti pengerjaan pola jahit saat ini</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {potongQueue.map(q => (
              <div key={q.id} className="bg-white p-4 border border-[#141414] rounded-none flex flex-col justify-between hover:border-slate-800 transition-all font-mono">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[9px] font-bold text-blue-700 block">{q.spkNo}</span>
                    <span className="font-sans font-bold text-[#141414] text-sm block">{q.klien}</span>
                    <span className="text-xs text-[#141414]/70 block mt-0.5">{q.model}</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 font-bold uppercase border ${q.status === 'Antrean' ? 'bg-gray-100 text-gray-500 border-gray-400' : 'bg-blue-50 text-blue-700 border-blue-600 animate-pulse'}`}>
                    {q.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E4E3E0] flex items-center justify-between text-xs text-[#141414]/60">
                  <span>TARGET: <b>{q.totalQty} Pcs</b></span>
                  <span>BUTUH: <b>{(q.totalQty * q.consumpPerPcs).toFixed(1)} {q.satuanConsump.toUpperCase()}</b></span>
                </div>

                {q.status === 'Antrean' && (
                  <button
                    onClick={() => onUpdateOrderStatus(q.id, 'Potong')}
                    className="w-full border border-[#141414] bg-[#F1F0ED] hover:bg-white text-[#141414] text-[10px] font-bold py-1.5 rounded-none mt-3 transition-colors cursor-pointer uppercase"
                  >
                    START CUTTING PROCESS [F5]
                  </button>
                )}
              </div>
            ))}
            {potongQueue.length === 0 && (
              <div className="text-center py-8 text-[#141414]/50 font-mono text-xs uppercase">[CUTTING QUEUE IS CLEAR]</div>
            )}
          </div>
        </div>

      </div>

      {/* Cutting History Yield */}
      {cuttingJobs.length > 0 && (
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#141414] pb-2">
            <CheckCircle size={15} />
            [04.3 LAPORAN RIWAYAT HASIL GUNTING - CUTTING YIELD LOG]
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#141414]">
              <thead>
                <tr className="bg-[#F1F0ED] border-b border-[#141414] text-[#141414] font-mono uppercase font-bold text-[10px]">
                  <th className="p-3">SPK No</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Bahan Terpakai</th>
                  <th className="p-3 text-right">Qty Pola Berhasil</th>
                  <th className="p-3 text-right">Perca Diselamatkan</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Tanggal Gunting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E3E0] font-mono">
                {cuttingJobs.map(job => (
                  <tr key={job.id} className="hover:bg-[#F9F9F8] transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-700">{job.spkNo}</td>
                    <td className="p-3 font-sans font-bold text-[#141414]">{job.model}</td>
                    <td className="p-3 text-[#141414]/70">{job.panjangBahanUsed} YD/M</td>
                    <td className="p-3 text-right font-bold text-[#141414]">{job.qtyProduced} pcs</td>
                    <td className="p-3 text-right text-slate-500">
                      {job.wasteScrapLength > 0 ? (
                        <span className="text-green-700 bg-green-50 px-2 py-0.5 border border-green-600 font-bold text-[9px] uppercase">
                          {job.wasteScrapLength} YD/M [SAVED]
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-[#141414]/70">{job.operator}</td>
                    <td className="p-3 text-[#141414]/50">{job.cuttingDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
