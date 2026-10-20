import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';

export async function requestAI(data) {
  const callable = httpsCallable(
    getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION),
    'processLearningAI',
    { timeout: 90000 },
  );
  const response = await callable(data);
  return response.data;
}
export function parseQuestionsWithAI(input) {
  return requestAI({ operation: 'parseTest', input });
}
export async function parseQuizWithAI(input) {
  const result = await requestAI({ operation: 'parseQuiz', input });
  return result.questions;
}
