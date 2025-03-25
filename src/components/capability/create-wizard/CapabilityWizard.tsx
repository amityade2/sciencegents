
import React from 'react';
import { CapabilityWizardProvider, useCapabilityWizard, wizardSteps } from './CapabilityWizardContext';
import WizardLayout from './WizardLayout';
import BasicInfo from './steps/BasicInfo';
import DetailedDescription from './steps/DetailedDescription';
import UploadDocuments from './steps/UploadDocuments';
import PersonalDetails from './steps/PersonalDetails';
import Review from './steps/Review';

// This component uses the context, so it must be wrapped by the provider
const WizardStepRenderer: React.FC = () => {
  const { currentStep } = useCapabilityWizard();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfo />;
      case 2:
        return <DetailedDescription />;
      case 3:
        return <UploadDocuments />;
      case 4:
        return <PersonalDetails />;
      case 5:
        return <Review />;
      default:
        return null;
    }
  };

  return (
    <div>
      {renderStep()}
    </div>
  );
};

// Inner component that has access to the context
const WizardContent: React.FC = () => {
  const wizardContext = useCapabilityWizard();
  
  return (
    <WizardLayout>
      <WizardStepRenderer />
    </WizardLayout>
  );
};

// The main component that provides the context
const CapabilityWizard: React.FC = () => {
  return (
    <CapabilityWizardProvider>
      <WizardContent />
    </CapabilityWizardProvider>
  );
};

export default CapabilityWizard;
