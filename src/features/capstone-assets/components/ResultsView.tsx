import React from 'react';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailView } from './ProjectDetailView';
import { RagInfoPanel } from '../../discovery/components/RagInfoPanel';
import { Button } from '../../../components/ui';
import { Search } from '../../../components/icons';
import type { CapstoneProject } from '../types';

interface ResultsViewProps {
    projects: CapstoneProject[];
    agentThoughts: string[];
    selectedProject: CapstoneProject | null;
    setSelectedProject: (project: CapstoneProject) => void;
    handleStartOver: () => void;
    handleGoToConfiguration: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ projects, agentThoughts, selectedProject, setSelectedProject, handleStartOver, handleGoToConfiguration }) => {
    
    if (!projects || projects.length === 0) {
        return (
            <div className="text-center p-8 animate-fadeIn">
                <p className="text-slate-600">No projects found. Please try a new search.</p>
                <Button onClick={handleStartOver} variant="secondary" icon={Search} className="mt-4 !py-2 !px-4 mx-auto">
                    New Search
                </Button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start animate-fadeIn">
            <div className="flex-1 w-full">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Generated Capstone Projects</h2>
                        <p className="text-slate-600 mt-1">Select a recommended project or explore other options to see details.</p>
                    </div>
                    <Button onClick={handleStartOver} variant="secondary" icon={Search} className="flex-shrink-0 !py-2 !px-4">
                        New Search
                    </Button>
                </div>
                <RagInfoPanel agentThoughts={agentThoughts} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            isActive={selectedProject?.id === project.id}
                            onClick={() => setSelectedProject(project)}
                        />
                    ))}
                </div>
            </div>
            {selectedProject && (
                <ProjectDetailView project={selectedProject} onGenerate={handleGoToConfiguration} />
            )}
        </div>
    );
};
