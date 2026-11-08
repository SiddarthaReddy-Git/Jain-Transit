import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ShuttleBus, Booking, EmergencyRequest, BayAnnouncement, CityBus, BusStatus } from '../types/transit';
import { playTransitChime } from '../utils/audioChime';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

interface TransitContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: { email: string; pass: string; fullName: string; phone?: string }) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logout: () => void;
  buses: ShuttleBus[];
  cityBuses: CityBus[];
  bookings: Booking[];
  emergencies: EmergencyRequest[];
  announcements: BayAnnouncement[];
  activeAnnouncement: BayAnnouncement | null;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  playChimeManually: () => void;
  // Student Actions
  createBooking: (busId: number, destination: string, travelType: 'NORMAL' | 'EMERGENCY') => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  createEmergencyRequest: (destination: string, reason: string, lat?: number, lng?: number) => Promise<EmergencyRequest>;
  // Driver Actions
  driverAdvanceStop: (busId: number, stopIndex: number, action: 'ARRIVE' | 'DEPART') => Promise<void>;
  driverAdjustOccupancy: (busId: number, delta: number) => Promise<void>;
  driverSetTripStatus: (busId: number, status: BusStatus, problem?: string) => Promise<void>;
  driverBroadcastGps: (busId: number, lat: number, lng: number, heading?: number) => Promise<void>;
  // Admin Actions
  adminAddBus: (bus: { number: string; capacity: number; routeName: string; destination: string; driverName: string; bayNumber: string }) => Promise<void>;
  adminRemoveBus: (busId: number) => Promise<void>;
  adminTriageEmergency: (requestId: string, action: 'ACKNOWLEDGE' | 'ASSIGN' | 'START' | 'COMPLETE' | 'CANCEL', busId?: number) => Promise<void>;
  adminCancelBooking: (bookingId: string) => Promise<void>;
}

const STORAGE_KEY = 'jain_transit_v2_store';

const DEFAULT_USERS: User[] = [
  { id: 'u_student_1', email: 'student@jaintransit.edu', fullName: 'Aarav Sharma', phone: '+91 98450 12345', role: 'STUDENT' },
  { id: 'u_student_2', email: 'student2@jaintransit.edu', fullName: 'Priya Patel', phone: '+91 98450 67890', role: 'STUDENT' },
  { id: 'u_driver_1', email: 'driver1@jaintransit.edu', fullName: 'Ramesh Gowda', phone: '+91 94480 11223', role: 'DRIVER' },
  { id: 'u_driver_5', email: 'driver5@jaintransit.edu', fullName: 'Sunil Kumar', phone: '+91 94480 44556', role: 'DRIVER' },
  { id: 'u_admin_1', email: 'admin@jaintransit.edu', fullName: 'Campus Transport Officer', phone: '+91 80 4646 9000', role: 'ADMIN' },
];

