


import { useState, useEffect, useRef } from 'react';
import { fetchTrendingTopics, generateCurriculum, fetchTrendingCapstoneTopics, generateCapstoneProjects } from '../../../api';
import type { Curriculum, GenerateCurriculumResponse, CapstoneProject } from '../../../types';
import { discoveryFilters, industries } from '../../../config';
import { useLocalStorage, useCancellableAction } from '../../../hooks';
import type { GenerateCapstoneProjectsResponse } from '../../../api/generateCapstoneProjects';
import { useToast } from '../../../context/ToastContext';

type ViewState = 'idle' | 'loading' | 'results';
type DiscoveryType = 'course' | 'project';

const DISCOVERY_CURRICULUM_CACHE_KEY = 'eliceCreatorAIDiscoveryCache';
const DISCOVERY_PROJECT_CACHE_KEY = 'eliceCreatorAIProjectCache';

export const useDiscovery = () => {
  const [discoveryType, setDiscoveryType] = useState<DiscoveryType>('project');
  const [searchValue, setSearchValue] = useState('');
  const [view, setView] = useState<ViewState>('idle');
  
  const [cachedCurriculumResults, setCachedCurriculumResults] = useLocalStorage<GenerateCurriculumResponse | null>(DISCOVERY_CURRICULUM_CACHE_KEY, null);
  const [cachedProjectResults, setCachedProjectResults] = useLocalStorage<GenerateCapstoneProjectsResponse | null>(DISCOVERY_PROJECT_CACHE_KEY, null);

  const [curriculumResults, setCurriculumResults] = useState<Curriculum[]>(cachedCurriculumResults?.curriculums || []);
  const [projectResults, setProjectResults] = useState<CapstoneProject[]>([]);
  const [agentThoughts, setAgentThoughts] = useState<string[]>(cachedCurriculumResults?.agentThoughts || cachedProjectResults?.agentThoughts || []);
  
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [isFetchingTopics, setIsFetchingTopics] = useState(true);
  const [progress, setProgress] = useState(0);
  const isCancelledRef = useRef(false);
  const { addToast } = useToast();

  const initialFilters = discoveryFilters.reduce((acc, filter) => {
    const defaultOption = filter.options.find(opt => opt.default) || filter.options[0];
    acc[filter.id] = defaultOption.value;
    return acc;
  }, {} as { [key: string]: string });

  const [filters, setFilters] = useState(initialFilters);
  
  const [selectedIndustry, setSelectedIndustry] = useState(() => {
    const defaultIndustry = industries.find(i => i.default) || industries[0];
    return defaultIndustry.value;
  });

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterId]: value,
    }));
  };

  const handleIndustryChange = (industry: string) => {
    setSelectedIndustry(industry);
  };
  
  useEffect(() => {
    if (cachedCurriculumResults) {
      setDiscoveryType('course');
      setCurriculumResults(cachedCurriculumResults.curriculums);
      setAgentThoughts(cachedCurriculumResults.agentThoughts);
      setView('results');
      setIsFetchingTopics(false);
    } else if (cachedProjectResults) {
      setDiscoveryType('project');
      const fullProjects: CapstoneProject[] = cachedProjectResults.projects.map((p, index) => ({
          ...p,
          id: Date.now() + index,
          industry: selectedIndustry,
          detailedDescription: '',
      }));
      setProjectResults(fullProjects);
      setAgentThoughts(cachedProjectResults.agentThoughts);
      setView('results');
      setIsFetchingTopics(false);
    }
  }, [cachedCurriculumResults, cachedProjectResults]);
  
  useEffect(() => {
    if (view === 'idle') {
      const loadTrendingTopics = async () => {
        setIsFetchingTopics(true);
        setTrendingTopics([]);
        const topics = await (discoveryType === 'course' ? fetchTrendingTopics(selectedIndustry) : fetchTrendingCapstoneTopics(selectedIndustry));
        setTrendingTopics(topics);
        setIsFetchingTopics(false);
      };
      loadTrendingTopics();
    }
  }, [view, selectedIndustry, discoveryType]);

  const handleStartDiscovery = async () => {
    if (searchValue.trim() === '') return;
    
    isCancelledRef.current = false;
    setProgress(0);
    setView('loading');
    try {
      const onProgressCallback = (p: number) => {
        if (!isCancelledRef.current) {
          setProgress(p);
        }
      };

      if (discoveryType === 'course') {
        const response = await generateCurriculum(searchValue, filters, onProgressCallback);
        if (isCancelledRef.current) return;
        setCurriculumResults(response.curriculums);
        setAgentThoughts(response.agentThoughts);
        setCachedCurriculumResults(response);
        setCachedProjectResults(null);
      } else {
        const response = await generateCapstoneProjects(searchValue, selectedIndustry, onProgressCallback);
        if (isCancelledRef.current) return;

        const fullProjects: CapstoneProject[] = response.projects.map((p, index) => ({
            ...p,
            id: Date.now() + index,
            industry: selectedIndustry,
            detailedDescription: `This project is about ${p.title}. A more detailed description will be generated in the next step.`,
        }));
        setProjectResults(fullProjects);
        setAgentThoughts(response.agentThoughts);
        setCachedProjectResults(response);
        setCachedCurriculumResults(null);
      }
      
      setTimeout(() => {
        if (!isCancelledRef.current) {
          setView('results');
        }
      }, 500);

    } catch (error) {
      if (isCancelledRef.current) {
        console.log('Discovery was cancelled.');
        return;
      }
      console.error("Error generating discovery data:", error);
      
      if (error instanceof Error && error.message.startsWith('JSON_PARSE_ERROR')) {
        addToast("The AI returned a response in an unexpected format. Please try again.", { type: 'error' });
      } else {
        addToast("An unexpected error occurred during discovery. Please try again.", { type: 'error' });
      }

      setView('idle');
      setProgress(0);
    }
  };

  const confirmCancelAction = () => {
    isCancelledRef.current = true;
    setView('idle');
    setProgress(0);
  };
  
  const {
    isModalOpen: isCancelModalOpen,
    open: handleCancelDiscovery,
    close: closeCancelModal,
    confirm: confirmCancelDiscovery,
  } = useCancellableAction(confirmCancelAction);


  const handleNewSearch = () => {
    isCancelledRef.current = true;
    setCachedCurriculumResults(null);
    setCachedProjectResults(null);
    setSearchValue('');
    setCurriculumResults([]);
    setProjectResults([]);
    setAgentThoughts([]);
    setSelectedIndustry(() => {
      const defaultIndustry = industries.find(i => i.default) || industries[0];
      return defaultIndustry.value;
    });
    setView('idle');
    setProgress(0);
  };

  return {
    view,
    discoveryType,
    setDiscoveryType,
    searchValue,
    setSearchValue,
    curriculumResults,
    projectResults,
    agentThoughts,
    trendingTopics,
    isFetchingTopics,
    progress,
    filters,
    handleFilterChange,
    selectedIndustry,
    handleIndustryChange,
    handleStartDiscovery,
    handleNewSearch,
    handleCancelDiscovery,
    isCancelModalOpen,
    confirmCancelDiscovery,
    closeCancelModal,
  };
};