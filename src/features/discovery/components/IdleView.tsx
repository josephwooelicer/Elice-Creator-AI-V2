import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Search, Rocket } from '../../../components/icons/index';
import { Tag, Select, Button, CardButton } from '../../../components/ui';
import { discoveryFilters, industries, appConfig } from '../../../config';
import { TrendingTopicsLoader } from '../../../components/loaders/TrendingTopicsLoader';

export const IdleView: React.FC<{
  discoveryType: 'course' | 'project';
  setDiscoveryType: (type: 'course' | 'project') => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  onStartDiscovery: () => void;
  trendingTopics: string[];
  isFetchingTopics: boolean;
  filters: { [key: string]: string };
  onFilterChange: (filterId: string, value: string) => void;
  selectedIndustry: string;
  onIndustryChange: (industry: string) => void;
}> = ({ 
  discoveryType, setDiscoveryType, searchValue, setSearchValue, onStartDiscovery, trendingTopics, isFetchingTopics,
  filters, onFilterChange, selectedIndustry, onIndustryChange
}) => {
  const [animationClass, setAnimationClass] = useState('animate-fadeIn');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Automatically focus the search input when the view becomes active.
    searchInputRef.current?.focus();
  }, []);

  const handleTypeChange = (newType: 'course' | 'project') => {
    if (discoveryType === newType) return;

    // When switching to 'project', slide out left
    // When switching to 'course', slide out right
    const slideOutClass = newType === 'project' ? 'animate-slideOutToLeft' : 'animate-slideOutToRight';
    setAnimationClass(slideOutClass);
    
    setTimeout(() => {
        setDiscoveryType(newType);
        // When 'project' is new, slide in from right
        // When 'course' is new, slide in from left
        const slideInClass = newType === 'project' ? 'animate-slideInFromRight' : 'animate-slideInFromLeft';
        setAnimationClass(slideInClass);
    }, 400); // Corresponds to animation duration
  };

  const handleDiscoverySubmit = useCallback(() => {
    if (searchValue.trim()) {
        onStartDiscovery();
    }
  }, [searchValue, onStartDiscovery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            handleDiscoverySubmit();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDiscoverySubmit]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          handleDiscoverySubmit();
      }
  };

  const placeholderText = discoveryType === 'course' 
    ? "Enter a topic for a new course... e.g., 'Project-based learning for React beginners'"
    : "Enter a topic for a new project... e.g., 'Real-time data visualization'";

  const buttonText = discoveryType === 'course' ? 'Start Discovery' : 'Discover Projects';
  const headerText = discoveryType === 'course' ? 'Explore a Universe of Knowledge' : 'Discover Your Next Project';
  const subHeaderText = discoveryType === 'course'
    ? "Let our AI assistant discover relevant content, spark new ideas, and accelerate your curriculum creation."
    : "Let our AI assistant propose industry-relevant projects, spark new ideas, and accelerate your creation.";


  return (
    <div className={`bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl mx-auto border border-slate-100 ${animationClass}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{headerText}</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">{subHeaderText}</p>
      </div>
      
      <div className="relative my-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder={placeholderText}
          className="flex-grow w-full pl-10 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-0 focus:ring-primary-focus focus:border-primary-focus placeholder-slate-400"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
      </div>

      {discoveryType === 'course' && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {discoveryFilters.map(filter => (
                <Select
                  key={filter.id}
                  label={filter.label}
                  id={filter.id}
                  value={filters[filter.id]}
                  onChange={(e) => onFilterChange(filter.id, e.target.value)}
                >
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              ))}
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex justify-center items-center gap-2 mb-4">
          <p className="text-sm text-slate-500">Or, start with a trending {discoveryType === 'course' ? 'topic' : 'idea'} from</p>
          <Select
            id="industry-filter"
            value={selectedIndustry}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="w-auto !py-1 text-sm"
          >
            {industries.map(industry => (
              <option key={industry.value} value={industry.value}>
                {industry.label}
              </option>
            ))}
          </Select>
          <p className="text-sm text-slate-500">industry</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center min-h-[68px] items-center">
          {isFetchingTopics ? (
            <TrendingTopicsLoader />
          ) : (
            trendingTopics.map(topic => (
              <Tag key={topic} onClick={() => setSearchValue(topic)}>{topic}</Tag>
            ))
          )}
        </div>
      </div>

      {appConfig.FEATURE_FLAGS.enableFileUpload && (
        <>
          <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-sm">Optional</span>
              <div className="flex-grow border-t border-slate-200"></div>
          </div>
          
          <div className="mb-8">
            <div className="text-center mb-4">
                <h3 className="text-base font-semibold text-slate-800">Refine with Your Own Content</h3>
                <p className="text-sm text-slate-600 mt-1">
                    Upload syllabi, lecture notes, or reference materials to get more tailored and accurate results.
                </p>
            </div>
            <div className="relative">
                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full px-6 py-10 text-center bg-slate-50 border-2 border-dashed rounded-lg cursor-pointer border-slate-200 hover:border-primary-medium hover:bg-primary-lightest transition-colors"
                >
                    <Upload className="w-10 h-10 text-slate-600" />
                    <p className="mt-4 text-sm text-slate-600">
                        <span className="font-semibold text-primary">Click to select files</span> or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                    PDF, TXT, DOCX, MD, PPTX (max 15MB per file)
                    </p>
                </label>
            </div>
          </div>
        </>
      )}
      
      <div className="mt-8">
        <Button 
          onClick={handleDiscoverySubmit} 
          disabled={!searchValue.trim()}
          icon={Search}
          className="w-full"
          shortcut="Mod+Enter"
        >
          {buttonText}
        </Button>
      </div>

      <div className="text-center mt-6 text-sm text-slate-500">
        {discoveryType === 'project' ? (
          <>
            Alternatively, you can{' '}
            <button onClick={() => handleTypeChange('course')} className="text-primary-text font-semibold hover:underline focus:outline-none">
              discover courses
            </button>
            .
          </>
        ) : (
          <>
            Alternatively, you can{' '}
            <button onClick={() => handleTypeChange('project')} className="text-primary-text font-semibold hover:underline focus:outline-none">
              discover projects
            </button>
            .
          </>
        )}
      </div>
    </div>
  );
};