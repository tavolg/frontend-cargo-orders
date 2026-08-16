export type OrderCategory = 'Upcoming' | 'Completed' | 'Past';
export type DestinationSide = 'pickup' | 'dropoff';

export interface ContactInfo {
  name?: string;
  telephone?: string;
  email?: string;
  country_code?: string;
  rfc?: string;
}

export interface OrderDestination {
  nickname?: string;
  address?: string;
  start_date?: number | string;
  end_date?: number | string;
  contact_info?: ContactInfo;
  status?: number | string;
  status_string?: string;
  status_class?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  reference?: string;
  type: string;
  status: string;
  statusCode?: number;
  category: OrderCategory;
  originCity: string;
  originAddress: string;
  originTime: string;
  destinationCity: string;
  destinationAddress: string;
  destinationTime: string;
  pickupMessage: string;
  driverName?: string;
  cargoWeight?: string;
  driverAvatar?: string | null;
  pickupPhone?: string;
  pickupEmail?: string;
  pickupDate?: string;
  pickupTime?: string;
  pickupAddress?: string;
  activeDestination?: DestinationSide;
  pickupContactName?: string;
  dropoffContactName?: string;
  timeline?: Array<{ label: string; active: boolean }>; 
  details?: {
    pickup: { address?: string; phone?: string; email?: string; date?: string; time?: string; contactName?: string };
    dropoff: { address?: string; phone?: string; email?: string; date?: string; time?: string; contactName?: string };
  };
}
