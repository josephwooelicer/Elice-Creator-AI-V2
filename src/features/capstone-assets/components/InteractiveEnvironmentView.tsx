

import React, { useState, useEffect } from 'react';
import { Button, Textarea, MarkdownContent, LoadingSpinner } from '../../../components/ui';
import { Rocket, Terminal, Eye, Modification } from '../../../components/icons';
import type { CapstoneProject, FileNode } from '../types';
import { FileExplorer } from './FileExplorer';
import Editor from '@monaco-editor/react';

interface InteractiveEnvironmentViewProps {
    selectedProject: CapstoneProject | null;
    updateSelectedProject: (project: CapstoneProject) => void;
    handleStartOver: () => void;
    handleGoToExport: () => void;
    handleApplyInstructions: (instructions: string) => void;
    isRegenerating: boolean;
    handleCancelRegeneration: () => void;
    progress: number;
    handleFileCreate: (parentPath: string[], type: 'file' | 'folder') => string[] | undefined;
    handleFileRename: (path: string[], newName: string) => boolean;
    handleFileDelete: (path: string[]) => void;
}

type Layout = 'terminal' | 'webapp';

const findFileInTree = (nodes: FileNode[], path: string[]): FileNode | null => {
    if (!nodes || path.length === 0) return null;
    const [current, ...rest] = path;
    const node = nodes.find(n => n.name === current);
    if (!node) return null;
    if (rest.length === 0) return node;
    if (node.type === 'folder' && node.children) {
        return findFileInTree(node.children, rest);
    }
    return null;
};

const updateFileInTree = (nodes: FileNode[], path: string[], newContent: string): FileNode[] => {
    return nodes.map(node => {
        if (node.name === path[0]) {
            if (path.length === 1 && node.type === 'file') {
                return { ...node, content: newContent };
            }
            if (node.type === 'folder' && node.children) {
                return { ...node, children: updateFileInTree(node.children, path.slice(1), newContent) };
            }
        }
        return node;
    });
};

const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'py': return 'python';
        case 'js': return 'javascript';
        case 'ts': return 'typescript';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'md': return 'markdown';
        case 'yml':
        case 'yaml':
            return 'yaml';
        case 'dockerfile':
            return 'dockerfile';
        default:
            return 'plaintext';
    }
};