const INITIAL_BUSES: ShuttleBus[] = [
  {
    id: 1,
    number: 'JT-01',
    capacity: 32,
    routeId: 101,
    routeName: 'Jain University → Bengaluru (Kanakapura Corridor)',
    driverId: 1,
    driverName: 'Ramesh Gowda',
    destination: 'Bengaluru',
    status: 'EN_ROUTE',
    bayNumber: 'Bay 2 (South Gate)',
    departureTime: '08:00 AM',
    lat: 12.6560,
    lng: 77.4410,
    heading: 18,
    speedKmH: 38,
    isSimulated: false,
    bookedSeats: 18,
    walkInPassengers: 7,
    currentStopIndex: 1,
    stops: [
      { id: 's1', name: 'Jain University Campus Terminal', landmark: 'Main Admin Bay', order: 1, scheduledTime: '08:00 AM', actualArrival: '07:55 AM', actualDeparture: '08:02 AM', status: 'COMPLETED' },
      { id: 's2', name: 'Kanakapura Cross Checkpost', landmark: 'Highway Toll', order: 2, scheduledTime: '08:18 AM', actualArrival: '08:17 AM', status: 'CURRENT' },
      { id: 's3', name: 'Harohalli Town Circle', landmark: 'Police Station Junction', order: 3, scheduledTime: '08:35 AM', status: 'PENDING' },
      { id: 's4', name: 'Art of Living Ashram Gate', landmark: 'Kaggalipura Hub', order: 4, scheduledTime: '08:55 AM', status: 'PENDING' },
      { id: 's5', name: 'Thalaghattapura Metro Station', landmark: 'Green Line Terminal', order: 5, scheduledTime: '09:12 AM', status: 'PENDING' },
      { id: 's6', name: 'Banashankari TTMC Hub', landmark: 'Bengaluru South Interchange', order: 6, scheduledTime: '09:35 AM', status: 'PENDING' },
    ],
  },
  {
    id: 2,
    number: 'JT-02',
    capacity: 36,
    routeId: 102,
    routeName: 'Jain University → Bengaluru (Express Shuttles)',
    driverId: 2,
    driverName: 'Mohan Das',
    destination: 'Bengaluru',
    status: 'BOARDING',
    bayNumber: 'Bay 1 (North Gate)',
    departureTime: '08:45 AM',
    lat: 12.6515,
    lng: 77.4392,
    heading: 0,
    speedKmH: 0,
    isSimulated: true,
    bookedSeats: 21,
    walkInPassengers: 5,
    currentStopIndex: 0,
    stops: [
      { id: 's21', name: 'Jain University Campus Terminal', landmark: 'Bay 1', order: 1, scheduledTime: '08:45 AM', status: 'CURRENT' },
      { id: 's22', name: 'Harohalli Industrial Area', landmark: 'KIADB Gate 2', order: 2, scheduledTime: '09:05 AM', status: 'PENDING' },
      { id: 's23', name: 'Kanakapura Bypass', landmark: 'Flyover North', order: 3, scheduledTime: '09:25 AM', status: 'PENDING' },
      { id: 's24', name: 'Bengaluru Central Majestic', landmark: 'Platform 18', order: 4, scheduledTime: '10:05 AM', status: 'PENDING' },
    ],
  },
  {
    id: 3,
    number: 'JT-03',
    capacity: 28,
    routeId: 103,
    routeName: 'Jain University → Harohalli Local Feeder',
    driverId: 3,
    driverName: 'Anil Reddy',
    destination: 'Harohalli',
    status: 'BOARDING',
    bayNumber: 'Bay 3 (West Bay)',
    departureTime: '08:30 AM',
    lat: 12.6512,
    lng: 77.4390,
    heading: 90,
    speedKmH: 0,
    isSimulated: true,
    bookedSeats: 22,
    walkInPassengers: 5, // 27/28 full!
    currentStopIndex: 0,
    stops: [
      { id: 's31', name: 'Jain University Campus Terminal', landmark: 'Bay 3', order: 1, scheduledTime: '08:30 AM', status: 'CURRENT' },
      { id: 's32', name: 'Hostel Block 4 & 5', landmark: 'Campus Loop', order: 2, scheduledTime: '08:35 AM', status: 'PENDING' },
      { id: 's33', name: 'Harohalli Bus Stand', landmark: 'Town Market', order: 3, scheduledTime: '08:50 AM', status: 'PENDING' },
    ],
  },
  {
    id: 4,
    number: 'JT-04',
    capacity: 32,
    routeId: 104,
    routeName: 'Jain University → Bengaluru Late Morning Run',
    driverId: 4,
    driverName: 'Kishore V.',
    destination: 'Bengaluru',
    status: 'IDLE',
    bayNumber: 'Bay 2 (South Gate)',
    departureTime: '09:30 AM',
    lat: 12.6510,
    lng: 77.4385,
    heading: 0,
    speedKmH: 0,
    isSimulated: true,
    bookedSeats: 6,
    walkInPassengers: 0,
    currentStopIndex: 0,
    stops: [
      { id: 's41', name: 'Jain University Campus Terminal', landmark: 'Bay 2', order: 1, scheduledTime: '09:30 AM', status: 'PENDING' },
      { id: 's42', name: 'Kaggalipura Junction', landmark: 'Main Road', order: 2, scheduledTime: '10:00 AM', status: 'PENDING' },
      { id: 's43', name: 'Yelachenahalli Metro', landmark: 'South Gate', order: 3, scheduledTime: '10:30 AM', status: 'PENDING' },
    ],
  },
  {
    id: 5,
    number: 'JT-05',
    capacity: 30,
    routeId: 105,
    routeName: 'Jain University → Harohalli Regular Shuttles',
    driverId: 5,
    driverName: 'Sunil Kumar',
    destination: 'Harohalli',
    status: 'EN_ROUTE',
    bayNumber: 'Bay 4 (Express Lane)',
    departureTime: '08:15 AM',
    lat: 12.6710,
    lng: 77.4480,
    heading: 195,
    speedKmH: 42,
    isSimulated: true,
    bookedSeats: 14,
    walkInPassengers: 2,
    currentStopIndex: 1,
    stops: [
      { id: 's51', name: 'Jain University Campus Terminal', landmark: 'Bay 4', order: 1, scheduledTime: '08:15 AM', actualArrival: '08:12 AM', actualDeparture: '08:16 AM', status: 'COMPLETED' },
      { id: 's52', name: 'Bettahalli Gate', landmark: 'Highway Cross', order: 2, scheduledTime: '08:24 AM', actualArrival: '08:25 AM', status: 'CURRENT' },
      { id: 's53', name: 'Harohalli Bus Stand', landmark: 'Main Stand', order: 3, scheduledTime: '08:40 AM', status: 'PENDING' },
    ],
  },
];

