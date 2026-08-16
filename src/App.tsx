import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Avatar } from './components/Avatar';
import { fetchAllOrders, fetchUpcomingOrders } from './services/api';
import type { Order } from './types/Order';
import NotificationIcon from './assets/Notification.svg';
import ArrowIcon from './assets/Image-1.svg';
import EyeIcon from './assets/Image.svg';
import TruckIcon from './assets/g1149.svg';
import TruckFtlIcon from './assets/g1149_FTL.svg';
import FclIcon from './assets/Group 26_fcl.svg';
import StepDoneIcon from './assets/Group 32.svg';
import StepPendingIcon from './assets/Group 5.svg';
import PickupPinIcon from './assets/g2355.svg';
import DropoffPinIcon from './assets/Group 27.svg';

const TABS = ['Upcoming', 'Completed', 'Past'] as const;
type Tab = (typeof TABS)[number];

const getTypeIcon = (type: string) => {
  const normalized = (type ?? '').toUpperCase();
  if (normalized === 'FCL') return FclIcon;
  if (normalized === 'FTL') return TruckFtlIcon;
  return TruckIcon;
};

const isInTransitStatus = (status: string) => /asign|transit|pend|recolecci/.test(status);

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
    <div className="flex min-h-screen items-center justify-center bg-[#060606] p-4 text-white">
      <div
        className="relative flex h-[1078px] w-[440px] select-none flex-col overflow-hidden rounded-[42px] border border-[#2a2a2a] bg-[#090909] p-5 shadow-[0_0_0_4px_rgba(255,255,255,0.04),0_30px_60px_rgba(0,0,0,0.8)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-24 rounded-full bg-[#2f3237]" />

        {!selectedOrder && (
          <>
            <header className="mb-4 flex items-center justify-between">
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/5">
                <img src={ArrowIcon} alt="back" className="h-5 w-5" />
              </button>

              <h1 className="text-[19px] font-bold tracking-[-0.02em]">Cargo Orders</h1>

              <div className="relative flex h-8 w-8 items-center justify-center">
                <img src={NotificationIcon} alt="notification" className="h-5 w-5" />
                <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#FFEE00]" />
              </div>
            </header>

            <nav className="mb-4 flex items-center justify-between border-b border-[#2a2d33] pb-2 text-[15px]">
              {TABS.map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-2 font-semibold transition-colors ${activeTab === tab ? 'text-[#FFEE00]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {tab}
                  {activeTab === tab && <span className="absolute -bottom-[9px] left-0 h-[2px] w-full rounded-full bg-[#FFEE00]" />}
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
                className="w-full rounded-xl border border-[#2a2d33] bg-[#171b20] py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-[#FFEE00]/60 focus:outline-none"
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
                filteredOrders.map((order) => {
                  const typeIcon = getTypeIcon(order.type);
                  const inTransit = isInTransitStatus(order.status);
                  const showPickupButton = !inTransit;

                  return (
                    <article key={order.id} className="-mx-5 px-5">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#dfe4eb]">
                        Order #{order.id}
                      </div>

                      <div className="rounded-[20px] border border-[#2a2d33] bg-[#11161b] overflow-hidden flex flex-col">
                        <div className="px-4 pt-4 pb-3 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <img src={typeIcon} alt={order.type} className="h-7 w-7 object-contain" />
                              <span className="text-[16px] font-medium text-white">{order.type}</span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-medium text-[#83d7ff]">
                              <span className="h-2.5 w-2.5 rounded-full bg-[#5ea5ff]" />
                              <span>{inTransit ? 'In transit' : 'Assigned'}</span>
                            </div>
                          </div>

                          <div className="relative border-l border-[#2a2d33] pl-5 mt-4">
                            <div className="pb-4">
                              <div className="absolute -left-[12px] top-1.5 flex h-5 w-5 items-center justify-center">
                                <img src={PickupPinIcon} alt="pickup" className="h-4 w-4" />
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a9198]">Pickup</p>
                                  <p className="mt-2 text-base font-semibold text-white">{order.originCity}</p>
                                  <p className="mt-1 text-xs text-[#a8afb6]">{order.originAddress}</p>
                                </div>
                                <span className="pt-1 text-[10px] text-[#a8afb6]">{order.originTime}</span>
                              </div>
                            </div>

                            <div className="pt-1">
                              <div className="absolute -left-[12px] top-[84px] flex h-5 w-5 items-center justify-center">
                                <img src={DropoffPinIcon} alt="dropoff" className="h-4 w-4" />
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a9198]">Dropoff</p>
                                  <p className="mt-2 text-base font-semibold text-white">{order.destinationCity}</p>
                                  <p className="mt-1 text-xs text-[#a8afb6]">{order.destinationAddress}</p>
                                </div>
                                <span className="pt-1 text-[10px] text-[#a8afb6]">{order.destinationTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 -mx-4 -mb-4 px-4 pb-4 pt-3">
                          {showPickupButton && (
                            <div className="flex-1 bg-[#FFEE00] px-6 py-2.5 text-sm font-bold text-black rounded-full flex items-center justify-center">
                              {order.pickupMessage}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className={`flex items-center justify-center gap-2 bg-[#FFEE00] px-6 py-2.5 text-sm font-bold text-black rounded-full ${showPickupButton ? 'flex-1' : 'w-full'}`}
                          >
                            <span>Resume</span>
                            <img src={EyeIcon} alt="view" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="py-10 text-center text-sm text-zinc-500">No se encontraron órdenes para esta búsqueda.</div>
              )}
            </main>
          </>
        )}

        {selectedOrder && (
          <div className="flex min-h-0 flex-1 animate-[fadeIn_0.25s_ease-out] flex-col overflow-hidden rounded-[42px] bg-[#000000] p-5 transition-all duration-300">
            <div className="mb-4 flex items-center justify-between">
              <button type="button" onClick={() => setSelectedOrder(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800/60">
                <img src={ArrowIcon} alt="back" className="h-5 w-5" />
              </button>
              <h2 className="text-[19px] font-bold tracking-[-0.02em]">Cargo Details</h2>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80">
                <img src={NotificationIcon} alt="notification" className="h-4 w-4" />
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
                    <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-[#FFEE00] ring-4 ring-[#141b21]" />
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

              <div className="mt-12 rounded-[24px] border border-[#2a2d33] bg-[#141b21] px-5 pb-5 pt-0 relative">
                <div className="flex justify-center -mt-8 mb-4 relative z-10">
                  <Avatar size="lg" src={selectedOrder.driverAvatar ?? undefined} />
                </div>
                <p className="text-center text-[38px] font-bold tracking-[0.02em]">10:30 PM</p>

                <div className="mt-5 pl-4">
                  <div className="relative ml-1 border-l border-[#2d3238] pl-7">
                    {selectedOrder.timeline?.map((step, index) => {
                      const StepIcon = step.active ? StepDoneIcon : StepPendingIcon;
                      return (
                        <div key={`${step.label}-${index}`} className="relative pb-5 last:pb-0">
                          <span className={`absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${step.active ? 'border-[#141b21] bg-[#FFEE00]' : 'border-zinc-400 bg-[#1c2127]'}`}>
                            <img src={StepIcon} alt="step" className="h-3 w-3" />
                          </span>
                          <div className="flex items-center gap-3 text-[17px] font-normal">
                            <span className={step.active ? 'text-white' : 'text-zinc-400'}>{step.label}</span>
                          </div>
                          {index < (selectedOrder.timeline?.length ?? 0) - 1 && (
                            <span className={`absolute -left-[24px] top-6 h-5 w-px ${step.active ? 'bg-[#FFEE00]' : 'bg-zinc-600'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPickupData((value) => !value)}
                  className="mt-6 w-[calc(100%+40px)] -mx-5 -mb-5 rounded-none bg-[#FFEE00] px-5 py-4 text-center text-[26px] font-bold text-black shadow-[0_0_20px_rgba(255,238,0,0.35)] transition hover:bg-[#ffeb3b]"
                >
                  Track Order
                </button>
              </div>

              {showPickupData && (
                <div className="mt-4 rounded-[20px] border border-black bg-[#000000] p-3 text-zinc-200">
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
