import React from 'react';
import { MainLayout } from './src/layouts/MainLayout';
import DiscoveryFeature from './src/features/discovery/DiscoveryFeature';
import GenerationFeature from './src/features/generation/GenerationFeature';
import ContentLibraryFeature from './src/features/content-library/ContentLibraryFeature';
import type { TabName } from './src/types';
import { ToastProvider } from './src/context/ToastContext';
import { NavigationProvider, useNavigation } from './src/context/NavigationContext';
import { CurriculumProvider } from './src/context/CurriculumContext';
import { ContentLibraryProvider } from './src/context/ContentLibraryContext';

const PANELS: Record<TabName, React.ComponentType> = {
  'Discovery': DiscoveryFeature,
  'Generation': GenerationFeature,
  'Library': ContentLibraryFeature,
};

const ActivePanel: React.FC = () => {
  const { activeTab } = useNavigation();

  return (
    <>
      {Object.entries(PANELS).map(([tabName, Component]) => (
        <div key={tabName} className={activeTab === tabName ? 'animate-fadeIn' : 'hidden'}>
          <Component />
        </div>
      ))}
    </>
  );
};

const AppContent: React.FC = () => {
  return (
    <MainLayout>
      <ActivePanel />
    </MainLayout>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <NavigationProvider>
        <CurriculumProvider>
          <ContentLibraryProvider>
            <AppContent />
          </ContentLibraryProvider>
        </CurriculumProvider>
      </NavigationProvider>
    </ToastProvider>
  );
};

export default App;
