


import React, { useState, useEffect, useRef } from 'react';
import { Button, MarkdownContent, Textarea, RegenerateButton, EditModeFooter } from '../../../components/ui';
import { Rocket, Terminal, Goal, Modification, File as FileIcon, SquareCheckBig } from '../../../components/icons';
import type { CapstoneProject } from '../types';

interface ConfigurationViewProps {
    selectedProject: CapstoneProject | null;
    updateSelectedProject: (project: CapstoneProject) => void;
    handleStartOver: () => void;
    handleGoToEnvironment: () => void;
}

const EditableSection: React.FC<{
    title: string;
    icon: React.ElementType;
    content: string;
    isEditing: boolean;
    onContentChange: (value: string) => void;
    onRegenerateRequest: () => void;
    rows?: number;
}> = ({ title, icon: Icon, content, isEditing, onContentChange, onRegenerateRequest, rows = 5 }) => {
    const regenButtonRef = useRef<HTMLButtonElement>(null);
    return (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative group">
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

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ selectedProject, updateSelectedProject, handleStartOver, handleGoToEnvironment }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProject, setEditedProject] = useState<CapstoneProject | null>(selectedProject);

    useEffect(() => {
        setEditedProject(selectedProject);
    }, [selectedProject]);

    if (!selectedProject || !editedProject) {
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
        setEditedProject(selectedProject);
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Configure Project Details</h2>
                    <p className="text-slate-600 mt-1">Review and modify the generated project details before creating the environment.</p>
                </div>
                {!isEditing && (
                    <Button variant="secondary" icon={Modification} onClick={() => setIsEditing(true)} className="!py-2">
                        Edit Project Details
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="top-24 space-y-6">
                    <EditableSection
                        title="Tech Stack"
                        icon={Terminal}
                        content={isEditing ? editedProject.techStack.join('\n') : selectedProject.techStack.map(t => `- ${t}`).join('\n')}
                        isEditing={isEditing}
                        onContentChange={(value) => handleListFieldChange('techStack', value)}
                        onRegenerateRequest={() => console.log('Regen Tech Stack')}
                    />
                    <div className="space-y-2">
                        <Button onClick={handleGoToEnvironment} className="w-full" disabled={isEditing}>
                            Generate Environment
                        </Button>
                        <Button onClick={handleStartOver} variant="secondary" className="w-full" disabled={isEditing}>
                            Start Over
                        </Button>
                    </div>
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                    <EditableSection
                        title="Description"
                        icon={FileIcon}
                        content={isEditing ? editedProject.detailedDescription : selectedProject.detailedDescription}
                        isEditing={isEditing}
                        onContentChange={(value) => handleFieldChange('detailedDescription', value)}
                        onRegenerateRequest={() => console.log('Regen Description')}
                        rows={8}
                    />
                    <EditableSection
                        title="Learning Outcomes"
                        icon={Goal}
                        content={isEditing ? editedProject.learningOutcomes.join('\n') : selectedProject.learningOutcomes.map(r => `- ${r}`).join('\n')}
                        isEditing={isEditing}
                        onContentChange={(value) => handleListFieldChange('learningOutcomes', value)}
                        onRegenerateRequest={() => console.log('Regen Learning Outcomes')}
                    />
                    <EditableSection
                        title="Project Requirements"
                        icon={SquareCheckBig}
                        content={isEditing ? editedProject.projectRequirements.join('\n') : selectedProject.projectRequirements.map(d => `- ${d}`).join('\n')}
                        isEditing={isEditing}
                        onContentChange={(value) => handleListFieldChange('projectRequirements', value)}
                        onRegenerateRequest={() => console.log('Regen Requirements')}
                    />
                    <EditableSection
                        title="Deliverables"
                        icon={Rocket}
                        content={isEditing ? editedProject.deliverables.join('\n') : selectedProject.deliverables.map(d => `- ${d}`).join('\n')}
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