import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2, Flag, Plus, Edit, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface AudioMarker {
  id: number;
  simulationId: number;
  createdBy: number;
  timestamp: number;
  category: 'excellent' | 'good' | 'needs_improvement' | 'critical_error';
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SyncedAudioPlayerProps {
  audioUrl: string;
  segments: TranscriptSegment[];
  keywords?: string[];
  simulationId: number;
}

export default function SyncedAudioPlayer({ audioUrl, segments, keywords = [], simulationId }: SyncedAudioPlayerProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Marker state
  const [isMarkerDialogOpen, setIsMarkerDialogOpen] = useState(false);
  const [markerCategory, setMarkerCategory] = useState<'excellent' | 'good' | 'needs_improvement' | 'critical_error'>('good');
  const [markerNote, setMarkerNote] = useState('');
  const [markerTimestamp, setMarkerTimestamp] = useState(0);
  
  // Fetch markers
  const markersQuery = trpc.audioMarkers.list.useQuery({ simulationId });
  const markers = markersQuery.data || [];
  
  // Mutations
  const createMarker = trpc.audioMarkers.create.useMutation({
    onSuccess: () => {
      utils.audioMarkers.list.invalidate({ simulationId });
      toast.success('Marcador agregado exitosamente');
      setIsMarkerDialogOpen(false);
      setMarkerNote('');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear marcador');
    },
  });
  
  const deleteMarker = trpc.audioMarkers.delete.useMutation({
    onSuccess: () => {
      utils.audioMarkers.list.invalidate({ simulationId });
      toast.success('Marcador eliminado');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar marcador');
    },
  });
  
  const isSupervisor = user?.role === 'admin' || user?.role === 'gerente' || user?.role === 'supervisor' || user?.role === 'coordinador';

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
  
  const handleAddMarker = () => {
    setMarkerTimestamp(Math.floor(currentTime));
    setIsMarkerDialogOpen(true);
  };
  
  const handleCreateMarker = () => {
    createMarker.mutate({
      simulationId,
      timestamp: markerTimestamp,
      category: markerCategory,
      note: markerNote || undefined,
    });
  };
  
  const handleDeleteMarker = (markerId: number) => {
    if (confirm('¿Estás seguro de eliminar este marcador?')) {
      deleteMarker.mutate({ id: markerId });
    }
  };
  
  const getMarkerColor = (category: string) => {
    switch (category) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'needs_improvement': return 'bg-yellow-500';
      case 'critical_error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getMarkerLabel = (category: string) => {
    switch (category) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bueno';
      case 'needs_improvement': return 'Necesita Mejora';
      case 'critical_error': return 'Error Crítico';
      default: return category;
    }
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
          {/* Progress Bar with Markers */}
          <div className="space-y-2">
            <div className="relative">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              {/* Marker flags on timeline */}
              {markers.map((marker) => {
                const position = duration > 0 ? (marker.timestamp / duration) * 100 : 0;
                return (
                  <div
                    key={marker.id}
                    className="absolute top-0 -translate-x-1/2 cursor-pointer group"
                    style={{ left: `${position}%` }}
                    onClick={() => jumpToSegment(marker.timestamp)}
                  >
                    <Flag
                      className={`w-4 h-4 ${getMarkerColor(marker.category)} text-white fill-current drop-shadow-md`}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                      <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap border">
                        <div className="font-semibold">{getMarkerLabel(marker.category)}</div>
                        <div className="text-muted-foreground">{formatTime(marker.timestamp)}</div>
                        {marker.note && (
                          <div className="mt-1 max-w-xs">{marker.note}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            
            {/* Add Marker Button (Supervisors only) */}
            {isSupervisor && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddMarker}
                disabled={!duration}
                className="ml-4"
              >
                <Flag className="w-4 h-4 mr-2" />
                Agregar Marcador
              </Button>
            )}
          </div>
        </div>
        
        {/* Markers Timeline */}
        {markers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Marcadores ({markers.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => jumpToSegment(marker.timestamp)}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getMarkerColor(marker.category)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatTime(marker.timestamp)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getMarkerColor(marker.category)} text-white`}>
                        {getMarkerLabel(marker.category)}
                      </span>
                    </div>
                    {marker.note && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{marker.note}</p>
                    )}
                  </div>
                  {isSupervisor && marker.createdBy === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMarker(marker.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
      
      {/* Add Marker Dialog */}
      <Dialog open={isMarkerDialogOpen} onOpenChange={setIsMarkerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Marcador</DialogTitle>
            <DialogDescription>
              Marca este momento en {formatTime(markerTimestamp)} con una categoría y nota opcional.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={markerCategory}
                onValueChange={(value: any) => setMarkerCategory(value)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Excelente
                    </div>
                  </SelectItem>
                  <SelectItem value="good">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Bueno
                    </div>
                  </SelectItem>
                  <SelectItem value="needs_improvement">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Necesita Mejora
                    </div>
                  </SelectItem>
                  <SelectItem value="critical_error">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Error Crítico
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note">Nota (opcional)</Label>
              <Textarea
                id="note"
                placeholder="Agrega un comentario sobre este momento..."
                value={markerNote}
                onChange={(e) => setMarkerNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMarkerDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMarker}
              disabled={createMarker.isPending}
            >
              {createMarker.isPending ? 'Guardando...' : 'Guardar Marcador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
