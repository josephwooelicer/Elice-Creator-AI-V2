import React, { useState, useEffect, useRef } from 'react';
import type { ContentItem, Curriculum, GenerationOptions, RegenerationPart } from '../../types';
import { getRegenerationPartId } from '../../types';
import { IconButton, Input, RegenerateButton, Button } from '../../components/ui';
import { Modification, Library, Trash, Check, X } from '../../components/icons';
import { formatDate, getDifficultyClasses, isDifficultyTag } from '../../utils';

interface PreviewHeaderProps {
    curriculum: Curriculum | ContentItem;
    generationOptions?: GenerationOptions | null;
    generationDate?: string | null;
    onRegenerateRequest: (part: RegenerationPart, ref: React.RefObject<HTMLButtonElement>) => void;
    openPopoverPartId: string | null;
    onSaveClick: () => void;
    onDeleteClick: () => void;
    showSaveButton: boolean;
    showDeleteButton: boolean;
    saveButtonRef: React.RefObject<HTMLButtonElement>;
    deleteButtonRef: React.RefObject<HTMLButtonElement>;
    onUpdateCurriculumTitle?: (newTitle: string) => void;
    lastRegeneratedCurriculumTitle?: { title: string; id: number } | null;
    shortcut?: string;
}

export const PreviewHeader: React.FC<PreviewHeaderProps> = ({
    curriculum,
    generationOptions,
    generationDate,
    onRegenerateRequest,
    openPopoverPartId,
    onSaveClick,
    onDeleteClick,
    showSaveButton,
    showDeleteButton,
    saveButtonRef,
    deleteButtonRef,
    onUpdateCurriculumTitle,
    lastRegeneratedCurriculumTitle,
    shortcut,
}) => {
    const curriculumTitleRegenButtonRef = React.useRef<HTMLButtonElement>(null);

    const isContentItem = 'created' in curriculum;
    const difficulty = 'tags' in curriculum ? (curriculum.tags.find(isDifficultyTag) || 'N/A') : curriculum.difficulty;
    const lessonCount = 'content' in curriculum ? curriculum.content.lessons.length : curriculum.lessonCount;
    const totalHours = generationOptions
        ? lessonCount * parseFloat(generationOptions.lessonDuration)
        : isContentItem ? curriculum.lessonCount * curriculum.lessonDuration : 0;
    const date = isContentItem ? curriculum.created : generationDate;
    const formattedDate = formatDate(date);
    const dateLabel = isContentItem ? 'Created on' : 'Generated on';
    const curriculumTitle = 'title' in curriculum ? curriculum.title : curriculum.name;

    const [isTitleEditing, setIsTitleEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(curriculumTitle);
    const [processedRegenId, setProcessedRegenId] = useState<number | null>(null);

    useEffect(() => {
        setEditedTitle(curriculumTitle);
    }, [curriculumTitle]);

    useEffect(() => {
        if (lastRegeneratedCurriculumTitle && lastRegeneratedCurriculumTitle.id !== processedRegenId) {
            setEditedTitle(lastRegeneratedCurriculumTitle.title);
            setIsTitleEditing(true);
            setProcessedRegenId(lastRegeneratedCurriculumTitle.id);
        }
    }, [lastRegeneratedCurriculumTitle, processedRegenId]);

    const handleSaveTitle = () => {
        if (editedTitle.trim()) {
            onUpdateCurriculumTitle?.(editedTitle.trim());
            setIsTitleEditing(false);
        }
    };
    const handleCancelEditTitle = () => {
        setEditedTitle(curriculumTitle);
        setIsTitleEditing(false);
    }

    const openCurriculumTitleRegen = () => {
        onRegenerateRequest({ type: 'curriculumTitle' }, curriculumTitleRegenButtonRef);
    };
    const isCurriculumTitleRegenOpen = openPopoverPartId === getRegenerationPartId({ type: 'curriculumTitle' });

    return (
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200">
            <div className="mr-4 flex-grow">
                {isTitleEditing ? (
                     <div className="flex items-end gap-2">
                        <Input
                            label="Course Title"
                            id="course-title-editor"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            containerClassName="!w-[50%]"
                        />
                        <RegenerateButton
                          ref={curriculumTitleRegenButtonRef}
                          onClick={openCurriculumTitleRegen}
                          isPopoverOpen={isCurriculumTitleRegenOpen}
                        />
                        <IconButton icon={X} tooltipText="Cancel" onClick={handleCancelEditTitle} className="!w-9 !h-9" />
                        <IconButton icon={Check} tooltipText="Save Title" variant="primary" onClick={handleSaveTitle} className="!w-9 !h-9" />
                    </div>
                ) : (
                    <div className="relative group -ml-12 pl-12 pt-1">
                        <p className="text-sm font-semibold text-slate-400">Curriculum</p>
                        <div className="z-10 w-[80%] flex flex-row justify-start items-center">
                            <h1 className="text-3xl w-fit font-semibold text-slate-800">{curriculumTitle}</h1>
                            {onUpdateCurriculumTitle && (
                                <IconButton icon={Modification} tooltipText="Edit Title" onClick={() => setIsTitleEditing(true)} className="ml-2 !w-8 !h-8" />
                            )}
                        </div>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-slate-500 mt-1">
                            <span className={`px-2 py-0-5 text-xs rounded-full font-medium ${getDifficultyClasses(difficulty)}`}>{difficulty}</span>
                            <span className="text-slate-400">&middot;</span>
                            <span>{lessonCount} lessons</span>
                            {totalHours > 0 && (
                                <>
                                    <span className="text-slate-400">&middot;</span>
                                    <span>{totalHours} hrs total</span>
                                </>
                            )}
                            {formattedDate && (
                                <>
                                    <span className="text-slate-400">&middot;</span>
                                    <span>{dateLabel} {formattedDate}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
                {showSaveButton && (
                    <Button
                        ref={saveButtonRef}
                        icon={Library}
                        variant="primary"
                        onClick={onSaveClick}
                        className="!py-2 !px-3"
                        shortcut={shortcut}
                    >
                        Save to Library
                    </Button>
                )}
                {showDeleteButton && (
                    <Button
                        ref={deleteButtonRef}
                        icon={Trash}
                        variant="secondary"
                        onClick={onDeleteClick}
                        className="!py-2 !px-3 !border-red-300 !text-red-600 hover:!bg-red-50 focus:!ring-red-500"
                    >
                        Delete
                    </Button>
                )}
            </div>
        </div>
    );
};
