import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronLeft, Search } from 'lucide-react';
import { Avatar } from './components/Avatar';
import { OrderCard } from './components/OrderCard';
import { fetchAllOrders, fetchUpcomingOrders } from './services/api';
import type { Order } from './types/Order';

const TABS = ['Upcoming', 'Completed', 'Past'] as const;
type Tab = (typeof TABS)[number];

const getStatusSteps = (statusCode?: number) => {
  const steps = ['Created Order', 'Accepted Order', 'Pickup set up by William', 'Pickup Completed'];
  const activeIndex = Math.min(Math.max(Number(statusCode ?? 1), 1), 4) - 1;

  return steps.map((label, index) => ({
    label,
    active: index <= activeIndex,
  }));
};

export default function App() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const detailScrollRef = useRef<HTMLDivElement | null>(null);
  const dragScrollRef = useRef({ active: false, startY: 0, startScrollTop: 0 });
  const detailDragRef = useRef({ active: false, startY: 0, startScrollTop: 0 });
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPickupData, setShowPickupData] = useState(false);
  const [activeDestination, setActiveDestination] = useState<'pickup' | 'dropoff'>('pickup');

  useEffect(() => {
    let isActive = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const [upcoming, all] = await Promise.all([fetchUpcomingOrders(), fetchAllOrders()]);
        if (isActive) {
          setOrders([...upcoming, ...all]);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesTab = order.category === activeTab;
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.originCity.toLowerCase().includes(term) ||
        order.destinationCity.toLowerCase().includes(term);

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchTerm]);

  useEffect(() => {
    if (!selectedOrder) {
      setShowPickupData(false);
      setActiveDestination('pickup');
      return;
    }

    setShowPickupData(true);
  }, [selectedOrder]);

  const statusSteps = getStatusSteps(selectedOrder?.statusCode);

  const handleScrollPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest('button, input, textarea, select')) {
      return;
    }

    dragScrollRef.current = {
      active: true,
      startY: event.clientY,
      startScrollTop: scrollRef.current?.scrollTop ?? 0,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleScrollPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragScrollRef.current.active || !scrollRef.current) return;

    const deltaY = event.clientY - dragScrollRef.current.startY;
    scrollRef.current.scrollTop = dragScrollRef.current.startScrollTop - deltaY;
  };

  const handleScrollPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragScrollRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleDetailScrollPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest('button, input, textarea, select')) {
      return;
    }

    detailDragRef.current = {
      active: true,
      startY: event.clientY,
      startScrollTop: detailScrollRef.current?.scrollTop ?? 0,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDetailScrollPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!detailDragRef.current.active || !detailScrollRef.current) return;

    const deltaY = event.clientY - detailDragRef.current.startY;
    detailScrollRef.current.scrollTop = detailDragRef.current.startScrollTop - deltaY;
  };

  const handleDetailScrollPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    detailDragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060809] p-4 text-white">
      <div
        className="relative flex h-[1078px] w-[440px] select-none flex-col overflow-hidden rounded-[42px] border border-[#646464] bg-[#0c0f13] p-5 shadow-[0_0_0_4px_rgba(255,255,255,0.04),0_30px_60px_rgba(0,0,0,0.8)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-24 rounded-full bg-[#2f3237]" />

        {!selectedOrder && (
          <>
            <header className="flex items-center justify-between pb-3">
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800/70">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-[19px] font-bold tracking-[-0.02em]">Cargo Orders</h1>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80">
                <Bell className="h-4 w-4 text-[#facc15]" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#facc15]" />
              </div>
            </header>

            <nav className="mb-4 flex items-center justify-between border-b border-[#2a2d33] pb-2 text-[15px]">
              {TABS.map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-2 font-semibold transition-colors ${activeTab === tab ? 'text-[#facc15]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {tab}
                  {activeTab === tab && <span className="absolute -bottom-[9px] left-0 h-[2px] w-full rounded-full bg-[#facc15]" />}
                </button>
              ))}
            </nav>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-[#2a2d33] bg-[#171b20] py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-[#facc15]/60 focus:outline-none"
              />
            </div>

            <main
              ref={scrollRef}
              onPointerDown={handleScrollPointerDown}
              onPointerMove={handleScrollPointerMove}
              onPointerUp={handleScrollPointerUp}
              onPointerLeave={handleScrollPointerUp}
              className="no-scrollbar flex min-h-0 flex-1 cursor-grab flex-col gap-4 overflow-y-auto pb-8 pr-1 active:cursor-grabbing"
              style={{ touchAction: 'none', scrollPaddingBottom: '32px', cursor: 'grab' }}
            >
              {loading ? (
                <div className="py-10 text-center text-sm text-zinc-400">Cargando pedidos...</div>
              ) : error ? (
                <div className="py-10 text-center text-sm text-red-400">{error}</div>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onSelect={setSelectedOrder} />
                ))
              ) : (
                <div className="py-10 text-center text-sm text-zinc-500">No se encontraron órdenes para esta búsqueda.</div>
              )}
            </main>
          </>
        )}

        {selectedOrder && (
          <div className="flex min-h-0 flex-1 animate-[fadeIn_0.25s_ease-out] flex-col overflow-hidden rounded-[42px] bg-[#0d1116] p-5 transition-all duration-300">
            <div className="mb-4 flex items-center justify-between">
              <button type="button" onClick={() => setSelectedOrder(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800/60">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-[19px] font-bold tracking-[-0.02em]">Cargo Details</h2>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80">
                <Bell className="h-4 w-4 text-[#facc15]" />
              </div>
            </div>

            <div
              ref={detailScrollRef}
              onPointerDown={handleDetailScrollPointerDown}
              onPointerMove={handleDetailScrollPointerMove}
              onPointerUp={handleDetailScrollPointerUp}
              onPointerLeave={handleDetailScrollPointerUp}
              className="no-scrollbar flex-1 cursor-grab overflow-y-auto active:cursor-grabbing"
              style={{ touchAction: 'none' }}
            >
              <div className="rounded-[24px] border border-[#2a2d33] bg-[#141b21] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Referencia {selectedOrder.reference ?? 'A1180'}</p>
                <p className="mt-2 text-[22px] font-bold leading-tight">Order #{selectedOrder.id}</p>

                <div className="relative mt-5 pl-5">
                  <div className="absolute left-0 top-0 h-[78%] w-px bg-[#2d3238]" />
                  <div className="relative pb-5">
                    <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-[#facc15] ring-4 ring-[#141b21]" />
                    <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Pickup</p>
                    <p className="mt-2 text-[17px] font-semibold leading-tight text-white">{selectedOrder.originCity}</p>
                    <p className="mt-1 text-sm text-zinc-400">{selectedOrder.originAddress}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#5ea5ff]" />
                      <span>Accepted</span>
                    </div>
                  </div>

                  <div className="relative pt-2">
                    <span className="absolute -left-[23px] top-2 h-3 w-3 rounded-full bg-zinc-500 ring-4 ring-[#141b21]" />
                    <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Dropoff</p>
                    <p className="mt-2 text-[17px] font-semibold leading-tight text-white">{selectedOrder.destinationCity}</p>
                    <p className="mt-1 text-sm text-zinc-400">{selectedOrder.destinationAddress}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
                      <span>On hold</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-[#2a2d33] bg-[#141b21] p-5">
                <div className="flex justify-center">
                  <Avatar size="lg" src={selectedOrder.driverAvatar ?? undefined} />
                </div>
                <p className="mt-4 text-center text-[38px] font-bold tracking-[0.02em]">10:30 PM</p>

                <div className="mt-5 pl-4">
                  <div className="relative ml-1 border-l border-[#2d3238] pl-7">
                    {statusSteps.map((step, index) => (
                      <div key={step.label} className="relative pb-5 last:pb-0">
                        <span className={`absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${step.active ? 'border-[#141b21] bg-[#facc15]' : 'border-zinc-400 bg-[#1c2127]'}`}>
                          {step.active && <span className="h-2 w-2 rounded-full bg-[#141b21]" />}
                        </span>
                        <div className="flex items-center gap-3 text-[17px] font-normal">
                          {step.active ? (
                            <span className="text-[#facc15]">✓</span>
                          ) : (
                            <span className="text-zinc-500">○</span>
                          )}
                          <span className={step.active ? 'text-white' : 'text-zinc-400'}>{step.label}</span>
                        </div>
                        {index < statusSteps.length - 1 && (
                          <span className={`absolute -left-[24px] top-6 h-5 w-px ${step.active ? 'bg-[#facc15]' : 'bg-zinc-600'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPickupData((value) => !value)}
                  className="mt-6 w-full rounded-[18px] bg-[#facc15] px-4 py-4 text-center text-[26px] font-bold text-black shadow-[0_0_20px_rgba(250,204,21,0.35)] transition hover:bg-[#f9d948]"
                >
                  Track Order
                </button>
              </div>

              {showPickupData && (
                <div className="mt-4 rounded-[20px] border border-[#2a2d33] bg-[#141b21] p-3 text-zinc-200">
                  <button
                    type="button"
                    onClick={() => setActiveDestination((value) => (value === 'pickup' ? 'dropoff' : 'pickup'))}
                    className="flex w-full items-center justify-between rounded-xl border border-[#2a2d33] bg-[#1a1f26] px-4 py-3 text-left text-[18px] font-medium"
                  >
                    <span>{activeDestination === 'pickup' ? 'Pickup Data' : 'Dropoff Data'}</span>
                    <span className="text-zinc-400">⌃</span>
                  </button>

                  <div className="mt-4 space-y-3 px-2 text-[16px] text-zinc-300">
                    <p className="text-[16px] leading-relaxed text-white">{activeDestination === 'pickup' ? selectedOrder.pickupAddress ?? selectedOrder.originAddress : selectedOrder.destinationAddress}</p>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <span>{selectedOrder.pickupDate ?? '14 de Octubre 2023'}</span>
                      <span>•</span>
                      <span>{selectedOrder.pickupTime ?? '10:30'}</span>
                    </div>
                    <p>{selectedOrder.pickupPhone ?? '+52 55 6789 0346'}</p>
                    <p>{selectedOrder.pickupEmail ?? 'johndoe@gmail.com'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
