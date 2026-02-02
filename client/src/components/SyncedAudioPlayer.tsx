import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface SyncedAudioPlayerProps {
  audioUrl: string;
  segments: TranscriptSegment[];
  keywords?: string[];
}

export default function SyncedAudioPlayer({ audioUrl, segments, keywords = [] }: SyncedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Find active segment based on current time
  useEffect(() => {
    const activeIndex = segments.findIndex(
      (seg) => currentTime >= seg.start && currentTime <= seg.end
    );
    
    if (activeIndex !== -1 && activeIndex !== activeSegmentIndex) {
      setActiveSegmentIndex(activeIndex);
      
      // Auto-scroll to active segment
      const activeElement = segmentRefs.current[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentTime, segments, activeSegmentIndex]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(duration, audio.currentTime + 10);
  };

  const jumpToSegment = (startTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = startTime;
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const highlightKeywords = (text: string) => {
    if (keywords.length === 0) return text;

    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isKeyword = keywords.some(
        (keyword) => keyword.toLowerCase() === part.toLowerCase()
      );
      return isKeyword ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 font-semibold px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Reproducción Sincronizada
        </CardTitle>
        <CardDescription>
          Escucha el audio mientras sigues la transcripción en tiempo real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {/* Audio Controls */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={skipBackward}
              disabled={!duration}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              onClick={togglePlayPause}
              disabled={!duration}
              className="w-12 h-12"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={skipForward}
              disabled={!duration}
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 ml-4">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>
        </div>

        {/* Transcript with Highlighting */}
        <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-muted/30">
          <h4 className="font-semibold text-foreground mb-3">Transcripción</h4>
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                ref={(el) => { segmentRefs.current[index] = el; }}
                onClick={() => jumpToSegment(segment.start)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  activeSegmentIndex === index
                    ? "bg-primary/20 border-2 border-primary shadow-md"
                    : "bg-card hover:bg-muted border border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">
                    {formatTime(segment.start)}
                  </span>
                  <p
                    className={`text-sm leading-relaxed ${
                      activeSegmentIndex === index
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {highlightKeywords(segment.text)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keywords Legend */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground">Palabras clave:</span>
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="text-xs bg-yellow-200 dark:bg-yellow-900 text-foreground px-2 py-1 rounded-full font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
