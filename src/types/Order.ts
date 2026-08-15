export type OrderCategory = 'Upcoming' | 'Completed' | 'Past';
export type DestinationSide = 'pickup' | 'dropoff';

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
}
