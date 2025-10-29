import React, { useState, useEffect, useRef } from 'react';
import { DeleteConfirmationPopover } from './DeleteConfirmationPopover';
import { RegeneratePopover, LessonNavigator } from '../../../../components/ui';
import { Eye } from '../../../../components/icons/index';
import type { ContentItem, RegenerationPart, LessonPlan } from '../../../../types';
import { getRegenerationPartId } from '../../../../types';
import { PreviewHeader } from '../../../../components/content';
import { ContentView } from './ContentView';

interface ContentViewerProps {
    selectedContent: ContentItem | null;
    onDeleteRequest: () => void;
    onRegenerate: (lessonIndex: number, part: RegenerationPart, instructions: string) => void;
    onGenerateNewPart: (lessonIndex: number, partType: 'exercise' | 'quiz') => Promise<any>;
    regeneratingPart: string | null;
    onUpdateNotes: (notes: string) => void;
    onUpdateLessonPlan: (lessonIndex: number, updatedPlan: LessonPlan) => void;
    onUpdateLessonTitle: (lessonIndex: number, newTitle: string) => void;
    onUpdateCurriculumTitle: (newTitle: string) => void;
    lastRegeneratedCurriculumTitle?: { title: string; id: number } | null;
    lastRegeneratedLessonTitle?: { lessonIndex: number; title: string; id: number } | null;
}

export const ContentViewer: React.FC<ContentViewerProps> = ({ 
    selectedContent, 
    onDeleteRequest, 
    onRegenerate,
    onGenerateNewPart,
    regeneratingPart,
    onUpdateNotes,
    onUpdateLessonPlan,
    onUpdateLessonTitle,
    onUpdateCurriculumTitle,
    lastRegeneratedCurriculumTitle,
    lastRegeneratedLessonTitle,
}) => {
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [animationDirection, setAnimationDirection] = useState<'right' | 'left' | null>(null);
    const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false);
    const deleteButtonRef = useRef<HTMLButtonElement>(null);
    const prevContentIdRef = useRef<number | null>(null);
    const [regenPopover, setRegenPopover] = useState<{ open: boolean; part: RegenerationPart | null; partId: string | null; ref: React.RefObject<HTMLButtonElement> | null }>({ open: false, part: null, partId: null, ref: null });
    const viewerRef = useRef<HTMLDivElement>(null);

    const currentLesson = selectedContent?.lessons[currentLessonIndex];

    useEffect(() => {
        if (selectedContent) {
            if (prevContentIdRef.current !== selectedContent.id) {
                setCurrentLessonIndex(0);
                setAnimationDirection(null);
                setIsDeletePopoverOpen(false);
            }
            prevContentIdRef.current = selectedContent.id;
        }
    }, [selectedContent]);


    const handleConfirmDelete = () => {
        onDeleteRequest();
        setIsDeletePopoverOpen(false);
    };

    const handleRegenerateClick = (instructions: string) => {
        if (regenPopover.part && regenPopover.partId) {
            onRegenerate(currentLessonIndex, regenPopover.part, instructions);
            setRegenPopover({ open: false, part: null, partId: null, ref: null });
        }
    };
    
    const openRegenPopover = (part: RegenerationPart, ref: React.RefObject<HTMLButtonElement>) => {
        setRegenPopover({ open: true, part, partId: getRegenerationPartId(part), ref });
    };
    
    const handleLessonPlanUpdate = (updatedPlan: LessonPlan) => {
        onUpdateLessonPlan(currentLessonIndex, updatedPlan);
    };
    
    const handleLessonTitleUpdate = (newTitle: string) => {
        onUpdateLessonTitle(currentLessonIndex, newTitle);
    };

    const handleGenerateNewPart = (partType: 'exercise' | 'quiz') => {
        return onGenerateNewPart(currentLessonIndex, partType);
    };

    const handleIndexChange = (newIndex: number) => {
        if (newIndex > currentLessonIndex) {
            setAnimationDirection('right');
        } else if (newIndex < currentLessonIndex) {
            setAnimationDirection('left');
        }
        setCurrentLessonIndex(newIndex);
    };

    return (
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[556px] relative" ref={viewerRef}>
          {selectedContent ? (
            <div>
              <PreviewHeader
                curriculum={selectedContent}
                generationOptions={selectedContent.generationOptions}
                onRegenerateRequest={openRegenPopover}
                openPopoverPartId={regenPopover.partId}
                onDeleteClick={() => setIsDeletePopoverOpen(p => !p)}
                deleteButtonRef={deleteButtonRef}
                showSaveButton={false}
                showDeleteButton={true}
                onUpdateCurriculumTitle={onUpdateCurriculumTitle}
                lastRegeneratedCurriculumTitle={lastRegeneratedCurriculumTitle}
                onSaveClick={() => {}}
                saveButtonRef={React.createRef<HTMLButtonElement>()}
              />
              <DeleteConfirmationPopover 
                isOpen={isDeletePopoverOpen} 
                onConfirm={handleConfirmDelete} 
                onCancel={() => setIsDeletePopoverOpen(false)}
                triggerRef={deleteButtonRef}
              />

              {selectedContent.lessons.length > 1 && (
                <LessonNavigator
                    currentLessonIndex={currentLessonIndex}
                    totalLessons={selectedContent.lessons.length}
                    lessonTitle={currentLesson?.title || ''}
                    onIndexChange={handleIndexChange}
                    className="my-4"
                />
              )}

                <ContentView
                    key={`${selectedContent.id}-${currentLessonIndex}`}
                    notes={selectedContent.notes}
                    lessonContent={currentLesson?.content}
                    lessonTitle={currentLesson?.title}
                    onRegenerate={openRegenPopover}
                    onGenerateNewPart={handleGenerateNewPart}
                    regeneratingPart={regeneratingPart}
                    openPopoverPartId={regenPopover.partId}
                    onUpdateNotes={onUpdateNotes}
                    onUpdateLessonPlan={handleLessonPlanUpdate}
                    onUpdateLessonTitle={handleLessonTitleUpdate}
                    lastRegeneratedTitle={lastRegeneratedLessonTitle}
                    currentLessonIndex={currentLessonIndex}
                    animationDirection={animationDirection}
                />
               <RegeneratePopover
                  isOpen={regenPopover.open}
                  onClose={() => setRegenPopover({ open: false, part: null, partId: null, ref: null })}
                  triggerRef={regenPopover.ref!}
                  onRegenerate={handleRegenerateClick}
                  isLoading={regeneratingPart === regenPopover.partId}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Eye className="w-14 h-14 text-slate-300 mb-5" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Select Content</h3>
              <p className="text-sm text-slate-500">Select content from the list to view and modify it here.</p>
            </div>
          )}
        </div>
    );
};