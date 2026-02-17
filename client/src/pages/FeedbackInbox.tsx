import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Archive, Reply, AlertCircle, ThumbsUp, BookOpen, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FeedbackItem {
  id: number;
  fromAdminId: number;
  fromAdminName: string | null;
  fromAdminEmail: string | null;
  title: string;
  message: string;
  feedbackType: 'note' | 'praise' | 'improvement' | 'urgent' | 'follow_up';
  priority: 'low' | 'medium' | 'high';
  isRead: number;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FEEDBACK_TYPE_CONFIG = {
  note: { icon: Mail, label: 'Nota', color: 'bg-blue-100 text-blue-800' },
  praise: { icon: ThumbsUp, label: 'Reconocimiento', color: 'bg-green-100 text-green-800' },
  improvement: { icon: BookOpen, label: 'Mejora', color: 'bg-yellow-100 text-yellow-800' },
  urgent: { icon: AlertCircle, label: 'Urgente', color: 'bg-red-100 text-red-800' },
  follow_up: { icon: Clock, label: 'Seguimiento', color: 'bg-purple-100 text-purple-800' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Media', color: 'bg-orange-100 text-orange-800' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-800' },
};

export function FeedbackInbox() {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  const feedbackQuery = trpc.feedback.getReceived.useQuery({ limit: 100, offset: 0 });
  const unreadCountQuery = trpc.feedback.getUnreadCount.useQuery();
  const markAsReadMutation = trpc.feedback.markAsRead.useMutation();
  const archiveMutation = trpc.feedback.archive.useMutation();
  const replyMutation = trpc.feedback.addReply.useMutation();

  const handleMarkAsRead = async (feedbackId: number) => {
    try {
      await markAsReadMutation.mutateAsync({ feedbackId });
      feedbackQuery.refetch();
      unreadCountQuery.refetch();
    } catch (error) {
      toast.error('Error al marcar como leído');
    }
  };

  const handleArchive = async (feedbackId: number) => {
    try {
      await archiveMutation.mutateAsync({ feedbackId });
      feedbackQuery.refetch();
      toast.success('Feedback archivado');
    } catch (error) {
      toast.error('Error al archivar');
    }
  };

  const handleReply = async () => {
    if (!selectedFeedback || !replyMessage.trim()) {
      toast.error('Por favor escribe una respuesta');
      return;
    }

    try {
      await replyMutation.mutateAsync({
        feedbackId: selectedFeedback.id,
        message: replyMessage.trim(),
      });

      toast.success('Respuesta enviada');
      setReplyMessage('');
      setShowReplyDialog(false);

      // Refresh feedback
      feedbackQuery.refetch();
    } catch (error) {
      toast.error('Error al enviar respuesta');
    }
  };

  const handleSelectFeedback = async (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    if (!feedback.isRead) {
      await handleMarkAsRead(feedback.id);
    }
  };

  const filteredFeedback = (feedbackQuery.data || []).filter((item: FeedbackItem) => {
    if (filter === 'unread') return item.isRead === 0;
    if (filter === 'archived') return false; // No archived in current implementation
    return true;
  });

  const unreadCount = (feedbackQuery.data || []).filter((item: FeedbackItem) => item.isRead === 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-8 h-8 text-kaitel-magenta" />
                Bandeja de Entrada
              </h1>
              <p className="text-slate-600 mt-1">Gestiona tu feedback y mejora continua</p>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-kaitel-magenta text-white text-lg px-3 py-1">
                {unreadCount} nuevos
              </Badge>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(['all', 'unread', 'archived'] as const).map((tab) => (
              <Button
                key={tab}
                variant={filter === tab ? 'default' : 'outline'}
                onClick={() => setFilter(tab)}
                className={filter === tab ? 'bg-kaitel-magenta hover:bg-kaitel-magenta/90' : ''}
              >
                {tab === 'all' && 'Todos'}
                {tab === 'unread' && `Sin leer (${unreadCount})`}
                {tab === 'archived' && 'Archivados'}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feedback List */}
          <div className="lg:col-span-2">
            {filteredFeedback.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">
                    {filter === 'archived' ? 'No hay feedback archivado' : 'No hay feedback pendiente'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredFeedback.map((feedback: FeedbackItem) => {
                  const typeConfig = FEEDBACK_TYPE_CONFIG[feedback.feedbackType];
                  const priorityConfig = PRIORITY_CONFIG[feedback.priority];
                  const TypeIcon = typeConfig.icon;

                  return (
                    <Card
                      key={feedback.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedFeedback?.id === feedback.id
                          ? 'ring-2 ring-kaitel-magenta'
                          : ''
                      } ${!feedback.isRead ? 'bg-blue-50 border-l-4 border-l-kaitel-magenta' : ''}`}
                      onClick={() => handleSelectFeedback(feedback)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <TypeIcon className="w-4 h-4 flex-shrink-0" />
                              <h3 className="font-semibold text-slate-900 truncate">
                                {feedback.title}
                              </h3>
                              {feedback.isRead === 0 && (
                                <div className="w-2 h-2 bg-kaitel-magenta rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {feedback.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              <span>De: {feedback.fromAdminName || 'Admin'}</span>
                              <span>•</span>
                              <span>
                                {format(new Date(feedback.createdAt), 'dd MMM yyyy', { locale: es })}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                            <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedFeedback && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedFeedback.title}</CardTitle>
                  <CardDescription>
                    De: {selectedFeedback.fromAdminName || 'Admin'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Message */}
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 mb-2">Mensaje</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                      {selectedFeedback.message}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tipo:</span>
                      <Badge className={FEEDBACK_TYPE_CONFIG[selectedFeedback.feedbackType].color}>
                        {FEEDBACK_TYPE_CONFIG[selectedFeedback.feedbackType].label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Prioridad:</span>
                      <Badge className={PRIORITY_CONFIG[selectedFeedback.priority].color}>
                        {PRIORITY_CONFIG[selectedFeedback.priority].label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fecha:</span>
                      <span className="font-medium">
                        {format(new Date(selectedFeedback.createdAt), 'dd MMM yyyy HH:mm', {
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReplyDialog(true)}
                      className="flex-1"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Responder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(selectedFeedback.id)}
                      className="flex-1"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archivar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder a {selectedFeedback?.fromAdminName}</DialogTitle>
            <DialogDescription>Escribe tu respuesta al feedback recibido</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tu respuesta</label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleReply}
                disabled={replyMutation.isPending}
                className="bg-kaitel-magenta hover:bg-kaitel-magenta/90"
              >
                {replyMutation.isPending ? 'Enviando...' : 'Enviar Respuesta'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
