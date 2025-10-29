


import { useState, useEffect, useRef } from 'react';
import { useCancellableAction } from '../../../hooks';
import type { CapstoneProject, FileNode } from '../types';
import { generateDetailedProject, generateProjectFiles, regenerateProjectFiles } from '../../../api';
import { useToast } from '../../../context/ToastContext';
import { useCurriculum } from '../../../context/CurriculumContext';

export type CapstoneAssetView = 'idle' | 'loading' | 'configure' | 'environment' | 'export';

// --- Tree Manipulation Helpers ---

const addNodeToTree = (nodes: FileNode[], parentPath: string[], newNode: FileNode): FileNode[] => {
    if (parentPath.length === 0) {
        if (nodes.some(n => n.name === newNode.name)) return nodes;
        return [...nodes, newNode];
    }
    const [current, ...rest] = parentPath;
    return nodes.map(node => {
        if (node.name === current && node.type === 'folder' && node.children) {
            return { ...node, children: addNodeToTree(node.children, rest, newNode) };
        }
        return node;
    });
};

const renameNodeInTree = (nodes: FileNode[], path: string[], newName: string): FileNode[] => {
    if (path.length === 1) {
        return nodes.map(node => (node.name === path[0] ? { ...node, name: newName } : node));
    }
    const [current, ...rest] = path;
    return nodes.map(node => {
        if (node.name === current && node.type === 'folder' && node.children) {
            return { ...node, children: renameNodeInTree(node.children, rest, newName) };
        }
        return node;
    });
};

const deleteNodeFromTree = (nodes: FileNode[], path: string[]): FileNode[] => {
    if (path.length === 1) {
        return nodes.filter(node => node.name !== path[0]);
    }
    const [current, ...rest] = path;
    return nodes.map(node => {
        if (node.name === current && node.type === 'folder' && node.children) {
            return { ...node, children: deleteNodeFromTree(node.children, rest) };
        }
        return node;
    });
};

const getChildrenOfPath = (nodes: FileNode[], path: string[]): FileNode[] => {
    if (path.length === 0) return nodes;
    let currentLevel = nodes;
    for (const part of path) {
        const node = currentLevel.find(n => n.name === part);
        if (node && node.type === 'folder' && node.children) {
            currentLevel = node.children;
        } else {
            return []; // Invalid path or not a folder
        }
    }
    return currentLevel;
};


