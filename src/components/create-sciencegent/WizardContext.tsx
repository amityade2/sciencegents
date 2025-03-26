import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScienceGentFormData } from '@/types/sciencegent';
import { validateStep, wizardSteps } from '@/components/create-sciencegent/utils';
import useScienceGentCreation, { CreationStatus } from '@/hooks/useScienceGentCreation';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';

// Initial form data
const initialFormData: ScienceGentFormData = {
  name: '',
  symbol: '',
  totalSupply: '',
  description: '',
  detailedDescription: '',
  profileImage: null,
  website: '',
  twitter: '',
  github: '',
  telegram: '',
  domain: 'General Science',
  agentFee: '2',
  persona: '',
  selectedCapabilities: [],
  initialLiquidity: ''
};

interface WizardContextType {
  currentStep: number;
  formData: ScienceGentFormData;
  isLaunching: boolean;
  status: CreationStatus;
  error: string | null;
  transactionHash: string | null;
  tokenAddress: string | null;
  isSyncing: boolean;
  isDSIApproved: boolean;
  isCheckingAllowance: boolean;
  developerProfile: any;
  isLoadingProfile: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleCapabilityToggle: (capabilityId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  handleApproveAndLaunch: () => Promise<void>;
  canProceed: boolean;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const WizardProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLaunching, setIsLaunching] = useState(false);
  const [formData, setFormData] = useState<ScienceGentFormData>(initialFormData);
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  
  // Get developer profile for review step
  const { profile: developerProfile, isLoading: isLoadingProfile } = useDeveloperProfile();
  
  const {
    status,
    error,
    transactionHash,
    tokenAddress,
    isSyncing,
    createToken,
    launchFee,
    approveDSI,
    isDSIApproved
  } = useScienceGentCreation();

  // Calculate if user can proceed to next step
  const canProceed = validateStep(currentStep, formData);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  // Move to success screen when creation is successful
  useEffect(() => {
    if (status === CreationStatus.Success) {
      setCurrentStep(wizardSteps.length + 1); // Move to success screen
    }
    
    // Reset launching state when not in progress
    if (status !== CreationStatus.Creating && 
        status !== CreationStatus.ApprovingDSI && 
        status !== CreationStatus.WaitingConfirmation) {
      setIsLaunching(false);
    }
  }, [status]);

  // Navigate to details page when token is successfully synced
  useEffect(() => {
    if (status === CreationStatus.Success && tokenAddress && !isSyncing) {
      // Small delay to show success state before redirecting
      const redirectTimer = setTimeout(() => {
        navigate(`/sciencegent/${tokenAddress}`);
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [status, tokenAddress, isSyncing, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, profileImage: e.target.files?.[0] || null }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCapabilityToggle = (capabilityId: string) => {
    setFormData(prev => {
      if (prev.selectedCapabilities.includes(capabilityId)) {
        return {
          ...prev,
          selectedCapabilities: prev.selectedCapabilities.filter(id => id !== capabilityId)
        };
      } else {
        return {
          ...prev,
          selectedCapabilities: [...prev.selectedCapabilities, capabilityId]
        };
      }
    });
  };

  const nextStep = () => {
    if (currentStep < wizardSteps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleApproveAndLaunch = async () => {
    // Prevent multiple calls
    if (isLaunching) {
      console.log("Already processing, preventing duplicate call");
      return;
    }
    
    setIsLaunching(true);
    
    // First check if DSI is approved
    if (!isDSIApproved) {
      try {
        const approved = await approveDSI();
        if (!approved) {
          setIsLaunching(false);
        }
      } catch (error) {
        setIsLaunching(false);
        console.error("Failed to approve DSI:", error);
      }
    } else {
      // DSI is already approved, proceed with token creation
      try {
        // Merge developer profile data with form data if available
        const tokenData = {
          ...formData,
          // These fields are not included in the form anymore, but populated from developer profile
          developerName: developerProfile?.developer_name || '',
          developerEmail: '',
          bio: developerProfile?.bio || '',
          developerTwitter: developerProfile?.developer_twitter || '',
          developerTelegram: developerProfile?.developer_telegram || '',
          developerGithub: developerProfile?.developer_github || '',
          developerWebsite: developerProfile?.developer_website || ''
        };

        await createToken(tokenData);
      } catch (error) {
        setIsLaunching(false);
        console.error("Failed to create token:", error);
      }
    }
  };

  return (
    <WizardContext.Provider value={{
      currentStep,
      formData,
      isLaunching,
      status,
      error,
      transactionHash,
      tokenAddress,
      isSyncing,
      isDSIApproved,
      isCheckingAllowance,
      developerProfile,
      isLoadingProfile,
      handleInputChange,
      handleFileChange,
      handleSelectChange,
      handleCapabilityToggle,
      nextStep,
      prevStep,
      handleApproveAndLaunch,
      canProceed
    }}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};
