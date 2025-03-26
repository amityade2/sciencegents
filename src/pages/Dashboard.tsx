
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import NavHeader from '@/components/layout/NavHeader';
import Footer from '@/components/layout/Footer';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { useWallet } from '@/hooks/useWallet';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const Dashboard = () => {
  const { tab } = useParams();
  const { isConnected, connect, address } = useWallet();
  
  // If a tab param exists, use it as the initial tab
  const initialTab = tab || 'investments';

  if (isConnected === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavHeader />
        <div className="container py-12 pt-24 flex-grow">
          <div className="max-w-md mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-blue-100 p-6">
                <Loader2 className="h-10 w-10 text-science-600 animate-spin" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Checking Wallet Status</h1>
            <p className="text-muted-foreground mb-8">
              Please wait while we check your wallet connection...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavHeader />
        <div className="container py-12 pt-24 flex-grow">
          <div className="max-w-md mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-blue-100 p-6">
                <Wallet className="h-10 w-10 text-science-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-8">
              Connect your wallet to view your ScienceGents dashboard, including your investments,
              created ScienceGents, and capabilities.
            </p>
            <Button 
              size="lg" 
              className="w-full bg-science-600 hover:bg-science-700 text-white" 
              onClick={connect}
            >
              Connect Wallet
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Use Navigate for tab routing
  if (tab && tab !== initialTab) {
    return <Navigate to={`/dashboard/${initialTab}`} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavHeader />
      <div className="container mx-auto px-4 py-6 pt-24 flex-grow">
        <DashboardHeader userName="User Name" />
        <div className="bg-white rounded-lg border overflow-hidden">
          <DashboardTabs initialTab={initialTab} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
