

import { useState, useRef, MutableRefObject } from 'react';
import { generateDetailedProject, generateProjectFileStructure, generateFileContent, regenerateProjectFiles } from '../../../api';
import type { CapstoneProject, FileNode, ProjectManualInputs } from '../../../types';
import { useToast } from '../../../context/ToastContext';

type CapstoneAssetView = 'idle' | 'loading' | 'configure' | 'environment' | 'export';

// --- Capstone Tree Manipulation Helpers ---
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
            return [];
        }
    }
    return currentLevel;
};

const getAllFilePaths = (nodes: FileNode[], basePath: string[] = []): string[][] => {
    let paths: string[][] = [];
    for (const node of nodes) {
        const newPath = [...basePath, node.name];
        if (node.type === 'file') {
            paths.push(newPath);
        } else if (node.type === 'folder' && node.children) {
            paths = paths.concat(getAllFilePaths(node.children, newPath));
        }
    }
    return paths;
};

const updateFileContentInTree = (nodes: FileNode[], path: string[], newContent: string): FileNode[] => {
    return nodes.map(node => {
        if (node.name === path[0]) {
            if (path.length === 1 && node.type === 'file') {
                return { ...node, content: newContent };
            }
            if (node.type === 'folder' && node.children) {
                return { ...node, children: updateFileContentInTree(node.children, path.slice(1), newContent) };
            }
        }
        return node;
    });
};


interface UseProjectGenerationProps {
    isCancelledRef: MutableRefObject<boolean>;
    setGenerationMode: (mode: 'idle' | 'course' | 'capstone') => void;
}

