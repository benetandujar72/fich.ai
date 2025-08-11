import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Edit, 
  Send,
  Shield,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Communication {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  messageType: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  readAt?: string;
  emailSent: boolean;
}

export function CommunicationsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newCommDialogOpen, setNewCommDialogOpen] = useState(false);

  // Fetch all communications for the institution
  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['/api/admin/communications', user?.institutionId],
    enabled: !!user?.institutionId,
  });

  // Fetch employees for recipient selection
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/admin/employees', user?.institutionId],
    enabled: !!user?.institutionId,
  });

  // Filter communications
  const filteredCommunications = communications.filter((comm: Communication) => {
    const matchesSearch = 
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || comm.messageType === typeFilter;
    const matchesStatus = statusFilter === "all" || comm.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Send new communication mutation
  const sendCommMutation = useMutation({
    mutationFn: async (data: {
      recipientId: string;
      messageType: string;
      subject: string;
      message: string;
      priority: string;
    }) => {
      return await apiRequest('POST', '/api/communications', {
        ...data,
        emailSent: true
      });
    },
    onSuccess: () => {
      toast({
        title: "Comunicació enviada",
        description: "La comunicació s'ha enviat correctament.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/communications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
      setNewCommDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error enviant comunicació",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-red-100 text-red-800';
      case 'notification': return 'bg-blue-100 text-blue-800';
      case 'communication': return 'bg-green-100 text-green-800';
      case 'announcement': return 'bg-purple-100 text-purple-800';
      case 'privacy_policy': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'alert': return 'Alerta';
      case 'notification': return 'Notificació';
      case 'communication': return 'Comunicació';
      case 'announcement': return 'Comunicat';
      case 'privacy_policy': return 'Política Privacitat';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEditCommunication = (comm: Communication) => {
    // Only sender can edit their own communications
    return comm.senderId === user?.id && comm.status === 'draft';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestió de Comunicacions</h2>
          <p className="text-muted-foreground">
            Administra totes les comunicacions del centre educatiu
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={newCommDialogOpen} onOpenChange={setNewCommDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Comunicació
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl modal-content-solid">
              <DialogHeader>
                <DialogTitle>Enviar Nova Comunicació</DialogTitle>
                <DialogDescription>
                  Crea i envia una nova comunicació als usuaris del centre
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                sendCommMutation.mutate({
                  recipientId: formData.get('recipient') as string,
                  messageType: formData.get('messageType') as string,
                  subject: formData.get('subject') as string,
                  message: formData.get('message') as string,
                  priority: formData.get('priority') as string,
                });
              }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Destinatari</label>
                      <Select name="recipient" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un usuari" />
                        </SelectTrigger>
                        <SelectContent className="select-content-solid">
                          {employees.map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Tipus</label>
                      <Select name="messageType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipus de missatge" />
                        </SelectTrigger>
                        <SelectContent className="select-content-solid">
                          <SelectItem value="communication">Comunicació</SelectItem>
                          <SelectItem value="notification">Notificació</SelectItem>
                          <SelectItem value="announcement">Comunicat</SelectItem>
                          <SelectItem value="privacy_policy">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Política de Privacitat
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Prioritat</label>
                    <Select name="priority" required defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="select-content-solid">
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Assumpte</label>
                    <Input name="subject" required placeholder="Assumpte de la comunicació" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Missatge</label>
                    <Textarea name="message" required placeholder="Contingut del missatge" rows={6} />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setNewCommDialogOpen(false)}>
                      Cancel·lar
                    </Button>
                    <Button type="submit" disabled={sendCommMutation.isPending}>
                      <Send className="h-4 w-4 mr-2" />
                      {sendCommMutation.isPending ? "Enviant..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cercar per assumpte o usuari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar per tipus" />
              </SelectTrigger>
              <SelectContent className="select-content-solid">
                <SelectItem value="all">Tots els tipus</SelectItem>
                <SelectItem value="communication">Comunicacions</SelectItem>
                <SelectItem value="notification">Notificacions</SelectItem>
                <SelectItem value="announcement">Comunicats</SelectItem>
                <SelectItem value="alert">Alertes</SelectItem>
                <SelectItem value="privacy_policy">Privacitat</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar per estat" />
              </SelectTrigger>
              <SelectContent className="select-content-solid">
                <SelectItem value="all">Tots els estats</SelectItem>
                <SelectItem value="draft">Esborranys</SelectItem>
                <SelectItem value="sent">Enviats</SelectItem>
                <SelectItem value="delivered">Entregats</SelectItem>
                <SelectItem value="read">Llegits</SelectItem>
                <SelectItem value="failed">Fallits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Communications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Registre de Comunicacions ({filteredCommunications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipus</TableHead>
                  <TableHead>Assumpte</TableHead>
                  <TableHead>Emissor</TableHead>
                  <TableHead>Destinatari</TableHead>
                  <TableHead>Estat</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Accions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommunications.map((comm: Communication) => (
                  <TableRow key={comm.id}>
                    <TableCell>
                      <Badge className={getTypeColor(comm.messageType)}>
                        {getTypeName(comm.messageType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{comm.subject}</TableCell>
                    <TableCell>{comm.senderName}</TableCell>
                    <TableCell>{comm.recipientName}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(comm.status)}>
                        {comm.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(comm.createdAt).toLocaleDateString('ca-ES')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEditCommunication(comm) && (
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredCommunications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No s'han trobat comunicacions amb els filtres aplicats
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CommunicationsManagement;