import type { Order, OrderCategory } from '../types/Order';

const BASE_URL = 'https://129bc152-6319-4e38-b755-534a4ee46195.mock.pstmn.io';

const extractCityFromAddress = (address: string): string => {
  if (!address) return 'Ciudad';

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const fallback = parts[parts.length - 2];
    return fallback.length > 2 ? fallback : parts[parts.length - 1];
  }

  return parts[0] || 'Ciudad';
};

const formatTimestamp = (value: number | string | undefined): string => {
  if (!value) return '--:--';

  const timestamp = Number(value);
  if (Number.isNaN(timestamp)) return '--:--';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getCategoryFromStatus = (statusText: string, fallback: OrderCategory): OrderCategory => {
  const normalized = statusText.toLowerCase();

  if (normalized.includes('complet') || normalized.includes('entreg') || normalized.includes('deliver')) {
    return 'Completed';
  }

  if (normalized.includes('asign') || normalized.includes('pend') || normalized.includes('transit')) {
    return 'Upcoming';
  }

  return fallback;
};

const normalizeOrder = (item: Record<string, any>, fallbackCategory: OrderCategory = 'Upcoming'): Order => {
  const destinations = Array.isArray(item?.destinations) ? item.destinations : [];
  const pickup = destinations[0] ?? {};
  const dropoff = destinations[1] ?? pickup;
  const orderStatus = String(item?.status_string ?? item?.status ?? 'Pending');
  const statusCode = Number(item?.status ?? 0);

  const id = String(item?.order_number ?? item?._id ?? 'N/A');
  const originAddress = String(pickup?.address ?? 'Dirección no disponible');
  const destinationAddress = String(dropoff?.address ?? originAddress);

  return {
    id,
    orderNumber: id,
    reference: item?.reference_number ?? `A${id.slice(0, 4)}`,
    type: String(item?.type ?? 'FTL'),
    status: orderStatus,
    statusCode: Number.isFinite(statusCode) ? statusCode : 0,
    category: getCategoryFromStatus(orderStatus, fallbackCategory),
    originCity: extractCityFromAddress(originAddress),
    originAddress,
    originTime: formatTimestamp(pickup?.start_date ?? item?.start_date),
    destinationCity: extractCityFromAddress(destinationAddress),
    destinationAddress,
    destinationTime: formatTimestamp(dropoff?.end_date ?? dropoff?.start_date ?? item?.end_date),
    pickupMessage: String(pickup?.nickname ?? 'Its time for pickup'),
    driverName: item?.manager?.nickname ?? item?.driver?.nickname ?? 'William',
    driverAvatar: item?.driver_thumbnail ?? null,
    cargoWeight: item?.cargo?.weight?.[0]
      ? `${Number(item.cargo.weight[0]).toLocaleString()} kg`
      : item?.route?.single
        ? `${Number(item.route.single).toLocaleString()} kg`
        : undefined,
    pickupPhone: '+52 55 6789 0346',
    pickupEmail: 'johndoe@gmail.com',
    pickupDate: '14 de Octubre 2023',
    pickupTime: '10:30',
    pickupAddress: 'Isidro Fabela 10, Valle Verde y Terminal, 50140 Toluca de Lerdo, México',
    activeDestination: 'pickup',
  };
};

const normalizeResponse = (payload: unknown): Record<string, any>[] => {
  if (Array.isArray(payload)) return payload as Record<string, any>[];

  if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>;

    if (Array.isArray(candidate.result)) {
      return candidate.result as Record<string, any>[];
    }

    if (candidate.result && typeof candidate.result === 'object') {
      return [candidate.result as Record<string, any>];
    }

    return [candidate as Record<string, any>];
  }

  return [];
};

export const fetchUpcomingOrders = async (): Promise<Order[]> => {
  const response = await fetch(`${BASE_URL}/orders/upcoming`);
  if (!response.ok) throw new Error('Error al cargar pedidos próximos');

  const payload = await response.json();
  return normalizeResponse(payload).map((item) => normalizeOrder(item, 'Upcoming'));
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const response = await fetch(`${BASE_URL}/orders`);
  if (!response.ok) throw new Error('Error al cargar todos los pedidos');

  const payload = await response.json();
  return normalizeResponse(payload).map((item) => normalizeOrder(item, 'Completed'));
};
