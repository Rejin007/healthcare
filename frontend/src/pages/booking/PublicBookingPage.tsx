import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Expert } from '../../types';
import BookingFlow from './BookingFlow';
import { useAuth } from '../../App';

/**
 * PublicBookingPage
 * ─────────────────
 * Entry point for unauthenticated users who click "Book Now" on the home page.
 * Reads the pre-selected expert from sessionStorage, then renders BookingFlow
 * with no logged-in user. BookingFlow will insert an AccountSetupPage step
 * so the patient can register or sign in mid-flow, then continue to payment.
 *
 * After payment + auto-login, navigates to /patient dashboard.
 */
const PublicBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [initialExpert, setInitialExpert] = useState<Expert | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If already fully logged in as a patient → just start booking (no account step)
    // The BookingFlow handles skipping the account step when currentUser is set.

    // Read pre-selected expert from sessionStorage (set in Home.tsx handleBookNow)
    const raw = sessionStorage.getItem('pendingBookingExpert');
    if (raw) {
      try {
        setInitialExpert(JSON.parse(raw));
      } catch {
        setInitialExpert(null);
      }
    }
    setReady(true);
  }, []);

  // Called by BookingFlow's AccountSetupPage when the user creates/logs into an account
  const handleLogin = (token: string, newUser: any) => {
    login(token, newUser);
  };

  // Called when booking + payment are complete
  const handleDone = (appointmentId?: string) => {
    sessionStorage.removeItem('pendingBookingExpert');
    // Navigate to patient dashboard (highlight the new appointment if id provided)
    navigate('/patient', { state: { newApptId: appointmentId } });
  };

  if (!ready) return null;

  return (
    <BookingFlow
      user={user}                    // null if not logged in → triggers account step
      onBackToDashboard={handleDone}
      initialExpert={initialExpert}  // pre-selected from homepage, or null → shows list
      onLogin={handleLogin}
    />
  );
};

export default PublicBookingPage;
