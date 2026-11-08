export type UserRole = 'STUDENT' | 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

export type BusStatus = 'IDLE' | 'BOARDING' | 'EN_ROUTE' | 'COMPLETED' | 'PROBLEM';

export interface RouteStop {
  id: string;
  name: string;
  landmark: string;
  order: number;
  scheduledTime: string;
  actualArrival?: string;
  actualDeparture?: string;
  status: 'PENDING' | 'CURRENT' | 'COMPLETED';
}

export interface ShuttleBus {
  id: number;
  number: string;
  capacity: number;
  routeId: number;
  routeName: string;
  driverId: number;
  driverName: string;
  destination: string;
  status: BusStatus;
  bayNumber: string;
  departureTime: string;
  lat: number;
  lng: number;
  heading: number;
  speedKmH: number;
  isSimulated: boolean;
  bookedSeats: number;
  walkInPassengers: number;
  currentStopIndex: number;
  stops: RouteStop[];
  problemNote?: string;
}

export interface CityBus {
  id: string;
  routeNumber: string;
  operator: 'BMTC' | 'KSRTC';
  source: string;
  destination: string;
  departureTime: string;
  departureTimeRaw?: string;
  frequency: string;
  via: string;
}

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  busId: number;
  busNumber: string;
  destination: string;
  seatNumber: number;
  travelType: 'NORMAL' | 'EMERGENCY';
  bookingTime: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'BOARDED';
  bayNumber: string;
}

export interface EmergencyRequest {
  id: string;
  studentId: string;
  studentName: string;
  destination: string;
  reason: string;
  latitude?: number;
  longitude?: number;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedBusId?: number;
  assignedBusNumber?: string;
  createdAt: string;
  notes?: string;
}

export interface BayAnnouncement {
  id: string;
  busNumber: string;
  destination: string;
  bayNumber: string;
  message: string;
  severity: 'INFO' | 'APPROACHING' | 'BOARDING' | 'DEPARTED';
  etaMinutes: number;
  timestamp: string;
  chimePlayed?: boolean;
}