export const InteractiveEnvironmentView: React.FC<InteractiveEnvironmentViewProps> = ({ 
    selectedProject, 
    updateSelectedProject, 
    handleStartOver, 
    handleGoToExport, 
    handleApplyInstructions,
    isRegenerating,
    handleCancelRegeneration,
    progress,
    handleFileCreate,
    handleFileRename,
    handleFileDelete,
}) => {
    const [layout, setLayout] = useState<Layout>('terminal');
    const [selectedFilePath, setSelectedFilePath] = useState<string[] | null>(null);
    const [renamingPath, setRenamingPath] = useState<string[] | null>(null);
    const [instructions, setInstructions] = useState('');
    const [markdownView, setMarkdownView] = useState<'preview' | 'edit'>('preview');
    
    const selectedFile = selectedFilePath ? findFileInTree(selectedProject?.fileStructure || [], selectedFilePath) : null;
    const language = selectedFile?.name ? getLanguageFromFileName(selectedFile.name) : 'plaintext';
    const isMarkdown = language === 'markdown';

    // Reset markdown view mode when the selected file changes
    useEffect(() => {
        setMarkdownView('preview');
    }, [selectedFilePath]);

    // Set initial file to view and reset rename state on project change
    useEffect(() => {
        if (selectedProject?.fileStructure) {
            setRenamingPath(null);
            const findFirstFile = (nodes: FileNode[]): string[] | null => {
                for (const node of nodes) {
                    if (node.type === 'file') {
                        return [node.name];
                    }
                    if (node.type === 'folder' && node.children) {
                        const nestedFile = findFirstFile(node.children);
                        if (nestedFile) {
                            return [node.name, ...nestedFile];
                        }
                    }
                }
                return null;
            };
            const firstFilePath = findFirstFile(selectedProject.fileStructure);
            setSelectedFilePath(firstFilePath);
        }
    }, [selectedProject?.id]);


    const handleFileContentChange = (newContent: string) => {
        if (!selectedProject || !selectedFilePath) return;
        const newFileStructure = updateFileInTree(selectedProject.fileStructure!, selectedFilePath, newContent);
        updateSelectedProject({ ...selectedProject, fileStructure: newFileStructure });
    };

    const handleApplyClick = () => {
        if (instructions.trim()) {
            handleApplyInstructions(instructions);
            setInstructions('');
        }
    };
    
    const onFileDelete = (path: string[]) => {
        handleFileDelete(path);
        // If the deleted file was selected, unselect it
        if (selectedFilePath?.join('/') === path.join('/')) {
            setSelectedFilePath(null);
        }
    }

    if (!selectedProject) {
        return <div>Loading...</div>;
    }

    return (
        <div className="animate-fadeIn flex flex-col h-[calc(100vh-200px)] relative">
            {isRegenerating && (
                <LoadingSpinner
                    title="Applying Instructions"
                    message="AI is modifying the project files..."
                    progress={progress}
                    onCancel={handleCancelRegeneration}
                />
            )}
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Interactive Environment</h2>
                    <p className="text-slate-600 mt-1">Test the generated project files and regenerate assets as needed.</p>
                </div>
                <div className="flex gap-4">
                    <Button onClick={handleStartOver} variant="secondary">Start Over</Button>
                    <Button onClick={handleGoToExport} icon={Rocket}>Finalize & Export</Button>
                </div>
            </div>
            
            <div className="flex gap-4 flex-1 min-h-0">
                {/* Left Panel */}
                <div className="w-1/3 lg:w-1/4 flex flex-col gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                        <FileExplorer 
                            fileStructure={selectedProject.fileStructure}
                            onSelectFile={setSelectedFilePath}
                            selectedFilePath={selectedFilePath}
                            onFileCreate={handleFileCreate}
                            onFileRename={handleFileRename}
                            onFileDelete={onFileDelete}
                            renamingPath={renamingPath}
                            setRenamingPath={setRenamingPath}
                        />
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-shrink-0 flex flex-col">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">Instructions</h3>
                        <Textarea 
                            placeholder="e.g., Add a Flask API endpoint to the app.py file..." 
                            rows={3} 
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="resize-none"
                        />
                        <Button className="w-full mt-2 !py-2" onClick={handleApplyClick} disabled={!instructions.trim() || isRegenerating}>Apply Instructions</Button>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-2/3 lg:w-3/4 flex flex-col gap-4">
                     <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xs ml-2 text-slate-500">Layout:</span>
                            <Button onClick={() => setLayout('terminal')} variant={layout === 'terminal' ? 'primary' : 'secondary'} className="!py-1 !px-3 !text-xs">Terminal</Button>
                            <Button onClick={() => setLayout('webapp')} variant={layout === 'webapp' ? 'primary' : 'secondary'} className="!py-1 !px-3 !text-xs">Web</Button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                             <span>CPU: <span className="font-semibold">5%</span></span>
                             <span>Memory: <span className="font-semibold">256MB / 2GB</span></span>
                             <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="font-semibold text-green-700">Ready</span></span>
                        </div>
                     </div>
                     <div className="bg-[#1e1e1e] p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col text-white font-mono text-sm overflow-hidden">
                        {layout === 'terminal' ? (
                            <>
                                <div className="flex-1 overflow-hidden bg-[#1e1e1e] rounded-md min-h-0 flex flex-col">
                                    {/* Editor Header */}
                                    <div className="bg-slate-800 px-4 py-1.5 flex justify-between items-center flex-shrink-0 border-b border-slate-600">
                                        <span className="text-xs text-slate-300 truncate pr-4">
                                            {selectedFilePath ? selectedFilePath.join('/') : 'No file selected'}
                                        </span>
                                        {selectedFile && isMarkdown && (
                                            <Button
                                                variant="secondary"
                                                className="!py-1 !px-2 !text-xs !bg-slate-600 hover:!bg-slate-500 !text-white border-slate-500"
                                                icon={markdownView === 'preview' ? Modification : Eye}
                                                onClick={() => setMarkdownView(prev => prev === 'preview' ? 'edit' : 'preview')}
                                            >
                                                {markdownView === 'preview' ? 'Edit' : 'Preview'}
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {/* Editor Content */}
                                    <div className="flex-1 min-h-0">
                                        {selectedFile ? (
                                            isMarkdown && markdownView === 'preview' ? (
                                                <div className="h-full overflow-y-auto bg-white text-slate-800 p-6">
                                                    <MarkdownContent content={selectedFile.content || ''} />
                                                </div>
                                            ) : (
                                                <Editor
                                                    height="100%"
                                                    language={language}
                                                    value={selectedFile.content || ''}
                                                    onChange={(value) => handleFileContentChange(value || '')}
                                                    theme="vs-dark"
                                                    loading={<div className="text-slate-400 p-4">Loading editor...</div>}
                                                    options={{
                                                        minimap: { enabled: false },
                                                        fontSize: 14,
                                                        wordWrap: 'on',
                                                        scrollBeyondLastLine: false,
                                                        automaticLayout: true,
                                                    }}
                                                />
                                            )
                                        ) : (
                                            <div className="p-4 text-slate-400">Select a file to view its content</div>
                                        )}
                                    </div>
                                </div>
                                <div className="h-1/3 flex-shrink-0 pt-4 flex flex-col">
                                     <div className="flex items-center gap-2 border-b border-slate-600 mb-2 flex-shrink-0">
                                        <button className="px-3 py-1 bg-slate-700/50 rounded-t-md text-xs">Terminal</button>
                                     </div>
                                     <div className="p-2 overflow-y-auto flex-1">
                                        <p><span className="text-green-400">root@capstone-env:</span><span className="text-blue-400">/app#</span> python app.py</p>
                                        <p> * Serving Flask app 'app'</p>
                                        <p> * Running on http://127.0.0.1:5000</p>
                                        <p>Press CTRL+C to quit</p>
                                     </div>
                                </div>
                            </>
                        ) : (
                             <div className="flex-1 bg-white rounded-md flex items-center justify-center text-slate-800">
                               <iframe className="w-full h-full border-0 rounded-md" title="Web App Preview" srcDoc="<html><body style='display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#555;'><h1>Web Application Preview</h1><p>Your running application will be displayed here.</p></body></html>"></iframe>
                             </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};