const INITIAL_CITY_BUSES: CityBus[] = [
  { id: 'cb1', routeNumber: '211-C', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (KR Market)', departureTime: '07:45 AM', departureTimeRaw: '0745', frequency: 'Morning Express', via: 'Harohalli, Kaggalipura, Banashankari TTMC' },
  { id: 'cb2', routeNumber: '211-G', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (Banashankari TTMC)', departureTime: '08:25 AM', departureTimeRaw: '0825', frequency: 'Peak Shuttle', via: 'Harohalli Cross, Thalaghattapura Metro' },
  { id: 'cb3', routeNumber: '213-B', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (Kempegowda / Majestic)', departureTime: '09:15 AM', departureTimeRaw: '0915', frequency: 'Direct Express', via: 'Kaggalipura, Banashankari, City Market' },
  { id: 'cb4', routeNumber: '211-C', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (KR Market)', departureTime: '10:15 AM', departureTimeRaw: '1015', frequency: 'Corridor Regular', via: 'Harohalli, Kaggalipura, Metro Green Line' },
  { id: 'cb5', routeNumber: 'KSRTC Exp', operator: 'KSRTC', source: 'Jain University Gate', destination: 'Bengaluru (Satellite Bus Stand)', departureTime: '11:25 AM', departureTimeRaw: '1125', frequency: 'Intercity Express', via: 'Harohalli Bypass, Mysore Road Satellite' },
  { id: 'cb6', routeNumber: '211-G', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (Banashankari TTMC)', departureTime: '11:55 AM', departureTimeRaw: '1155', frequency: 'Midday Connect', via: 'Thalaghattapura Metro, Konanakunte Cross' },
  { id: 'cb7', routeNumber: '213-B', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (Kempegowda / Majestic)', departureTime: '01:00 PM', departureTimeRaw: '1300', frequency: 'Afternoon Run', via: 'Kanakapura Corridor, Banashankari, Lalbagh' },
  { id: 'cb8', routeNumber: '211-C', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (KR Market)', departureTime: '03:00 PM', departureTimeRaw: '1500', frequency: 'Campus Return', via: 'Harohalli, Kaggalipura, Metro Green Line' },
  { id: 'cb9', routeNumber: '211-G', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (Banashankari TTMC)', departureTime: '04:00 PM', departureTimeRaw: '1600', frequency: 'Evening Peak 1', via: 'Thalaghattapura Metro Station, Banashankari' },
  { id: 'cb10', routeNumber: '211-M', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (Banashankari / Silk Board)', departureTime: '04:50 PM', departureTimeRaw: '1650', frequency: 'Evening Peak 2', via: 'Harohalli, Kaggalipura, Banashankari' },
  { id: 'cb11', routeNumber: 'KSRTC Exp', operator: 'KSRTC', source: 'Jain University Gate', destination: 'Bengaluru (Satellite Bus Stand)', departureTime: '05:35 PM', departureTimeRaw: '1735', frequency: 'Intercity Express', via: 'Harohalli Bypass, Kengeri, Mysore Road' },
  { id: 'cb12', routeNumber: '211-C', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (KR Market)', departureTime: '06:20 PM', departureTimeRaw: '1820', frequency: 'Dusk Service', via: 'Kaggalipura, Thalaghattapura Metro' },
  { id: 'cb13', routeNumber: '211-G', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (Banashankari TTMC)', departureTime: '07:15 PM', departureTimeRaw: '1915', frequency: 'Night Shuttle', via: 'Metro Green Line, Banashankari' },
  { id: 'cb14', routeNumber: '213-B', operator: 'BMTC', source: 'Jain University Gate', destination: 'Bengaluru (Kempegowda / Majestic)', departureTime: '08:10 PM', departureTimeRaw: '2010', frequency: 'Last Gate Departure', via: 'Harohalli, Banashankari, Central Station' },
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'BK-1001',
    studentId: 'u_student_1',
    studentName: 'Aarav Sharma',
    busId: 1,
    busNumber: 'JT-01',
    destination: 'Bengaluru',
    seatNumber: 12,
    travelType: 'NORMAL',
    bookingTime: 'Today 07:15 AM',
    status: 'CONFIRMED',
    bayNumber: 'Bay 2 (South Gate)',
  },
  {
    id: 'BK-1002',
    studentId: 'u_student_2',
    studentName: 'Priya Patel',
    busId: 2,
    busNumber: 'JT-02',
    destination: 'Bengaluru',
    seatNumber: 8,
    travelType: 'NORMAL',
    bookingTime: 'Today 07:45 AM',
    status: 'CONFIRMED',
    bayNumber: 'Bay 1 (North Gate)',
  },
];

const INITIAL_EMERGENCIES: EmergencyRequest[] = [
  {
    id: 'SOS-201',
    studentId: 'u_student_1',
    studentName: 'Aarav Sharma',
    destination: 'Bengaluru (Fortis Hospital Bannerghatta)',
    reason: 'Medical consultation following lab sprain; need scheduled transport back before 11 AM.',
    latitude: 12.6525,
    longitude: 77.4412,
    status: 'ASSIGNED',
    assignedBusId: 4,
    assignedBusNumber: 'JT-04',
    createdAt: 'Today 07:30 AM',
    notes: 'Transport supervisor assigned JT-04 standby at Bay 2.',
  },
];

const INITIAL_ANNOUNCEMENTS: BayAnnouncement[] = [
  {
    id: 'ann-1',
    busNumber: 'JT-01',
    destination: 'Bengaluru',
    bayNumber: 'Bay 2',
    message: 'JT-01 is en route to Bengaluru. Arriving at Kanakapura Cross in 3 minutes.',
    severity: 'APPROACHING',
    etaMinutes: 3,
    timestamp: 'Just now',
  },
  {
    id: 'ann-2',
    busNumber: 'JT-02',
    destination: 'Bengaluru',
    bayNumber: 'Bay 1',
    message: 'JT-02 boarding commenced at North Gate Bay 1. Departure at 08:45 AM.',
    severity: 'BOARDING',
    etaMinutes: 12,
    timestamp: '2 mins ago',
  },
];

const TransitContext = createContext<TransitContextType | null>(null);

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or fall back to defaults
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
      return saved ? JSON.parse(saved) : DEFAULT_USERS[0]; // Default to student
    } catch {
      return DEFAULT_USERS[0];
    }
  });

  const [buses, setBuses] = useState<ShuttleBus[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_buses`);
      return saved ? JSON.parse(saved) : INITIAL_BUSES;
    } catch {
      return INITIAL_BUSES;
    }
  });

  const [cityBuses] = useState<CityBus[]>(INITIAL_CITY_BUSES);

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_bookings`);
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_emergencies`);
      return saved ? JSON.parse(saved) : INITIAL_EMERGENCIES;
    } catch {
      return INITIAL_EMERGENCIES;
    }
  });

  const [announcements, setAnnouncements] = useState<BayAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [activeAnnouncement, setActiveAnnouncement] = useState<BayAnnouncement | null>(INITIAL_ANNOUNCEMENTS[0]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(currentUser));
    } catch (e) {
      console.warn(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_buses`, JSON.stringify(buses));
    } catch (e) {
      console.warn(e);
    }
  }, [buses]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_bookings`, JSON.stringify(bookings));
    } catch (e) {
      console.warn(e);
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_emergencies`, JSON.stringify(emergencies));
    } catch (e) {
      console.warn(e);
    }
  }, [emergencies]);

  // Firestore real-time listeners for live synchronization across users
  useEffect(() => {
    let unsubBookings = () => {};
    let unsubEmergencies = () => {};

    try {
      unsubBookings = onSnapshot(
        collection(db, 'bookings'),
        snapshot => {
          if (!snapshot.empty) {
            const list: Booking[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as Booking;
              list.push(data);
            });
            setBookings(prev => {
              const map = new Map<string, Booking>();
              prev.forEach(b => map.set(b.id, b));
              list.forEach(b => map.set(b.id, b));
              return Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
            });
          }
        },
        err => console.warn('Bookings firestore listener:', err.message)
      );
    } catch (e) {
      console.warn('Init bookings listener error:', e);
    }

    try {
      unsubEmergencies = onSnapshot(
        collection(db, 'emergencies'),
        snapshot => {
          if (!snapshot.empty) {
            const list: EmergencyRequest[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data() as EmergencyRequest;
              list.push(data);
            });
            setEmergencies(prev => {
              const map = new Map<string, EmergencyRequest>();
              prev.forEach(e => map.set(e.id, e));
              list.forEach(e => map.set(e.id, e));
              return Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
            });
          }
        },
        err => console.warn('Emergencies firestore listener:', err.message)
      );
    } catch (e) {
      console.warn('Init emergencies listener error:', e);
    }

    return () => {
      unsubBookings();
      unsubEmergencies();
    };
  }, []);

  const playChimeManually = useCallback(() => {
    playTransitChime();
  }, []);

  // Google Sign-In with Firebase Auth
  const signInWithGoogle = async (): Promise<User> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email || 'student@jaintransit.edu';
      let role: 'STUDENT' | 'DRIVER' | 'ADMIN' = 'STUDENT';
      if (email.includes('driver')) role = 'DRIVER';
      if (email.includes('admin')) role = 'ADMIN';

      const userObj: User = {
        id: res.user.uid,
        email,
        fullName: res.user.displayName || email.split('@')[0],
        role,
        phone: res.user.phoneNumber || undefined,
      };

      setCurrentUser(userObj);

      try {
        await setDoc(
          doc(db, 'users', res.user.uid),
          {
            uid: res.user.uid,
            email: userObj.email,
            fullName: userObj.fullName,
            role: userObj.role,
            phone: userObj.phone || null,
            photoURL: res.user.photoURL || null,
            lastLogin: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('Firestore user save:', fsErr);
      }

      return userObj;
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      throw err;
    }
  };

  // Login handler
  const login = async (email: string, pass: string): Promise<User> => {
    // Seeded accounts accept Transit@123 or any password for testing convenience
    const found = DEFAULT_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      return found;
    }
    // Generic login matching role prefix
    let role: 'STUDENT' | 'DRIVER' | 'ADMIN' = 'STUDENT';
    if (email.includes('driver')) role = 'DRIVER';
    if (email.includes('admin')) role = 'ADMIN';

    const newUser: User = {
      id: `u_${Date.now()}`,
      email,
      fullName: email.split('@')[0].toUpperCase(),
      role,
    };
    setCurrentUser(newUser);
    return newUser;
  };

  // Register handler
  const register = async (data: { email: string; pass: string; fullName: string; phone?: string }): Promise<User> => {
    const newUser: User = {
      id: `u_${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      role: 'STUDENT',
    };
    setCurrentUser(newUser);
    return newUser;
  };

  const logout = () => {
    fbSignOut(auth).catch(() => {});
    setCurrentUser(null);
  };

  // Student booking
  const createBooking = async (busId: number, destination: string, travelType: 'NORMAL' | 'EMERGENCY'): Promise<Booking> => {
    const bus = buses.find(b => b.id === busId);
    if (!bus) throw new Error('Selected shuttle not found.');

    const totalOccupied = bus.bookedSeats + bus.walkInPassengers;
    if (totalOccupied >= bus.capacity) {
      throw new Error(`Shuttle ${bus.number} is completely full (${bus.capacity}/${bus.capacity} seats taken).`);
    }

    const nextSeat = totalOccupied + 1;
    const newBooking: Booking = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: currentUser?.id || 'guest_student',
      studentName: currentUser?.fullName || 'Student Rider',
      busId: bus.id,
      busNumber: bus.number,
      destination,
      seatNumber: nextSeat,
      travelType,
      bookingTime: 'Just now',
      status: 'CONFIRMED',
      bayNumber: bus.bayNumber,
    };

    setBookings(prev => [newBooking, ...prev]);

    // Update bus booked count
    setBuses(prev => prev.map(b => b.id === busId ? { ...b, bookedSeats: b.bookedSeats + 1 } : b));

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'bookings', newBooking.id), newBooking);
    } catch (fsErr) {
      console.warn('Firestore booking persist:', fsErr);
    }

    return newBooking;
  };

  const cancelBooking = async (bookingId: string) => {
    const bk = bookings.find(b => b.id === bookingId);
    if (!bk) return;
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
    setBuses(prev => prev.map(b => b.id === bk.busId ? { ...b, bookedSeats: Math.max(0, b.bookedSeats - 1) } : b));

    try {
      await setDoc(doc(db, 'bookings', bookingId), { status: 'CANCELLED' }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore cancel booking:', fsErr);
    }
  };

  // Emergency request
  const createEmergencyRequest = async (destination: string, reason: string, lat?: number, lng?: number): Promise<EmergencyRequest> => {
    const newReq: EmergencyRequest = {
      id: `SOS-${Math.floor(200 + Math.random() * 800)}`,
      studentId: currentUser?.id || 'emergency_student',
      studentName: currentUser?.fullName || 'Student Commuter',
      destination,
      reason,
      latitude: lat,
      longitude: lng,
      status: 'PENDING',
      createdAt: 'Just now',
    };
    setEmergencies(prev => [newReq, ...prev]);

    try {
      await setDoc(doc(db, 'emergencies', newReq.id), newReq);
    } catch (fsErr) {
      console.warn('Firestore emergency persist:', fsErr);
    }

    return newReq;
  };

  // Driver Stop Progression
  const driverAdvanceStop = async (busId: number, stopIndex: number, action: 'ARRIVE' | 'DEPART') => {
    setBuses(prev => prev.map(bus => {
      if (bus.id !== busId) return bus;

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const updatedStops = bus.stops.map((stop, idx) => {
        if (idx === stopIndex) {
          if (action === 'ARRIVE') {
            return { ...stop, actualArrival: nowTime, status: 'CURRENT' as const };
          } else {
            return { ...stop, actualDeparture: nowTime, status: 'COMPLETED' as const };
          }
        }
        if (action === 'DEPART' && idx === stopIndex + 1) {
          return { ...stop, status: 'CURRENT' as const };
        }
        return stop;
      });

      const nextStopIdx = action === 'DEPART' ? Math.min(bus.stops.length - 1, stopIndex + 1) : stopIndex;
      const isTripComplete = action === 'DEPART' && stopIndex === bus.stops.length - 1;

      return {
        ...bus,
        currentStopIndex: nextStopIdx,
        status: isTripComplete ? 'COMPLETED' : 'EN_ROUTE',
        stops: updatedStops,
      };
    }));

    // Trigger bay departure / approach announcement
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      const currentStop = bus.stops[stopIndex];
      const newAnn: BayAnnouncement = {
        id: `ann-${Date.now()}`,
        busNumber: bus.number,
        destination: bus.destination,
        bayNumber: bus.bayNumber,
        message: action === 'ARRIVE'
          ? `${bus.number} has arrived at ${currentStop?.name || 'intermediate stop'}. Boarding open.`
          : `${bus.number} departed ${currentStop?.name || 'stop'} and is moving towards next corridor leg.`,
        severity: action === 'ARRIVE' ? 'BOARDING' : 'APPROACHING',
        etaMinutes: action === 'ARRIVE' ? 0 : 8,
        timestamp: 'Just now',
      };
      setAnnouncements(prev => [newAnn, ...prev.slice(0, 8)]);
      setActiveAnnouncement(newAnn);
      if (soundEnabled) {
        playTransitChime();
      }
    }
  };

  // Driver Occupancy Stepper
  const driverAdjustOccupancy = async (busId: number, delta: number) => {
    setBuses(prev => prev.map(bus => {
      if (bus.id !== busId) return bus;
      const currentWalkIn = bus.walkInPassengers || 0;
      const newWalkIn = Math.max(0, currentWalkIn + delta);
      // Cap at total capacity minus booked
      const maxAllowed = bus.capacity - bus.bookedSeats;
      const clamped = Math.min(newWalkIn, Math.max(0, maxAllowed + 5)); // Allow a few standing passengers
      return {
        ...bus,
        walkInPassengers: clamped,
      };
    }));
  };

  // Driver Trip Status (Start, Pause, End, Problem)
  const driverSetTripStatus = async (busId: number, status: BusStatus, problem?: string) => {
    setBuses(prev => prev.map(bus => {
      if (bus.id !== busId) return bus;
      return {
        ...bus,
        status,
        problemNote: problem,
      };
    }));
  };

  // Driver GPS Broadcaster
  const driverBroadcastGps = async (busId: number, lat: number, lng: number, heading = 0) => {
    setBuses(prev => prev.map(bus => {
      if (bus.id !== busId) return bus;
      return {
        ...bus,
        lat,
        lng,
        heading,
        isSimulated: false,
      };
    }));
  };

  // Admin Actions
  const adminAddBus = async (busData: { number: string; capacity: number; routeName: string; destination: string; driverName: string; bayNumber: string }) => {
    const newBus: ShuttleBus = {
      id: Date.now(),
      number: busData.number,
      capacity: busData.capacity,
      routeId: Math.floor(100 + Math.random() * 900),
      routeName: busData.routeName,
      driverId: Math.floor(10 + Math.random() * 90),
      driverName: busData.driverName,
      destination: busData.destination,
      status: 'IDLE',
      bayNumber: busData.bayNumber,
      departureTime: '10:00 AM',
      lat: 12.6515,
      lng: 77.4390,
      heading: 0,
      speedKmH: 0,
      isSimulated: true,
      bookedSeats: 0,
      walkInPassengers: 0,
      currentStopIndex: 0,
      stops: [
        { id: `s_${Date.now()}_1`, name: 'Jain University Campus Terminal', landmark: busData.bayNumber, order: 1, scheduledTime: '10:00 AM', status: 'PENDING' },
        { id: `s_${Date.now()}_2`, name: `${busData.destination} Terminus`, landmark: 'Arrival Platform', order: 2, scheduledTime: '10:45 AM', status: 'PENDING' },
      ],
    };
    setBuses(prev => [...prev, newBus]);
  };

  const adminRemoveBus = async (busId: number) => {
    setBuses(prev => prev.filter(b => b.id !== busId));
  };

  const adminTriageEmergency = async (requestId: string, action: 'ACKNOWLEDGE' | 'ASSIGN' | 'START' | 'COMPLETE' | 'CANCEL', busId?: number) => {
    setEmergencies(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      let newStatus = req.status;
      let assignedNumber = req.assignedBusNumber;

      if (action === 'ACKNOWLEDGE') newStatus = 'ACKNOWLEDGED';
      if (action === 'ASSIGN') {
        newStatus = 'ASSIGNED';
        const b = buses.find(x => x.id === busId);
        assignedNumber = b?.number || 'Special Shuttle';
      }
      if (action === 'START') newStatus = 'IN_PROGRESS';
      if (action === 'COMPLETE') newStatus = 'COMPLETED';
      if (action === 'CANCEL') newStatus = 'CANCELLED';

      return {
        ...req,
        status: newStatus,
        assignedBusId: busId ?? req.assignedBusId,
        assignedBusNumber: assignedNumber,
      };
    }));
  };

  const adminCancelBooking = async (bookingId: string) => {
    cancelBooking(bookingId);
  };

  // Subtle real-time simulation tick for buses on the move
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prev => prev.map(bus => {
        if (bus.status !== 'EN_ROUTE') return bus;
        // Minor delta for realistic GPS live feel
        const latDelta = (Math.random() - 0.48) * 0.0003;
        const lngDelta = (Math.random() - 0.48) * 0.0003;
        return {
          ...bus,
          lat: bus.lat + latDelta,
          lng: bus.lng + lngDelta,
          speedKmH: Math.floor(32 + Math.random() * 14),
        };
      }));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <TransitContext.Provider
      value={{
        currentUser,
        login,
        register,
        signInWithGoogle,
        logout,
        buses,
        cityBuses,
        bookings,
        emergencies,
        announcements,
        activeAnnouncement,
        soundEnabled,
        setSoundEnabled,
        playChimeManually,
        createBooking,
        cancelBooking,
        createEmergencyRequest,
        driverAdvanceStop,
        driverAdjustOccupancy,
        driverSetTripStatus,
        driverBroadcastGps,
        adminAddBus,
        adminRemoveBus,
        adminTriageEmergency,
        adminCancelBooking,
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export const useTransit = () => {
  const ctx = useContext(TransitContext);
  if (!ctx) throw new Error('useTransit must be used within a TransitProvider');
  return ctx;
};
