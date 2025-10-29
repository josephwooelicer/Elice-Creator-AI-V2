import React, { useState, useEffect, useMemo } from 'react';
import { Goal, Lesson, Exercise, Quiz, Rocket as Project } from '../icons';
import type { LessonPlan } from '../../types';

const useScrollspy = (
  ids: string[],
  options?: IntersectionObserverInit,
): string | null => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const intersectingIds = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            intersectingIds.add(entry.target.id);
          } else {
            intersectingIds.delete(entry.target.id);
          }
        });

        const newActiveId = ids.find(id => intersectingIds.has(id)) || null;
        
        // Let the scroll handler take precedence if we are at the bottom.
        const isAtBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
        const isAtTop = window.scrollY <= 2;
        if (!isAtBottom && !isAtTop) {
          setActiveId(newActiveId);
        }
      },
      options
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
      const isAtTop = window.scrollY <= 2;
      if (isAtBottom && ids.length > 0) {
        setActiveId(ids[ids.length - 1]);
      } else if (isAtTop && ids.length > 0) {
        setActiveId(ids[0]);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run on mount to check initial state, in case the page is too short to scroll
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ids, options]);

  return activeId;
};


const SECTIONS_CONFIG = [
  { id: 'lesson-outcome', label: 'Outcome', icon: Goal, isPresent: (plan: LessonPlan) => !!plan.lessonOutcome },
  { id: 'lesson-outline', label: 'Lesson', icon: Lesson, isPresent: (plan: LessonPlan) => !!plan.lessonOutline },
  { id: 'lesson-exercises', label: 'Exercises', icon: Exercise, isPresent: (plan: LessonPlan) => plan.exercises && plan.exercises.length > 0 },
  { id: 'lesson-quiz', label: 'Quiz', icon: Quiz, isPresent: (plan: LessonPlan) => plan.quiz && plan.quiz.questions.length > 0 },
  { id: 'lesson-project', label: 'Project', icon: Project, isPresent: (plan: LessonPlan) => !!plan.project?.description },
];

interface LessonStructureNavProps {
    lessonPlan: LessonPlan | null;
    isCapstone: boolean;
}

export const LessonStructureNav: React.FC<LessonStructureNavProps> = ({ lessonPlan, isCapstone }) => {
    const visibleSections = useMemo(() => {
        if (lessonPlan) {
            return SECTIONS_CONFIG.filter(sec => sec.isPresent(lessonPlan));
        }
        
        // Logic for optimistic UI (skeleton view)
        const capstoneSections = ['lesson-outcome', 'lesson-project'];
        const standardSections = ['lesson-outcome', 'lesson-outline', 'lesson-exercises', 'lesson-quiz'];
        const sectionIdsToShow = isCapstone ? capstoneSections : standardSections;
        
        return SECTIONS_CONFIG.filter(sec => sectionIdsToShow.includes(sec.id));
    }, [lessonPlan, isCapstone]);
    
    const sectionIds = useMemo(() => visibleSections.map(sec => sec.id), [visibleSections]);

    const activeId = useScrollspy(sectionIds, {
        rootMargin: '0px 0px -80% 0px', // Set the intersection area to be the top 20% of the viewport
    });

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        
        // If the first item is clicked, scroll to the very top of the page.
        if (visibleSections.length > 0 && id === visibleSections[0].id) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const element = document.getElementById(id);
        if (element) {
            const yOffset = -100; // A comfortable offset from the top to account for headers and provide padding.
            const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };
    
    return (
        <nav className="w-48 sticky top-36 hidden md:block">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">On this page</h3>
            <ul className="space-y-1">
                {visibleSections.map(({ id, label, icon: Icon }) => {
                    const isActive = activeId === id;
                    return (
                        <li key={id}>
                            <a 
                                href={`#${id}`}
                                onClick={(e) => handleNavClick(e, id)}
                                className={`flex items-center space-x-2 p-2 rounded-md text-md transition-colors ${
                                    isActive 
                                        ? 'bg-primary-lightest text-primary-text font-semibold' 
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-text' : 'text-slate-500'}`} />
                                <span>{label}</span>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};