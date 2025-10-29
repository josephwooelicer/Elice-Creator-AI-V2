import React from 'react';
import { Input } from '../../../../components/ui';
import { LessonPlanEditor } from '../../../../components/content';
import { parseLessonPlanMarkdown, lessonPlanToMarkdown } from '../../../../utils';
import type { LessonPlan } from '../../../../types';

interface EditViewProps {
    editedNotes: string;
    onNotesChange: (value: string) => void;
    editedContent: string;
    onContentChange: (value: string) => void;
    editedTitle: string;
    onTitleChange: (value: string) => void;
    hasLessons: boolean;
}

export const EditView: React.FC<EditViewProps> = ({
    editedNotes,
    onNotesChange,
    editedContent,
    onContentChange,
    editedTitle,
    onTitleChange,
    hasLessons
}) => {
    const handlePlanChange = (updatedPlan: Partial<LessonPlan>) => {
        const fullPlan: LessonPlan = {
            lessonOutcome: updatedPlan.lessonOutcome || '',
            lessonOutline: updatedPlan.lessonOutline || '',
            exercises: updatedPlan.exercises || [],
            quiz: updatedPlan.quiz || { questions: [] },
            project: updatedPlan.project || { description: '', objective: '', deliverables: [] },
        };
        onContentChange(lessonPlanToMarkdown(fullPlan));
    };

    return (
        <div>
            <div className="mb-4">
                <label htmlFor="notes-editor" className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                    id="notes-editor"
                    value={editedNotes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    className="w-full h-[100px] text-slate-700 p-3 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-0 focus:ring-primary-focus focus:border-primary-focus"
                    placeholder="Add notes..."
                />
            </div>

            {hasLessons ? (
                <>
                    <Input
                        label="Lesson Title"
                        id="lesson-title-editor"
                        value={editedTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        containerClassName="mb-4"
                    />
                    <LessonPlanEditor
                        lessonPlan={parseLessonPlanMarkdown(editedContent)}
                        onPlanChange={handlePlanChange}
                    />
                </>
            ) : (
                <div className="text-center py-10 px-4 text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg mt-4">
                    This curriculum has no lessons yet.
                    <p className="mt-2 text-xs">You can still add or edit notes above.</p>
                </div>
            )}
        </div>
    );
};