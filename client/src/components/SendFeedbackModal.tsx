import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface SendFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: number;
  agentName?: string;
}

const FEEDBACK_TYPES = [
  { value: 'note', label: 'Nota General' },
  { value: 'praise', label: 'Reconocimiento' },
  { value: 'improvement', label: 'Mejora' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'follow_up', label: 'Seguimiento' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
];

export function SendFeedbackModal({ isOpen, onClose, agentId, agentName }: SendFeedbackModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'note' | 'praise' | 'improvement' | 'urgent' | 'follow_up'>('note');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(agentId || null);

  const sendMutation = trpc.feedback.send.useMutation();
  const agentsList = trpc.analytics.getAgentsList.useQuery(undefined, { enabled: isOpen });

  const handleSend = async () => {
    if (!selectedAgentId || !title.trim() || !message.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      await sendMutation.mutateAsync({
        toAgentId: selectedAgentId,
        title: title.trim(),
        message: message.trim(),
        feedbackType,
        priority,
      });

      toast.success('Feedback enviado correctamente');

      // Reset form
      setTitle('');
      setMessage('');
      setFeedbackType('note');
      setPriority('medium');
      setSelectedAgentId(agentId || null);
      onClose();
    } catch (error) {
      toast.error('No se pudo enviar el feedback');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
          <DialogDescription>
            {agentName ? `A: ${agentName}` : 'Selecciona un agente para enviar feedback'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!agentId && (
            <div>
              <label className="text-sm font-medium">Agente</label>
              <Select value={selectedAgentId?.toString() || ''} onValueChange={(v) => setSelectedAgentId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un agente" />
                </SelectTrigger>
                <SelectContent>
                  {agentsList.data?.map((agent: any) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Tipo de Feedback</label>
            <Select value={feedbackType} onValueChange={(v: any) => setFeedbackType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Prioridad</label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Mejora en tono de voz"
              maxLength={255}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Mensaje</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu feedback aquí..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="bg-kaitel-magenta hover:bg-kaitel-magenta/90"
            >
              {sendMutation.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
