import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { Curriculum, CapstoneProject } from '../types';
import { useLocalStorage } from '../hooks';

const LAST_CURRICULUM_KEY = 'eliceCreatorAILastCurriculum';
const LAST_GENERATED_CURRICULUM_KEY = 'eliceCreatorAILastGeneratedCurriculum';


interface CurriculumContextType {
  // From discovery, passed to generation
  selectedCurriculum: Curriculum | null;
  setSelectedCurriculum: (curriculum: Curriculum | null) => void;
  // Used by generation settings
  currentCurriculum: Curriculum | null;
  setCurrentCurriculum: (curriculum: Curriculum | null) => void;
  // The curriculum used for the last generation result
  generatedCurriculum: Curriculum | null;
  setGeneratedCurriculum: (curriculum: Curriculum | null) => void;
  // From discovery, passed to capstone assets generation
  selectedCapstoneProject: CapstoneProject | null;
  setSelectedCapstoneProject: (project: CapstoneProject | null) => void;
  startGenerationImmediately: boolean;
  setStartGenerationImmediately: (start: boolean) => void;
}

const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined);

export const CurriculumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [currentCurriculum, setCurrentCurriculum] = useLocalStorage<Curriculum | null>(LAST_CURRICULUM_KEY, null);
  const [generatedCurriculum, setGeneratedCurriculum] = useLocalStorage<Curriculum | null>(LAST_GENERATED_CURRICULUM_KEY, null);
  const [selectedCapstoneProject, setSelectedCapstoneProject] = useState<CapstoneProject | null>(null);
  const [startGenerationImmediately, setStartGenerationImmediately] = useState<boolean>(false);

  const value = {
    selectedCurriculum,
    setSelectedCurriculum,
    currentCurriculum,
    setCurrentCurriculum,
    generatedCurriculum,
    setGeneratedCurriculum,
    selectedCapstoneProject,
    setSelectedCapstoneProject,
    startGenerationImmediately,
    setStartGenerationImmediately,
  };

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>;
};

export const useCurriculum = (): CurriculumContextType => {
  const context = useContext(CurriculumContext);
  if (context === undefined) {
    throw new Error('useCurriculum must be used within a CurriculumProvider');
  }
  return context;
};
