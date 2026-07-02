import React, { useState } from 'react';
import { DollarSign, Percent, TrendingUp, Scissors, Shirt, Package, Layers, Info } from 'lucide-react';
import { Order, SewingAssignment } from '../types';

interface CostingProfitProps {
  orders: Order[];
  sewing: SewingAssignment[];
}

export default function CostingProfit({ orders, sewing }: CostingProfitProps) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Calculate detailed costing for selected order
  const getDetailedCosting = (o: Order) => {
    const totalQty = o.totalQty;
    
    // 1. Fabric cost
    const fabricUsed = totalQty * o.consumpPerPcs;
    const fabricCost = fabricUsed * o.biayaKainPerUnit;

    // 2. Cutting cost
    const cuttingCost = totalQty * o.biayaPotongPerPcs;

    // 3. Sewing cost
    // Lookup actual sewing assignments to see what was promised/done, fallback to standard Rp 8.500
    const assignments = sewing.filter(s => s.orderId === o.id);
    const sewingCost = assignments.length > 0
      ? assignments.reduce((sum, s) => sum + (s.qtyTarget * s.ratePerPcs), 0)
      : totalQty * 8500;

    // 4. Accessories
    const accessoriesCost = totalQty * o.biayaAksesorisPerPcs;

    // 5. Packing
    const packingCost = totalQty * o.biayaPackingPerPcs;

    const totalHPP = fabricCost + cuttingCost + sewingCost + accessoriesCost + packingCost;
    const hppPerPcs = totalHPP / totalQty;

    const totalRevenue = totalQty * o.hargaJualPerPcs;
    const netProfit = totalRevenue - totalHPP;
    const profitPerPcs = netProfit / totalQty;

    const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      fabricUsed,
      fabricCost,
      cuttingCost,
      sewingCost,
      accessoriesCost,
      packingCost,
      totalHPP,
      hppPerPcs,
      totalRevenue,
      netProfit,
      profitPerPcs,
      marginPercent
    };
  };

  return (
    <div className="space-y-6 font-mono text-[#141414]">
      
      {/* Title */}
      <div className="border-b border-[#141414] pb-4">
        <h2 className="text-base font-mono font-extrabold text-[#141414] uppercase tracking-wider">[09. MODUL COSTING & ANALISIS LABA HPP]</h2>
        <p className="text-[#141414]/60 font-mono text-[11px] uppercase">Kalkulasi Harga Pokok Produksi (HPP) riil terperinci untuk mengetahui laba bersih per pesanan konveksi</p>
      </div>

      {/* Selector SPK */}
      <div className="bg-white p-4 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex items-center justify-between gap-4 font-mono text-xs">
        <span className="font-extrabold text-[#141414] uppercase tracking-wider">[09.1 SELEKSI SPK ANALISIS HPP]</span>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
        >
          <option value="">-- Pilih SPK --</option>
          {orders.map(o => (
            <option key={o.id} value={o.id}>{o.spkNo} - {o.klien} ({o.model})</option>
          ))}
        </select>
      </div>

      {selectedOrder ? (
        (() => {
          const c = getDetailedCosting(selectedOrder);
          
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Financial Cards */}
              <div className="space-y-6">
                
                {/* Net Profit Card */}
                <div className="bg-[#141414] text-white p-6 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between font-mono">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider">[ESTIMASI LABA BERSIH SPK]</span>
                      <h3 className="font-mono font-extrabold text-xl mt-1 text-green-400">Rp {c.netProfit.toLocaleString('id-ID')}</h3>
                    </div>
                    <span className="p-2 border border-white/20 bg-white/10">
                      <TrendingUp size={16} />
                    </span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-white/70 uppercase">
                    <span>Laba Per Pcs:</span>
                    <span className="font-bold text-green-400">Rp {c.profitPerPcs.toLocaleString('id-ID')} / pcs</span>
                  </div>
                </div>

                {/* HPP & Revenue Details Card */}
                <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-4 font-mono text-xs">
                  <h4 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider border-b border-[#141414]/10 pb-2">
                    [09.2 INFORMASI KEUANGAN GLOBAL]
                  </h4>
                  
                  <div className="space-y-2.5 text-[11px] uppercase">
                    <div className="flex justify-between items-center border-b border-[#141414]/10 pb-2">
                      <span className="text-[#141414]/60">Harga Jual Klien / pcs</span>
                      <span className="font-bold text-[#141414]">Rp {selectedOrder.hargaJualPerPcs.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#141414]/10 pb-2">
                      <span className="text-[#141414]/60">Total HPP / pcs</span>
                      <span className="font-bold text-[#141414]">Rp {c.hppPerPcs.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-[#141414]/10 pb-2">
                      <span className="text-[#141414]/60">Total Omset (Revenue)</span>
                      <span className="font-bold text-[#141414]">Rp {c.totalRevenue.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 font-bold">
                      <span className="text-[#141414]/60">Margin Laba</span>
                      <span className="font-extrabold text-green-700 bg-green-50 px-2.5 py-0.5 border border-green-600 rounded-none text-[10px]">
                        {c.marginPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Middle Column: Detailed Costing Table */}
              <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-4 lg:col-span-2">
                <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider border-b border-[#141414] pb-2">
                  [09.3 RINCIAN KOMPONEN PEMBENTUK HPP SPK]
                </h3>
                
                <div className="space-y-3.5 text-xs font-mono">
                  
                  {/* Fabric Cost */}
                  <div className="flex items-center justify-between bg-[#F1F0ED] p-3 border border-[#141414]/20 rounded-none">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-[#141414] text-white rounded-none">
                        <Layers size={13} />
                      </span>
                      <div>
                        <span className="font-bold text-[#141414] block">Biaya Bahan Baku (Kain)</span>
                        <span className="text-[9px] text-[#141414]/50 uppercase font-bold block">Pola kain ({c.fabricUsed.toFixed(0)} {selectedOrder.satuanConsump} x Rp {selectedOrder.biayaKainPerUnit.toLocaleString('id-ID')})</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#141414]">Rp {c.fabricCost.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Cutting Cost */}
                  <div className="flex items-center justify-between bg-[#F1F0ED] p-3 border border-[#141414]/20 rounded-none">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-[#141414] text-white rounded-none">
                        <Scissors size={13} />
                      </span>
                      <div>
                        <span className="font-bold text-[#141414] block">Biaya Gunting (Cutting)</span>
                        <span className="text-[9px] text-[#141414]/50 uppercase font-bold block">Penyusunan marker & cutting per-pcs</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#141414]">Rp {c.cuttingCost.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Sewing Cost */}
                  <div className="flex items-center justify-between bg-[#F1F0ED] p-3 border border-[#141414]/20 rounded-none">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-[#141414] text-white rounded-none">
                        <Shirt size={13} />
                      </span>
                      <div>
                        <span className="font-bold text-[#141414] block">Biaya Lini Jahit (Sewing)</span>
                        <span className="text-[9px] text-[#141414]/50 uppercase font-bold block">Total upah borongan untuk seluruh penjahit</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#141414]">Rp {c.sewingCost.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Accessories */}
                  <div className="flex items-center justify-between bg-[#F1F0ED] p-3 border border-[#141414]/20 rounded-none">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-[#141414] text-white rounded-none">
                        <Package size={13} />
                      </span>
                      <div>
                        <span className="font-bold text-[#141414] block">Aksesoris & Packaging</span>
                        <span className="text-[9px] text-[#141414]/50 uppercase font-bold block">Label woven, hangtag, kancing, zip, dll</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#141414]">
                      Rp {(c.accessoriesCost + c.packingCost).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* HPP Summary */}
                  <div className="flex items-center justify-between bg-[#141414] text-white p-4 border border-[#141414] rounded-none">
                    <div>
                      <span className="font-mono font-extrabold block text-xs uppercase tracking-wider text-amber-400">TOTAL HARGA POKOK PRODUKSI (HPP)</span>
                      <span className="text-[9px] text-white/50 block uppercase">Jumlah pengeluaran riil produksi untuk {selectedOrder.totalQty} pcs</span>
                    </div>
                    <span className="font-mono font-extrabold text-[#141414] bg-amber-400 border border-amber-400 px-3 py-1 rounded-none text-base">
                      Rp {c.totalHPP.toLocaleString('id-ID')}
                    </span>
                  </div>

                </div>
              </div>

              {/* Bento Row: Visual SVG chart block */}
              <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] col-span-1 lg:col-span-3 space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-[#141414] pb-2">
                  <h4 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider">[09.4 BENTO ALLOCATION CHART - PROPORSI REVENUE SPK]</h4>
                  <span className="text-[#141414]/50 text-[10px] flex items-center gap-1 uppercase">
                    <Info size={12} /> Proporsi alokasi pengeluaran vs laba bersih
                  </span>
                </div>

                {/* Horizontal responsive Stacked Bar chart */}
                <div className="w-full bg-[#F1F0ED] border border-[#141414] h-10 rounded-none overflow-hidden flex font-mono font-extrabold text-white text-[9px] select-none">
                  {/* Fabric segment */}
                  <div 
                    className="bg-blue-600 hover:brightness-110 flex items-center justify-center transition-all cursor-pointer border-r border-[#141414]"
                    style={{ width: `${(c.fabricCost / c.totalRevenue) * 100}%` }}
                    title={`Biaya Kain: Rp ${c.fabricCost.toLocaleString('id-ID')}`}
                  >
                    {((c.fabricCost / c.totalRevenue) * 100) > 8 && 'FABRIC'}
                  </div>
                  {/* Cutting segment */}
                  <div 
                    className="bg-amber-600 hover:brightness-110 flex items-center justify-center transition-all cursor-pointer border-r border-[#141414]"
                    style={{ width: `${(c.cuttingCost / c.totalRevenue) * 100}%` }}
                    title={`Biaya Potong: Rp ${c.cuttingCost.toLocaleString('id-ID')}`}
                  >
                    {((c.cuttingCost / c.totalRevenue) * 100) > 8 && 'CUT'}
                  </div>
                  {/* Sewing segment */}
                  <div 
                    className="bg-indigo-600 hover:brightness-110 flex items-center justify-center transition-all cursor-pointer border-r border-[#141414]"
                    style={{ width: `${(c.sewingCost / c.totalRevenue) * 100}%` }}
                    title={`Biaya Sewing: Rp ${c.sewingCost.toLocaleString('id-ID')}`}
                  >
                    {((c.sewingCost / c.totalRevenue) * 100) > 8 && 'SEW'}
                  </div>
                  {/* Accessories segment */}
                  <div 
                    className="bg-purple-600 hover:brightness-110 flex items-center justify-center transition-all cursor-pointer border-r border-[#141414]"
                    style={{ width: `${((c.accessoriesCost + c.packingCost) / c.totalRevenue) * 100}%` }}
                    title={`Aksesoris: Rp ${(c.accessoriesCost + c.packingCost).toLocaleString('id-ID')}`}
                  >
                    {(((c.accessoriesCost + c.packingCost) / c.totalRevenue) * 100) > 8 && 'PACK'}
                  </div>
                  {/* Profit segment */}
                  <div 
                    className="bg-green-600 hover:brightness-110 flex items-center justify-center text-[#141414] font-extrabold transition-all cursor-pointer"
                    style={{ width: `${(c.netProfit / c.totalRevenue) * 100}%` }}
                    title={`Laba Bersih: Rp ${c.netProfit.toLocaleString('id-ID')}`}
                  >
                    {((c.netProfit / c.totalRevenue) * 100) > 8 && `NET_MARGIN_${c.marginPercent.toFixed(0)}%`}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-[10px] pt-2 border-t border-[#141414]/10">
                  <div className="flex items-center gap-1.5 text-[#141414]/70">
                    <span className="w-3 h-3 bg-blue-600 border border-[#141414] block" />
                    <span>BAHAN: Rp {c.fabricCost.toLocaleString('id-ID')} ({((c.fabricCost / c.totalRevenue) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#141414]/70">
                    <span className="w-3 h-3 bg-amber-600 border border-[#141414] block" />
                    <span>POTONG: Rp {c.cuttingCost.toLocaleString('id-ID')} ({((c.cuttingCost / c.totalRevenue) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#141414]/70">
                    <span className="w-3 h-3 bg-indigo-600 border border-[#141414] block" />
                    <span>JAHIT: Rp {c.sewingCost.toLocaleString('id-ID')} ({((c.sewingCost / c.totalRevenue) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#141414]/70">
                    <span className="w-3 h-3 bg-purple-600 border border-[#141414] block" />
                    <span>ACC & PACK: Rp {(c.accessoriesCost + c.packingCost).toLocaleString('id-ID')} ({(((c.accessoriesCost + c.packingCost) / c.totalRevenue) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#141414] font-extrabold">
                    <span className="w-3 h-3 bg-green-600 border border-[#141414] block" />
                    <span>PROFIT MARGIN: Rp {c.netProfit.toLocaleString('id-ID')} ({c.marginPercent.toFixed(0)}%)</span>
                  </div>
                </div>
              </div>

            </div>
          );
        })()
      ) : (
        <div className="h-48 bg-[#F1F0ED] border border-dashed border-[#141414] flex flex-col items-center justify-center text-center p-4 rounded-none font-mono text-xs">
          <DollarSign size={20} className="text-[#141414]/40 mb-2" />
          <span className="text-[#141414]/60 font-extrabold uppercase">[TIDAK ADA SPK TERPILIH]</span>
          <p className="text-[10px] text-[#141414]/40 max-w-xs uppercase mt-1 leading-relaxed">Silakan pilih SPK di atas untuk memuat visualisasi Bento allocation serta margin breakdown.</p>
        </div>
      )}

    </div>
  );
}
