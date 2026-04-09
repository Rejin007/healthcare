import React, { useState } from 'react';
import { Expert } from '../../types';
import CliniciansListPage from './CliniciansListPage';
import SessionDetailsPage, { SessionDetails } from './SessionDetailsPage';
import ConfirmDetailsPage from './ConfirmDetailsPage';
import PaymentPage from './PaymentPage';
import BookingSuccessPage from './BookingSuccessPage';

type BookingStep = 'list' | 'session' | 'confirm' | 'payment' | 'success';

interface BookingFlowProps {
  user: any;
  onBackToDashboard: () => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ user, onBackToDashboard }) => {
  const [step,           setStep]           = useState<BookingStep>('list');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [appointmentId,  setAppointmentId]  = useState<string>('');

  const handleSelectClinician = (expert: Expert) => {
    setSelectedExpert(expert);
    setStep('session');
  };

  const handleSessionDone = (details: SessionDetails) => {
    setSessionDetails(details);
    setStep('confirm');
  };

  const handleConfirm = () => setStep('payment');

  const handlePaySuccess = (apptId: string) => {
    setAppointmentId(apptId);
    setStep('success');
  };

  switch (step) {
    case 'list':
      return <CliniciansListPage onSelectClinician={handleSelectClinician} />;

    case 'session':
      return (
        <SessionDetailsPage
          expert={selectedExpert!}
          user={user}                        // ← pass user for booked-date check
          onBack={() => setStep('list')}
          onNext={handleSessionDone}
        />
      );

    case 'confirm':
      return (
        <ConfirmDetailsPage
          expert={selectedExpert!}
          session={sessionDetails!}
          user={user}
          onBack={() => setStep('session')}
          onNext={handleConfirm}
        />
      );

    case 'payment':
      return (
        <PaymentPage
          expert={selectedExpert!}
          session={sessionDetails!}
          user={user}
          onBack={() => setStep('confirm')}
          onSuccess={handlePaySuccess}
        />
      );

    case 'success':
      return (
        <BookingSuccessPage
          expert={selectedExpert!}
          session={sessionDetails!}
          appointmentId={appointmentId}
          onViewDashboard={onBackToDashboard}
          onBookAnother={() => {
            setSelectedExpert(null);
            setSessionDetails(null);
            setStep('list');
          }}
        />
      );

    default:
      return null;
  }
};

export default BookingFlow;
