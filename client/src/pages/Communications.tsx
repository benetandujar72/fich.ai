import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Mail, 
  Send, 
  Inbox, 
  Trash2, 
  Eye, 
  EyeOff, 
  Paperclip, 
  Calendar,
  AlertCircle,
  Users,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

interface Communication {
  id: string;
  institutionId: string;
  senderId: string;
  recipientId: string;
  messageType: 'internal' | 'notification' | 'alert';
  subject: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  emailSent: boolean;
  emailSentAt?: string;
  readAt?: string;
  deliveredAt?: string;
  deletedByUserAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    firstName: string;
    lastName: string;
    email: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function Communications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'inbox' | 'sent' | 'unread'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Form states for compose dialog
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeMessageType, setComposeMessageType] = useState<'internal' | 'notification' | 'alert'>('internal');
  const [composePriority, setComposePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [composeEmailEnabled, setComposeEmailEnabled] = useState(true);

  // Fetch communications
  const { data: communicationsResponse = [], isLoading } = useQuery({
    queryKey: ['/api/communications', user?.id, 'all'],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/communications/${user.id}/all?filter=${selectedFilter}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch users for recipient selection
  const { data: institutionUsers = [] } = useQuery({
    queryKey: ['/api/users', user?.institutionId],
    queryFn: async () => {
      if (!user?.institutionId) return [];
      const response = await fetch(`/api/users/institution/${user.institutionId}`);
      return response.json();
    },
    enabled: !!user?.institutionId,
  });

  // Create communication mutation
  const createCommunicationMutation = useMutation({
    mutationFn: async (communicationData: any) => {
      return apiRequest('POST', '/api/communications', communicationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
      toast({
        title: "Missatge enviat",
        description: "El missatge s'ha enviat correctament.",
      });
      setIsComposeOpen(false);
      resetComposeForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No s'ha pogut enviar el missatge.",
      });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (communicationId: string) => {
      return apiRequest('PATCH', `/api/communications/${communicationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
    },
  });

  // Delete communication mutation
  const deleteCommunicationMutation = useMutation({
    mutationFn: async (communicationId: string) => {
      return apiRequest('DELETE', `/api/communications/${communicationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
      toast({
        title: "Missatge eliminat",
        description: "El missatge s'ha eliminat correctament.",
      });
      setSelectedCommunication(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No s'ha pogut eliminar el missatge.",
      });
    },
  });

  const resetComposeForm = () => {
    setComposeRecipient('');
    setComposeSubject('');
    setComposeContent('');
    setComposeMessageType('internal');
    setComposePriority('medium');
    setComposeEmailEnabled(true);
  };

  const handleComposeSubmit = () => {
    if (!composeRecipient || !composeSubject || !composeContent.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Sisplau, ompliu tots els camps obligatoris.",
      });
      return;
    }

    createCommunicationMutation.mutate({
      recipientId: composeRecipient,
      messageType: composeMessageType,
      subject: composeSubject,
      content: composeContent,
      priority: composePriority,
      emailSent: composeEmailEnabled,
    });
  };

  const handleMarkAsRead = (communication: Communication) => {
    if (communication.status !== 'read' && communication.recipientId === user?.id) {
      markAsReadMutation.mutate(communication.id);
    }
    setSelectedCommunication(communication);
  };

  // Asegurar que communications siempre sea un array
  const communications = Array.isArray(communicationsResponse) ? communicationsResponse : [];

  const filteredCommunications = communications.filter((comm: Communication) => {
    const matchesSearch = searchTerm === '' || 
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${comm.sender.firstName} ${comm.sender.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    switch (selectedFilter) {
      case 'inbox':
        return comm.recipientId === user?.id && matchesSearch;
      case 'sent':
        return comm.senderId === user?.id && matchesSearch;
      case 'unread':
        return comm.recipientId === user?.id && comm.status !== 'read' && matchesSearch;
      default:
        return (comm.recipientId === user?.id || comm.senderId === user?.id) && matchesSearch;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (communication: Communication) => {
    if (communication.status === 'read') return <Eye className="h-4 w-4 text-green-600" />;
    if (communication.status === 'delivered') return <Mail className="h-4 w-4 text-blue-600" />;
    return <EyeOff className="h-4 w-4 text-gray-400" />;
  };

  const unreadCount = communications.filter((comm: Communication) => 
    comm.recipientId === user?.id && comm.status !== 'read'
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregant comunicacions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comunicacions</h1>
          <p className="text-muted-foreground">
            Gestiona la comunicació interna del centre educatiu
          </p>
        </div>
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-compose-message">
              <Send className="mr-2 h-4 w-4" />
              Nou Missatge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Redactar Missatge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient">Destinatari *</Label>
                  <Select value={composeRecipient} onValueChange={setComposeRecipient}>
                    <SelectTrigger data-testid="select-recipient">
                      <SelectValue placeholder="Selecciona un destinatari" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionUsers.map((user: User) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="messageType">Tipus de Missatge</Label>
                  <Select value={composeMessageType} onValueChange={(value: 'internal' | 'notification' | 'alert') => setComposeMessageType(value)}>
                    <SelectTrigger data-testid="select-message-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Intern</SelectItem>
                      <SelectItem value="notification">Notificació</SelectItem>
                      <SelectItem value="alert">Alerta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioritat</Label>
                  <Select value={composePriority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setComposePriority(value)}>
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Mitjana</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={composeEmailEnabled}
                    onChange={(e) => setComposeEmailEnabled(e.target.checked)}
                    data-testid="checkbox-email-enabled"
                  />
                  <Label htmlFor="emailEnabled">Enviar per email</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Assumpte *</Label>
                <Input
                  id="subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Introdueix l'assumpte del missatge"
                  data-testid="input-subject"
                />
              </div>

              <div>
                <Label htmlFor="content">Contingut *</Label>
                <Textarea
                  id="content"
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="Escriu el contingut del missatge..."
                  rows={6}
                  data-testid="textarea-content"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                  Cancel·lar
                </Button>
                <Button 
                  onClick={handleComposeSubmit}
                  disabled={createCommunicationMutation.isPending}
                  data-testid="button-send-message"
                >
                  {createCommunicationMutation.isPending ? 'Enviant...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <Tabs value={selectedFilter} onValueChange={(value: 'all' | 'inbox' | 'sent' | 'unread') => setSelectedFilter(value)} className="w-auto">
          <TabsList>
            <TabsTrigger value="inbox" className="relative" data-testid="tab-inbox">
              <Inbox className="mr-2 h-4 w-4" />
              Bústia d'entrada
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" data-testid="tab-sent">
              <Send className="mr-2 h-4 w-4" />
              Enviats
            </TabsTrigger>
            <TabsTrigger value="unread" data-testid="tab-unread">
              <AlertCircle className="mr-2 h-4 w-4" />
              No llegits
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              <Mail className="mr-2 h-4 w-4" />
              Tots
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cercar missatges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>

      {/* Communications List and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Communications List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Missatges ({filteredCommunications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {filteredCommunications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Mail className="mx-auto h-8 w-8 mb-2" />
                    <p>No hi ha missatges</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCommunications.map((communication: Communication, index: number) => (
                      <div key={communication.id}>
                        <div
                          className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                            selectedCommunication?.id === communication.id ? 'bg-accent' : ''
                          } ${communication.status !== 'read' && communication.recipientId === user?.id ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                          onClick={() => handleMarkAsRead(communication)}
                          data-testid={`communication-item-${communication.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="text-sm font-medium truncate">
                                  {communication.senderId === user?.id 
                                    ? `Para: ${communication.recipient.firstName} ${communication.recipient.lastName}`
                                    : `De: ${communication.sender.firstName} ${communication.sender.lastName}`
                                  }
                                </p>
                                <Badge variant={getPriorityColor(communication.priority)} className="text-xs">
                                  {communication.priority}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium truncate mb-1">
                                {communication.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mb-2">
                                {communication.content}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(communication.createdAt), 'dd/MM/yyyy HH:mm', { locale: ca })}
                                </p>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(communication)}
                                  {communication.emailSent && (
                                    <Mail className="h-4 w-4 text-green-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < filteredCommunications.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Communication Detail */}
        <div className="lg:col-span-2">
          {selectedCommunication ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {selectedCommunication.subject}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>
                          De: {selectedCommunication.sender.firstName} {selectedCommunication.sender.lastName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(selectedCommunication.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ca })}
                        </span>
                      </div>
                      <Badge variant={getPriorityColor(selectedCommunication.priority)}>
                        {selectedCommunication.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedCommunication.emailSent && (
                      <Badge variant="outline" className="text-green-600">
                        <Mail className="mr-1 h-3 w-3" />
                        Email enviat
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCommunicationMutation.mutate(selectedCommunication.id)}
                      disabled={deleteCommunicationMutation.isPending}
                      data-testid="button-delete-communication"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedCommunication.content}
                  </div>
                </div>
                
                {selectedCommunication.readAt && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Llegit el {format(new Date(selectedCommunication.readAt), 'dd MMMM yyyy, HH:mm', { locale: ca })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Mail className="mx-auto h-12 w-12 mb-4" />
                  <p>Selecciona un missatge per veure'n els detalls</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}