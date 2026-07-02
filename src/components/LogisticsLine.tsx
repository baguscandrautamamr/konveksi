import React, { useState, useRef, useEffect } from 'react';
import { Truck, MapPin, CheckCircle, Signature, Trash2, ShieldCheck, PenTool } from 'lucide-react';
import { Order, Logistics } from '../types';

interface LogisticsLineProps {
  orders: Order[];
  logistics: Logistics[];
  onAddLogistics: (logistic: Logistics) => void;
  onUpdateLogisticsStatus: (id: string, status: Logistics['status'], signature?: { type: 'driver' | 'penerima', data: string }, namaPenerima?: string) => void;
  onAddLogisticsHistory: (id: string, log: { time: string; lokasi: string; keterangan: string }) => void;
}

export default function LogisticsLine({
  orders,
  logistics,
  onAddLogistics,
  onUpdateLogisticsStatus,
  onAddLogisticsHistory
}: LogisticsLineProps) {
  const activeOrdersForShipment = orders.filter(o => o.status === 'Dikirim' || o.status === 'Selesai');

  // Input States
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [tipePengiriman, setTipePengiriman] = useState<'3PL' | 'Armada Sendiri'>('3PL');
  const [kurirNama, setKurirNama] = useState('Indah Cargo');
  const [resiNo, setResiNo] = useState('');

  // Signature States
  const [activeSignLogisticId, setActiveSignLogisticId] = useState<string | null>(null);
  const [signType, setSignType] = useState<'driver' | 'penerima'>('driver');
  const [namaPenerimaInput, setNamaPenerimaInput] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Canvas Drawing Logic
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // slate-900 color
  }, [activeSignLogisticId, signType]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.touches[0].clientY - rect.top;

    // Prevent scrolling when drawing on touchscreen
    if ('touches' in e) {
      e.preventDefault();
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!canvasRef.current || !activeSignLogisticId) return;
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL(); // base64 string

    if (signType === 'driver') {
      onUpdateLogisticsStatus(activeSignLogisticId, 'Dalam Perjalanan', { type: 'driver', data: signatureData });
      // Add a history item
      onAddLogisticsHistory(activeSignLogisticId, {
        time: new Date().toISOString(),
        lokasi: 'Gudang Konveksi',
        keterangan: 'Paket diserahterimakan ke sopir armada konveksi.'
      });
      alert('Tanda tangan sopir tersimpan! Armada siap diberangkatkan.');
      // Switch to receiver signature immediately as simulated helper
      setSignType('penerima');
      clearCanvas();
    } else {
      if (!namaPenerimaInput.trim()) {
        alert('Silakan masukkan nama penerima barang!');
        return;
      }
      onUpdateLogisticsStatus(activeSignLogisticId, 'Terkirim', { type: 'penerima', data: signatureData }, namaPenerimaInput);
      // Add a history item
      onAddLogisticsHistory(activeSignLogisticId, {
        time: new Date().toISOString(),
        lokasi: 'Alamat Klien',
        keterangan: `Barang berhasil diserahkan dan ditandatangani oleh ${namaPenerimaInput}.`
      });
      alert('Tanda tangan penerima tersimpan! Status pengiriman selesai.');
      setActiveSignLogisticId(null);
      setNamaPenerimaInput('');
      clearCanvas();
    }
  };

  const handleRegisterShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOrd = orders.find(o => o.id === selectedOrderId);
    if (!selectedOrd) {
      alert('Pilih SPK yang akan dikirim!');
      return;
    }

    const newLogistics: Logistics = {
      id: `LOG-${Date.now()}`,
      orderId: selectedOrderId,
      spkNo: selectedOrd.spkNo,
      klien: selectedOrd.klien,
      tipePengiriman,
      kurirNama,
      resiNo: tipePengiriman === '3PL' ? resiNo : undefined,
      status: 'Belum Kirim',
      history: []
    };

    onAddLogistics(newLogistics);

    // If 3PL, simulate immediate courier receipt scanning
    if (tipePengiriman === '3PL') {
      onUpdateLogisticsStatus(newLogistics.id, 'Dalam Perjalanan');
      onAddLogisticsHistory(newLogistics.id, {
        time: new Date().toISOString(),
        lokasi: 'Drop Point Bandung',
        keterangan: `Paket diterima oleh ekspedisi ${kurirNama} dengan nomor resi ${resiNo}.`
      });
    }

    // Reset Form
    setSelectedOrderId('');
    setResiNo('');
    alert('Logistik pengiriman berhasil didaftarkan!');
  };

  return (
    <div className="space-y-6 font-mono">
      
      {/* Title */}
      <div className="border-b border-[#141414] pb-4">
        <h2 className="text-base font-mono font-extrabold text-[#141414] uppercase tracking-wider">[08. LINI PENGIRIMAN & LOGISTIK]</h2>
        <p className="text-[#141414]/60 font-mono text-[11px] uppercase">Pemberangkatkan pesanan menggunakan ekspedisi kargo 3PL pihak ketiga maupun armada supir konveksi sendiri</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Register Shipment */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[#141414] pb-2">
            <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider flex items-center gap-2">
              <Truck size={14} />
              [08.1 SURAT JALAN & REGISTRASI PENGIRIMAN]
            </h3>
            <span className="text-[10px] font-mono font-extrabold border border-[#141414] bg-[#F1F0ED] text-[#141414] px-2 py-0.5 rounded-none uppercase">
              LINE_LOGISTICS_ACTIVE
            </span>
          </div>

          <form onSubmit={handleRegisterShipment} className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-[#141414]">
            
            {/* SPK Selector */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Pilih SPK yang Siap Kirim</label>
              <select
                required
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="">-- Pilih SPK --</option>
                {activeOrdersForShipment.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.spkNo} - {o.klien} ({o.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery type */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Pilihan Ekspedisi / Armada</label>
              <select
                value={tipePengiriman}
                onChange={(e) => {
                  const val = e.target.value as '3PL' | 'Armada Sendiri';
                  setTipePengiriman(val);
                  setKurirNama(val === '3PL' ? 'Indah Cargo' : 'Pak Ujang (Sopir Konveksi)');
                }}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none focus:bg-[#F1F0ED]"
              >
                <option value="3PL">Ekspedisi Pihak Ketiga (3PL / Cargo)</option>
                <option value="Armada Sendiri">Armada Mobil Box Konveksi Sendiri</option>
              </select>
            </div>

            {/* Courier Name */}
            <div>
              <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Nama Driver / Kurir Cargo</label>
              <input
                type="text"
                required
                value={kurirNama}
                onChange={(e) => setKurirNama(e.target.value)}
                className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
              />
            </div>

            {/* Resi (only if 3PL) */}
            {tipePengiriman === '3PL' ? (
              <div>
                <label className="text-[10px] text-[#141414]/60 font-bold uppercase block mb-1">Nomor Resi Pengiriman</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: CRG-982138127ID"
                  value={resiNo}
                  onChange={(e) => setResiNo(e.target.value)}
                  className="w-full text-xs border border-[#141414] rounded-none px-3 py-1.5 bg-white text-[#141414] outline-none"
                />
              </div>
            ) : (
              <div className="bg-[#F1F0ED] p-3 border border-[#141414] rounded-none text-[10px] text-[#141414] self-center uppercase font-bold leading-relaxed">
                <b>INFO ARMADA:</b> Wajib menyertakan tanda tangan digital dari supir (saat berangkat) dan klien (saat menerima barang di HP) sebagai tanda terima sah digital.
              </div>
            )}

            <button
              type="submit"
              className="col-span-1 md:col-span-2 bg-[#141414] hover:bg-white hover:text-[#141414] text-white border border-[#141414] font-mono text-xs font-bold py-2.5 rounded-none uppercase transition-colors cursor-pointer"
            >
              TERBITKAN SURAT JALAN PENGIRIMAN
            </button>

          </form>
        </div>

        {/* In-house Digital Signature Panel */}
        <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between font-mono text-xs text-[#141414]">
          <div>
            <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider mb-2 border-b border-[#141414] pb-2 flex items-center gap-1.5">
              <Signature size={14} />
              [08.2 DIGITAL SIGNATURE BOARD]
            </h3>
            <p className="text-[10px] text-[#141414]/60 mb-4 uppercase leading-relaxed">Gunakan mouse atau touchscreen Anda untuk menandatangani surat tanda terima pengiriman konveksi secara sah.</p>
 
            {activeSignLogisticId ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#F1F0ED] p-2 border border-[#141414] text-[9px] font-bold text-[#141414]">
                  <span>SOPIR / PENERIMA SIGN:</span>
                  <span className="uppercase text-amber-700">{signType} SIGNATURE</span>
                </div>

                {signType === 'penerima' && (
                  <div>
                    <label className="text-[9px] text-[#141414]/60 font-bold uppercase block mb-0.5">Nama Penerima Barang</label>
                    <input
                      type="text"
                      required
                      placeholder="Ibu Linda (Finance PT Mandiri)"
                      value={namaPenerimaInput}
                      onChange={(e) => setNamaPenerimaInput(e.target.value)}
                      className="w-full text-xs border border-[#141414] rounded-none px-2 py-1 bg-white text-[#141414] outline-none"
                    />
                  </div>
                )}

                {/* Canvas signature board */}
                <div className="border-2 border-[#141414] rounded-none bg-[#F1F0ED] relative h-32">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={128}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="bg-white text-[#141414] hover:bg-[#F1F0ED] text-[9px] font-mono font-bold px-2 py-1 border border-[#141414] rounded-none cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveSignature}
                  className="w-full bg-[#141414] hover:bg-white hover:text-[#141414] text-white border border-[#141414] font-mono text-xs font-bold py-2 rounded-none uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PenTool size={12} />
                  Kunci Tanda Tangan digital
                </button>
              </div>
            ) : (
              <div className="h-48 bg-[#F1F0ED] border border-dashed border-[#141414] flex flex-col justify-center items-center text-center p-4 rounded-none">
                <Signature size={20} className="text-[#141414]/30 mb-2" />
                <span className="text-[#141414]/60 text-[10px] font-extrabold uppercase">Tanda Tangan Non-Aktif</span>
                <p className="text-[9px] text-[#141414]/40 max-w-xs mt-1 uppercase">Klik tombol "Tanda Tangan Digital" di list pengiriman untuk mengaktifkan papan.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Shipments logs and 3PL tracking */}
      <div className="bg-white p-5 border border-[#141414] rounded-none shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        <h3 className="font-mono font-extrabold text-xs text-[#141414] uppercase tracking-wider mb-4 border-b border-[#141414] pb-2">
          [08.3 DAFTAR PENGIRIMAN JALAN & STATUS PELACAKAN]
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {logistics.map(shipment => {
            const isArmada = shipment.tipePengiriman === 'Armada Sendiri';
            return (
              <div key={shipment.id} className="bg-white p-5 border border-[#141414] rounded-none flex flex-col justify-between font-mono">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-[9px] font-bold text-blue-700 block">{shipment.spkNo}</span>
                      <h4 className="font-sans font-bold text-[#141414] leading-tight block">{shipment.klien}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 border rounded-none ${
                      shipment.status === 'Belum Kirim' ? 'bg-[#F1F0ED] text-[#141414] border-[#141414]' :
                      shipment.status === 'Dalam Perjalanan' ? 'bg-amber-50 text-amber-700 border-amber-500 animate-pulse' :
                      'bg-emerald-50 text-emerald-700 border-emerald-600'
                    }`}>
                      {shipment.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#141414]/70 space-y-1.5 mt-3 border-b border-[#141414]/10 pb-3 font-mono">
                    <p>Driver / Ekspedisi: <b className="text-[#141414]">{shipment.kurirNama}</b></p>
                    <p>Metode: <b className="text-[#141414]">{shipment.tipePengiriman}</b></p>
                    {shipment.resiNo && <p>No Resi: <b className="font-mono bg-[#F1F0ED] border border-[#141414]/20 px-1.5 py-0.5 rounded-none text-[10px]">{shipment.resiNo}</b></p>}
                    {shipment.namaPenerima && <p>Diterima Oleh: <b className="text-emerald-700">{shipment.namaPenerima}</b></p>}
                  </div>

                  {/* Shipment Tracking Timeline */}
                  <div className="mt-4 space-y-3">
                    <span className="text-[9px] font-bold text-[#141414]/40 block uppercase">[Tracking Log Realtime - API Connected]</span>
                    {shipment.history.map((h, i) => (
                      <div key={i} className="flex gap-2.5 text-xs font-mono">
                        <MapPin size={13} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-[9px] text-[#141414]/40 block uppercase">
                            {new Date(h.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {h.lokasi}
                          </span>
                          <span className="text-[#141414] font-bold">{h.keterangan}</span>
                        </div>
                      </div>
                    ))}
                    {shipment.history.length === 0 && (
                      <span className="text-[#141414]/50 italic text-[11px] block uppercase">[AWAITING COURIER SACK PICK-UP]</span>
                    )}
                  </div>
                </div>

                {/* Delivery actions */}
                {shipment.status !== 'Terkirim' && (
                  <div className="mt-6 pt-3 border-t border-[#141414]/10 flex gap-2">
                    {isArmada ? (
                      <button
                        onClick={() => {
                          setActiveSignLogisticId(shipment.id);
                          setSignType(shipment.status === 'Belum Kirim' ? 'driver' : 'penerima');
                        }}
                        className="w-full bg-[#141414] hover:bg-white hover:text-[#141414] text-amber-400 border border-[#141414] font-mono text-xs font-bold py-2 rounded-none flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase"
                      >
                        <Signature size={12} />
                        {shipment.status === 'Belum Kirim' ? 'Tanda Tangan Driver (Sopir)' : 'Tanda Tangan Penerima'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Simulate JNE/Expedition API updates
                          const time = new Date().toISOString();
                          onAddLogisticsHistory(shipment.id, {
                            time,
                            lokasi: 'Kota Penerima',
                            keterangan: 'Paket berhasil diserahkan ke alamat klien tujuan. Selesai.'
                          });
                          onUpdateLogisticsStatus(shipment.id, 'Terkirim', undefined, 'Resepsionis Kantor');
                        }}
                        className="w-full bg-emerald-700 hover:bg-white hover:text-emerald-700 text-white border border-emerald-700 font-mono text-xs font-bold py-2 rounded-none flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase"
                      >
                        <CheckCircle size={12} />
                        Simulasikan Terkirim (3PL API)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
