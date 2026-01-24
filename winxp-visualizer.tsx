import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Maximize2 } from 'lucide-react';

const WinXPVisualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentViz, setCurrentViz] = useState('bars');
  const [volume, setVolume] = useState(70);
  const [audioSrc, setAudioSrc] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  const [trackName, setTrackName] = useState('Demo Track');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [loadingStatus, setLoadingStatus] = useState('');
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#000428');
      gradient.addColorStop(1, '#004e92');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        if (currentViz === 'bars') {
          drawBars(ctx, dataArray, width, height);
        } else if (currentViz === 'wave') {
          drawWave(ctx, dataArray, width, height);
        } else if (currentViz === 'particles') {
          drawParticles(ctx, dataArray, width, height);
        }
      } else {
        drawIdle(ctx, width, height);
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentViz]);

  const drawBars = (ctx, dataArray, width, height) => {
    const barCount = 64;
    const barWidth = width / barCount;
    const step = Math.floor(dataArray.length / barCount);
    
    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step];
      const barHeight = (value / 255) * height * 0.8;
      const x = i * barWidth;
      const y = height - barHeight;
      
      const hue = (i / barCount) * 120 + 180;
      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, `hsl(${hue}, 100%, 60%)`);
      gradient.addColorStop(1, `hsl(${hue}, 100%, 30%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 2, barHeight);
      
      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(x, y, barWidth - 2, barHeight);
      ctx.shadowBlur = 0;
    }
  };

  const drawWave = (ctx, dataArray, width, height) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00ff88';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff88';
    
    ctx.beginPath();
    const sliceWidth = width / dataArray.length;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 255.0;
      const y = (v * height * 0.6) + (height * 0.2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Mirror effect
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.beginPath();
    x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 255.0;
      const y = height - (v * height * 0.6) - (height * 0.2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    ctx.stroke();
  };

  const particlesRef = useRef([]);
  
  const drawParticles = (ctx, dataArray, width, height) => {
    // Initialize particles if needed
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 100; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1
        });
      }
    }
    
    // Get average frequency
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const intensity = avg / 255;
    
    // Update and draw particles
    particlesRef.current.forEach((p, i) => {
      const freqValue = dataArray[i % dataArray.length] / 255;
      
      p.x += p.vx * (1 + intensity * 2);
      p.y += p.vy * (1 + intensity * 2);
      
      // Wrap around edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      
      const hue = (freqValue * 120) + 200;
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${freqValue * 0.8 + 0.2})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + freqValue), 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.shadowBlur = 0;
  };

  const drawIdle = (ctx, width, height) => {
    const time = Date.now() * 0.001;
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.3)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let x = 0; x < width; x += 5) {
      const y = height / 2 + Math.sin(x * 0.02 + time) * 20;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    
    if (isPlaying) {
      audio.pause();
    } else {
      await audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val / 100;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    
    if (file) {
      const audio = audioRef.current;
      
      // Stop current playback
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      }
      
      // Create URL from file
      const url = URL.createObjectURL(file);
      console.log('Created URL:', url);
      
      setAudioSrc(url);
      setTrackName(file.name.replace(/\.[^/.]+$/, ''));
      
      // Force audio to load the new source
      audio.load();
      audio.volume = volume / 100;
      
      // Clear the file input so you can select the same file again
      e.target.value = '';
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setLoadingStatus('Loading...');
      const audio = audioRef.current;
      
      // Stop current playback
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      }
      
      setAudioSrc(urlInput.trim());
      
      // Extract filename from URL
      const filename = urlInput.split('/').pop().split('?')[0];
      setTrackName(filename.replace(/\.[^/.]+$/, '') || 'Custom Track');
      
      // Set up event listeners
      audio.onloadeddata = () => {
        setLoadingStatus('✓ Loaded successfully! Click Play to start.');
        setTimeout(() => setLoadingStatus(''), 3000);
        audio.volume = volume / 100;
      };
      
      audio.onerror = (e) => {
        setLoadingStatus('✗ CORS Error: This server doesn\'t allow audio playback from other sites. Try soundhelix.com URLs or host your file elsewhere.');
        console.error('Audio load error:', e);
        setTimeout(() => setLoadingStatus(''), 6000);
      };
      
      // Force audio to load the new source
      audio.load();
      
      setUrlInput('');
    } else {
      setLoadingStatus('Please enter a URL');
      setTimeout(() => setLoadingStatus(''), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-t-lg px-4 py-2 border-t-2 border-l-2 border-blue-400 border-r-2 border-b border-blue-900">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-sm">Windows Media Player</span>
            <div className="flex gap-2">
              <button className="w-6 h-6 bg-blue-500 hover:bg-blue-400 rounded flex items-center justify-center text-white text-xs">_</button>
              <button className="w-6 h-6 bg-blue-500 hover:bg-blue-400 rounded flex items-center justify-center text-white text-xs">□</button>
              <button className="w-6 h-6 bg-red-500 hover:bg-red-400 rounded flex items-center justify-center text-white text-xs">×</button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border-4 border-gray-700 rounded-b-lg overflow-hidden shadow-2xl">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full"
          />
          
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 border-t-2 border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg shadow-lg transition-all"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentViz('bars')}
                    className={`px-3 py-2 rounded text-sm transition-all ${
                      currentViz === 'bars' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Bars
                  </button>
                  <button
                    onClick={() => setCurrentViz('wave')}
                    className={`px-3 py-2 rounded text-sm transition-all ${
                      currentViz === 'wave' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Wave
                  </button>
                  <button
                    onClick={() => setCurrentViz('particles')}
                    className={`px-3 py-2 rounded text-sm transition-all ${
                      currentViz === 'particles' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Particles
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Volume2 size={20} className="text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24"
                />
                <span className="text-gray-400 text-sm w-8">{volume}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder="Paste MP3 URL here"
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg border-2 border-gray-600 focus:outline-none focus:border-purple-500 text-sm"
                />
                <button
                  onClick={handleUrlSubmit}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg transition-all font-medium"
                >
                  Load Song
                </button>
              </div>
              {loadingStatus && (
                <div className={`mt-2 text-sm ${loadingStatus.includes('✗') ? 'text-red-400' : loadingStatus.includes('✓') ? 'text-green-400' : 'text-yellow-400'}`}>
                  {loadingStatus}
                </div>
              )}
            </div>
            
            <div className="text-center text-gray-400 text-sm">
              {isPlaying ? `♪ Now Playing: ${trackName}` : 'Click Play to start visualization'}
            </div>
          </div>
        </div>
        
        <audio
          ref={audioRef}
          src={audioSrc}
          loop
        />
      </div>
    </div>
  );
};

export default WinXPVisualizer;