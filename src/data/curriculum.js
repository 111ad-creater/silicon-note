import { module1 } from './modules/module1.js';
import { module2 } from './modules/module2.js';
import { module3 } from './modules/module3.js';
import { module4 } from './modules/module4.js';
import { module5 } from './modules/module5.js';
import { module6 } from './modules/module6.js';
import { module7 } from './modules/module7.js';
import { module8 } from './modules/module8.js';
import { EXERCISES_BY_LESSON } from './exercises.js';

function injectExercises(stage) {
  return {
    ...stage,
    lessons: stage.lessons.map((lesson) => {
      const items = EXERCISES_BY_LESSON[lesson.id];
      if (!items || items.length === 0) return lesson;

      const blocks = [...lesson.blocks];
      const quizIdx = blocks.findIndex((b) => b.type === 'quiz');
      const exerciseBlock = { type: 'exercises', lessonId: lesson.id, items };

      if (quizIdx >= 0) {
        blocks.splice(quizIdx, 0, exerciseBlock);
      } else {
        blocks.push(exerciseBlock);
      }

      return { ...lesson, blocks };
    }),
  };
}

export const CURRICULUM_STAGES = [
  module1,
  module2,
  module3,
  module4,
  module5,
  module6,
  module7,
  module8,
].map(injectExercises);