export const useProjectGeneration = ({ isCancelledRef, setGenerationMode }: UseProjectGenerationProps) => {
    const { addToast } = useToast();
    
    const [capstoneView, setCapstoneView] = useState<CapstoneAssetView>('idle');
    const [activeProject, setActiveProject] = useState<CapstoneProject | null>(null);
    const [capstoneProgress, setCapstoneProgress] = useState(0);
    const [loadingTitle, setLoadingTitle] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isRegeneratingFiles, setIsRegeneratingFiles] = useState(false);
    const [isCapstoneLoading, setIsCapstoneLoading] = useState(false);
    
    const handleGoToConfiguration = async (projectToDetail: CapstoneProject) => {
        isCancelledRef.current = false;
        setCapstoneProgress(0);
        setLoadingTitle("Generating Project Details");
        setLoadingMessage("Expanding project brief into a detailed specification...");
        setIsCapstoneLoading(true);
        
        try {
            const onProgressCallback = (p: number) => {
                if (!isCancelledRef.current) setCapstoneProgress(p);
            };

            const detailedData = await generateDetailedProject(projectToDetail, onProgressCallback);

            if (isCancelledRef.current) return;
            
            const updatedProjectData = { ...projectToDetail, ...detailedData };
            setActiveProject(updatedProjectData);

            setTimeout(() => {
                if (!isCancelledRef.current) {
                    setCapstoneView('configure');
                    setIsCapstoneLoading(false);
                }
            }, 500);

        } catch (error) {
            if (isCancelledRef.current) return;
            console.error("Error generating detailed project:", error);
            addToast("Failed to generate detailed project specifications. Please try again.", { type: 'error' });
            setGenerationMode('idle');
            setIsCapstoneLoading(false);
        }
    };

    const handleGenerateManualProject = (projectInputs: ProjectManualInputs) => {
        const tempProject: CapstoneProject = {
            id: Date.now(),
            title: projectInputs.title,
            description: projectInputs.expectations || `A capstone project about ${projectInputs.title}.`,
            industry: 'All',
            tags: [projectInputs.difficulty],
            recommended: false,
            learningOutcomes: [],
            techStack: [],
            projectRequirements: [],
            deliverables: [],
            detailedDescription: '',
        };
        setGenerationMode('capstone');
        handleGoToConfiguration(tempProject);
    };

    const handleGoToEnvironment = async () => {
        if (!activeProject) return;
        isCancelledRef.current = false;
        
        // --- Stage 1: Generate File Structure ---
        setCapstoneProgress(0);
        setLoadingTitle("Generating Project Architecture");
        setLoadingMessage("Designing the file and folder structure...");
        setIsCapstoneLoading(true);

        try {
            const onStructureProgress = (p: number) => { if (!isCancelledRef.current) setCapstoneProgress(p * 0.2); }; // Stage 1 is ~20% of the work
            const { fileStructure } = await generateProjectFileStructure(activeProject, onStructureProgress);
            
            if (isCancelledRef.current) return;
            
            let projectWithStructure = { ...activeProject, fileStructure };
            setActiveProject(projectWithStructure);

            // --- Stage 2: Generate File Contents Iteratively ---
            setLoadingTitle("Generating File Content");
            
            const allFilePaths = getAllFilePaths(fileStructure);
            if (allFilePaths.length === 0) {
                 if (!isCancelledRef.current) {
                    setCapstoneView('environment');
                    setIsCapstoneLoading(false);
                }
                return;
            }

            for (let i = 0; i < allFilePaths.length; i++) {
                if (isCancelledRef.current) throw new Error("Cancelled");
                
                const path = allFilePaths[i];
                const filePath = path.join('/');
                setLoadingMessage(`Generating ${filePath}...`);
                
                const contentProgress = ((i + 1) / allFilePaths.length) * 80;
                setCapstoneProgress(20 + contentProgress);
                
                const content = await generateFileContent(projectWithStructure, fileStructure, filePath);
                
                if (isCancelledRef.current) throw new Error("Cancelled");

                projectWithStructure = {
                    ...projectWithStructure,
                    fileStructure: updateFileContentInTree(projectWithStructure.fileStructure!, path, content)
                };
                setActiveProject(projectWithStructure);
            }
            
            setTimeout(() => {
                if (!isCancelledRef.current) {
                    setCapstoneView('environment');
                    setIsCapstoneLoading(false);
                }
            }, 500);

        } catch (error) {
            if (isCancelledRef.current || (error instanceof Error && error.message === "Cancelled")) {
                console.log("Environment generation was cancelled.");
                setGenerationMode('idle');
                setIsCapstoneLoading(false);
                return;
            }
            console.error("Error generating project files:", error);
            addToast("Failed to generate project environment. Please try again.", { type: 'error' });
            setCapstoneView('configure');
            setIsCapstoneLoading(false);
        }
    };

    const handleApplyInstructions = async (instructions: string) => {
        if (!activeProject || !instructions.trim()) return;
        isCancelledRef.current = false;
        setCapstoneProgress(0);
        setIsRegeneratingFiles(true);

        try {
            const onProgressCallback = (p: number) => { if (!isCancelledRef.current) setCapstoneProgress(p); };
            const { fileStructure } = await regenerateProjectFiles(activeProject, instructions, onProgressCallback);
            if (isCancelledRef.current) return;
            
            setActiveProject({ ...activeProject, fileStructure });
            addToast("Project files have been updated.", { type: 'default' });
        } catch (error) {
            if (isCancelledRef.current) return;
            console.error("Error regenerating project files:", error);
            addToast("Failed to apply instructions. Please try again.", { type: 'error' });
        } finally {
            setIsRegeneratingFiles(false);
            setCapstoneProgress(0);
        }
    };

    const handleCancelRegeneration = () => {
        isCancelledRef.current = true;
        setIsRegeneratingFiles(false);
        setCapstoneProgress(0);
    };

    const handleGoToExport = () => setCapstoneView('export');

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

    const resetState = () => {
        setActiveProject(null);
        setCapstoneView('idle');
        setCapstoneProgress(0);
        setIsCapstoneLoading(false);
    };

    return {
        capstoneView,
        setCapstoneView,
        activeProject,
        capstoneProgress,
        setCapstoneProgress,
        loadingTitle,
        loadingMessage,
        isCapstoneLoading,
        isRegenerating: isRegeneratingFiles,
        handleGoToConfiguration,
        handleGenerateManualProject,
        handleGoToEnvironment,
        handleApplyInstructions,
        handleCancelRegeneration,
        handleGoToExport,
        handleFileCreate,
        handleFileRename,
        handleFileDelete,
        updateSelectedProject: setActiveProject,
        resetState,
    };
};