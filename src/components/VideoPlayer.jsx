import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { get, ref } from 'firebase/database';
import Plyr from 'plyr';
import playerIcons from '../../node_modules/plyr/dist/plyr.svg?url';
import 'plyr/dist/plyr.css';
import { auth } from '../firebase/config';
import { database, updateLessonProgress } from '../firebase/realtimeDb';
import { getLessonPlayback } from '../api/courseContent';
import { lessonPlaybackProgress, playbackStartTime } from '../utils/playback';

function LessonVideo({ videoId, courseId, lessonId, durationSeconds, progress, search }) {
  const { t, i18n } = useTranslation();
  const hostRef = useRef(null);
  const positionRef = useRef(playbackStartTime(search, progress));
  const completedRef = useRef(Boolean(progress?.completed));

  useEffect(() => {
    const host = hostRef.current;
    const container = document.createElement('div');
    container.className = 'plyr__video-embed';
    const frame = document.createElement('iframe');
    const source = new URL(`/embed/${videoId}`, import.meta.env.VITE_VIDEO_EMBED_ORIGIN);
    source.search = new URLSearchParams({
      origin: window.location.origin,
      playsinline: '1',
      rel: '0',
      enablejsapi: '1',
    });
    frame.src = source.href;
    frame.title = t('ui.lessonVideo');
    frame.allow = 'autoplay; encrypted-media; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    container.append(frame);
    host.append(container);

    const player = new Plyr(container, {
      iconUrl: playerIcons,
      controls: [
        'play-large',
        'restart',
        'rewind',
        'play',
        'fast-forward',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'captions',
        'settings',
        'fullscreen',
      ],
      settings: ['captions', 'speed'],
      speed: { selected: 1, options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
      seekTime: 10,
      keyboard: { focused: true, global: false },
      captions: { active: false, language: i18n.resolvedLanguage, update: true },
      i18n: t('player.controls', { returnObjects: true }),
      youtube: { noCookie: true, rel: 0, playsinline: 1 },
      fullscreen: { enabled: true, fallback: true, iosNative: false },
      playsinline: true,
    });
    let ready = false;
    let lastSaved = null;
    const currentUser = auth.currentUser;
    const save = (ended = false) => {
      if (!ready || !currentUser || auth.currentUser?.uid !== currentUser.uid) return;
      const position = Number(player.currentTime) || 0;
      const duration = Number(player.duration) || Number(durationSeconds) || 0;
      positionRef.current = position;
      const next = lessonPlaybackProgress(position, duration, completedRef.current, ended);
      if (!next.timestamp && !next.completed) return;
      const signature = `${next.timestamp}:${next.completed}`;
      if (signature === lastSaved) return;
      lastSaved = signature;
      completedRef.current = next.completed;
      void updateLessonProgress(currentUser.uid, courseId, lessonId, next);
    };
    const onReady = () => {
      ready = true;
      const duration = Number(player.duration);
      const target = positionRef.current;
      if (target > 0)
        player.currentTime = duration > 0 ? Math.min(target, Math.max(0, duration - 1)) : target;
    };
    const onTimeUpdate = () => {
      if (ready) positionRef.current = Number(player.currentTime) || 0;
    };
    const onPause = () => save();
    const onEnded = () => save(true);
    const onHidden = () => {
      if (document.visibilityState === 'hidden') save();
    };
    player.on('ready', onReady);
    player.on('timeupdate', onTimeUpdate);
    player.on('pause', onPause);
    player.on('ended', onEnded);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPause);
    const timer = window.setInterval(onPause, 15000);
    return () => {
      save();
      ready = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPause);
      player.off('ready', onReady);
      player.off('timeupdate', onTimeUpdate);
      player.off('pause', onPause);
      player.off('ended', onEnded);
      player.destroy();
      host.replaceChildren();
    };
  }, [videoId, courseId, lessonId, durationSeconds, i18n.resolvedLanguage, t]);

  return <div ref={hostRef} className="lesson-video-player w-full h-full bg-black" />;
}

export default function VideoPlayer({ courseId, lessonId, durationSeconds }) {
  const { t } = useTranslation();
  const { search } = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [playback, setPlayback] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setPlayback(null);
    setError(false);
    const uid = auth.currentUser?.uid;
    Promise.all([
      getLessonPlayback(courseId, lessonId),
      uid && database
        ? get(ref(database, `users/${uid}/progress/${courseId}/lessons/${lessonId}`))
            .then((snapshot) => snapshot.val())
            .catch(() => null)
        : null,
    ])
      .then(([source, progress]) => {
        if (active) setPlayback({ ...source, progress });
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [courseId, lessonId, attempt]);

  if (!playback)
    return (
      <div
        className="h-full min-h-48 flex flex-col items-center justify-center gap-3 bg-gray-950 p-6 text-center text-white"
        role="status"
      >
        <p>{error ? t('player.unavailable') : t('player.loading')}</p>
        {error && (
          <button
            type="button"
            className="rounded-lg border border-white/40 px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            onClick={() => setAttempt((current) => current + 1)}
          >
            {t('player.retry')}
          </button>
        )}
      </div>
    );

  return (
    <LessonVideo
      key={`${courseId}:${lessonId}:${search}`}
      {...playback}
      courseId={courseId}
      lessonId={lessonId}
      durationSeconds={durationSeconds}
      search={search}
    />
  );
}
