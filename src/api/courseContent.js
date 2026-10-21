import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from '../firebase/config';

const pendingRequests = new Map();

async function request(name, data) {
  const key = `${auth.currentUser?.uid}:${name}:${data.courseId}:${data.lessonId || ''}`;
  if (!pendingRequests.has(key)) {
    const callable = httpsCallable(
      getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION),
      name,
    );
    const pending = callable(data)
      .then((response) => response.data)
      .finally(() => pendingRequests.delete(key));
    pendingRequests.set(key, pending);
  }
  return pendingRequests.get(key);
}

export async function getCourseContent(courseId) {
  const result = await request('getCourseContent', { courseId });
  return result.course;
}

export function getLessonPlayback(courseId, lessonId) {
  return request('getLessonPlayback', { courseId, lessonId });
}
