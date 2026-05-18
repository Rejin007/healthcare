import React, { useState } from 'react';
import { Expert } from '../../types';
import CliniciansListPage from './CliniciansListPage';
import SessionDetailsPage, { SessionDetails } from './SessionDetailsPage';
import AccountSetupPage from './AccountSetupPage';
import ConfirmDetailsPage from './ConfirmDetailsPage';
import PaymentPage from './PaymentPage';

type BookingStep = 'list' | 'session' | 'account' | 'confirm' | 'payment';

interface BookingFlowProps {
  user: any;
  onBackToDashboard: (appointmentId?: string) => void;
  initialExpert?: Expert | null;
  onLogin?: (token: string, user: any) => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({
  user: initialUser,
  onBackToDashboard,
  initialExpert = null,
  onLogin,
}) => {
  const startStep: BookingStep = initialExpert ? 'session' : 'list';

  const [step,           setStep]           = useState<BookingStep>(startStep);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(initialExpert);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [currentUser,    setCurrentUser]    = useState<any>(initialUser);

  const handleSelectClinician = (expert: Expert) => {
    setSelectedExpert(expert);
    setStep('session');
  };

  const handleSessionDone = (details: SessionDetails) => {
    setSessionDetails(details);
    if (currentUser) {
      setStep('confirm');
    } else {
      setStep('account');
    }
  };

  const handleAccountSuccess = (user: any, token: string) => {
    setCurrentUser(user);
    if (onLogin) onLogin(token, user);
    setStep('confirm');
  };

  const handleConfirm = () => setStep('payment');

  const handlePaySuccess = (apptId: string) => {
    onBackToDashboard(apptId);
  };

  switch (step) {
    case 'list':
      return (
        <CliniciansListPage
          onSelectClinician={handleSelectClinician}
          onBack={() => onBackToDashboard()}
        />
      );

    case 'session':
      return (
        <SessionDetailsPage
          expert={selectedExpert!}
          user={currentUser}
          onBack={() => initialExpert ? onBackToDashboard() : setStep('list')}
          onNext={handleSessionDone}
        />
      );

    case 'account':
      return (
        <AccountSetupPage
          onBack={() => setStep('session')}
          onSuccess={handleAccountSuccess}
        />
      );

    case 'confirm':
      return (
        <ConfirmDetailsPage
          expert={selectedExpert!}
          session={sessionDetails!}
          user={currentUser}
          onBack={() => (currentUser && currentUser === initialUser) ? setStep('session') : setStep('account')}
          onNext={handleConfirm}
        />
      );

    case 'payment':
      return (
        <PaymentPage
          expert={selectedExpert!}
          session={sessionDetails!}
          user={currentUser}
          onBack={() => setStep('confirm')}
          onSuccess={handlePaySuccess}
        />
      );

    default:
      return null;
  }
};

export default BookingFlow;