import React from 'react';
import { AlertTriangle, Clock, TrendingUp, CheckCircle, Flame, DollarSign } from 'lucide-react';
import { Order, SewingAssignment, QCInspection } from '../types';

interface DashboardEstimasiProps {
  orders: Order[];
  sewing: SewingAssignment[];
  qc: QCInspection[];
  onOrderClick?: (orderId: string) => void;
}

export default function DashboardEstimasi({ orders, sewing, qc, onOrderClick }: DashboardEstimasiProps) {
  // Sewing productivity calculation
  // Let's assume an average team capacity of sewing. We can countCompleted Sewing pieces
  const activeOrders = orders.filter(o => o.status !== 'Selesai');
  
  // Calculate sewing productivity (e.g., total completed in last few days or default 50 pcs/day per tailor team)
  const defaultSewingRatePerDay = 65; // pieces jahit per hari

  // Calculate HPP and profit globally
  let globalRevenue = 0;
  let globalCost = 0;

  orders.forEach(o => {
    // Fabric yardage needed
    const fabricNeeded = o.totalQty * o.consumpPerPcs;
    const fabricCost = fabricNeeded * o.biayaKainPerUnit;
    const accessoriesCost = o.totalQty * o.biayaAksesorisPerPcs;
    const packingCost = o.totalQty * o.biayaPackingPerPcs;
    const cuttingCost = o.totalQty * o.biayaPotongPerPcs;

    // Sewing cost is the rate per piece paid to tailors.
    // Let's look up sewing rates for this order, or fallback to standard Rp 8.000 per pcs
    const orderSewingAssignments = sewing.filter(s => s.orderId === o.id);
    const sewingCost = orderSewingAssignments.length > 0
      ? orderSewingAssignments.reduce((sum, s) => sum + (s.qtyTarget * s.ratePerPcs), 0)
      : o.totalQty * 8500; // default Rp 8.500 sewing rate per pcs

    const totalHPP = fabricCost + accessoriesCost + packingCost + cuttingCost + sewingCost;
    const totalRevenue = o.totalQty * o.hargaJualPerPcs;

    globalRevenue += totalRevenue;
    globalCost += totalHPP;
  });

  const globalProfit = globalRevenue - globalCost;
  const profitMarginPercent = globalRevenue > 0 ? ((globalProfit / globalRevenue) * 100).toFixed(1) : '0';

  // Analysis of each active order's deadline status
  const orderAnalysisList = activeOrders.map(o => {
    // remaining pieces to sew
    // let's look at completed sewing assignments for this order
    const assignmentsForOrder = sewing.filter(s => s.orderId === o.id);
    const completedSewingQty = assignmentsForOrder.length > 0
      ? Math.max(...assignmentsForOrder.map(a => a.qtyCompleted)) // take max completed as progress
      : o.status === 'Packing' || o.status === 'Dikirim' ? o.totalQty : 0;

    const remainingQty = o.totalQty - completedSewingQty;

    // Date math
    const today = new Date('2026-07-01'); // Fixed current context date from metadata
    const deadlineDate = new Date(o.deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    // Days required to finish sewing based on sewing team capacity
    const daysRequired = Math.ceil(remainingQty / defaultSewingRatePerDay);

    const isAtRisk = daysRequired > daysRemaining;

    return {
      order: o,
      completedSewingQty,
      remainingQty,
      daysRemaining,
      daysRequired,
      isAtRisk,
      sewingRate: defaultSewingRatePerDay
    };
  });

  const urgentOrdersCount = orderAnalysisList.filter(o => o.isAtRisk && o.remainingQty > 0).length;

  return (
    <div className="space-y-6">
      {/* Upper Grid: Alert Banner & General Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Costing & Profit Card */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#141414] pb-2">
              <h3 className="font-mono font-extrabold text-sm text-[#141414] uppercase tracking-wider">
                [01. ANALISIS KEUANGAN & HPP]
              </h3>
              <span className="p-1 border border-[#141414] bg-[#141414] text-white">
                <TrendingUp size={16} />
              </span>
            </div>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-[#E4E3E0] pb-2">
                <span className="opacity-60 uppercase">TOTAL OMSET</span>
                <span className="font-bold text-[#141414]">Rp {globalRevenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#E4E3E0] pb-2">
                <span className="opacity-60 uppercase">ESTIMASI TOTAL HPP</span>
                <span className="font-medium text-red-600">Rp {globalCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-extrabold text-[#141414] uppercase">LABA BERSIH RIIL</span>
                <span className="font-black text-green-700 text-base">Rp {globalProfit.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[#141414] flex items-center justify-between text-[11px] font-mono">
            <span className="opacity-60 uppercase">MARGIN PROFIT</span>
            <span className="font-extrabold text-white bg-green-700 border border-green-700 px-2.5 py-0.5">
              {profitMarginPercent}%
            </span>
          </div>
        </div>

        {/* Real-time Deadline Alert Module */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] col-span-1 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#141414] pb-2">
              <div>
                <h3 className="font-mono font-extrabold text-sm text-[#141414] uppercase tracking-wider">
                  [02. REAL-TIME DEADLINE PREDICTOR]
                </h3>
                <p className="text-[10px] font-mono text-[#141414]/60 mt-0.5">
                  CAPACITY LIMIT: {defaultSewingRatePerDay} PCS/DAY/TEAM VS TASK DUE DATE
                </p>
              </div>
              <div className={`p-1.5 border-2 ${urgentOrdersCount > 0 ? 'bg-red-50 text-red-600 border-red-600 animate-pulse' : 'bg-green-50 text-green-600 border-green-600'}`}>
                {urgentOrdersCount > 0 ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
              </div>
            </div>

            {urgentOrdersCount > 0 ? (
              <div className="bg-red-50 text-red-800 p-3.5 border border-red-600 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <Flame size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">CRITICAL CAPACITY ALERT:</span> {urgentOrdersCount} pesanan diprediksi melewati deadline pengiriman. Sisa hari kerja lebih rendah dari sisa waktu jahit aktual tim!
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 text-green-800 p-3.5 border border-green-600 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600 shrink-0" />
                  <div>
                    <span className="font-extrabold">SYSTEM NOMINAL:</span> Kecepatan jahit konveksi memadai untuk seluruh SPK aktif. Pengiriman tepat waktu diproyeksikan aman.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#E4E3E0] text-xs font-mono">
            <div className="flex items-center gap-2">
              <Clock size={14} className="opacity-60" />
              <div>
                <span className="text-[10px] opacity-60 block uppercase">SEWING BENCHMARK</span>
                <span className="font-bold">{defaultSewingRatePerDay} Pcs / Hari</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="opacity-60" />
              <div>
                <span className="text-[10px] opacity-60 block uppercase">CURRENT TIMESTAMP</span>
                <span className="font-bold text-blue-700">1 Juli 2026</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main List: Live Alert Matrix */}
      <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        <h3 className="font-mono font-extrabold text-sm text-[#141414] uppercase tracking-wider mb-4">
          [03. LIVE WARNING MATRIX: PRODUCTION DUE TIMELINES]
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#141414]">
            <thead>
              <tr className="bg-[#F1F0ED] border-b border-[#141414] text-[#141414] font-mono uppercase font-bold text-[10px]">
                <th className="p-3">SPK & KLIEN</th>
                <th className="p-3">MODEL & QTY</th>
                <th className="p-3">SISA JAHIT</th>
                <th className="p-3">EST. DURASI</th>
                <th className="p-3">SISA WAKTU</th>
                <th className="p-3 text-center">STATUS KETEPATAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3E0] font-mono">
              {orderAnalysisList.map(({ order, completedSewingQty, remainingQty, daysRemaining, daysRequired, isAtRisk }) => (
                <tr 
                  key={order.id} 
                  onClick={() => onOrderClick && onOrderClick(order.id)}
                  className="hover:bg-[#F9F9F8] cursor-pointer transition-colors"
                >
                  <td className="p-3">
                    <span className="text-[10px] font-bold text-[#141414]/50 block">{order.spkNo}</span>
                    <span className="font-sans font-bold text-[#141414]">{order.klien}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-sans font-bold text-[#141414] block">{order.model}</span>
                    <span className="text-[#141414]/50 text-[10px]">{order.totalQty} Pcs</span>
                  </td>
                  <td className="p-3 font-bold">
                    {remainingQty === 0 ? (
                      <span className="text-green-700 border border-green-600 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-green-50">
                        COMPLETE
                      </span>
                    ) : (
                      <span className="text-[#141414]">{remainingQty} Pcs</span>
                    )}
                  </td>
                  <td className="p-3">
                    {remainingQty === 0 ? '-' : `${daysRequired} Hari`}
                  </td>
                  <td className="p-3">
                    <span className={`font-bold ${daysRemaining <= 5 && remainingQty > 0 ? 'text-amber-600' : 'text-[#141414]'}`}>
                      {daysRemaining} Hari
                    </span>
                    <span className="text-[10px] text-[#141414]/50 block">DUE {order.deadline}</span>
                  </td>
                  <td className="p-3 text-center">
                    {remainingQty === 0 ? (
                      <span className="inline-block text-green-700 border border-green-600 bg-green-50 text-[10px] font-extrabold px-2 py-0.5">
                        COMPLETED
                      </span>
                    ) : isAtRisk ? (
                      <span className="inline-flex items-center gap-1 text-red-600 border border-red-600 bg-red-50 text-[10px] font-extrabold px-2 py-0.5 animate-pulse">
                        <AlertTriangle size={10} />
                        DELAYED (OVERTIME)
                      </span>
                    ) : (
                      <span className="inline-block text-green-700 border border-green-600 bg-green-50 text-[10px] font-extrabold px-2 py-0.5">
                        ON TIME
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {orderAnalysisList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#141414]/50 font-mono">
                    [DATABASE EMPTY: NO ACTIVE ORDERS DETECTED]
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
