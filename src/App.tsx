import React, { useState, useEffect } from 'react';
import { db, seedAdvisoryCacheIfNeeded, getCurrentFarm } from './db';
import { Farm } from './types';
import { Header } from './components/common/Header';
import { BottomNav, NavTab } from './components/common/BottomNav';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { CropsModule } from './components/crops/CropsModule';
import { AnimalsModule } from './components/animals/AnimalsModule';
import { FarmChatModule } from './components/farmchat/FarmChatModule';
import { MoreModule } from './components/more/MoreModule';
import { AppLockScreen } from './components/security/AppLockScreen';
import { AppLockSetupModal } from './components/security/AppLockSetupModal';
import { Sprout, Loader2 } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // App Lock Security State
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const isEnabled = localStorage.getItem('farmpro_app_lock_enabled') === 'true';
    const hasPin = Boolean(localStorage.getItem('farmpro_app_lock_pin'));
    return isEnabled && hasPin;
  });
  const [showPinSetupModal, setShowPinSetupModal] = useState<boolean>(false);

  // Navigation deep-linking params
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

  useEffect(() => {
    async function initApp() {
      try {
        await seedAdvisoryCacheIfNeeded();
        const farm = await getCurrentFarm();
        if (farm) {
          setCurrentFarm(farm);
        }
      } catch (err) {
        console.error('Failed to initialize local farm database:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initApp();
  }, []);

  const handleOnboardingComplete = (newFarm: Farm) => {
    setCurrentFarm(newFarm);
    setActiveTab('home');
  };

  const handleSelectCrop = (cropId: string) => {
    setSelectedCropId(cropId);
    setActiveTab('crops');
  };

  const handleSelectAnimal = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setActiveTab('animals');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-2xl bg-farm-cyan/20 text-farm-cyan flex items-center justify-center mb-4 animate-pulse">
          <Sprout className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
          Farm Pro
        </h1>
        <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-farm-cyan" />
          <span>Opening offline database...</span>
        </div>
      </div>
    );
  }

  // If no farm registered yet, show radical 2-step onboarding
  if (!currentFarm) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-farm-cyan selection:text-farm-navy">
      {/* Top Header with connectivity pill and language quick switcher */}
      <Header
        farm={currentFarm}
        onOpenSettings={() => setActiveTab('more')}
      />

      {/* Main Screen View */}
      <main className="flex-1 w-full animate-in fade-in duration-150">
        {activeTab === 'home' && (
          <HomeDashboard
            farm={currentFarm}
            onChangeTab={setActiveTab}
            onSelectCrop={handleSelectCrop}
            onSelectAnimal={handleSelectAnimal}
          />
        )}

        {activeTab === 'crops' && (
          <CropsModule
            farm={currentFarm}
            selectedCycleId={selectedCropId}
            onClearSelectedCrop={() => setSelectedCropId(null)}
          />
        )}

        {activeTab === 'animals' && (
          <AnimalsModule
            farm={currentFarm}
            selectedAnimalId={selectedAnimalId}
            onClearSelectedAnimal={() => setSelectedAnimalId(null)}
          />
        )}

        {activeTab === 'farmchat' && (
          <FarmChatModule farm={currentFarm} />
        )}

        {activeTab === 'more' && (
          <MoreModule
            farm={currentFarm}
            onFarmUpdated={(updated) => setCurrentFarm(updated)}
            onResetComplete={() => {
              setCurrentFarm(null);
              setActiveTab('home');
            }}
            onLockApp={() => setIsAppLocked(true)}
          />
        )}
      </main>

      {/* Persistent 5-item Bottom Navigation Bar (Icon + Word always together) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (tab !== 'crops') setSelectedCropId(null);
          if (tab !== 'animals') setSelectedAnimalId(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 4-Digit App Lock Screen Overlay */}
      {isAppLocked && (
        <AppLockScreen
          onUnlock={() => setIsAppLocked(false)}
          onPinResetSuccess={() => {
            setIsAppLocked(false);
            setShowPinSetupModal(true);
          }}
        />
      )}

      {/* Post-PIN-Reset New PIN Setup Flow */}
      {showPinSetupModal && (
        <AppLockSetupModal
          isOpen={showPinSetupModal}
          mode="setup"
          onClose={() => setShowPinSetupModal(false)}
          onSuccess={() => setShowPinSetupModal(false)}
        />
      )}
    </div>
  );
}
