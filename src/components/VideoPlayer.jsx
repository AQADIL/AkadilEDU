import i18n from '../i18n';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Plyr from 'plyr';
import playerIcons from '../../node_modules/plyr/dist/plyr.svg?url';
import 'plyr/dist/plyr.css';
import { auth } from '../firebase/config';
import { updateLessonProgress } from '../firebase/realtimeDb';

const VideoPlayer = ({
  videoUrl,
  courseId,
  lessonId,
  durationSeconds,
  onTimeUpdate,
  resumeTime,
}) => {
  const videoContainerRef = useRef(null);
  const playerRef = useRef(null);
  const wrapperRef = useRef(null);

  const onTimeUpdateRef = useRef(onTimeUpdate);

  const location = useLocation();

  const watchedSecondsRef = useRef(0);
  const lastTimeRef = useRef(null);
  const sessionStartedRef = useRef(false);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  const getYouTubeId = (url) => {
    if (!url) return null;
    if (typeof url === 'string' && url.length === 11 && !url.includes('/')) return url;

    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(live\/)|(shorts\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[9] && match[9].length === 11 ? match[9] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    if (!videoId || !videoContainerRef.current) return undefined;

    const isIOS =
      typeof window !== 'undefined' && /iP(hone|od|ad)/.test(window.navigator.userAgent || '');

    const controls = [
      'play-large',
      'play',
      'rewind',
      'fast-forward',
      'progress',
      'current-time',
      'mute',
      'volume',
      'captions',
      'settings',

      ...(isIOS ? [] : ['pip']),
      'airplay',
      'fullscreen',
    ];

    const pip = isIOS ? { enabled: false, fallback: false } : { enabled: true, fallback: true };

    const player = new Plyr(videoContainerRef.current, {
      loadSprite: true,
      iconUrl: playerIcons,
      controls,

      settings: ['speed', 'loop'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },

      clickToPlay: true,

      keyboard: {
        focused: true,
        global: true,
      },

      pip,
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        disablekb: 0,

        playsinline: 0,
        vq: 'hd1080',
      },
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: true,
      },
    });

    playerRef.current = player;
    watchedSecondsRef.current = 0;
    lastTimeRef.current = null;
    sessionStartedRef.current = false;
    const forceHD = () => {
      try {
        if (player.embed && typeof player.embed.setPlaybackQuality === 'function') {
          player.embed.setPlaybackQuality('hd1080');
          player.embed.setPlaybackQuality('highres');
        }
      } catch {}
    };

    player.on('ready', forceHD);
    player.on('playing', forceHD);

    const params = new URLSearchParams(location.search);
    const timeParam = params.get('t');
    const seekSeconds = timeParam ? parseFloat(timeParam) : null;

    if (!Number.isNaN(seekSeconds) && seekSeconds > 0) {
      const onReadySeek = () => {
        try {
          player.currentTime = seekSeconds;
        } catch {}
        player.off('ready', onReadySeek);
      };
      player.on('ready', onReadySeek);
    }

    const handleTimeUpdate = () => {
      if (!auth.currentUser || !courseId || !lessonId) return;

      const uid = auth.currentUser.uid;
      if (!uid) return;

      const currentTime = player.currentTime || 0;

      if (!sessionStartedRef.current) {
        sessionStartedRef.current = true;
        lastTimeRef.current = currentTime;
      } else {
        const last = lastTimeRef.current ?? currentTime;
        let delta = currentTime - last;

        if (delta > 0 && delta < 15) {
          watchedSecondsRef.current += delta;
        }
        lastTimeRef.current = currentTime;
      }

      if (onTimeUpdateRef.current) {
        try {
          onTimeUpdateRef.current(currentTime);
        } catch {}
      }
    };

    const saveProgress = () => {
      if (!auth.currentUser || !courseId || !lessonId) return;

      const uid = auth.currentUser.uid;
      if (!uid) return;

      const playerInstance = playerRef.current || player;
      if (!playerInstance) return;

      const currentTime = playerInstance.currentTime || 0;
      const effectiveDuration =
        (durationSeconds > 0 ? durationSeconds : playerInstance.duration) || 0;

      if (watchedSecondsRef.current < 30 && currentTime < 30) {
        return;
      }

      const timeLeft = Math.max(0, effectiveDuration - currentTime);
      const rawPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;
      const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
      const completed = percent >= 95 || timeLeft <= 300;

      updateLessonProgress(uid, courseId, lessonId, {
        timestamp: Math.floor(currentTime),
        percent,
        completed,
      });
    };

    const handleEnded = () => {
      const effectiveDuration =
        (durationSeconds > 0 ? durationSeconds : player.duration) || player.currentTime || 0;
      if (!auth.currentUser || !courseId || !lessonId) return;

      const uid = auth.currentUser.uid;
      if (!uid) return;

      updateLessonProgress(uid, courseId, lessonId, {
        timestamp: Math.floor(effectiveDuration),
        percent: 100,
        completed: true,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgress();
      }
    };

    const handleBeforeUnload = () => {
      saveProgress();
    };

    player.on('timeupdate', handleTimeUpdate);
    player.on('ended', handleEnded);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const intervalId = window.setInterval(() => {
      saveProgress();
    }, 300000);

    return () => {
      player.off('timeupdate', handleTimeUpdate);
      player.off('ended', handleEnded);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.clearInterval(intervalId);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, location.search, courseId, lessonId, durationSeconds]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (resumeTime == null) return;
    const target = Number(resumeTime);
    if (!Number.isFinite(target) || target <= 0) return;

    try {
      player.currentTime = target;
    } catch {}
  }, [resumeTime]);

  if (!videoId) {
    return <div className="w-full aspect-video bg-gray-900 rounded-xl" />;
  }

  return (
    <div
      ref={wrapperRef}
      className="w-full rounded-xl overflow-hidden shadow-2xl bg-black relative group outline-none"
      tabIndex="0"
    >
      <style>{`
        :root { --plyr-color-main: #3b82f6; }
        .plyr { height: 100%; border-radius: 0.75rem; }
        .plyr__video-wrapper { background: #000; }
        .plyr__video-embed iframe { pointer-events: none !important; }

        .plyr__controls {
          position: relative;
          z-index: 50 !important;
          pointer-events: auto !important;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent) !important;
        }

        .plyr__control {
          z-index: 51 !important;
        }
      `}</style>

      <div
        className="absolute left-0 right-0 top-0 z-20 w-full bg-transparent pointer-events-none"
        style={{ bottom: '56px' }}
      />

      <div ref={videoContainerRef} className="plyr__video-embed" id="player">
        <iframe
          src={`${import.meta.env.VITE_VIDEO_EMBED_ORIGIN}/embed/${videoId}?origin=${encodeURIComponent(window.location.origin)}&iv_load_policy=3&modestbranding=1&playsinline=0&showinfo=0&rel=0&enablejsapi=1&vq=hd1080`}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          title={i18n.t('ui.lessonVideo')}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
