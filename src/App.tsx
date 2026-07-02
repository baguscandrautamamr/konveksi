import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Layers, 
  Scissors, 
  Shirt, 
  ShieldCheck, 
  Package, 
  Truck, 
  DollarSign, 
  LayoutDashboard,
  Database
} from 'lucide-react';

import { 
  RollKain, 
  Order, 
  Tailor, 
  SewingAssignment, 
  QCInspection, 
  PackingJob, 
  Logistics, 
  PackingBox 
} from './types';

import { 
  INITIAL_ROLLS, 
  INITIAL_ORDERS, 
  INITIAL_TAILORS, 
  INITIAL_SEWING, 
  INITIAL_QC, 
  INITIAL_PACKING, 
  INITIAL_LOGISTICS 
} from './initialData';

import Header from './components/Header';
import DashboardEstimasi from './components/DashboardEstimasi';
import StokKain from './components/StokKain';
import MatrixBreakdown from './components/MatrixBreakdown';
import CuttingLine from './components/CuttingLine';
import SewingLine from './components/SewingLine';
import QCLine from './components/QCLine';
import PackingLine from './components/PackingLine';
import LogisticsLine from './components/LogisticsLine';
import CostingProfit from './components/CostingProfit';
import ClientPortal from './components/ClientPortal';

