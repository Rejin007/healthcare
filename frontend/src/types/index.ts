export interface User {
  id: string;
  phone: string;
  email?: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  role_name?: string;
}

export interface Expert {
  id: string;
  admin_user_id?: string;
  bio?: string;
  experience_years?: number;
  profile_image?: string;
  is_active?: boolean;
  full_name?: string;
  phone?: string;
  email?: string;
  total_appointments?: number;
  availability?: ExpertAvailability[];
  pricing?: ExpertPricing[];
}

export interface Patient {
  id: string;
  phone: string;
  email?: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface Appointment {
  id: string;
  user_id?: string;
  expert_id?: string;
  mode: 'online' | 'inperson';
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  created_by?: string;
  payment_id?: string;
  google_meet_link?: string;
  created_at?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  expert_name?: string;
  amount?: number;
  payment_status?: string;
}

export interface DashboardStats {
  total_patients: number;
  active_experts: number;
  total_appointments: number;
  total_revenue: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
}

export interface ExpertAvailability {
  id?: string;
  expert_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  mode?: string;
}

export interface ExpertPricing {
  id?: string;
  expert_id?: string;
  mode: string;
  price: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
