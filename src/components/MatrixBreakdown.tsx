import React, { useState, useEffect } from 'react';
import { Search, Plus, Calculator, ChevronRight, FileSpreadsheet, Eye, Sparkles, Trash2, Calendar } from 'lucide-react';
import { Order, SizeMatrix, RollKain } from '../types';
import { downloadOrdersTemplate } from '../utils/excel';
import { resolveColor } from './StokKain';

interface MatrixBreakdownProps {
  orders: Order[];
  rolls: RollKain[];
  onAddOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateRoll: (roll: RollKain) => void;
  onAddRoll: (roll: RollKain) => void;
}

export default function MatrixBreakdown({ 
  orders, 
  rolls = [], 
  onAddOrder, 
  onDeleteOrder,
  onUpdateRoll,
  onAddRoll
}: MatrixBreakdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrderDetails = orders.find(o => o.id === selectedOrderId) || null;

  // Custom Delete Confirmation State
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Form State
  const [klien, setKlien] = useState('');
  const [model, setModel] = useState('Kaos Polos Cotton Combed');
  const [consumpPerPcs, setConsumpPerPcs] = useState(0.35); // 0.35 yard per pcs
  const [satuanConsump, setSatuanConsump] = useState<'yard' | 'meter'>('yard');
  const [totalQty, setTotalQty] = useState(100);
  const [hargaJualPerPcs, setHargaJualPerPcs] = useState(45000);
  const [biayaKainPerUnit, setBiayaKainPerUnit] = useState(28000);
  const [biayaAksesorisPerPcs, setBiayaAksesorisPerPcs] = useState(2000);
  const [deadline, setDeadline] = useState('2026-07-15');

  // Matrix construction state
  const [warnaInput, setWarnaInput] = useState('Hitam');
  const [matrixState, setMatrixState] = useState<SizeMatrix>({
    'Hitam': { 'S': 20, 'M': 30, 'L': 30, 'XL': 20 }
  });

  // Map of color name in matrix -> Roll ID selected
  const [warnaRollAllocation, setWarnaRollAllocation] = useState<Record<string, string>>({});
  
  // Auto-deduct toggle
  const [autoDeductFabric, setAutoDeductFabric] = useState(true);

  // Auto-allocate matching rolls when matrix colors or rolls change
  useEffect(() => {
    const newAlloc = { ...warnaRollAllocation };
    let changed = false;
    Object.keys(matrixState).forEach(warna => {
      if (!newAlloc[warna]) {
        // Find a matching roll in inventory
        const matchingRolls = rolls.filter(r => 
          (r.status === 'Tersedia' || r.status === 'Sisa Perca') && 
          r.warna.toLowerCase().trim() === warna.toLowerCase().trim()
        );
        if (matchingRolls.length > 0) {
          // Pre-select the first one with sufficient length, or first in list
          const totalWarnaQty = Object.values(matrixState[warna] || {}).reduce((sum: number, q: any) => sum + Number(q), 0) as number;
          const reqLength = totalWarnaQty * consumpPerPcs;
          const bestMatch = matchingRolls.find(r => r.panjang >= reqLength) || matchingRolls[0];
          
          newAlloc[warna] = bestMatch.id;
          changed = true;
        } else {
          // Default to manual if no match is found
          newAlloc[warna] = '';
        }
      }
    });
    if (changed) {
      setWarnaRollAllocation(newAlloc);
    }
  }, [matrixState, rolls, consumpPerPcs]);

  // Automatically recalculate total quantity from matrix
  useEffect(() => {
    let sum = 0;
    Object.values(matrixState).forEach(warnaSizes => {
      Object.values(warnaSizes).forEach(qty => {
        sum += Number(qty) || 0;
      });
    });
    setTotalQty(sum);
  }, [matrixState]);

  const handleAddWarnaRow = () => {
    if (!warnaInput.trim()) return;
    if (matrixState[warnaInput]) {
      alert('Warna ini sudah ada dalam tabel matrix!');
      return;
    }
    setMatrixState({
      ...matrixState,
      [warnaInput]: { 'S': 0, 'M': 0, 'L': 0, 'XL': 0 }
    });
    setWarnaInput('');
  };

  const handleUpdateMatrixVal = (warna: string, ukuran: string, val: number) => {
    setMatrixState({
      ...matrixState,
      [warna]: {
        ...matrixState[warna],
        [ukuran]: val
      }
    });
  };

  const handleRemoveWarnaRow = (warna: string) => {
    const newState = { ...matrixState };
    delete newState[warna];
    setMatrixState(newState);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(matrixState).length === 0) {
      alert('Silakan tambahkan setidaknya satu warna di tabel Matrix Breakdown!');
      return;
    }

    // Generate safe, sequential unique IDs and SPK numbers
    const nextIdNum = orders.reduce((max, o) => {
      const match = o.id.match(/ORD-(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        return val > max ? val : max;
      }
      return max;
    }, 0) + 1;
    const id = `ORD-${String(nextIdNum).padStart(3, '0')}`;

    const nextSpkNum = orders.reduce((max, o) => {
      const match = o.spkNo.match(/SPK\/\d+\/\d+\/(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        return val > max ? val : max;
      }
      return max;
    }, 0) + 1;
    const spkNo = `SPK/2026/07/${String(nextSpkNum).padStart(3, '0')}`;

    // Deduct or auto-create rolls
    if (autoDeductFabric) {
      Object.entries(matrixState).forEach(([warna, sizes]) => {
        const totalWarnaQty = Object.values(sizes).reduce((sum, q) => sum + q, 0);
        const requiredLength = totalWarnaQty * consumpPerPcs;
        const selectedRollId = warnaRollAllocation[warna];

        if (selectedRollId === 'AUTO_CREATE') {
          // Auto create a roll
          const newRollId = `ROL-${Date.now().toString().slice(-4)}-${warna.toUpperCase().slice(0, 3)}`;
          // Assume roll originally had requiredLength + 10, then after deduction it has 10 sisa.
          const bufferLength = 10;
          onAddRoll({
            id: newRollId,
            jenis: `Katun Combed 30s (${model})`,
            warna: warna,
            lebar: 150,
            panjang: bufferLength,
            satuan: satuanConsump,
            qrCode: `KNV-FAB-${newRollId}`,
            status: 'Tersedia',
            keterangan: `Dibuat otomatis dari ${spkNo} (Kebutuhan ${requiredLength.toFixed(1)} ${satuanConsump} terpotong)`
          });
        } else if (selectedRollId) {
          const selectedRoll = rolls.find(r => r.id === selectedRollId);
          if (selectedRoll) {
            const sisa = Number((selectedRoll.panjang - requiredLength).toFixed(1));
            const isUsedUp = sisa <= 0.5;
            onUpdateRoll({
              ...selectedRoll,
              panjang: isUsedUp ? 0 : sisa,
              status: isUsedUp ? 'Terpakai' : selectedRoll.status,
              keterangan: `${selectedRoll.keterangan || ''} (Dipakai ${requiredLength.toFixed(1)} ${satuanConsump} untuk ${spkNo})`
            });
          }
        }
      });
    }

    onAddOrder({
      id,
      spkNo,
      klien,
      model,
      consumpPerPcs,
      satuanConsump,
      totalQty,
      status: 'Antrean',
      matrix: matrixState,
      hargaJualPerPcs,
      biayaKainPerUnit,
      biayaAksesorisPerPcs,
      biayaPackingPerPcs: 1500, // Standard packaging
      biayaPotongPerPcs: 1000,
      deadline,
      createdAt: new Date().toISOString().split('T')[0],
      allocatedRolls: warnaRollAllocation
    });

    // Reset Form
    setKlien('');
    setModel('Kaos Polos Cotton Combed');
    setConsumpPerPcs(0.35);
    setMatrixState({ 'Hitam': { 'S': 20, 'M': 30, 'L': 30, 'XL': 20 } });
    setWarnaRollAllocation({});
    setShowAddForm(false);
  };

  const filteredOrders = orders.filter(o => 
    o.klien.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.spkNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Add New Order Toggle / Container */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#141414] pb-4">
        <div>
          <h2 className="text-base font-mono font-extrabold text-[#141414] uppercase tracking-wider">[03. ORDER BREAKDOWN & SIZE MATRIX]</h2>
          <p className="text-[#141414]/60 font-mono text-[11px] uppercase">Ubah order kain menjadi Surat Perintah Kerja (SPK) dengan hitungan sisa yard & meter otomatis</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadOrdersTemplate}
            className="flex items-center gap-2 border border-[#141414] bg-[#F1F0ED] hover:bg-white text-[#141414] px-3.5 py-1.5 rounded-none font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <FileSpreadsheet size={13} />
            EXCEL TEMPLATE
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 border border-[#141414] bg-[#141414] text-white hover:bg-white hover:text-[#141414] px-4 py-1.5 rounded-none font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <Plus size={14} />
            {showAddForm ? 'CLOSE CREATOR' : 'CREATE NEW SPK'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateOrder} className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-[#141414]">
            <Sparkles size={14} className="text-yellow-600 animate-pulse" />
            [SPK MATRIX BUILD GENERATOR]
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs text-[#141414]">
            
            {/* General Info */}
            <div className="space-y-4">
              <h4 className="font-mono font-extrabold text-[10px] text-[#141414]/50 uppercase tracking-widest">1. INFORMASI UMUM SPK</h4>
              
              <div>
                <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Nama Klien / Perusahaan</label>
                <input
                  type="text"
                  required
                  placeholder="PT Sukses Bersama"
                  value={klien}
                  onChange={(e) => setKlien(e.target.value)}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Model / Nama Pakaian</label>
                <input
                  type="text"
                  required
                  placeholder="Kaos Polos Combed 30s"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">HPP Kain / Yard</label>
                  <input
                    type="number"
                    required
                    value={biayaKainPerUnit}
                    onChange={(e) => setBiayaKainPerUnit(Number(e.target.value))}
                    className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Harga Jual / Pcs</label>
                  <input
                    type="number"
                    required
                    value={hargaJualPerPcs}
                    onChange={(e) => setHargaJualPerPcs(Number(e.target.value))}
                    className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Target Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Aksesoris/pcs</label>
                  <input
                    type="number"
                    required
                    value={biayaAksesorisPerPcs}
                    onChange={(e) => setBiayaAksesorisPerPcs(Number(e.target.value))}
                    className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Consumption Estimator */}
            <div className="space-y-4">
              <h4 className="font-mono font-extrabold text-[10px] text-[#141414]/50 uppercase tracking-widest">2. ESTIMASI KEBUTUHAN BAHAN</h4>
              
              <div>
                <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Pemakaian Bahan Per Pcs (Consumption)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={consumpPerPcs}
                    onChange={(e) => setConsumpPerPcs(Number(e.target.value))}
                    className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
                  />
                  <select
                    value={satuanConsump}
                    onChange={(e) => setSatuanConsump(e.target.value as 'yard' | 'meter')}
                    className="text-xs border border-[#141414] rounded-none bg-white px-2 outline-none"
                  >
                    <option value="yard">Yard</option>
                    <option value="meter">Meter</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#F1F0ED] rounded-none p-4 border border-[#141414] flex flex-col justify-between h-40">
                <div className="flex items-center gap-2 text-[#141414]">
                  <Calculator size={16} />
                  <span className="font-mono font-extrabold uppercase text-[11px] tracking-wider">Estimator Bahan Otomatis</span>
                </div>
                
                <div className="my-2">
                  <span className="text-[9px] text-[#141414]/60 uppercase block">Total Estimasi Kebutuhan Kain</span>
                  <span className="text-lg font-mono font-black text-[#141414] block">
                    {(totalQty * consumpPerPcs).toFixed(1)} {satuanConsump.toUpperCase()}
                  </span>
                  <span className="text-[9px] text-[#141414]/60 block mt-1 uppercase">Dihitung dari: {totalQty} pcs x {consumpPerPcs} {satuanConsump} / pcs</span>
                </div>
              </div>
            </div>

            {/* Matrix Breakdown Grid Editor */}
            <div className="space-y-4">
              <h4 className="font-mono font-extrabold text-[10px] text-[#141414]/50 uppercase tracking-widest">3. MATRIX SIZE BREAKDOWN</h4>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Warna: Putih, Navy"
                  value={warnaInput}
                  onChange={(e) => setWarnaInput(e.target.value)}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddWarnaRow}
                  className="bg-[#141414] hover:bg-white hover:text-[#141414] border border-[#141414] text-white text-[10px] font-bold px-3 py-1.5 rounded-none uppercase cursor-pointer"
                >
                  ADD ROW
                </button>
              </div>

              <div className="border border-[#141414] rounded-none overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px] bg-white">
                  <thead>
                    <tr className="bg-[#F1F0ED] border-b border-[#141414] text-[#141414] font-mono font-bold uppercase text-[9px]">
                      <th className="p-2">Warna</th>
                      <th className="p-2 text-center">S</th>
                      <th className="p-2 text-center">M</th>
                      <th className="p-2 text-center">L</th>
                      <th className="p-2 text-center">XL</th>
                      <th className="p-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(matrixState).map(([warna, sizes]) => (
                      <tr key={warna} className="border-b border-[#E4E3E0]">
                        <td className="p-2 font-bold text-[#141414]">{warna}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={sizes['S'] || 0}
                            onChange={(e) => handleUpdateMatrixVal(warna, 'S', Number(e.target.value))}
                            className="w-10 text-center border border-[#141414] rounded-none py-0.5 text-xs bg-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={sizes['M'] || 0}
                            onChange={(e) => handleUpdateMatrixVal(warna, 'M', Number(e.target.value))}
                            className="w-10 text-center border border-[#141414] rounded-none py-0.5 text-xs bg-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={sizes['L'] || 0}
                            onChange={(e) => handleUpdateMatrixVal(warna, 'L', Number(e.target.value))}
                            className="w-10 text-center border border-[#141414] rounded-none py-0.5 text-xs bg-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={sizes['XL'] || 0}
                            onChange={(e) => handleUpdateMatrixVal(warna, 'XL', Number(e.target.value))}
                            className="w-10 text-center border border-[#141414] rounded-none py-0.5 text-xs bg-white"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveWarnaRow(warna)}
                            className="text-[#141414]/50 hover:text-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-[#F1F0ED] border border-[#141414] p-2.5 text-xs font-bold text-[#141414]">
                <span>Total Pesanan Terhitung:</span>
                <span className="font-mono text-sm">{totalQty} pcs</span>
              </div>

              {/* ALOKASI STOK KAIN BERDASARKAN WARNA */}
              <div className="border border-[#141414] p-3 space-y-3 bg-[#F1F0ED]/40 font-mono">
                <div className="flex justify-between items-center border-b border-[#141414]/30 pb-1.5 mb-2">
                  <span className="font-mono font-extrabold text-[10px] text-[#141414] uppercase tracking-wider">🔗 HUBUNGKAN STOK KAIN</span>
                  <label className="flex items-center gap-1.5 text-[10px] font-mono cursor-pointer font-extrabold">
                    <input 
                      type="checkbox" 
                      checked={autoDeductFabric} 
                      onChange={(e) => setAutoDeductFabric(e.target.checked)}
                      className="accent-[#141414]"
                    />
                    <span>POTONG STOK</span>
                  </label>
                </div>

                {Object.keys(matrixState).length === 0 ? (
                  <p className="text-[10px] text-[#141414]/50 font-mono uppercase text-center py-2">[TAMBAHKAN WARNA UNTUK HUBUNGKAN STOK]</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {Object.entries(matrixState).map(([warna, sizes]) => {
                      const totalWarnaQty = Object.values(sizes).reduce((sum, q) => sum + q, 0);
                      const requiredLength = totalWarnaQty * consumpPerPcs;
                      const selectedRollId = warnaRollAllocation[warna] || '';
                      
                      // Matching rolls in inventory
                      const matchingRolls = rolls.filter(r => 
                        (r.status === 'Tersedia' || r.status === 'Sisa Perca') &&
                        r.warna.toLowerCase().trim() === warna.toLowerCase().trim()
                      );
                      
                      const selectedRoll = rolls.find(r => r.id === selectedRollId);
                      const sisaPanjangRoll = selectedRoll ? selectedRoll.panjang : 0;
                      const hasEnough = selectedRoll ? sisaPanjangRoll >= requiredLength : false;
                      const totalStockWarna = matchingRolls.reduce((sum, r) => sum + r.panjang, 0);

                      return (
                        <div key={warna} className="border border-[#141414] p-2 bg-white space-y-2 text-[10px] font-mono">
                          <div className="flex justify-between items-center border-b border-[#141414]/10 pb-1">
                            <span className="font-bold flex items-center gap-1.5 text-xs text-[#141414]">
                              <span className="w-2.5 h-2.5 rounded-none border border-[#141414] inline-block shrink-0" style={{ backgroundColor: resolveColor(warna) }} />
                              {warna.toUpperCase()}
                            </span>
                            <span className="text-[#141414]/70">Butuh: <b className="text-[#141414]">{requiredLength.toFixed(1)} {satuanConsump.toUpperCase()}</b></span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] text-[#141414]/60 block font-bold">ALOKASI ROLL KAIN</label>
                            <select
                              value={selectedRollId}
                              onChange={(e) => setWarnaRollAllocation({
                                ...warnaRollAllocation,
                                [warna]: e.target.value
                              })}
                              className="w-full text-[10px] border border-[#141414] bg-white text-[#141414] py-1 px-1.5 outline-none font-bold uppercase rounded-none"
                            >
                              <option value="">-- PILIH ROLL KAIN / MANUAL --</option>
                              {matchingRolls.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.id} ({r.jenis}) - SISA {r.panjang} {r.satuan.toUpperCase()}
                                </option>
                              ))}
                              <option value="AUTO_CREATE">+ BUAT ROLL BARU OTOMATIS ({warna.toUpperCase()})</option>
                            </select>

                            {/* Status Alokasi */}
                            {selectedRollId === 'AUTO_CREATE' && (
                              <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-1 text-[8px] text-blue-800">
                                <span>TINDAKAN:</span>
                                <span className="font-extrabold uppercase">[AKAN MEMBUAT ROLL BARU & MEMOTONG]</span>
                              </div>
                            )}

                            {selectedRollId && selectedRollId !== 'AUTO_CREATE' && selectedRoll && (
                              <div className="flex justify-between items-center bg-[#F1F0ED] border border-[#141414]/10 p-1 text-[8px]">
                                <span>SISA SETELAH DIPAKAI:</span>
                                <span className={`font-black ${hasEnough ? 'text-green-700' : 'text-red-600'}`}>
                                  {(sisaPanjangRoll - requiredLength).toFixed(1)} {selectedRoll.satuan.toUpperCase()}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-0.5 text-[9px]">
                              <span className="text-[#141414]/50 font-bold">STOK GLOBAL WARNA COCOK:</span>
                              <span className={`font-extrabold ${totalStockWarna >= requiredLength ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'} px-1 border border-[#141414]/10`}>
                                {totalStockWarna.toFixed(1)} {satuanConsump.toUpperCase()}
                              </span>
                            </div>

                            {selectedRollId && selectedRollId !== 'AUTO_CREATE' && selectedRoll && (
                              <div className="flex justify-end pt-1">
                                {hasEnough ? (
                                  <span className="text-[8px] bg-green-600 text-white font-black px-1.5 py-0.5 uppercase tracking-wider border border-green-700">STOK CUKUP</span>
                                ) : (
                                  <span className="text-[8px] bg-red-600 text-white font-black px-1.5 py-0.5 uppercase tracking-wider border border-red-700">STOK SELEKSI KURANG!</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#141414]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 border border-[#141414] bg-white hover:bg-[#F1F0ED] font-mono text-xs font-bold rounded-none uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-[#141414] hover:bg-white hover:text-[#141414] border border-[#141414] text-white font-mono text-xs font-bold rounded-none uppercase cursor-pointer"
            >
              SAVE SPK & VALIDATE MATRIX
            </button>
          </div>
        </form>
      )}

      {/* Main Table & Selected Order Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Order list */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#141414] pb-3">
            <h3 className="font-mono font-extrabold text-sm text-[#141414] uppercase tracking-wider">[03.1 REGISTERED ACTIVE SPK LIST]</h3>
            <div className="relative w-full sm:w-48 font-mono">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#141414]/50" size={13} />
              <input
                type="text"
                placeholder="Cari SPK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none pl-8 pr-3 py-1.5 bg-white text-[#141414] outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-[#E4E3E0] max-h-96 overflow-y-auto pr-1">
            {filteredOrders.map(o => (
              <div 
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`py-3 flex items-center justify-between cursor-pointer hover:bg-[#F1F0ED] px-3 rounded-none transition-all border ${selectedOrderId === o.id ? 'border-[#141414] bg-[#F1F0ED]' : 'border-transparent'}`}
              >
                <div>
                  <span className="font-mono text-[10px] font-bold text-blue-700 block">{o.spkNo}</span>
                  <span className="font-sans font-bold text-[#141414] text-sm block">{o.klien}</span>
                  <span className="text-xs text-[#141414]/70 block mt-0.5">{o.model}</span>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div>
                    <span className="font-mono font-extrabold text-[#141414] text-xs block">{o.totalQty} Pcs</span>
                    <span className="text-[10px] text-[#141414]/50 block">CONSUP: {(o.totalQty * o.consumpPerPcs).toFixed(0)} {o.satuanConsump.toUpperCase()}</span>
                  </div>

                  <span className={`inline-block text-[9px] px-2 py-0.5 font-mono font-extrabold uppercase border ${
                    o.status === 'Antrean' ? 'bg-gray-100 text-gray-500 border-gray-400' : 
                    o.status === 'Potong' ? 'bg-blue-50 text-blue-700 border-blue-600' : 
                    o.status === 'Jahit' ? 'bg-indigo-50 text-indigo-700 border-indigo-600' : 
                    o.status === 'QC' ? 'bg-amber-50 text-amber-800 border-amber-600' : 
                    o.status === 'Packing' ? 'bg-purple-50 text-purple-700 border-purple-600' : 'bg-green-50 text-green-700 border-green-600'
                  }`}>
                    {o.status}
                  </span>

                  <ChevronRight size={14} className="text-[#141414]/50" />
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="py-8 text-center text-[#141414]/50 font-mono text-xs uppercase">[NO SPK MATCHED IN QUEUE]</div>
            )}
          </div>
        </div>

        {/* Breakdown Matrix Visualizer */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <h3 className="font-mono font-extrabold text-sm text-[#141414] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#141414] pb-2">
            <Eye size={16} />
            [03.2 SIZE MATRIX VIEWER]
          </h3>

          {selectedOrderDetails ? (
            <div className="space-y-5">
              <div className="border-b border-[#E4E3E0] pb-4">
                <span className="font-mono text-[9px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 inline-block mb-1 uppercase">{selectedOrderDetails.spkNo}</span>
                <h4 className="font-sans font-extrabold text-base text-[#141414]">{selectedOrderDetails.klien}</h4>
                <p className="text-xs text-[#141414]/70 mt-1">MODEL: {selectedOrderDetails.model}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#141414]/60 mt-2 uppercase">
                  <Calendar size={12} />
                  <span>KIRIM BEFORE: <b className="text-[#141414] font-bold">{selectedOrderDetails.deadline}</b></span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono font-extrabold text-[#141414]/50 block mb-2 uppercase tracking-widest">BREAKDOWN GRID STATUS</span>
                
                <div className="space-y-4">
                  {Object.entries(selectedOrderDetails.matrix).map(([warna, sizes]) => {
                    const totalWarnaQty = Object.values(sizes).reduce((sum, q) => sum + q, 0);
                    return (
                      <div key={warna} className="bg-[#F1F0ED] p-3 border border-[#141414] rounded-none">
                        <div className="flex justify-between items-center border-b border-[#141414]/30 pb-2 mb-2 font-mono text-xs">
                          <span className="font-bold text-[#141414] flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-none border border-[#141414]" style={{ backgroundColor: resolveColor(warna) }} />
                            {warna.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-extrabold text-[#141414]/80">{totalWarnaQty} PCS</span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                          {Object.entries(sizes).map(([ukuran, qty]) => (
                            <div key={ukuran} className="bg-white p-1.5 border border-[#141414] rounded-none">
                              <span className="text-[9px] text-[#141414]/50 block font-bold">{ukuran}</span>
                              <span className="font-bold text-[#141414] text-xs">{qty}</span>
                            </div>
                          ))}
                        </div>

                        {/* Stock Linkage Status Info */}
                        <div className="mt-3 pt-2 border-t border-[#141414]/10 flex flex-col gap-1 font-mono text-[9px] text-[#141414]/70 uppercase">
                          <div className="flex justify-between">
                            <span>Kebutuhan Bahan:</span>
                            <span className="font-bold text-[#141414]">{(totalWarnaQty * selectedOrderDetails.consumpPerPcs).toFixed(1)} {selectedOrderDetails.satuanConsump.toUpperCase()}</span>
                          </div>
                          {(() => {
                            const matchingRolls = rolls.filter(r => 
                              r.warna.toLowerCase().trim() === warna.toLowerCase().trim()
                            );
                            const availableRolls = matchingRolls.filter(r => r.status === 'Tersedia' || r.status === 'Sisa Perca');
                            const totalAvailableLength = availableRolls.reduce((sum, r) => sum + r.panjang, 0);
                            const required = totalWarnaQty * selectedOrderDetails.consumpPerPcs;
                            
                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>Total Stok Tersedia:</span>
                                  <span className={`font-bold ${totalAvailableLength >= required ? 'text-green-700' : 'text-red-600'}`}>
                                    {totalAvailableLength.toFixed(1)} {selectedOrderDetails.satuanConsump.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center bg-white border border-[#141414]/10 p-1 mt-1 text-[8px]">
                                  <span>Status:</span>
                                  {totalAvailableLength >= required ? (
                                    <span className="text-green-700 font-extrabold bg-green-50 px-1 border border-green-200 uppercase">[Bahan Cukup]</span>
                                  ) : availableRolls.length > 0 ? (
                                    <span className="text-amber-700 font-extrabold bg-amber-50 px-1 border border-amber-200 uppercase">[Butuh Tambahan {(required - totalAvailableLength).toFixed(1)} {selectedOrderDetails.satuanConsump.toUpperCase()}]</span>
                                  ) : (
                                    <span className="text-red-600 font-extrabold bg-red-50 px-1 border border-red-200 uppercase">[Stok Kosong]</span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4E3E0] flex items-center justify-between font-mono text-[10px] uppercase text-[#141414]/60">
                <span>CONSUP: <b className="text-[#141414]">{selectedOrderDetails.consumpPerPcs} {selectedOrderDetails.satuanConsump.toUpperCase()}/PCS</b></span>
                <button
                  onClick={() => {
                    setOrderToDelete(selectedOrderDetails);
                  }}
                  className="text-red-600 hover:text-red-800 font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} />
                  DELETE SPK
                </button>
              </div>

            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 bg-[#F1F0ED] rounded-none border border-dashed border-[#141414]/30 font-mono">
              <span className="text-[#141414]/70 text-xs font-bold uppercase mb-1">[NO SPK SELECTION]</span>
              <p className="text-[10px] text-[#141414]/50 max-w-xs uppercase">Silakan pilih salah satu SPK di tabel samping kiri untuk melihat detail breakdown warna & ukuran secara utuh.</p>
            </div>
          )}
        </div>

      </div>

      {/* SPK Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-white text-[#141414] rounded-none p-6 max-w-sm w-full border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-center">
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-2 text-red-600">[KONFIRMASI HAPUS SPK]</h3>
            <p className="text-[11px] uppercase mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus SPK <span className="font-extrabold text-[#141414] bg-[#F1F0ED] px-1">{orderToDelete.spkNo}</span> ({orderToDelete.klien} - {orderToDelete.model})?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderToDelete(null)}
                className="w-full bg-[#F1F0ED] border border-[#141414] hover:bg-white text-[#141414] py-2 px-3 font-bold text-xs uppercase rounded-none cursor-pointer transition-colors"
              >
                BATAL
              </button>
              <button
                onClick={() => {
                  onDeleteOrder(orderToDelete.id);
                  setSelectedOrderId(null);
                  setOrderToDelete(null);
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
