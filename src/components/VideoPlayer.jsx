import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { auth } from '../firebase/config';
import { updateLessonProgress } from '../firebase/realtimeDb';

const VideoPlayer = ({ videoUrl, courseId, lessonId, durationSeconds, onTimeUpdate, resumeTime }) => {
  const videoContainerRef = useRef(null);
  const playerRef = useRef(null);
  const wrapperRef = useRef(null);

  const onTimeUpdateRef = useRef(onTimeUpdate);

  const location = useLocation();

  // Timer for double-tap detection
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);

  // Smart resume tracking
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

  // --- SMART GESTURE LOGIC (Inline/Desktop) ---
  const handleSmartClick = useCallback((e) => {
    const player = playerRef.current;
    if (!player) return;

    // On iOS native fullscreen, these clicks won't fire, which is fine.

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const timeSinceLastTap = now - lastTapRef.current;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = (x / width) * 100;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      if (percent < 35) {
        player.rewind(10);
      } else if (percent > 65) {
        player.forward(10);
      } else if (player.fullscreen && typeof player.fullscreen.toggle === 'function') {
        player.fullscreen.toggle();
      } else if (typeof player.toggleFullscreen === 'function') {
        player.toggleFullscreen();
      }

      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        player.togglePlay();
      }, DOUBLE_TAP_DELAY);
    }
  }, []);

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
      // Show PiP on desktop/Android only
      ...(isIOS ? [] : ['pip']),
      'airplay',
      'fullscreen'
    ];

    const pip = isIOS
      ? { enabled: false, fallback: false }
      : { enabled: true, fallback: true };

    const player = new Plyr(videoContainerRef.current, {
      loadSprite: true,
      iconUrl: 'https://cdn.plyr.io/3.7.8/plyr.svg',
      controls,
      // YouTube no longer respects JS quality switching; keep UI clean
      settings: ['speed', 'loop'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      // Let Plyr own click-to-play on the video surface (works in fullscreen too)
      clickToPlay: true,
      // Enable global keyboard shortcuts so F/Space work reliably in fullscreen
      keyboard: {
        focused: true,
        global: true
      },
      // Force PiP support where the browser and provider allow it (desktop / Android)
      pip,
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        disablekb: 0,
        // Allow native iOS player to take over when appropriate
        playsinline: 0,
        vq: 'hd1080'
      },
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: true
      }
    });

    playerRef.current = player;
    watchedSecondsRef.current = 0;
    lastTimeRef.current = null;
    sessionStartedRef.current = false;
    const forceHD = () => {
      try {
        if (player.embed && typeof player.embed.setPlaybackQuality === 'function') {
          // Try to push YouTube into HD/highres when possible
          player.embed.setPlaybackQuality('hd1080');
          player.embed.setPlaybackQuality('highres');
        }
      } catch {
        // ignore
      }
    };

    player.on('ready', forceHD);
    player.on('playing', forceHD);

    // URL-based seeking (?t=seconds)
    const params = new URLSearchParams(location.search);
    const timeParam = params.get('t');
    const seekSeconds = timeParam ? parseFloat(timeParam) : null;

    if (!Number.isNaN(seekSeconds) && seekSeconds > 0) {
      const onReadySeek = () => {
        try {
          player.currentTime = seekSeconds;
        } catch (e) {
          // ignore seek errors
        }
        player.off('ready', onReadySeek);
      };
      player.on('ready', onReadySeek);
    }

    const handleTimeUpdate = () => {
      if (!auth.currentUser || !courseId || !lessonId) return;

      const uid = auth.currentUser.uid;
      if (!uid) return;

      const currentTime = player.currentTime || 0;
      const effectiveDuration =
        (typeof durationSeconds === 'number' && durationSeconds > 0
          ? durationSeconds
          : player.duration || 0) || currentTime || 0;

      // Track approximate real watch time for this session (avoid counting big seeks)
      if (!sessionStartedRef.current) {
        sessionStartedRef.current = true;
        lastTimeRef.current = currentTime;
      } else {
        const last = lastTimeRef.current ?? currentTime;
        let delta = currentTime - last;
        // Ignore negative jumps and very large jumps (likely seeking)
        if (delta > 0 && delta < 15) {
          watchedSecondsRef.current += delta;
        }
        lastTimeRef.current = currentTime;
      }

      if (onTimeUpdateRef.current) {
        try {
          onTimeUpdateRef.current(currentTime);
        } catch {
          // ignore callback errors
        }
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
        (typeof durationSeconds === 'number' && durationSeconds > 0
          ? durationSeconds
          : playerInstance.duration || 0) || currentTime || 0;

      // Apply 30s session threshold for background saves
      if (watchedSecondsRef.current < 30 && currentTime < 30) {
        return;
      }

      const timeLeft = Math.max(0, effectiveDuration - currentTime);
      const rawPercent = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;
      const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
      const completed = percent >= 95 || timeLeft <= 300; // <5 мин до конца или >95%

      updateLessonProgress(uid, courseId, lessonId, {
        timestamp: Math.floor(currentTime),
        percent,
        completed
      });
    };

    const handleEnded = () => {
      if (!auth.currentUser || !courseId || !lessonId) return;

      const uid = auth.currentUser.uid;
      if (!uid) return;

      const effectiveDuration =
        (typeof durationSeconds === 'number' && durationSeconds > 0
          ? durationSeconds
          : player.duration || 0) || player.currentTime || 0;

      updateLessonProgress(uid, courseId, lessonId, {
        timestamp: Math.floor(effectiveDuration),
        percent: 100,
        completed: true
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
    }, 300000); // 5 минут

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
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
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
    } catch {
      // ignore seek errors
    }
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

      {/* SMART GLASS SHIELD (Inline/Desktop) – only over video area, not controls */}
      <div
        className="absolute left-0 right-0 top-0 z-20 w-full bg-transparent pointer-events-none"
        style={{ bottom: '56px' }}
      />

      <div ref={videoContainerRef} className="plyr__video-embed" id="player">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?origin=${window.location.origin}&iv_load_policy=3&modestbranding=1&playsinline=0&showinfo=0&rel=0&enablejsapi=1&vq=hd1080`}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          title="Lesson Video"
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
