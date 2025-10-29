
import React from 'react';
import { useCapstoneAssets } from './hooks/useCapstoneAssets';
import { ConfigurationView } from './components/ConfigurationView';
import { InteractiveEnvironmentView } from './components/InteractiveEnvironmentView';
import { ExportView } from './components/ExportView';
import { ConfirmationModal, LoadingSpinner } from '../../components/ui';
import { Rocket } from '../../components/icons';

const CapstoneAssetsFeature: React.FC = () => {
    const hookValues = useCapstoneAssets();

    const renderView = () => {
        if (!hookValues.activeProject && hookValues.view !== 'loading') {
            return (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200">
                    <Rocket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">No Project Selected</h2>
                    <p className="text-slate-600 mt-2">
                        Please go to the <span className="font-semibold text-primary-text">Discovery</span> tab to find and select a capstone project first.
                    </p>
                </div>
            );
        }

        if (hookValues.view === 'loading') {
            return (
                <div className="relative min-h-[60vh]">
                    <LoadingSpinner
                        title={hookValues.loadingTitle}
                        message={hookValues.loadingMessage}
                        progress={hookValues.progress}
                        onCancel={hookValues.openCancelModal}
                    />
                </div>
            );
        }
        
        switch (hookValues.view) {
            case 'configure':
                return <ConfigurationView {...hookValues} />;
            case 'environment':
                return <InteractiveEnvironmentView {...hookValues} />;
            case 'export':
                return <ExportView {...hookValues} />;
            default:
                 return <div className="text-center p-8">Loading project...</div>;
        }
    };

    return (
        <>
            {renderView()}
            <ConfirmationModal
                isOpen={hookValues.isCancelModalOpen}
                onClose={hookValues.closeCancelModal}
                onConfirm={hookValues.confirmCancelAction}
                title="Stop Generating"
                message="Are you sure you want to stop? This will cancel the generation process."
                cancelButtonText="Continue Generating"
                confirmButtonText="Stop"
            />
        </>
    );
};

export default CapstoneAssetsFeature;
