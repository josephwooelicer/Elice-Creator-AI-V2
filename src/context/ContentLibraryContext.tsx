
import React, { createContext, useContext, ReactNode, useState } from 'react';
import type { ContentItem } from '../types';
import { useLocalStorage } from '../hooks';

interface ContentLibraryContextType {
  contentLibrary: ContentItem[];
  addContentItem: (item: ContentItem) => void;
  updateContentItem: (item: ContentItem) => void;
  deleteContentItem: (id: number) => void;
  activeContentItem: ContentItem | null;
  setActiveContentItem: (item: ContentItem | null) => void;
}

const ContentLibraryContext = createContext<ContentLibraryContextType | undefined>(undefined);

export const ContentLibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contentLibrary, setContentLibrary] = useLocalStorage<ContentItem[]>('eliceCreatorAIContentLibrary', []);
  const [activeContentItem, setActiveContentItem] = useState<ContentItem | null>(null);

  const addContentItem = (item: ContentItem) => {
    // Add new item to the beginning of the list
    setContentLibrary(prevContent => [item, ...prevContent]);
  };
  
  const updateContentItem = (updatedItem: ContentItem) => {
    setContentLibrary(prevContent =>
      prevContent.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const deleteContentItem = (id: number) => {
    setContentLibrary(prevContent => prevContent.filter(item => item.id !== id));
  };

  const value = {
    contentLibrary,
    addContentItem,
    updateContentItem,
    deleteContentItem,
    activeContentItem,
    setActiveContentItem,
  };

  return <ContentLibraryContext.Provider value={value}>{children}</ContentLibraryContext.Provider>;
};

export const useContentLibrary = (): ContentLibraryContextType => {
  const context = useContext(ContentLibraryContext);
  if (context === undefined) {
    throw new Error('useContentLibrary must be used within a ContentLibraryProvider');
  }
  return context;
};
