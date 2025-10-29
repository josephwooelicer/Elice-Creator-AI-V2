import React, { useState, useEffect } from 'react';
import { Button, Textarea, LoadingSpinner } from '../../../../components/ui';
import { Rocket } from '../../../../components/icons';
import type { CapstoneProject } from '../../../../types';

interface InteractiveEnvironmentViewProps {
    activeProject: CapstoneProject | null;
    handleStartOver: () => void;
    handleGoToExport: () => void;
    handleApplyInstructions: (instructions: string) => void;
    isRegenerating: boolean;
    handleCancelRegeneration: () => void;
    capstoneProgress: number;
}

type IframeTab = 'app' | 'browser';

export const InteractiveEnvironmentView: React.FC<InteractiveEnvironmentViewProps> = ({ 
    activeProject, 
    handleStartOver, 
    handleGoToExport, 
    handleApplyInstructions,
    isRegenerating,
    handleCancelRegeneration,
    capstoneProgress,
}) => {
    const [instructions, setInstructions] = useState('');
    const [activeTab, setActiveTab] = useState<IframeTab>('app');
    const [browserUrl, setBrowserUrl] = useState('https://www.google.com/webhp?igu=1');
    const [addressBarInput, setAddressBarInput] = useState('');

    useEffect(() => {
        if (activeTab === 'app') {
            setAddressBarInput('Local Application Preview');
        } else {
            setAddressBarInput(browserUrl);
        }
    }, [activeTab, browserUrl]);

    const handleApplyClick = () => {
        if (instructions.trim()) {
            handleApplyInstructions(instructions);
            setInstructions('');
        }
    };

    const handleGo = () => {
        if (activeTab === 'browser') {
            let url = addressBarInput.trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            setBrowserUrl(url);
        }
    };
    
    if (!activeProject) {
        return <div>Loading...</div>;
    }

    return (
        <div className="animate-fadeIn flex flex-col h-[calc(100vh-200px)] relative">
            {isRegenerating && (
                <LoadingSpinner
                    title="Applying Instructions"
                    message="AI is modifying the project files..."
                    progress={capstoneProgress}
                    onCancel={handleCancelRegeneration}
                />
            )}
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Interactive Environment</h2>
                    <p className="text-slate-600 mt-1">Provide instructions to modify the project and see the results in the preview.</p>
                </div>
                <div className="flex gap-4">
                    <Button onClick={handleStartOver} variant="secondary">Start Over</Button>
                    <Button onClick={handleGoToExport} icon={Rocket}>Finalize & Export</Button>
                </div>
            </div>
            
            <div className="flex gap-4 flex-1 min-h-0">
                {/* Left Panel */}
                <div className="w-1/3 lg:w-1/4 flex flex-col gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">Environment Status</h3>
                        <div className="space-y-2 text-xs text-slate-600">
                             <div className="flex justify-between"><span>CPU:</span> <span className="font-semibold">5%</span></div>
                             <div className="flex justify-between"><span>Memory:</span> <span className="font-semibold">256MB / 2GB</span></div>
                             <div className="flex justify-between items-center">
                                <span>Status:</span>
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="font-semibold text-green-700">Ready</span></span>
                             </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2">Instructions</h3>
                        <Textarea 
                            placeholder="e.g., Change the background color of the header to blue..." 
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="flex-1 resize-none"
                        />
                        <Button className="w-full mt-2 !py-2" onClick={handleApplyClick} disabled={!instructions.trim() || isRegenerating}>Apply Instructions</Button>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-2/3 lg:w-3/4 flex flex-col">
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                        {/* Tabs */}
                        <div className="bg-slate-100 px-2 py-1.5 border-b border-slate-200 flex items-center gap-2 flex-shrink-0">
                            <button 
                                onClick={() => setActiveTab('app')} 
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'app' ? 'bg-white text-primary-text shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                Code
                            </button>
                            <button 
                                onClick={() => setActiveTab('browser')} 
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === 'browser' ? 'bg-white text-primary-text shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                App
                            </button>
                        </div>

                        {/* Address Bar */}
                        <div className="flex items-center gap-2 p-2 bg-slate-50 border-b border-slate-200 flex-shrink-0">
                            <input
                                type="text"
                                value={addressBarInput}
                                onChange={(e) => setAddressBarInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleGo(); }}
                                disabled={activeTab === 'app'}
                                className="w-full px-3 py-1 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-focus focus:border-primary-focus disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder={activeTab === 'app' ? 'Local application preview' : 'https://example.com'}
                            />
                            <Button onClick={handleGo} disabled={activeTab === 'app'} className="!py-1.5 !px-4">Go</Button>
                        </div>

                        {/* Iframe Container */}
                        <div className="flex-1 bg-slate-200 flex items-center justify-center text-slate-800 relative">
                            {activeTab === 'app' && (
                                <iframe
                                    className="w-full h-full border-0 bg-white"
                                    title="Web App Preview"
                                    srcDoc="<html><body style='display:flex; flex-direction: column; align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#555; background-color: #f8f9fa;'><h1>Web Application Preview</h1><p>Your running application will be displayed here.</p></body></html>"
                                ></iframe>
                            )}
                            {activeTab === 'browser' && (
                                <iframe
                                    className="w-full h-full border-0 bg-white"
                                    title="Browser"
                                    src={browserUrl}
                                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                                ></iframe>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};