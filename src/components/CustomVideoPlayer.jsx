import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

/**
 * CustomVideoPlayer - Modern video player without YouTube branding
 * Supports both YouTube (via no-cookie iframe) and local MP4 files
 * 
 * @param {string} videoUrl - Video URL (YouTube or direct MP4)
 * @param {string} videoId - YouTube video ID (e.g., "dQw4w9WgXcQ")
 * @param {string} src - Local video file path (e.g., "/videos/lesson1.mp4")
 * @param {string} title - Video title for accessibility
 * 
 * Examples:
 * <CustomVideoPlayer videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
 * <CustomVideoPlayer videoId="dQw4w9WgXcQ" title="Intro to React" />
 * <CustomVideoPlayer src="/videos/lesson1.mp4" title="Getting Started" />
 */
const CustomVideoPlayer = ({ videoUrl, videoId: propVideoId, src: propSrc, title = 'Video Player' }) => {
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  
  // Parse videoUrl to extract videoId or src
  const parseVideoUrl = (url) => {
    if (!url) return { videoId: propVideoId, src: propSrc };
    
    // Check if YouTube URL (including live streams)
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\?\/]+)/);
    if (youtubeMatch && youtubeMatch[1]) {
      return { videoId: youtubeMatch[1], src: null };
    }
    
    // Otherwise treat as direct video source (MP4, etc)
    return { videoId: null, src: url };
  };
  
  const { videoId, src } = videoUrl ? parseVideoUrl(videoUrl) : { videoId: propVideoId, src: propSrc };
  
  const [isYouTube] = useState(!!videoId);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Load YouTube IFrame API
  useEffect(() => {
    if (!isYouTube || !videoId) return;
    
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initYouTubePlayer();
        return;
      }
      
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        
        tag.onerror = () => {
          console.error('Failed to load YouTube IFrame API');
          setIsLoading(false);
        };
        
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = () => {
          initYouTubePlayer();
        };
      }
    };
    
    // Delay to ensure DOM is ready
    const timer = setTimeout(loadYouTubeAPI, 100);
    
    return () => clearTimeout(timer);
  }, [videoId, isYouTube]);
  
  // Initialize YouTube Player
  const initYouTubePlayer = () => {
    if (!iframeRef.current || !videoId) {
      console.error('Cannot initialize YouTube player: missing ref or videoId');
      setIsLoading(false);
      return;
    }
    
    try {
      const ytPlayer = new window.YT.Player(iframeRef.current, {
        videoId: videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 1,  // Enable fullscreen for mobile
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            setDuration(event.target.getDuration());
            setIsLoading(false);
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            if (event.data === window.YT.PlayerState.PLAYING) {
              startTimeUpdate();
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            setIsLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Failed to create YouTube player:', error);
      setIsLoading(false);
    }
  };
  
  // Time update interval for YouTube
  const startTimeUpdate = () => {
    const interval = setInterval(() => {
      if (player && player.getCurrentTime) {
        setCurrentTime(player.getCurrentTime());
      }
    }, 100);
    
    return () => clearInterval(interval);
  };
  
  // Initialize Local Video
  useEffect(() => {
    if (isYouTube || !videoRef.current || !src) return;
    
    const video = videoRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    
    const handleError = () => {
      console.error('Video load error');
      setIsLoading(false);
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [isYouTube, src]);
  
  // Play/Pause
  const togglePlay = () => {
    if (isYouTube && player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };
  
  // Seek
  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    
    if (isYouTube && player) {
      player.seekTo(time);
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };
  
  // Volume
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (isYouTube && player) {
      player.setVolume(newVolume * 100);
      if (newVolume === 0) {
        player.mute();
      } else {
        player.unMute();
      }
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
  };
  
  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume || 0.5);
    } else {
      handleVolumeChange(0);
    }
  };
  
  // Playback Speed
  const changeSpeed = (speed) => {
    setPlaybackRate(speed);
    setShowSettings(false);
    
    if (isYouTube && player) {
      player.setPlaybackRate(speed);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };
  
  // Fullscreen - mobile-friendly
  const toggleFullscreen = () => {
    // For YouTube - use iframe container fullscreen
    if (isYouTube && iframeRef.current) {
      const iframeContainer = iframeRef.current.parentElement;
      
      if (isMobile) {
        // Try YouTube player API fullscreen method first
        if (player && player.getIframe) {
          const iframe = player.getIframe();
          if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
          } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
          } else if (iframe.webkitEnterFullscreen) {
            iframe.webkitEnterFullscreen();
          }
          return;
        }
      }
      
      // Fallback to container fullscreen
      if (iframeContainer) {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          if (iframeContainer.requestFullscreen) {
            iframeContainer.requestFullscreen();
          } else if (iframeContainer.webkitRequestFullscreen) {
            iframeContainer.webkitRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
        return;
      }
    }
    
    // For local video on iOS/mobile
    if (!isYouTube && videoRef.current) {
      const video = videoRef.current;
      
      // iOS native fullscreen
      if (video.webkitEnterFullscreen) {
        if (video.webkitDisplayingFullscreen) {
          video.webkitExitFullscreen();
        } else {
          video.webkitEnterFullscreen();
        }
        return;
      }
      
      // Android/other mobile fullscreen
      if (video.requestFullscreen) {
        video.requestFullscreen();
        return;
      }
    }
    
    // Desktop fullscreen for player container
    if (!playerRef.current) return;
    
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      } else if (playerRef.current.webkitRequestFullscreen) {
        playerRef.current.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };
  
  // Format time
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Auto-hide controls
  useEffect(() => {
    let timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };
    
    playerRef.current?.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      playerRef.current?.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying]);
  
  return (
    <div 
      ref={playerRef}
      className={`relative w-full aspect-video bg-gradient-to-br from-[#0f1724] via-[#132033] to-[#0f1724] overflow-hidden group ${
        isMobile ? 'rounded-lg shadow-xl' : 'rounded-xl shadow-2xl'
      }`}
      style={{ maxWidth: '100%' }}
    >
      {/* Video Container */}
      <div className="relative w-full h-full">
        {isYouTube ? (
          <div 
            ref={iframeRef} 
            className="w-full h-full"
            style={{ pointerEvents: isMobile ? 'auto' : 'none' }}
          />
        ) : (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain"
            onClick={isMobile ? undefined : togglePlay}
            playsInline
            preload="metadata"
            webkit-playsinline="true"
            x-webkit-airplay="allow"
          />
        )}
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Center Play Button - крупнее на мобильных */}
        {!isPlaying && !isLoading && (
          <button
            onClick={togglePlay}
            className={`absolute inset-0 m-auto flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-cyan-500/50 active:scale-95 ${
              isMobile ? 'w-24 h-24' : 'w-20 h-20'
            }`}
          >
            <Play className={`text-white ml-1 ${isMobile ? 'w-12 h-12' : 'w-10 h-10'}`} fill="white" />
          </button>
        )}
        
        {/* Tap для play/pause на всём экране - под контролами */}
        {!isLoading && isMobile && isPlaying && (
          <div 
            className="absolute inset-0"
            onClick={togglePlay}
            style={{ background: 'transparent', zIndex: 5 }}
          />
        )}
      </div>
      
      {/* Custom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent transition-all duration-300 z-10 ${
          showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Progress Bar - крупнее на мобильных */}
        <div 
          ref={progressRef}
          className={`bg-white/20 cursor-pointer group/progress transition-all ${
            isMobile ? 'h-3' : 'h-2 hover:h-3'
          }`}
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 relative transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          >
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg transition-opacity ${
              isMobile ? 'w-5 h-5 opacity-100' : 'w-4 h-4 opacity-0 group-hover/progress:opacity-100'
            }`}></div>
          </div>
        </div>
        
        {/* Controls Panel - адаптивный для мобильных */}
        <div className={`flex items-center ${isMobile ? 'px-3 py-2 gap-2' : 'px-4 py-3 gap-4'}`}>
          {/* Play/Pause - крупнее на мобильных */}
          <button
            onClick={togglePlay}
            className={`flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all ${
              isMobile ? 'w-12 h-12' : 'w-10 h-10'
            }`}
          >
            {isPlaying ? (
              <Pause className={`text-white ${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} fill="white" />
            ) : (
              <Play className={`text-white ml-0.5 ${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} fill="white" />
            )}
          </button>
          
          {/* Time - меньше на мобильных */}
          <div className={`text-white font-medium whitespace-nowrap ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          <div className="flex-1"></div>
          
          {/* Volume - скрыт на мобильных (системная громкость) */}
          {!isMobile && (
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-0 group-hover/volume:w-20 transition-all opacity-0 group-hover/volume:opacity-100"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          )}
          
          {/* Speed Settings - упрощен на мобильных */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all ${
                isMobile ? 'w-12 h-12' : 'w-10 h-10'
              }`}
            >
              <Settings className={`text-white ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
            </button>
            
            {showSettings && (
              <div className={`absolute bottom-full right-0 mb-2 bg-[#132033] rounded-lg shadow-xl ${
                isMobile ? 'p-1 min-w-[100px]' : 'p-2 min-w-[120px]'
              }`}>
                <div className={`text-gray-400 px-2 py-1 font-semibold ${isMobile ? 'text-xs' : 'text-xs'}`}>Жылдамдық</div>
                {speeds.map(speed => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className={`w-full rounded hover:bg-cyan-500/20 active:scale-95 transition-all text-left ${
                      isMobile ? 'px-2 py-2 text-sm' : 'px-3 py-2 text-sm'
                    } ${playbackRate === speed ? 'text-cyan-400 font-semibold' : 'text-white'}`}
                  >
                    {speed === 1 ? 'Қалыпты' : `${speed}x`}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Fullscreen - крупнее на мобильных */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all ${
              isMobile ? 'w-12 h-12' : 'w-10 h-10'
            }`}
          >
            <Maximize className={`text-white ${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
