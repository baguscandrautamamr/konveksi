import React, { useState } from 'react';
import { Search, Compass, CheckCircle2, Circle, Clock, MapPin, Truck } from 'lucide-react';
import { Order, Logistics } from '../types';

interface ClientPortalProps {
  orders: Order[];
  logistics: Logistics[];
}

export default function ClientPortal({ orders, logistics }: ClientPortalProps) {
  const [searchSpk, setSearchSpk] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleSearchSpk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSpk.trim()) return;

    const matched = orders.find(o => 
      o.spkNo.toLowerCase() === searchSpk.trim().toLowerCase() ||
      o.klien.toLowerCase().includes(searchSpk.trim().toLowerCase())
    );

    if (matched) {
      setSelectedOrder(matched);
    } else {
      alert('Nomor SPK atau Nama Klien tidak ditemukan! Silakan periksa kembali tanda terima Anda.');
    }
  };

  const getStatusProgressPercent = (status: Order['status']) => {
    switch (status) {
      case 'Antrean': return 15;
      case 'Potong': return 35;
      case 'Jahit': return 60;
      case 'QC': return 75;
      case 'Packing': return 90;
      case 'Dikirim': return 95;
      case 'Selesai': return 100;
      default: return 0;
    }
  };

  const getStatusTextIndonesian = (status: Order['status']) => {
    switch (status) {
      case 'Antrean': return 'Menunggu Antrean Kain';
      case 'Potong': return 'Tahap Gelar & Pemotongan Bahan (Cutting)';
      case 'Jahit': return 'Tahap Perakitan & Jahit Borongan (Sewing)';
      case 'QC': return 'Pemeriksaan Mutu & Jaminan Kualitas (QC)';
      case 'Packing': return 'Proses Finishing & Packing Sacks';
      case 'Dikirim': return 'Sedang Dikirim Melalui Kurir';
      case 'Selesai': return 'Pesanan Selesai & Diterima Klien';
      default: return '';
    }
  };

  // Check if shipment exists
  const shipment = selectedOrder ? logistics.find(l => l.orderId === selectedOrder.id) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 font-mono">
      
      {/* Top Welcome Panel */}
      <div className="bg-[#141414] text-white p-6 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] text-center space-y-4">
        <span className="border border-white/20 bg-white/10 text-amber-400 text-[10px] font-mono font-bold px-3 py-1 rounded-none uppercase tracking-wider inline-block">
          PORTAL_KLIEN_KONVEKSI // LIVE_PROGRESS_PORTAL
        </span>
        <h2 className="text-base font-bold uppercase tracking-wider">[PANTAU PROGRESS PESANAN ANDA SECARA MANDIRI]</h2>
        <p className="text-white/60 text-[11px] max-w-md mx-auto uppercase leading-relaxed">
          Masukkan nomor SPK atau Nama Perusahaan Anda untuk melihat progress bar produksi Anda langsung dari dapur jahit konveksi kami.
        </p>

        <form onSubmit={handleSearchSpk} className="flex gap-2 max-w-md mx-auto pt-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <input
              type="text"
              placeholder="CONTOH: SPK/2026/06/012 ATAU PT SUKSES"
              value={searchSpk}
              onChange={(e) => setSearchSpk(e.target.value)}
              className="w-full text-xs border border-white/20 bg-white/10 text-white rounded-none pl-9 pr-4 py-2 focus:outline-none focus:border-amber-400 font-mono uppercase placeholder:text-white/30"
            />
          </div>
          <button
            type="submit"
            className="bg-amber-400 hover:bg-white hover:text-[#141414] text-slate-950 font-extrabold px-5 py-2 rounded-none text-xs transition-colors shrink-0 uppercase border border-amber-400 cursor-pointer"
          >
            LACAK SPK
          </button>
        </form>

        {/* Suggestive clickable examples for sandbox use */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-white/40 pt-1">
          <span className="uppercase">CONTOH LACAK CEPAT:</span>
          {orders.slice(0, 3).map(o => (
            <button
              key={o.id}
              onClick={() => {
                setSelectedOrder(o);
                setSearchSpk(o.spkNo);
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 border border-white/20 rounded-none font-mono text-[9px] uppercase cursor-pointer"
            >
              {o.spkNo}
            </button>
          ))}
        </div>
      </div>

      {selectedOrder ? (
        <div className="bg-white rounded-none p-5 border border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-6 font-mono text-xs text-[#141414]">
          
          {/* Header summary info (no secrets shown!) */}
          <div className="flex justify-between items-start border-b border-[#141414]/10 pb-4">
            <div>
              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 border border-amber-400 rounded-none inline-block uppercase">
                NOMOR SPK: {selectedOrder.spkNo}
              </span>
              <h3 className="font-sans font-bold text-[#141414] text-lg mt-2 leading-tight">{selectedOrder.klien}</h3>
              <p className="text-[11px] text-[#141414]/60 uppercase mt-1">Produk dipesan: <b className="text-[#141414]">{selectedOrder.model}</b> ({selectedOrder.totalQty} Pcs)</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#141414]/50 block uppercase font-bold">ESTIMASI KIRIM</span>
              <span className="font-bold text-[#141414] text-sm block">{selectedOrder.deadline}</span>
              <span className="text-[9px] text-[#141414]/40 block uppercase">ORDER_DATE: {selectedOrder.createdAt}</span>
            </div>
          </div>

          {/* Aesthetic progress visualizer bar */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[11px] uppercase">
              <span className="font-extrabold text-[#141414]/60">PROGRESS PERAKITAN:</span>
              <span className="font-extrabold text-[#141414] bg-[#F1F0ED] px-2.5 py-0.5 border border-[#141414] rounded-none text-[10px]">
                {getStatusProgressPercent(selectedOrder.status)}% SELESAI
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-[#F1F0ED] border border-[#141414] h-3 rounded-none overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-400 to-green-600 h-full transition-all duration-1000"
                style={{ width: `${getStatusProgressPercent(selectedOrder.status)}%` }}
              />
            </div>

            {/* Current step banner */}
            <div className="bg-[#F1F0ED] text-[#141414] p-4 border border-[#141414] rounded-none flex items-start gap-3 text-xs uppercase leading-relaxed font-bold">
              <Clock size={14} className="text-[#141414]/60 shrink-0 mt-0.5 animate-spin" style={{ animationDuration: '6s' }} />
              <div>
                <span>STATUS SAAT INI: </span>
                <span className="text-amber-700">{getStatusTextIndonesian(selectedOrder.status)}</span>
                <p className="text-[10px] text-[#141414]/50 mt-1 font-medium normal-case leading-relaxed">Tim jahit konveksi kami sedang berupaya maksimal menyelesaikan pesanan Anda sesuai standar mutu terbaik.</p>
              </div>
            </div>
          </div>

          {/* Milestone timeline list */}
          <div className="space-y-4 pt-2">
            <span className="text-[10px] font-bold text-[#141414]/50 block uppercase tracking-wider">[MILESTONE TAHAPAN PRODUKSI REALTIME]</span>
            
            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#141414]/10">
              
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 text-xs">
                <span className="p-0.5 bg-green-600 text-white border border-[#141414] rounded-none z-10">
                  <CheckCircle2 size={13} />
                </span>
                <div>
                  <span className="font-bold text-[#141414] block uppercase">SPK Terbit & Validasi Kain</span>
                  <span className="text-[#141414]/60 text-[11px] uppercase block">Order diverifikasi dan bahan baku kain dialokasikan dari gudang.</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 text-xs">
                <span className={`p-0.5 border border-[#141414] rounded-none z-10 ${
                  ['Potong', 'Jahit', 'QC', 'Packing', 'Dikirim', 'Selesai'].includes(selectedOrder.status) 
                    ? 'bg-green-600 text-white' : 'bg-white text-[#141414]/30'
                }`}>
                  <CheckCircle2 size={13} />
                </span>
                <div>
                  <span className="font-bold text-[#141414] block uppercase">Gelar & Potong Bahan (Cutting)</span>
                  <span className="text-[#141414]/60 text-[11px] uppercase block">Kain digelar di meja potong panjang dan dipola sesuai ukuran pesanan.</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 text-xs">
                <span className={`p-0.5 border border-[#141414] rounded-none z-10 ${
                  ['Jahit', 'QC', 'Packing', 'Dikirim', 'Selesai'].includes(selectedOrder.status) 
                    ? 'bg-green-600 text-white' : 'bg-white text-[#141414]/30'
                }`}>
                  <CheckCircle2 size={13} />
                </span>
                <div>
                  <span className="font-bold text-[#141414] block uppercase">Perakitan & Jahit (Sewing)</span>
                  <span className="text-[#141414]/60 text-[11px] uppercase block">Pola kain mulai dijahit secara detail dan digabung oleh operator profesional.</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3.5 text-xs">
                <span className={`p-0.5 border border-[#141414] rounded-none z-10 ${
                  ['QC', 'Packing', 'Dikirim', 'Selesai'].includes(selectedOrder.status) 
                    ? 'bg-green-600 text-white' : 'bg-white text-[#141414]/30'
                }`}>
                  <CheckCircle2 size={13} />
                </span>
                <div>
                  <span className="font-bold text-[#141414] block uppercase">Pemeriksaan Kualitas Akhir (Quality Control)</span>
                  <span className="text-[#141414]/60 text-[11px] uppercase block">Baju diuji satu per satu untuk memastikan jaminan bebas defect atau lolos cacat jahit.</span>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-3.5 text-xs">
                <span className={`p-0.5 border border-[#141414] rounded-none z-10 ${
                  ['Packing', 'Dikirim', 'Selesai'].includes(selectedOrder.status) 
                    ? 'bg-green-600 text-white' : 'bg-white text-[#141414]/30'
                }`}>
                  <CheckCircle2 size={13} />
                </span>
                <div>
                  <span className="font-bold text-[#141414] block uppercase">Gosok Uap & Kemas Karung (Packing)</span>
                  <span className="text-[#141414]/60 text-[11px] uppercase block">Proses uap agar licin rapi, dibungkus plastik pelindung, dan masuk karung ekspedisi.</span>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex items-start gap-3.5 text-xs">
                <span className={`p-0.5 border border-[#141414] rounded-none z-10 ${
                  ['Dikirim', 'Selesai'].includes(selectedOrder.status) 
                    ? 'bg-green-600 text-white' : 'bg-white text-[#141414]/30'
                }`}>
                  <CheckCircle2 size={13} />
                </span>
                <div>
                  <span className="font-bold text-[#141414] block uppercase">Pemberangkatkan Logistik (Shipped)</span>
                  <span className="text-[#141414]/60 text-[11px] uppercase block">Barang diserahkan ke kurir atau armada dalam perjalanan menuju alamat Anda.</span>
                </div>
              </div>

            </div>
          </div>

          {/* Real-time 3PL tracking for clients */}
          {shipment && shipment.history.length > 0 && (
            <div className="bg-[#141414] text-white p-5 border border-[#141414] rounded-none space-y-3 mt-4">
              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 uppercase">
                <Truck size={14} />
                [TRACKING_STATUS_EKSPEDISI_CONNECTED]
              </span>

              <div className="space-y-3 font-mono">
                {shipment.history.map((h, idx) => (
                  <div key={idx} className="flex gap-2.5 text-xs border-b border-white/10 pb-2 last:border-0 last:pb-0">
                    <MapPin size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono text-[9px] text-white/40 block uppercase">
                        {new Date(h.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {h.lokasi}
                      </span>
                      <span className="text-white font-bold block mt-0.5">{h.keterangan}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-[#F1F0ED] border border-dashed border-[#141414] h-64 rounded-none flex flex-col items-center justify-center text-center p-6 text-[#141414]/60 uppercase font-bold text-xs">
          <Compass size={24} className="text-[#141414]/40 mb-2 animate-bounce" />
          <span>[Menunggu Lacak SPK]</span>
          <p className="text-[10px] text-[#141414]/40 max-w-xs mt-1 uppercase leading-relaxed font-semibold">Masukkan data SPK di atas atau klik salah satu tombol contoh SPK untuk mensimulasikan pencarian klien.</p>
        </div>
      )}

    </div>
  );
}
