





import React, { useState, useEffect, useRef } from 'react';
import { Button, MarkdownContent, Textarea, RegenerateButton, EditModeFooter } from '../../../../components/ui';
import { Rocket, Terminal, Goal, Modification, File as FileIcon, SquareCheckBig } from '../../../../components/icons';
import type { CapstoneProject } from '../../../../types';
import { ProjectStructureNav } from './ProjectStructureNav';

interface ConfigurationViewProps {
    activeProject: CapstoneProject | null;
    updateSelectedProject: (project: CapstoneProject) => void;
    handleStartOver: () => void;
    handleGoToEnvironment: () => void;
}

const EditableSection: React.FC<{
    id: string;
    title: string;
    icon: React.ElementType;
    content: string;
    isEditing: boolean;
    onContentChange: (value: string) => void;
    onRegenerateRequest: () => void;
    rows?: number;
}> = ({ id, title, icon: Icon, content, isEditing, onContentChange, onRegenerateRequest, rows = 5 }) => {
    const regenButtonRef = useRef<HTMLButtonElement>(null);
    return (
        <div id={id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative group scroll-mt-24">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-slate-700">{title}</span>
                </div>
                {isEditing && (
                    <RegenerateButton
                        ref={regenButtonRef}
                        onClick={onRegenerateRequest}
                    />
                )}
            </div>
            {isEditing ? (
                <Textarea
                    value={content}
                    onChange={e => onContentChange(e.target.value)}
                    rows={rows}
                />
            ) : (
                <div className="prose prose-sm max-w-none text-slate-700">
                    <MarkdownContent content={content} />
                </div>
            )}
        </div>
    );
};

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ activeProject, updateSelectedProject, handleStartOver, handleGoToEnvironment }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProject, setEditedProject] = useState<CapstoneProject | null>(activeProject);

    useEffect(() => {
        setEditedProject(activeProject);
    }, [activeProject]);

    if (!activeProject || !editedProject) {
        return (
            <div className="text-center p-8">
                <p>No project selected. Please go back and select a project.</p>
                <Button onClick={handleStartOver} className="mt-4">Start Over</Button>
            </div>
        );
    }

    const handleSave = () => {
        updateSelectedProject(editedProject);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedProject(activeProject);
        setIsEditing(false);
    };

    const handleFieldChange = (field: keyof CapstoneProject, value: string | string[]) => {
        setEditedProject(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleListFieldChange = (field: 'techStack' | 'projectRequirements' | 'deliverables' | 'learningOutcomes', value: string) => {
        handleFieldChange(field, value.split('\n').filter(line => line.trim() !== ''));
    };

    return (
        <div className="animate-fadeIn relative">
             <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                <div>
                    <p className="text-sm font-semibold text-slate-400">Capstone Project</p>
                    <h1 className="text-3xl font-semibold text-slate-800">{editedProject.title}</h1>
                </div>
                {!isEditing && (
                    <Button variant="secondary" icon={Modification} onClick={() => setIsEditing(true)} className="!py-2">
                        Edit Project Details
                    </Button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <ProjectStructureNav
                    onGenerate={handleGoToEnvironment}
                    onStartOver={handleStartOver}
                    isEditing={isEditing}
                />
                
                <div className="flex-1 w-full min-w-0 space-y-6">
                    <EditableSection
                        id="project-description"
                        title="Description"
                        icon={FileIcon}
                        content={isEditing ? editedProject.detailedDescription : activeProject.detailedDescription}
                        isEditing={isEditing}
                        onContentChange={(value) => handleFieldChange('detailedDescription', value)}
                        onRegenerateRequest={() => console.log('Regen Description')}
                        rows={8}
                    />
                    <EditableSection
                        id="project-tech-stack"
                        title="Tech Stack"
                        icon={Terminal}
                        content={isEditing ? editedProject.techStack.join('\n') : activeProject.techStack.map(t => `- ${t}`).join('\n')}
                        isEditing={isEditing}
                        onContentChange={(value) => handleListFieldChange('techStack', value)}
                        onRegenerateRequest={() => console.log('Regen Tech Stack')}
                    />
                    <EditableSection
                        id="project-learning-outcomes"
                        title="Learning Outcomes"
                        icon={Goal}
                        content={isEditing ? editedProject.learningOutcomes.join('\n') : activeProject.learningOutcomes.map(r => `- ${r}`).join('\n')}
                        isEditing={isEditing}
                        onContentChange={(value) => handleListFieldChange('learningOutcomes', value)}
                        onRegenerateRequest={() => console.log('Regen Learning Outcomes')}
                    />
                    <EditableSection
                        id="project-requirements"
                        title="Project Requirements"
                        icon={SquareCheckBig}
                        content={isEditing ? editedProject.projectRequirements.join('\n') : activeProject.projectRequirements.map(d => `- ${d}`).join('\n')}
                        isEditing={isEditing}
                        onContentChange={(value) => handleListFieldChange('projectRequirements', value)}
                        onRegenerateRequest={() => console.log('Regen Requirements')}
                    />
                    <EditableSection
                        id="project-deliverables"
                        title="Deliverables"
                        icon={Rocket}
                        content={isEditing ? editedProject.deliverables.join('\n') : activeProject.deliverables.map(d => `- ${d}`).join('\n')}
                        isEditing={isEditing}
                        onContentChange={(value) => handleListFieldChange('deliverables', value)}
                        onRegenerateRequest={() => console.log('Regen Deliverables')}
                    />
                </div>
            </div>
            {isEditing && <EditModeFooter onSave={handleSave} onCancel={handleCancel} />}
        </div>
    );
};