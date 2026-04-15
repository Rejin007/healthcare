import React, { useState } from 'react';
import { Expert } from '../../types';
import CliniciansListPage from './CliniciansListPage';
import SessionDetailsPage, { SessionDetails } from './SessionDetailsPage';
import ConfirmDetailsPage from './ConfirmDetailsPage';
import PaymentPage from './PaymentPage';

type BookingStep = 'list' | 'session' | 'confirm' | 'payment';

interface BookingFlowProps {
  user: any;
  onBackToDashboard: (appointmentId?: string) => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ user, onBackToDashboard }) => {
  const [step,           setStep]           = useState<BookingStep>('list');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);

  const handleSelectClinician = (expert: Expert) => {
    setSelectedExpert(expert);
    setStep('session');
  };

  const handleSessionDone = (details: SessionDetails) => {
    setSessionDetails(details);
    setStep('confirm');
  };

  const handleConfirm = () => setStep('payment');

  // Payment done → go straight to dashboard; pass appointmentId so it can be highlighted
  const handlePaySuccess = (apptId: string) => {
    onBackToDashboard(apptId);
  };

  switch (step) {
    case 'list':
      return <CliniciansListPage onSelectClinician={handleSelectClinician} />;

    case 'session':
      return (
        <SessionDetailsPage
          expert={selectedExpert!}
          user={user}
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

    default:
      return null;
  }
};

export default BookingFlow;
