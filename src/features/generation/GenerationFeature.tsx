import React from 'react';
import { GenerationSettings } from './components/GenerationSettings';
import { LessonPlanViewer } from './components/LessonPlanViewer';
import { useGeneration } from './hooks/useGeneration';
import { ConfirmationModal, LoadingSpinner } from '../../components/ui';
import { ConfigurationView } from './components/capstone/ConfigurationView';
import { InteractiveEnvironmentView } from './components/capstone/InteractiveEnvironmentView';
import { ExportView } from './components/capstone/ExportView';
import { Modification } from '../../components/icons';

const CapstoneWorkspace: React.FC<ReturnType<typeof useGeneration>> = (props) => {
    const { 
        capstoneView,
        isCapstoneLoading,
        loadingTitle,
        loadingMessage,
        capstoneProgress,
        openCancelModal,
    } = props;

    if (isCapstoneLoading) {
        return (
            <div className="relative min-h-[60vh]">
                <LoadingSpinner
                    title={loadingTitle}
                    message={loadingMessage}
                    progress={capstoneProgress}
                    onCancel={openCancelModal}
                />
            </div>
        );
    }
    
    switch (capstoneView) {
        case 'configure':
            return <ConfigurationView 
                activeProject={props.activeProject}
                updateSelectedProject={props.updateSelectedProject}
                handleStartOver={props.handleStartOver}
                handleGoToEnvironment={props.handleGoToEnvironment}
            />;
        case 'environment':
            return <InteractiveEnvironmentView 
                activeProject={props.activeProject}
                handleStartOver={props.handleStartOver}
                handleGoToExport={props.handleGoToExport}
                handleApplyInstructions={props.handleApplyInstructions}
                isRegenerating={props.isRegenerating}
                handleCancelRegeneration={props.handleCancelRegeneration}
                capstoneProgress={props.capstoneProgress}
            />;
        case 'export':
            return <ExportView 
                activeProject={props.activeProject}
                handleStartOver={props.handleStartOver}
            />;
        default:
            return <div className="text-center p-8">Loading project...</div>;
    }
}

const GenerationFeature: React.FC = () => {
    const hookValues = useGeneration();
    const {
        generationMode,
        isCancelModalOpen,
        closeCancelModal,
        confirmCancelAction,
    } = hookValues;
    
    const renderContent = () => {
        switch(generationMode) {
            case 'course':
                return (
                     <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                        <GenerationSettings
                            selectedCurriculum={hookValues.currentCurriculum}
                            view={hookValues.view}
                            hasResults={!!hookValues.lessonPlans}
                            onNewGeneration={hookValues.handleNewGeneration}
                            onGenerate={hookValues.handleGenerate}
                            onGenerateProject={hookValues.handleGenerateManualProject}
                        />
                        <LessonPlanViewer
                            view={hookValues.view}
                            progress={hookValues.progress}
                            lessonPlans={hookValues.lessonPlans}
                            currentCurriculum={hookValues.generatedCurriculum}
                            generationOptions={hookValues.lastGenOptions}
                            generationDate={hookValues.generationDate}
                            regeneratingPart={hookValues.regeneratingPart}
                            onSaveContent={hookValues.handleSaveContent}
                            onRegenerate={hookValues.handleRegeneratePart}
                            onGenerateNewPart={hookValues.handleGenerateNewPart}
                            onUpdateLessonPlan={hookValues.handleUpdateLessonPlan}
                            onUpdateLessonTitle={hookValues.handleUpdateLessonTitle}
                            onUpdateCurriculumTitle={hookValues.handleUpdateCurriculumTitle}
                            onCancel={hookValues.openCancelModal}
                            lastRegeneratedTitle={hookValues.lastRegeneratedTitle}
                            lastRegeneratedCurriculumTitle={hookValues.lastRegeneratedCurriculumTitle}
                        />
                    </div>
                );
            case 'capstone':
                return <CapstoneWorkspace {...hookValues} />;
            case 'idle':
            default:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                        <GenerationSettings
                            selectedCurriculum={hookValues.currentCurriculum}
                            view={hookValues.view}
                            hasResults={!!hookValues.lessonPlans}
                            onNewGeneration={hookValues.handleNewGeneration}
                            onGenerate={hookValues.handleGenerate}
                            onGenerateProject={hookValues.handleGenerateManualProject}
                        />
                        <div className="w-full lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[556px] relative flex flex-col items-center justify-center text-center">
                            <Modification className="w-14 h-14 text-slate-300 mb-5" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Generate Content</h3>
                            <p className="text-sm text-slate-500">Your generated content will appear here.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            {renderContent()}
            <ConfirmationModal
                isOpen={isCancelModalOpen}
                onClose={closeCancelModal}
                onConfirm={confirmCancelAction}
                title="Stop Generating"
                message="Are you sure you want to stop? All progress will be lost."
                cancelButtonText="Continue Generating"
                confirmButtonText="Stop"
            />
            <ConfirmationModal
                isOpen={hookValues.showCapstoneModal}
                onClose={hookValues.closeCapstoneModal}
                onConfirm={hookValues.confirmCapstoneGeneration}
                title="Generate Capstone Project?"
                message="Your course has been saved. Would you like to generate the assets for its capstone project now?"
                confirmButtonText="Generate"
                cancelButtonText="Later"
                variant="default"
            />
        </>
    );
};

export default GenerationFeature;