export default function App() {
  // Navigation Tab State
  const [currentTab, setCurrentTab] = useState('estimasi');
  const [showClientPortal, setShowClientPortal] = useState(false);

  // Core Database States (with local storage sync loading)
  const [rolls, setRolls] = useState<RollKain[]>(() => {
    const saved = localStorage.getItem('smk_rolls');
    return saved ? JSON.parse(saved) : INITIAL_ROLLS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('smk_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [tailors, setTailors] = useState<Tailor[]>(() => {
    const saved = localStorage.getItem('smk_tailors');
    return saved ? JSON.parse(saved) : INITIAL_TAILORS;
  });

  const [sewing, setSewing] = useState<SewingAssignment[]>(() => {
    const saved = localStorage.getItem('smk_sewing');
    return saved ? JSON.parse(saved) : INITIAL_SEWING;
  });

  const [qc, setQc] = useState<QCInspection[]>(() => {
    const saved = localStorage.getItem('smk_qc');
    return saved ? JSON.parse(saved) : INITIAL_QC;
  });

  const [packing, setPacking] = useState<PackingJob[]>(() => {
    const saved = localStorage.getItem('smk_packing');
    return saved ? JSON.parse(saved) : INITIAL_PACKING;
  });

  const [logistics, setLogistics] = useState<Logistics[]>(() => {
    const saved = localStorage.getItem('smk_logistics');
    return saved ? JSON.parse(saved) : INITIAL_LOGISTICS;
  });

  // Save states to localStorage upon changes
  useEffect(() => {
    localStorage.setItem('smk_rolls', JSON.stringify(rolls));
  }, [rolls]);

  useEffect(() => {
    localStorage.setItem('smk_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('smk_tailors', JSON.stringify(tailors));
  }, [tailors]);

  useEffect(() => {
    localStorage.setItem('smk_sewing', JSON.stringify(sewing));
  }, [sewing]);

  useEffect(() => {
    localStorage.setItem('smk_qc', JSON.stringify(qc));
  }, [qc]);

  useEffect(() => {
    localStorage.setItem('smk_packing', JSON.stringify(packing));
  }, [packing]);

  useEffect(() => {
    localStorage.setItem('smk_logistics', JSON.stringify(logistics));
  }, [logistics]);

  // DATABASE WRITERS & MUTATORS
  const handleAddRoll = (newRoll: RollKain) => {
    setRolls([newRoll, ...rolls]);
  };

  const handleUpdateRoll = (updatedRoll: RollKain) => {
    setRolls(rolls.map(r => r.id === updatedRoll.id ? updatedRoll : r));
  };

  const handleDeleteRoll = (id: string) => {
    setRolls(rolls.filter(r => r.id !== id));
  };

  const handleAddOrder = (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
    // Also initialize packing job and logistics record automatically!
    setPacking([
      {
        id: `PCK-${Date.now()}`,
        orderId: newOrder.id,
        spkNo: newOrder.spkNo,
        klien: newOrder.klien,
        model: newOrder.model,
        totalQty: newOrder.totalQty,
        packedQty: 0,
        boxes: [],
        status: 'Proses'
      },
      ...packing
    ]);
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
    setPacking(packing.filter(p => p.orderId !== id));
    setLogistics(logistics.filter(l => l.orderId !== id));
    setSewing(sewing.filter(s => s.orderId !== id));
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleAddTailor = (newTailor: Tailor) => {
    setTailors([...tailors, newTailor]);
  };

  const handleAddSewingAssignment = (newAssignment: SewingAssignment) => {
    setSewing([newAssignment, ...sewing]);
  };

  const handleUpdateSewingProgress = (assignmentId: string, delta: number) => {
    setSewing(sewing.map(s => {
      if (s.id === assignmentId) {
        const nextQty = Math.max(0, Math.min(s.qtyTarget, s.qtyCompleted + delta));
        return { ...s, qtyCompleted: nextQty };
      }
      return s;
    }));
  };

  const handleDeleteAssignment = (id: string) => {
    setSewing(sewing.filter(s => s.id !== id));
  };

  const handleAddQCInspection = (newQC: QCInspection) => {
    setQc([newQC, ...qc]);

    // If passed, increment packedQty in packing jobs
    if (newQC.qtyPassed > 0) {
      setPacking(packing.map(p => {
        if (p.orderId === newQC.orderId) {
          return {
            ...p,
            packedQty: Math.min(p.totalQty, p.packedQty + newQC.qtyPassed)
          };
        }
        return p;
      }));
    }
  };

  const handleDeleteQCLog = (id: string) => {
    setQc(qc.filter(q => q.id !== id));
  };

  const handleAddPackingBox = (orderId: string, newBox: PackingBox) => {
    setPacking(packing.map(p => {
      if (p.orderId === orderId) {
        const updatedBoxes = [...p.boxes, newBox];
        const totalPacked = updatedBoxes.reduce((sum, b) => sum + b.qty, 0);
        return {
          ...p,
          boxes: updatedBoxes,
          packedQty: totalPacked,
          status: totalPacked >= p.totalQty ? 'Selesai' : 'Proses'
        };
      }
      return p;
    }));
  };

  const handleAddLogistics = (newLogistics: Logistics) => {
    setLogistics([newLogistics, ...logistics]);
  };

  const handleUpdateLogisticsStatus = (
    id: string, 
    status: Logistics['status'], 
    signature?: { type: 'driver' | 'penerima', data: string }, 
    namaPenerima?: string
  ) => {
    setLogistics(logistics.map(l => {
      if (l.id === id) {
        const updated = { ...l, status };
        if (signature) {
          if (signature.type === 'driver') {
            updated.signatureDriver = signature.data;
          } else {
            updated.signaturePenerima = signature.data;
            if (namaPenerima) updated.namaPenerima = namaPenerima;
          }
        }
        return updated;
      }
      return l;
    }));
  };

  const handleAddLogisticsHistory = (id: string, log: { time: string; lokasi: string; keterangan: string }) => {
    setLogistics(logistics.map(l => {
      if (l.id === id) {
        return {
          ...l,
          history: [...l.history, log]
        };
      }
      return l;
    }));
  };

  const handleImportRolls = (importedRolls: RollKain[]) => {
    setRolls([...importedRolls, ...rolls]);
  };

  const handleImportOrders = (importedOrders: Order[]) => {
    setOrders([...importedOrders, ...orders]);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-4 md:p-6 selection:bg-[#141414] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* App Header */}
        <Header 
          rolls={rolls}
          orders={orders}
          sewing={sewing}
          qc={qc}
          logistics={logistics}
          onImportRolls={handleImportRolls}
          onImportOrders={handleImportOrders}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          showClientPortal={showClientPortal}
          setShowClientPortal={setShowClientPortal}
        />

        {showClientPortal ? (
          /* Custom client-facing view */
          <ClientPortal 
            orders={orders}
            logistics={logistics}
          />
        ) : (
          /* Internal Admin/Operational Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar Tab Menu */}
            <div className="bg-[#F1F0ED] p-4 border border-[#141414] h-fit space-y-1.5 rounded-none">
              <span className="text-[10px] font-mono font-bold text-[#141414]/60 block uppercase tracking-widest mb-3 px-2">
                [SYSTEM PRODUCTION LINES]
              </span>
              
              <button
                id="tab-estimasi"
                onClick={() => setCurrentTab('estimasi')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all border rounded-none ${
                  currentTab === 'estimasi' 
                    ? 'bg-[#141414] text-white border-[#141414]' 
                    : 'bg-[#F1F0ED] text-[#141414]/70 border-transparent hover:border-[#141414] hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={14} />
                  00 DASHBOARD OVERVIEW
                </span>
                <span className="text-[9px] opacity-60">[*]</span>
              </button>

              <button
                id="tab-rolls"
                onClick={() => setCurrentTab('rolls')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all border rounded-none ${
                  currentTab === 'rolls' 
                    ? 'bg-[#141414] text-white border-[#141414]' 
                    : 'bg-[#F1F0ED] text-[#141414]/70 border-transparent hover:border-[#141414] hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Database size={14} />
                  01 STOK KAIN (INVENTORY)
                </span>
                <span className="text-[9px] opacity-60">[{rolls.length}]</span>
              </button>

              <button
                id="tab-orders"
                onClick={() => setCurrentTab('orders')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all border rounded-none ${
                  currentTab === 'orders' 
                    ? 'bg-[#141414] text-white border-[#141414]' 
                    : 'bg-[#F1F0ED] text-[#141414]/70 border-transparent hover:border-[#141414] hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers size={14} />
                  02 ORDER MATRIX
                </span>
                <span className="text-[9px] opacity-60">[{orders.length}]</span>
              </button>

              <button
                id="tab-cutting"
                onClick={() => setCurrentTab('cutting')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all border rounded-none ${
                  currentTab === 'cutting' 
                    ? 'bg-[#141414] text-white border-[#141414]' 
                    : 'bg-[#F1F0ED] text-[#141414]/70 border-transparent hover:border-[#141414] hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Scissors size={14} />
                  03 CUTTING LINE (MEJA)
                </span>
                <span className="text-[9px] opacity-60">[{orders.filter(o => o.status === 'Antrean' || o.status === 'Potong').length}]</span>
              </button>

              <button
                id="tab-sewing"
                onClick={() => setCurrentTab('sewing')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all border rounded-none ${
                  currentTab === 'sewing' 
                    ? 'bg-[#141414] text-white border-[#141414]' 
                    : 'bg-[#F1F0ED] text-[#141414]/70 border-transparent hover:border-[#141414] hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shirt size={14} />
                  04 SEWING LINE (JAHIT)
                </span>
                <span className="text-[9px] opacity-60">[{sewing.length}]</span>
              </button>

              <button
                id="tab-qc"
                onClick={() => setCurrentTab('qc')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all border rounded-none ${
                  currentTab === 'qc' 
                    ? 'bg-[#141414] text-white border-[#141414]' 
                    : 'bg-[#F1F0ED] text-[#141414]/70 border-transparent hover:border-[#141414] hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={14} />
                  05 QC LINE (INSPEKSI)
                </span>
                <span className="text-[9px] opacity-60">[{qc.length}]</span>
              </button>

              <button
                id="tab-packing"
                onClick={() => setCurrentTab('packing')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all border rounded-none ${
                  currentTab === 'packing' 
                    ? 'bg-[#141414] text-white border-[#141414]' 
                    : 'bg-[#F1F0ED] text-[#141414]/70 border-transparent hover:border-[#141414] hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package size={14} />
                  06 PACKING (FINISHING)
                </span>
                <span className="text-[9px] opacity-60">[{packing.length}]</span>
              </button>

              <button
                id="tab-logistics"
                onClick={() => setCurrentTab('logistics')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all border rounded-none ${
                  currentTab === 'logistics' 
                    ? 'bg-[#141414] text-white border-[#141414]' 
                    : 'bg-[#F1F0ED] text-[#141414]/70 border-transparent hover:border-[#141414] hover:bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Truck size={14} />
                  07 LOGISTICS & SHIPPED
                </span>
                <span className="text-[9px] opacity-60">[{logistics.filter(l => l.status !== 'Terkirim').length}]</span>
              </button>

              <div className="border-t border-[#141414]/20 my-3 pt-3">
                <button
                  id="tab-costing"
                  onClick={() => setCurrentTab('costing')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-extrabold transition-all border rounded-none ${
                    currentTab === 'costing' 
                      ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]' 
                      : 'bg-orange-100 text-[#141414] border-[#141414] hover:bg-orange-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <DollarSign size={14} />
                    08 COSTING & HPP LABA
                  </span>
                  <span className="text-[9px] text-red-600 font-extrabold">[ANALYSIS]</span>
                </button>
              </div>

            </div>

            {/* Active Workspace Area */}
            <div className="lg:col-span-3 min-w-0">
              {currentTab === 'estimasi' && (
                <DashboardEstimasi 
                  orders={orders}
                  sewing={sewing}
                  qc={qc}
                  onOrderClick={(orderId) => {
                    setCurrentTab('orders');
                  }}
                />
              )}

              {currentTab === 'rolls' && (
                <StokKain 
                  rolls={rolls}
                  onAddRoll={handleAddRoll}
                  onUpdateRoll={handleUpdateRoll}
                  onDeleteRoll={handleDeleteRoll}
                />
              )}

              {currentTab === 'orders' && (
                <MatrixBreakdown 
                  orders={orders}
                  rolls={rolls}
                  onAddOrder={handleAddOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onUpdateRoll={handleUpdateRoll}
                  onAddRoll={handleAddRoll}
                />
              )}

              {currentTab === 'cutting' && (
                <CuttingLine 
                  orders={orders}
                  rolls={rolls}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onAddRoll={handleAddRoll}
                  onUpdateRoll={handleUpdateRoll}
                />
              )}

              {currentTab === 'sewing' && (
                <SewingLine 
                  orders={orders}
                  tailors={tailors}
                  sewing={sewing}
                  onAddTailor={handleAddTailor}
                  onAddSewingAssignment={handleAddSewingAssignment}
                  onUpdateSewingProgress={handleUpdateSewingProgress}
                  onDeleteAssignment={handleDeleteAssignment}
                />
              )}

              {currentTab === 'qc' && (
                <QCLine 
                  orders={orders}
                  tailors={tailors}
                  sewing={sewing}
                  qc={qc}
                  onAddQCInspection={handleAddQCInspection}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onDeleteQCLog={handleDeleteQCLog}
                />
              )}

              {currentTab === 'packing' && (
                <PackingLine 
                  orders={orders}
                  packing={packing}
                  qc={qc}
                  onAddPackingBox={handleAddPackingBox}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              )}

              {currentTab === 'logistics' && (
                <LogisticsLine 
                  orders={orders}
                  logistics={logistics}
                  onAddLogistics={handleAddLogistics}
                  onUpdateLogisticsStatus={handleUpdateLogisticsStatus}
                  onAddLogisticsHistory={handleAddLogisticsHistory}
                />
              )}

              {currentTab === 'costing' && (
                <CostingProfit 
                  orders={orders}
                  sewing={sewing}
                />
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
