import React from 'react';
import { Goal, Lesson, Exercise, Quiz, Rocket as Project } from '../icons';

const SkeletonBar: React.FC<{ width?: string; height?: string; className?: string }> = ({ width = '100%', height = '1rem', className = '' }) => (
    <div className={`bg-slate-200 rounded animate-pulse ${className}`} style={{ width, height }}></div>
);

const SkeletonSection: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-primary" />
                <span className="font-semibold text-slate-700">{title}</span>
            </div>
        </div>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

interface LessonContentSkeletonProps {
    isCapstone: boolean;
}

export const LessonPlanSkeleton: React.FC<LessonContentSkeletonProps> = ({ isCapstone }) => {
    const capstoneContent = (
        <SkeletonSection icon={Project} title="Project">
            <p className="font-semibold text-slate-800 mb-1">Description</p>
            <SkeletonBar />
            <SkeletonBar width="90%" />
            <p className="font-semibold text-slate-800 mb-1 pt-2">Objective</p>
            <SkeletonBar width="80%" />
            <p className="font-semibold text-slate-800 mb-1 pt-2">Deliverables</p>
            <SkeletonBar width="70%" />
            <SkeletonBar width="60%" />
        </SkeletonSection>
    );

    const standardContent = (
        <>
            <SkeletonSection icon={Goal} title="Lesson Outcome">
                <SkeletonBar />
                <SkeletonBar width="80%" />
            </SkeletonSection>
            <SkeletonSection icon={Lesson} title="Lesson">
                <SkeletonBar height="1.25rem" width="40%" className="mb-4" />
                <SkeletonBar />
                <SkeletonBar />
                <SkeletonBar width="90%" />
                <SkeletonBar height="1.25rem" width="30%" className="mt-6 mb-4" />
                <SkeletonBar />
                <SkeletonBar width="95%" />
            </SkeletonSection>
            <SkeletonSection icon={Exercise} title="Exercises">
                <SkeletonBar height="1.25rem" width="20%" className="mb-4" />
                <SkeletonBar />
                <SkeletonBar width="90%" />
            </SkeletonSection>
             <SkeletonSection icon={Quiz} title="Quiz">
                <SkeletonBar height="1.25rem" width="20%" className="mb-4" />
                <SkeletonBar />
                <SkeletonBar width="90%" />
            </SkeletonSection>
        </>
    );

    return (
        <div className="space-y-6">
            {isCapstone ? capstoneContent : standardContent}
        </div>
    );
};
