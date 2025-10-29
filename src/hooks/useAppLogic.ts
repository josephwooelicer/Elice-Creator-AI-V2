import { useNavigation } from '../context/NavigationContext';
import { useCurriculum } from '../context/CurriculumContext';
import { useContentLibrary } from '../context/ContentLibraryContext';
import type { Curriculum, ContentItem, CapstoneProject } from '../types';

export const useAppLogic = () => {
    const { navigateTo } = useNavigation();
    const { setSelectedCurriculum, setSelectedCapstoneProject, setStartGenerationImmediately } = useCurriculum();
    const { setActiveContentItem } = useContentLibrary();

    const selectCurriculumAndSwitchToGeneration = (curriculum: Curriculum) => {
        setSelectedCurriculum(curriculum);
        setStartGenerationImmediately(true);
        navigateTo('Generation');
    };

    const selectCapstoneProjectAndSwitchToGeneration = (project: CapstoneProject) => {
        setSelectedCapstoneProject(project);
        navigateTo('Generation');
    };

    const viewContentItemInLibrary = (item: ContentItem) => {
        setActiveContentItem(item);
        navigateTo('Library');
    };

    return {
        selectCurriculumAndSwitchToGeneration,
        selectCapstoneProjectAndSwitchToGeneration,
        viewContentItemInLibrary,
    };
};
