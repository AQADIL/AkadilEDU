const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  hasCourseAccess,
  courseWithoutVideoSources,
  youtubeId,
} = require('../functions/courseAccess');

const user = { emailVerified: true, disabled: false };
const profile = { status: 'active', isDeleted: false, courses: { course: { expiryDate: 2000 } } };

test('course access checks server identity, account status and enrollment expiry', () => {
  assert.equal(hasCourseAccess(user, profile, 'course', 1000), true);
  for (const account of [{ ...user, disabled: true }, { ...user, emailVerified: false }, null]) {
    assert.equal(hasCourseAccess(account, profile, 'course', 1000), false);
  }
  for (const account of [
    null,
    { ...profile, status: 'suspended' },
    { ...profile, isDeleted: true },
    { ...profile, courses: {} },
  ]) {
    assert.equal(hasCourseAccess(user, account, 'course', 1000), false);
  }
  assert.equal(hasCourseAccess(user, profile, 'course', 2000), false);
  assert.equal(hasCourseAccess(user, profile, 'other', 1000), false);
  assert.equal(
    hasCourseAccess(user, { ...profile, courses: { course: {} } }, 'course', 1000),
    true,
  );
  assert.equal(
    hasCourseAccess(
      user,
      { ...profile, courses: { course: { expiryDate: 'never' } } },
      'course',
      1000,
    ),
    false,
  );
  assert.equal(
    hasCourseAccess({ ...user, customClaims: { admin: true } }, profile, 'other', 1000),
    true,
  );
  assert.equal(hasCourseAccess(user, { ...profile, role: 'admin' }, 'other', 1000), false);
});

test('course content omits every video source without modifying stored data', () => {
  const course = {
    title: 'Course',
    modules: {
      one: {
        lessons: {
          first: { title: 'Lesson', videoUrl: 'M7lc1UVf-VE', duration: 5, quiz: { questions: [] } },
          second: { title: 'No video', videoUrl: '' },
        },
      },
    },
  };
  const content = courseWithoutVideoSources(course);
  assert.equal(JSON.stringify(content).includes('M7lc1UVf-VE'), false);
  assert.equal(JSON.stringify(content).includes('videoUrl'), false);
  assert.equal(content.modules.one.lessons.first.hasVideo, true);
  assert.equal(content.modules.one.lessons.second.hasVideo, false);
  assert.equal(content.modules.one.lessons.first.duration, 5);
  assert.equal(course.modules.one.lessons.first.videoUrl, 'M7lc1UVf-VE');
});

test('YouTube sources accept supported forms and reject forged hosts and invalid IDs', () => {
  for (const source of [
    'M7lc1UVf-VE',
    'https://youtu.be/M7lc1UVf-VE?t=30',
    'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    'https://youtube.com/shorts/M7lc1UVf-VE',
    'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE',
  ]) {
    assert.equal(youtubeId(source), 'M7lc1UVf-VE');
  }
  for (const source of [
    null,
    '',
    'short',
    'javascript:alert(1)',
    'https://youtube.com.evil.test/watch?v=M7lc1UVf-VE',
    'https://evil.test/embed/M7lc1UVf-VE',
  ]) {
    assert.equal(youtubeId(source), null);
  }
});

test('playback progress does not complete short or unknown-duration lessons prematurely', async () => {
  const { lessonPlaybackProgress, playbackStartTime } = await import('../src/utils/playback.js');
  assert.deepEqual(lessonPlaybackProgress(30, 180), {
    timestamp: 30,
    percent: 17,
    completed: false,
  });
  assert.equal(lessonPlaybackProgress(60, 0).completed, false);
  assert.equal(lessonPlaybackProgress(170, 180).completed, false);
  assert.equal(lessonPlaybackProgress(171, 180).completed, true);
  assert.equal(lessonPlaybackProgress(10, 180, true).completed, true);
  assert.equal(lessonPlaybackProgress(180, 180, false, true).completed, true);
  assert.equal(playbackStartTime('', { timestamp: 60 }), 60);
  assert.equal(playbackStartTime('?t=15', { timestamp: 60 }), 15);
  assert.equal(playbackStartTime('?t=0', { timestamp: 60 }), 0);
  assert.equal(playbackStartTime('?t=bad', { timestamp: 60 }), 60);
  assert.equal(playbackStartTime('', { timestamp: 60, completed: true }), 0);
});
