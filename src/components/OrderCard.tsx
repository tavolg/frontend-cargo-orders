import React from 'react';
import { Eye, Truck } from 'lucide-react';
import type { Order } from '../types/Order';

interface OrderCardProps {
  order: Order;
  onSelect: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onSelect }) => {
  const isActive = order.statusCode ? order.statusCode >= 1 : true;
  const statusLabel = order.statusCode && order.statusCode > 1 ? 'Assigned' : 'In transit';

  return (
    <div
      className="cursor-pointer rounded-[22px] border border-[#2a2d33] bg-[#111418] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all hover:border-zinc-700"
      onClick={() => onSelect(order)}
    >
      <div className="flex items-center justify-between gap-3 text-[13px] text-zinc-300">
        <span className="font-semibold text-white">
          Order <span className="font-bold">#{order.id}</span>
        </span>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-[#2a2d33] bg-[#191d22] px-2 py-1 text-[11px] font-medium text-zinc-200">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-600 bg-[#14181d] text-[10px] text-zinc-300">
              <Truck className="h-2.5 w-2.5" />
            </span>
            {order.type}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5ea5ff]">
            <span className="h-2 w-2 rounded-full bg-[#5ea5ff]" />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="relative mt-4 border-l border-[#2d3138] pl-5">
        <div className="relative pb-3">
          <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-[#facc15] ring-4 ring-[#111418]" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Pickup</p>
              <h3 className="mt-2 text-base font-semibold text-white">{order.originCity}</h3>
              <p className="text-xs text-zinc-400">{order.originAddress}</p>
            </div>
            <span className="pt-1 text-[11px] font-mono text-zinc-400">{order.originTime}</span>
          </div>
        </div>

        <div className="relative pt-2">
          <span className="absolute -left-[27px] top-2 h-3 w-3 rounded-full bg-zinc-500 ring-4 ring-[#111418]" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Dropoff</p>
              <h3 className="mt-2 text-base font-semibold text-white">{order.destinationCity}</h3>
              <p className="text-xs text-zinc-400">{order.destinationAddress}</p>
            </div>
            <span className="pt-1 text-[11px] font-mono text-zinc-400">{order.destinationTime}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex-1 rounded-full border border-[#3a3f45] bg-[#101418] px-3 py-3 text-left text-[14px] font-semibold text-[#f4f4f5] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(order);
          }}
        >
          {isActive ? order.pickupMessage : 'Pickup completed'}
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(order);
          }}
          className="flex items-center gap-2 rounded-full bg-[#facc15] px-4 py-3 text-sm font-bold text-black shadow-[0_0_0_1px_rgba(0,0,0,0.05)] transition hover:bg-[#f9d948]"
        >
          <span>Resume</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/70 bg-black/10">
            <Eye className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>
    </div>
  );
};
