export interface User {
    id: string;
    phone: string;
    email?: string;
    full_name?: string;
    is_active: boolean;
    created_at: Date;
    last_login_at?: Date;
}
export interface AdminUser {
    id: string;
    full_name?: string;
    phone?: string;
    email?: string;
    password_hash?: string;
    role_id: number;
    role_name?: string;
    is_active: boolean;
    created_at: Date;
}
export interface Expert {
    id: string;
    admin_user_id: string;
    bio?: string;
    experience_years?: number;
    profile_image?: string;
    is_active: boolean;
    full_name?: string;
    phone?: string;
    email?: string;
    total_appointments?: number;
}
export interface Appointment {
    id: string;
    user_id: string;
    expert_id: string;
    mode: 'online' | 'inperson';
    start_time: Date;
    end_time: Date;
    status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
    created_by: string;
    payment_id?: string;
    google_meet_link?: string;
    created_at: Date;
    patient_name?: string;
    patient_phone?: string;
    expert_name?: string;
    amount?: number;
    payment_status?: string;
}
export interface Payment {
    id: string;
    user_id: string;
    appointment_id: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    amount: number;
    currency: string;
    status: string;
    created_at: Date;
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
    id: string;
    expert_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    mode?: string;
}
export interface ExpertPricing {
    id: string;
    expert_id: string;
    mode: string;
    price: number;
}
//# sourceMappingURL=index.d.ts.map