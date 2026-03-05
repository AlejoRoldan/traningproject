import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';

/**
 * useAudio Hook
 *
 * Gestiona grabación y reproducción de audio en tiempo real
 * - Grabación de micrófono del agente
 * - Reproducción de respuestas del cliente IA
 * - Control de volumen
 * - Gestión de permisos del navegador
 */

interface AudioStats {
  duration: number;
  decibels: number;
  frequency: number;
}

interface UseAudioReturn {
  // Recording
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  isRecording: boolean;
  recordingTime: number;

  // Playback
  playAudio: (audioUrl: string | Blob) => Promise<void>;
  stopPlayback: () => void;
  isPlaying: boolean;
  playbackTime: number;

  // Controls
  setVolume: (volume: number) => void;
  volume: number;

  // Stats
  audioStats: AudioStats;

  // Permissions
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;

  // Errors
  error: string | null;
}

export const useAudio = (): UseAudioReturn => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio context for stats
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  // Controls
  const [volume, setVolume] = useState(1);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioStats, setAudioStats] = useState<AudioStats>({
    duration: 0,
    decibels: 0,
    frequency: 0,
  });

  /**
   * Solicitar permiso de micrófono
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Crear AudioContext para análisis
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);

      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;

      // Detener stream inmediatamente, solo queríamos verificar permisos
      stream.getTracks().forEach((track) => track.stop());

      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Microphone permission denied';
      setError(message);
      setHasPermission(false);
      return false;
    }
  }, []);

  /**
   * Iniciar grabación de audio
   */
  const startRecording = useCallback(async () => {
    try {
      if (!hasPermission) {
        const permitted = await requestPermission();
        if (!permitted) {
          throw new Error('Microphone permission required');
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);

      // Actualizar tiempo de grabación
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Analizar audio en tiempo real
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);

      analyzer.fftSize = 256;
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);

      const updateStats = () => {
        analyzer.getByteFrequencyData(dataArray);

        // Calcular decibeles
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        const decibels = 20 * Math.log10(average / 255);

        // Calcular frecuencia dominante
        const maxFreq = dataArray.indexOf(Math.max(...dataArray));
        const frequency =
          (maxFreq * audioContext.sampleRate) / analyzer.fftSize;

        setAudioStats({
          duration: recordingTime,
          decibels: Math.max(0, decibels),
          frequency,
        });

        if (isRecording) {
          requestAnimationFrame(updateStats);
        }
      };

      updateStats();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error starting recording';
      setError(message);
      setIsRecording(false);
    }
  }, [hasPermission, requestPermission, isRecording, recordingTime]);

  /**
   * Detener grabación y retornar blob de audio
   */
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        audioChunksRef.current = [];
        resolve(audioBlob);
      };

      mediaRecorder.stop();

      // Detener tracks
      mediaRecorder.stream
        .getTracks()
        .forEach((track) => track.stop());

      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    });
  }, []);

  /**
   * Reproducir audio
   */
  const playAudio = useCallback(
    async (audioUrlOrBlob: string | Blob) => {
      try {
        if (!audioRef.current) {
          const audio = new Audio();
          audio.volume = volume;
          audioRef.current = audio;
        }

        if (audioUrlOrBlob instanceof Blob) {
          const url = URL.createObjectURL(audioUrlOrBlob);
          audioRef.current.src = url;
        } else {
          audioRef.current.src = audioUrlOrBlob;
        }

        setIsPlaying(true);
        setPlaybackTime(0);

        audioRef.current.play();

        playbackIntervalRef.current = setInterval(() => {
          setPlaybackTime((prev) => prev + 1);
        }, 1000);

        audioRef.current.onended = () => {
          setIsPlaying(false);
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
          }
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Error playing audio';
        setError(message);
        setIsPlaying(false);
      }
    },
    [volume],
  );

  /**
   * Detener reproducción
   */
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(false);
    setPlaybackTime(0);

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  }, []);

  /**
   * Cambiar volumen
   */
  const handleSetVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    // Recording
    startRecording,
    stopRecording,
    isRecording,
    recordingTime,

    // Playback
    playAudio,
    stopPlayback,
    isPlaying,
    playbackTime,

    // Controls
    setVolume: handleSetVolume,
    volume,

    // Stats
    audioStats,

    // Permissions
    hasPermission,
    requestPermission,

    // Errors
    error,
  };
};
