import type { Order, OrderCategory, OrderDestination } from '../types/Order';

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

const formatTimeValue = (value: number | string | undefined): string => {
  if (!value) return '--:--';

  const timestamp = Number(value);
  if (Number.isNaN(timestamp)) return '--:--';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatDateValue = (value: number | string | undefined): string => {
  if (!value) return 'Sin fecha';

  const timestamp = Number(value);
  if (Number.isNaN(timestamp)) return 'Sin fecha';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getTypeFromStatus = (text: string): string => {
  const normalized = text.toLowerCase();

  if (normalized.includes('fcl')) return 'FCL';
  if (normalized.includes('ftl')) return 'FTL';
  return 'FTL';
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

const getContactInfo = (destination?: OrderDestination) => ({
  name: destination?.contact_info?.name ?? 'Sin contacto',
  phone: destination?.contact_info?.telephone ?? '',
  email: destination?.contact_info?.email ?? '',
});

const buildTimeline = (item: Record<string, any>) => {
  const pickupStatusList = Array.isArray(item?.status_list?.pickup) ? item.status_list.pickup : [];
  const stepNames = ['Created Order', 'Accepted Order', 'Pickup set up by ', 'Pickup Completed'];
  
  // Determine el nivel alcanzado (0-4)
  let maxLevel = 0; // 0: sin nivel, 1: created, 2: accepted, 3: pickup set up, 4: completed

  // Revisar pickupStatusList
  if (pickupStatusList.length > 0) {
    const activeStates = pickupStatusList.filter((step: Record<string, any>) => step?.active);
    activeStates.forEach((step: Record<string, any>) => {
      const label = String(step?.status ?? '').toLowerCase();
      if (label.includes('creada')) maxLevel = Math.max(maxLevel, 1);
      if (label.includes('asign')) maxLevel = Math.max(maxLevel, 2);
      if (label.includes('recolecci') && label.includes('complet')) maxLevel = Math.max(maxLevel, 4);
    });
  }

  // Revisar status_string como fallback
  const fallbackStatus = String(item?.status_string ?? '').toLowerCase();
  if (fallbackStatus.includes('complet') || fallbackStatus.includes('entreg')) {
    maxLevel = Math.max(maxLevel, 4);
  } else if (fallbackStatus.includes('recolecci') && fallbackStatus.includes('pend')) {
    maxLevel = Math.max(maxLevel, 3);
  } else if (fallbackStatus.includes('asign') || fallbackStatus.includes('pend') || fallbackStatus.includes('inici')) {
    maxLevel = Math.max(maxLevel, 2);
  } else if (fallbackStatus.length > 0) {
    maxLevel = Math.max(maxLevel, 1);
  }

  const driverName = item?.driver?.nickname ?? item?.manager?.nickname ?? 'William';

  return stepNames.map((label, index) => {
    const isLabelWithName = label.includes('Pickup set up by ');
    const finalLabel = isLabelWithName ? `${label}${driverName}` : label;
    
    // Un paso está activo si el nivel alcanzado es igual o superior al índice del paso + 1
    const stepLevel = index + 1; // step 0 = level 1, step 1 = level 2, etc.
    const active = maxLevel >= stepLevel;

    return { label: finalLabel, active };
  });
};

const normalizeOrder = (item: Record<string, any>, fallbackCategory: OrderCategory = 'Upcoming'): Order => {
  const destinations = Array.isArray(item?.destinations) ? item.destinations : [];
  const pickup = destinations.find((destination: Record<string, any>) => String(destination?.nickname ?? '').toLowerCase().includes('recolecci')) ?? destinations[0] ?? {};
  const dropoff = destinations.find((destination: Record<string, any>) => String(destination?.nickname ?? '').toLowerCase().includes('entreg')) ?? destinations[1] ?? pickup;

  const id = String(item?.order_number ?? item?._id ?? 'N/A');
  const orderStatusText = String(item?.status_string ?? item?.status ?? 'Orden Asignada');
  const statusCode = Number(item?.status ?? item?.completion_percentage ?? 1);
  const originAddress = String(pickup?.address ?? item?.route?.pickup ?? 'Dirección no disponible');
  const destinationAddress = String(dropoff?.address ?? item?.route?.dropoff ?? originAddress);

  const pickupContact = getContactInfo(pickup as OrderDestination);
  const dropoffContact = getContactInfo(dropoff as OrderDestination);
  const driverName = item?.driver?.nickname ?? item?.manager?.nickname ?? 'William';
  const senderName = pickupContact.name !== 'Sin contacto' ? pickupContact.name : driverName;

  const timeline = buildTimeline(item);
  const isInTransit = /asign|transit|pend|inici|recolecci/.test(orderStatusText.toLowerCase());

  return {
    id,
    orderNumber: id,
    reference: item?.reference_number ?? `A${id.slice(0, 4)}`,
    type: String(item?.type ?? getTypeFromStatus(orderStatusText)),
    status: orderStatusText,
    statusCode: Number.isFinite(statusCode) ? statusCode : 1,
    category: getCategoryFromStatus(orderStatusText, fallbackCategory),
    originCity: extractCityFromAddress(originAddress),
    originAddress,
    originTime: formatTimeValue(pickup?.start_date ?? item?.start_date),
    destinationCity: extractCityFromAddress(destinationAddress),
    destinationAddress,
    destinationTime: formatTimeValue(dropoff?.end_date ?? dropoff?.start_date ?? item?.end_date),
    pickupMessage: isInTransit ? 'Its time for pickup' : 'Pickup completed',
    driverName,
    cargoWeight: item?.cargo?.weight?.[0]
      ? `${Number(item.cargo.weight[0]).toLocaleString()} kg`
      : item?.route?.single
        ? `${Number(item.route.single).toLocaleString()} kg`
        : undefined,
    driverAvatar: item?.driver_thumbnail ?? item?.driver?.thumbnail ?? null,
    pickupPhone: pickupContact.phone || '+52 55 6789 0346',
    pickupEmail: pickupContact.email || 'johndoe@gmail.com',
    pickupDate: formatDateValue(pickup?.start_date ?? item?.start_date),
    pickupTime: formatTimeValue(pickup?.start_date ?? item?.start_date),
    pickupAddress: pickup?.address ?? originAddress,
    activeDestination: 'pickup',
    pickupContactName: senderName,
    dropoffContactName: dropoffContact.name,
    timeline,
    details: {
      pickup: {
        address: pickup?.address ?? originAddress,
        phone: pickupContact.phone || '',
        email: pickupContact.email || '',
        date: formatDateValue(pickup?.start_date ?? item?.start_date),
        time: formatTimeValue(pickup?.start_date ?? item?.start_date),
        contactName: senderName,
      },
      dropoff: {
        address: dropoff?.address ?? destinationAddress,
        phone: dropoffContact.phone || '',
        email: dropoffContact.email || '',
        date: formatDateValue(dropoff?.start_date ?? item?.end_date),
        time: formatTimeValue(dropoff?.start_date ?? item?.end_date),
        contactName: dropoffContact.name,
      },
    },
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
