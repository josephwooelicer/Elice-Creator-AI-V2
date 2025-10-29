


import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui';
import { Check, Rocket } from '../../../../components/icons';
import type { CapstoneProject } from '../../../../types';

interface ExportViewProps {
    activeProject: CapstoneProject | null;
    handleStartOver: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({ activeProject, handleStartOver }) => {
    const [isPreparing, setIsPreparing] = useState(true);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsPreparing(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl mx-auto border border-slate-100 animate-fadeIn text-center">
            {isPreparing ? (
                 <>
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Preparing Files...</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto mt-2">
                        Your capstone project assets are being compiled.
                    </p>
                </>
            ) : (
                <>
                    <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Your Project is Ready!</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto mt-2">
                        Download the generated assets for "<span className="font-semibold text-slate-700">{activeProject?.title}</span>" or start a new project.
                    </p>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button variant="primary" icon={Rocket}>
                            Download ZIP File
                        </Button>
                        <Button variant="secondary" icon={Rocket}>
                            Download Config File
                        </Button>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <Button onClick={handleStartOver} variant="text">
                           Start a New Project
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};