
import React from 'react';
import { Search, Upload } from '../../../components/icons';
import { Tag, Select, Button } from '../../../components/ui';
import { industries, appConfig } from '../../../config';
import { TrendingTopicsLoader } from '../../../components/loaders/TrendingTopicsLoader';

interface DiscoveryViewProps {
    searchValue: string;
    setSearchValue: (value: string) => void;
    handleStartDiscovery: () => void;
    trendingTopics: string[];
    isLoadingTopics: boolean;
    selectedIndustry: string;
    setSelectedIndustry: (industry: string) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
    searchValue, setSearchValue, handleStartDiscovery, trendingTopics, isLoadingTopics,
    selectedIndustry, setSelectedIndustry
}) => {

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl mx-auto border border-slate-100 animate-fadeIn">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Discover Your Next Project</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                    Let our AI assistant propose industry-relevant projects, spark new ideas, and accelerate your creation.
                </p>
            </div>

            <div className="relative mb-6">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Enter a topic for a new project... e.g., 'Real-time data visualization'"
                    className="flex-grow w-full pl-10 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-0 focus:ring-primary-focus focus:border-primary-focus placeholder-slate-400"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartDiscovery()}
                />
            </div>

            <div className="mb-8">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <p className="text-sm text-slate-500">Or, start with a trending project idea from</p>
                    <Select
                        id="industry-filter"
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
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
                    {isLoadingTopics ? (
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
                        <h3 className="text-base font-semibold text-slate-800">Refine with Your Own Curriculum</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Upload your existing curriculum or syllabus to get more tailored capstone project recommendations.
                        </p>
                    </div>
                    <div className="relative">
                        <input id="capstone-file-upload" name="capstone-file-upload" type="file" className="sr-only" multiple />
                        <label
                            htmlFor="capstone-file-upload"
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
                    onClick={handleStartDiscovery}
                    disabled={!searchValue.trim()}
                    icon={Search}
                    className="w-full"
                >
                    Discover Projects
                </Button>
            </div>
        </div>
    );
};
