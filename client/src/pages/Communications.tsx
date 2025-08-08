import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Send, 
  Mail, 
  MailOpen, 
  Archive, 
  AlertTriangle,
  Clock,
  Plus,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ca, es } from "date-fns/locale";

interface Communication {
  id: string;
  senderId: string;
  recipientId?: string;
  subject: string;
  message: string;
  type: string;
  priority: string;
  status: string;
  readAt?: string;
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  recipient?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function Communications() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [newMessage, setNewMessage] = useState({
    recipientId: '',
    subject: '',
    message: '',
    type: 'message',
    priority: 'normal',
  });
  const [filter, setFilter] = useState('all'); // all, unread, sent
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  
  const locale = language === "ca" ? ca : es;

  // Get communications
  const { data: communications, isLoading } = useQuery({
    queryKey: ['/api/communications', user?.id, 'all'],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/communications/${user.id}/all`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get users for recipient selection
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users', user?.institutionId],
    queryFn: async () => {
      if (!user?.institutionId) return [];
      const response = await fetch(`/api/users/${user.institutionId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!user?.institutionId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest('POST', '/api/communications', messageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
      toast({
        title: language === "ca" ? "Missatge enviat" : "Mensaje enviado",
        description: language === "ca" ? "El missatge s'ha enviat correctament" : "El mensaje se ha enviado correctamente",
      });
      setNewMessage({
        recipientId: '',
        subject: '',
        message: '',
        type: 'message',
        priority: 'normal',
      });
      setIsComposeOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (communicationId: string) => {
      const response = await apiRequest('PATCH', `/api/communications/${communicationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.subject || !newMessage.message) return;
    
    sendMessageMutation.mutate({
      ...newMessage,
      institutionId: user?.institutionId,
    });
  };

  const handleViewMessage = (communication: Communication) => {
    setSelectedCommunication(communication);
    if (communication.status === 'unread' && communication.recipientId === user?.id) {
      markAsReadMutation.mutate(communication.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'notification': return <Mail className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredCommunications = communications?.filter((comm: Communication) => {
    if (filter === 'unread') return comm.status === 'unread' && comm.recipientId === user?.id;
    if (filter === 'sent') return comm.senderId === user?.id;
    return comm.senderId === user?.id || comm.recipientId === user?.id;
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              {language === "ca" ? "Comunicacions" : "Comunicaciones"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ca" 
                ? "Gestiona les teves comunicacions amb l'administració" 
                : "Gestiona tus comunicaciones con la administración"}
            </p>
          </div>
          
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-compose-message">
                <Plus className="h-4 w-4 mr-2" />
                {language === "ca" ? "Nou missatge" : "Nuevo mensaje"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {language === "ca" ? "Nou missatge" : "Nuevo mensaje"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipient">
                    {language === "ca" ? "Destinatari" : "Destinatario"}
                  </Label>
                  <Select value={newMessage.recipientId} onValueChange={(value) => 
                    setNewMessage(prev => ({ ...prev, recipientId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "ca" ? "Selecciona destinatari" : "Selecciona destinatario"} />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">
                    {language === "ca" ? "Prioritat" : "Prioridad"}
                  </Label>
                  <Select value={newMessage.priority} onValueChange={(value) => 
                    setNewMessage(prev => ({ ...prev, priority: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{language === "ca" ? "Baixa" : "Baja"}</SelectItem>
                      <SelectItem value="normal">{language === "ca" ? "Normal" : "Normal"}</SelectItem>
                      <SelectItem value="high">{language === "ca" ? "Alta" : "Alta"}</SelectItem>
                      <SelectItem value="urgent">{language === "ca" ? "Urgent" : "Urgente"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subject">
                    {language === "ca" ? "Assumpte" : "Asunto"}
                  </Label>
                  <Input
                    id="subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={language === "ca" ? "Escriu l'assumpte..." : "Escribe el asunto..."}
                    data-testid="input-subject"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">
                    {language === "ca" ? "Missatge" : "Mensaje"}
                  </Label>
                  <Textarea
                    id="message"
                    value={newMessage.message}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                    placeholder={language === "ca" ? "Escriu el missatge..." : "Escribe el mensaje..."}
                    rows={4}
                    data-testid="textarea-message"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsComposeOpen(false)}
                    data-testid="button-cancel"
                  >
                    {language === "ca" ? "Cancel·lar" : "Cancelar"}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSendMessage}
                    disabled={!newMessage.subject || !newMessage.message || sendMessageMutation.isPending}
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendMessageMutation.isPending 
                      ? (language === "ca" ? "Enviant..." : "Enviando...")
                      : (language === "ca" ? "Enviar" : "Enviar")
                    }
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            data-testid="filter-all"
          >
            <Filter className="h-4 w-4 mr-2" />
            {language === "ca" ? "Tots" : "Todos"}
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            data-testid="filter-unread"
          >
            <Mail className="h-4 w-4 mr-2" />
            {language === "ca" ? "No llegits" : "No leídos"}
          </Button>
          <Button
            variant={filter === 'sent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('sent')}
            data-testid="filter-sent"
          >
            <Send className="h-4 w-4 mr-2" />
            {language === "ca" ? "Enviats" : "Enviados"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Communications list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {language === "ca" ? "Missatges" : "Mensajes"}
              <Badge variant="secondary">{filteredCommunications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCommunications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {language === "ca" 
                    ? "No hi ha missatges per mostrar" 
                    : "No hay mensajes para mostrar"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCommunications.map((comm: Communication) => (
                  <div
                    key={comm.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      comm.status === 'unread' && comm.recipientId === user?.id 
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                        : ''
                    }`}
                    onClick={() => handleViewMessage(comm)}
                    data-testid={`message-${comm.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(comm.type)}
                        <span className="font-medium text-sm">
                          {comm.senderId === user?.id 
                            ? `${language === "ca" ? "A:" : "Para:"} ${comm.recipient?.firstName} ${comm.recipient?.lastName}`
                            : `${language === "ca" ? "De:" : "De:"} ${comm.sender?.firstName} ${comm.sender?.lastName}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getPriorityColor(comm.priority)}>
                          {comm.priority}
                        </Badge>
                        {comm.status === 'unread' && comm.recipientId === user?.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1">{comm.subject}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{comm.message}</p>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(comm.createdAt), 'dd/MM/yyyy HH:mm', { locale })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message viewer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedCommunication?.status === 'unread' && selectedCommunication?.recipientId === user?.id
                ? <Mail className="h-5 w-5" />
                : <MailOpen className="h-5 w-5" />
              }
              {language === "ca" ? "Detall del missatge" : "Detalle del mensaje"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCommunication ? (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedCommunication.senderId === user?.id 
                        ? `${language === "ca" ? "A:" : "Para:"} ${selectedCommunication.recipient?.firstName} ${selectedCommunication.recipient?.lastName}`
                        : `${language === "ca" ? "De:" : "De:"} ${selectedCommunication.sender?.firstName} ${selectedCommunication.sender?.lastName}`
                      }
                    </span>
                    <Badge variant="secondary" className={getPriorityColor(selectedCommunication.priority)}>
                      {selectedCommunication.priority}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{selectedCommunication.subject}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(selectedCommunication.createdAt), 'dd/MM/yyyy HH:mm', { locale })}
                    {selectedCommunication.readAt && (
                      <span className="ml-4">
                        {language === "ca" ? "Llegit:" : "Leído:"} {format(new Date(selectedCommunication.readAt), 'dd/MM/yyyy HH:mm', { locale })}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedCommunication.message}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MailOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {language === "ca" 
                    ? "Selecciona un missatge per veure els detalls" 
                    : "Selecciona un mensaje para ver los detalles"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}