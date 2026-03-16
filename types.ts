
export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  CLIENTS = 'CLIENTS',
  FINANCE = 'FINANCE',
  ESTIMATES = 'ESTIMATES',
  TEAMS = 'TEAMS',
  LIVE = 'LIVE'
}

export type HouseType = 'APARTMENT' | 'HOUSE' | 'SINGLE_FAMILY' | 'TOWNHOUSE' | 'CONDO' | 'OFFICE';
export type MemberRole = 'LEADER' | 'DRIVER' | 'HELPER';
export type PaymentModel = 'PER_SERVICE' | 'DAILY_FIXED';
export type ServiceFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ONETIME';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface TeamMember {
  id: string;
  name: string;
  role: MemberRole;
  defaultRate: number; 
  paymentModel: PaymentModel;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  color: string;
}

export interface Payout {
  memberId: string;
  memberName: string;
  amount: number;
  model: PaymentModel;
}

export interface ClientAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  verifiedWithAI?: boolean;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  category?: 'STANDARD' | 'ROOM' | 'SPECIAL';
  beforePhoto?: string;
  afterPhoto?: string;
}

export interface ServicePhoto {
  id: string;
  type: 'BEFORE' | 'AFTER';
  url: string;
  timestamp: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address: string; 
  addressDetails: ClientAddress;
  birthday?: string;
  preferences: string[];
  cleaningInstructions?: string;
  specialRequirements?: string;
  customTasks?: string[]; 
  accessCode?: string;
  hasDog: boolean;
  extraServices: string[];
  language: 'PT' | 'EN';
  defaultPrice?: number;
  houseType?: HouseType;
  houseDetails?: {
    bedrooms: number;
    bathrooms: number;
    sqft?: number;
  };
  frequency: ServiceFrequency;
  preferredDay?: DayOfWeek;
  preferredTime?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  teamId: string;
  date: string;
  time: string;
  duration: number; 
  actualDuration?: number; 
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID' | 'RECURRING';
  amount: number;
  payouts: Payout[];
  isRecurring?: boolean;
  notes?: string;
  checkInTime?: string;
  checkOutTime?: string;
  checklist: ChecklistItem[];
  photos: ServicePhoto[];
  aiData?: {
    netProfit: number;
    taxReserve: number;
    operationalCost: number;
    mathNotes: string;
  };
}

export interface Expense {
  id: string;
  category: 'GAS' | 'SUPPLIES' | 'OTHER';
  teamId?: string;
  amount: number;
  date: string;
  description: string;
  aiVerified?: boolean;
}

export interface PricingEstimate {
  low: number;
  high: number;
  marketReasoning: string;
  competitorInsights?: string;
  sources?: { title: string; uri: string }[];
}

export interface Estimate {
  id: string;
  clientName: string;
  address: string;
  date: string;
  serviceType: 'STANDARD' | 'DEEP' | 'MOVE_IN_OUT';
  houseType: HouseType;
  frequency: ServiceFrequency;
  details: { 
    bedrooms: number; 
    bathrooms: number; 
    sqft: number;
    hasDog?: boolean;
    accessCode?: string;
    extraServices?: string[];
    cleaningInstructions?: string;
  };
  aiData: PricingEstimate;
  finalPrice: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
}

export interface RouteAnalysis {
  summary: string;
  warnings: string[];
  orderedAppointmentIds: string[];
}
