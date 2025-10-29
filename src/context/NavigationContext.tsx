
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { TabName } from '../types';

interface NavigationContextType {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
  navigateTo: (tab: TabName) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabName>('Discovery');
  
  const navigateTo = useCallback((tab: TabName) => {
    setActiveTab(tab);
  }, []);

  const value = {
    activeTab,
    setActiveTab,
    navigateTo,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