export const useCapstoneAssets = () => {
    const { selectedCapstoneProject, setSelectedCapstoneProject } = useCurriculum();
    const [view, setView] = useState<CapstoneAssetView>('idle');
    const [activeProject, setActiveProject] = useState<CapstoneProject | null>(null);
    const [progress, setProgress] = useState(0);
    const [loadingTitle, setLoadingTitle] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const isCancelledRef = useRef(false);
    const { addToast } = useToast();

    const handleGoToConfiguration = async (projectToDetail: CapstoneProject) => {
        isCancelledRef.current = false;
        setProgress(0);
        setLoadingTitle("Generating Project Details");
        setLoadingMessage("Expanding project brief into a detailed specification...");
        setView('loading');
        
        try {
            const onProgressCallback = (p: number) => {
                if (!isCancelledRef.current) setProgress(p);
            };

            const detailedData = await generateDetailedProject(projectToDetail, onProgressCallback);

            if (isCancelledRef.current) return;
            
            const updatedProjectData = {
                ...projectToDetail,
                ...detailedData,
            };

            setActiveProject(updatedProjectData);

            setTimeout(() => {
                if (!isCancelledRef.current) {
                    setView('configure');
                }
            }, 500);

        } catch (error) {
            if (isCancelledRef.current) {
                console.log('Detailed project generation was cancelled.');
                return;
            }
            console.error("Error generating detailed project:", error);
            if (error instanceof Error && error.message.startsWith('JSON_PARSE_ERROR')) {
                addToast("The AI returned a response in an unexpected format. Please try again.", { type: 'error' });
            } else {
                addToast("Failed to generate detailed project specifications. Please try again.", { type: 'error' });
            }
            setView('idle');
            setActiveProject(null);
            setProgress(0);
        }
    };

    useEffect(() => {
        if (selectedCapstoneProject) {
            // After a project is selected from Discovery, it won't have the detailed spec.
            // So, the first thing to do is generate it.
            if (!selectedCapstoneProject.detailedDescription || selectedCapstoneProject.detailedDescription.includes("A more detailed description will be generated")) {
                handleGoToConfiguration(selectedCapstoneProject);
            } else if (!selectedCapstoneProject.fileStructure) {
                setActiveProject(selectedCapstoneProject);
                setView('configure');
            } else {
                setActiveProject(selectedCapstoneProject);
                setView('environment');
            }
            // Clear the global selection so it doesn't trigger this effect again on tab switch
            setSelectedCapstoneProject(null);
        }
    }, [selectedCapstoneProject]);
    
    const confirmCancelAction = () => {
        if (view === 'loading') {
            isCancelledRef.current = true;
            setView('idle');
            setActiveProject(null);
            setProgress(0);
        }
    };

    const {
        isModalOpen: isCancelModalOpen,
        open: openCancelModal,
        close: closeCancelModal,
        confirm: confirmCancel,
    } = useCancellableAction(confirmCancelAction);


    const handleGoToEnvironment = async () => {
        if (!activeProject) return;

        isCancelledRef.current = false;
        setProgress(0);
        setLoadingTitle("Generating Environment");
        setLoadingMessage("Creating file structure and boilerplate code...");
        setView('loading');

        try {
            const onProgressCallback = (p: number) => {
                if (!isCancelledRef.current) setProgress(p);
            };

            const { fileStructure } = await generateProjectFiles(activeProject, onProgressCallback);

            if (isCancelledRef.current) return;
            
            const updatedProjectData = {
                ...activeProject,
                fileStructure,
            };

            setActiveProject(updatedProjectData);

            setTimeout(() => {
                if (!isCancelledRef.current) {
                    setView('environment');
                }
            }, 500);

        } catch (error) {
            if (isCancelledRef.current) {
                console.log('Environment generation was cancelled.');
                return;
            }
            console.error("Error generating project files:", error);
            if (error instanceof Error && error.message.startsWith('JSON_PARSE_ERROR')) {
                addToast("The AI returned a response in an unexpected format. Please try again.", { type: 'error' });
            } else {
                addToast("Failed to generate project environment. Please try again.", { type: 'error' });
            }
            setView('configure');
            setProgress(0);
        }
    };
    
    const handleApplyInstructions = async (instructions: string) => {
        if (!activeProject || !instructions.trim()) return;

        isCancelledRef.current = false;
        setProgress(0);
        setIsRegenerating(true);

        try {
            const onProgressCallback = (p: number) => {
                if (!isCancelledRef.current) setProgress(p);
            };

            const { fileStructure } = await regenerateProjectFiles(activeProject, instructions, onProgressCallback);

            if (isCancelledRef.current) return;
            
            const updatedProjectData = {
                ...activeProject,
                fileStructure,
            };
            
            setActiveProject(updatedProjectData);
            addToast("Project files have been updated.", { type: 'default' });

        } catch (error) {
            if (isCancelledRef.current) {
                console.log('File regeneration was cancelled.');
                return;
            }
            console.error("Error regenerating project files:", error);
            if (error instanceof Error && error.message.startsWith('JSON_PARSE_ERROR')) {
                addToast("The AI returned a response in an unexpected format. Please try again.", { type: 'error' });
            } else {
                addToast("Failed to apply instructions. Please try again.", { type: 'error' });
            }
            setProgress(0);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleCancelRegeneration = () => {
        isCancelledRef.current = true;
        setIsRegenerating(false);
        setProgress(0);
    };

    const handleGoToExport = () => {
        setView('export');
    };

    const handleBackToResults = () => {
        setView('idle');
        setActiveProject(null);
        // This is now handled by the discovery tab, so we just clear the state
    };

    const handleStartOver = () => {
        setActiveProject(null);
        setView('idle');
    };

    const handleFileCreate = (parentPath: string[], type: 'file' | 'folder'): string[] | undefined => {
        if (!activeProject || !activeProject.fileStructure) return;
        const children = getChildrenOfPath(activeProject.fileStructure, parentPath);
        const existingNames = children.map(c => c.name);

        let name = type === 'file' ? 'new-file.txt' : 'new-folder';
        let counter = 1;
        while (existingNames.includes(name)) {
            name = type === 'file' ? `new-file-${counter}.txt` : `new-folder-${counter}`;
            counter++;
        }

        const newNode: FileNode = type === 'file' ? { name, type: 'file', content: '' } : { name, type: 'folder', children: [] };
        const newFileStructure = addNodeToTree(activeProject.fileStructure, parentPath, newNode);
        setActiveProject({ ...activeProject, fileStructure: newFileStructure });
        return [...parentPath, name];
    };

    const handleFileRename = (path: string[], newName: string): boolean => {
        if (!activeProject || !activeProject.fileStructure || !newName.trim()) return false;

        const isProtectedFile = path.length === 1 && (path[0].toLowerCase() === 'readme.md' || path[0].toLowerCase() === 'setup.md');
        if (isProtectedFile) {
            addToast("README.md and SETUP.md cannot be renamed.", { type: 'error' });
            return false;
        }

        const parentPath = path.slice(0, -1);
        const children = getChildrenOfPath(activeProject.fileStructure, parentPath);
        if (children.some(c => c.name === newName)) {
            addToast(`A file or folder named "${newName}" already exists.`, { type: 'error' });
            return false;
        }
        const newFileStructure = renameNodeInTree(activeProject.fileStructure, path, newName.trim());
        setActiveProject({ ...activeProject, fileStructure: newFileStructure });
        return true;
    };

    const handleFileDelete = (path: string[]) => {
        if (!activeProject || !activeProject.fileStructure) return;

        const isProtectedFile = path.length === 1 && (path[0].toLowerCase() === 'readme.md' || path[0].toLowerCase() === 'setup.md');
        if (isProtectedFile) {
            addToast("README.md and SETUP.md cannot be deleted.", { type: 'error' });
            return;
        }

        const newFileStructure = deleteNodeFromTree(activeProject.fileStructure, path);
        setActiveProject({ ...activeProject, fileStructure: newFileStructure });
    };

    return {
        view,
        setView,
        activeProject,
        selectedProject: activeProject, // for compatibility with ConfigurationView
        updateSelectedProject: setActiveProject,
        progress,
        loadingTitle,
        loadingMessage,
        isRegenerating,
        handleGoToConfiguration: () => { if(activeProject) handleGoToConfiguration(activeProject) },
        handleGoToEnvironment,
        handleApplyInstructions,
        handleGoToExport,
        handleStartOver,
        handleBackToResults,
        isCancelModalOpen,
        openCancelModal,
        closeCancelModal,
        confirmCancelAction: confirmCancel,
        handleCancelRegeneration,
        handleFileCreate,
        handleFileRename,
        handleFileDelete,
    };
};