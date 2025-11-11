import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

/**
 * CustomVideoPlayer - Modern video player without YouTube branding
 * Supports both YouTube (via no-cookie iframe) and local MP4 files
 * 
 * @param {string} videoId - YouTube video ID (e.g., "dQw4w9WgXcQ")
 * @param {string} src - Local video file path (e.g., "/videos/lesson1.mp4")
 * @param {string} title - Video title for accessibility
 * 
 * Examples:
 * <CustomVideoPlayer videoId="dQw4w9WgXcQ" title="Intro to React" />
 * <CustomVideoPlayer src="/videos/lesson1.mp4" title="Getting Started" />
 */
const CustomVideoPlayer = ({ videoId, src, title = 'Video Player' }) => {
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  
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
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  // Load YouTube IFrame API
  useEffect(() => {
    if (!isYouTube) return;
    
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    window.onYouTubeIframeAPIReady = () => {
      initYouTubePlayer();
    };
    
    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
    }
  }, [videoId]);
  
  // Initialize YouTube Player
  const initYouTubePlayer = () => {
    if (!iframeRef.current) return;
    
    const ytPlayer = new window.YT.Player(iframeRef.current, {
      videoId: videoId,
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
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
        }
      }
    });
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
    if (isYouTube || !videoRef.current) return;
    
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
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isYouTube]);
  
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
  
  // Fullscreen
  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
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
      className="relative w-full aspect-video bg-gradient-to-br from-[#0f1724] via-[#132033] to-[#0f1724] rounded-xl overflow-hidden shadow-2xl group"
      style={{ maxWidth: '100%' }}
    >
      {/* Video Container */}
      <div className="relative w-full h-full">
        {isYouTube ? (
          <div 
            ref={iframeRef} 
            className="w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />
        )}
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Center Play Button */}
        {!isPlaying && !isLoading && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-20 h-20 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-cyan-500/50"
          >
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </button>
        )}
      </div>
      
      {/* Custom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent transition-all duration-300 ${
          showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="h-2 bg-white/20 cursor-pointer group/progress hover:h-3 transition-all"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 relative transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
          </div>
        </div>
        
        {/* Controls Panel */}
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            )}
          </button>
          
          {/* Time */}
          <div className="text-sm text-white font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          <div className="flex-1"></div>
          
          {/* Volume */}
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
          
          {/* Speed Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
            
            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 bg-[#132033] rounded-lg shadow-xl p-2 min-w-[120px]">
                <div className="text-xs text-gray-400 px-2 py-1 font-semibold">Жылдамдық</div>
                {speeds.map(speed => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className={`w-full px-3 py-2 text-sm rounded hover:bg-cyan-500/20 transition-colors text-left ${
                      playbackRate === speed ? 'text-cyan-400 font-semibold' : 'text-white'
                    }`}
                  >
                    {speed === 1 ? 'Қалыпты' : `${speed}x`}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <Maximize className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
