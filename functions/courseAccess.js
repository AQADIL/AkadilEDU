const functions = require('firebase-functions/v1');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const { validId } = require('./validation');

function youtubeId(value) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (/^[\w-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    let id;
    if (host === 'youtu.be') id = parts[0];
    else if (
      [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtube-nocookie.com',
        'www.youtube-nocookie.com',
      ].includes(host)
    ) {
      id =
        url.searchParams.get('v') ||
        (['embed', 'shorts', 'live', 'v'].includes(parts[0]) ? parts[1] : null);
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch {
    return null;
  }
}

function hasCourseAccess(user, profile, courseId, now = Date.now()) {
  if (!user || user.disabled || profile?.status !== 'active' || profile.isDeleted) return false;
  if (user.customClaims?.admin === true) return true;
  if (!user.emailVerified) return false;
  const enrollment = profile.courses?.[courseId];
  if (!enrollment || typeof enrollment !== 'object') return false;
  return (
    enrollment.expiryDate == null ||
    (typeof enrollment.expiryDate === 'number' && enrollment.expiryDate > now)
  );
}

function courseWithoutVideoSources(value) {
  if (Array.isArray(value)) return value.map(courseWithoutVideoSources);
  if (!value || typeof value !== 'object') return value;
  const result = Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'videoUrl')
      .map(([key, item]) => [key, courseWithoutVideoSources(item)]),
  );
  if (Object.hasOwn(value, 'videoUrl')) result.hasVideo = Boolean(youtubeId(value.videoUrl));
  return result;
}

async function authorizedCourse(data, context, playback) {
  if (!context.auth)
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  if (!validId(data?.courseId) || (playback && !validId(data?.lessonId))) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid lesson');
  }
  const uid = context.auth.uid;
  const db = getDatabase();
  const [user, profileSnapshot] = await Promise.all([
    getAuth().getUser(uid),
    db.ref(`users/${uid}`).get(),
  ]);
  if (!hasCourseAccess(user, profileSnapshot.val(), data.courseId)) {
    throw new functions.https.HttpsError('permission-denied', 'Course access required');
  }
  const now = Date.now();
  const limit = playback ? 12 : 60;
  const result = await db
    .ref(`privateRateLimits/${playback ? 'playback' : 'courseContent'}/${uid}`)
    .transaction((previous) => {
      const current = previous?.window > now - 60000 ? previous : { window: now, count: 0 };
      if (current.count >= limit) return;
      return { window: current.window, count: current.count + 1 };
    });
  if (!result.committed)
    throw new functions.https.HttpsError('resource-exhausted', 'Request limit reached');
  const course = (await db.ref(`courses/${data.courseId}`).get()).val();
  if (!course) throw new functions.https.HttpsError('not-found', 'Course unavailable');
  return course;
}

exports.getCourseContent = functions
  .runWith({ timeoutSeconds: 30, maxInstances: 10 })
  .https.onCall(async (data, context) => {
    return { course: courseWithoutVideoSources(await authorizedCourse(data, context, false)) };
  });

exports.getLessonPlayback = functions
  .runWith({ timeoutSeconds: 30, maxInstances: 10 })
  .https.onCall(async (data, context) => {
    const course = await authorizedCourse(data, context, true);
    const lesson = Object.values(course.modules || {})
      .map((module) => module.lessons?.[data.lessonId])
      .find(Boolean);
    const videoId = youtubeId(lesson?.videoUrl);
    if (!videoId) throw new functions.https.HttpsError('not-found', 'Video unavailable');
    return { videoId };
  });

exports.youtubeId = youtubeId;
exports.hasCourseAccess = hasCourseAccess;
exports.courseWithoutVideoSources = courseWithoutVideoSources;
