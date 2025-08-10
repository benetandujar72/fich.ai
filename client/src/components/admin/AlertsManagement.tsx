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
  AlertTriangle, 
  Plus, 
  Search, 
  Edit, 
  Send,
  Clock,
  Filter 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Alert {
  id: string;
  type: string;
  subject: string;
  content: string;
  employeeId: string;
  employeeName: string;
  sentAt: string;
  emailSent: boolean;
  delayMinutes?: number;
  accumulatedMinutes?: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function AlertsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [newAlertDialogOpen, setNewAlertDialogOpen] = useState(false);


  // Fetch alerts history
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/admin/alerts', user?.institutionId],
    enabled: !!user?.institutionId,
  });



  // Fetch employees for recipient selection
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/admin/employees', user?.institutionId],
    enabled: !!user?.institutionId,
  });

  // Enhanced filtered alerts with multiple filters
  const filteredAlerts = (alerts as Alert[]).filter((alert: Alert) => {
    const matchesSearch = 
      alert.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || alert.type === typeFilter;
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "sent" && alert.emailSent) ||
      (statusFilter === "pending" && !alert.emailSent);
    
    const matchesUser = userFilter === "all" || alert.employeeId === userFilter;
    
    const matchesDate = dateFilter === "all" || (() => {
      const alertDate = new Date(alert.sentAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      switch (dateFilter) {
        case "today":
          return alertDate.toDateString() === today.toDateString();
        case "yesterday":
          return alertDate.toDateString() === yesterday.toDateString();
        case "week":
          return alertDate >= lastWeek;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesType && matchesStatus && matchesUser && matchesDate;
  });

  // Send manual alert mutation
  const sendAlertMutation = useMutation({
    mutationFn: async (data: {
      recipients: string[];
      subject: string;
      message: string;
      type: string;
    }) => {
      return fetch('/api/admin/alerts/send-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          institutionId: user?.institutionId,
        }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Alerta enviada",
        description: "L'alerta s'ha enviat correctament.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alerts'] });
      setNewAlertDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error enviant alerta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'delay_alert': return 'bg-orange-100 text-orange-800';
      case 'accumulated_delay': return 'bg-red-100 text-red-800';
      case 'manual_notification': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeName = (type: string) => {
    switch (type) {
      case 'delay_alert': return 'Retard Puntual';
      case 'accumulated_delay': return 'Retard Acumulat';
      case 'manual_notification': return 'Notificació Manual';
      case 'scheduled': return 'Programada';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestió d'Alertes</h2>
          <p className="text-muted-foreground">
            Administra i configura les alertes del sistema
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={newAlertDialogOpen} onOpenChange={setNewAlertDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-foreground">Enviar Nova Alerta</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Envia una alerta manual als usuaris seleccionats
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                sendAlertMutation.mutate({
                  recipients: [formData.get('recipient') as string],
                  subject: formData.get('subject') as string,
                  message: formData.get('message') as string,
                  type: 'manual_notification',
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Destinatari</label>
                    <Select name="recipient" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un empleat" />
                      </SelectTrigger>
                      <SelectContent>
                        {(employees as Employee[]).map((employee: Employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} - {employee.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Assumpte</label>
                    <Input name="subject" required placeholder="Assumpte de l'alerta" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Missatge</label>
                    <Textarea name="message" required placeholder="Contingut del missatge" rows={4} />
                  </div>
                  
                  <Button type="submit" disabled={sendAlertMutation.isPending}>
                    <Send className="h-4 w-4 mr-2" />
                    {sendAlertMutation.isPending ? "Enviant..." : "Enviar Alerta"}
                  </Button>
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
                placeholder="Cercar per assumpte o empleat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar per tipus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tots els tipus</SelectItem>
                <SelectItem value="delay_alert">Retard Puntual</SelectItem>
                <SelectItem value="accumulated_delay">Retard Acumulat</SelectItem>
                <SelectItem value="manual_notification">Manual</SelectItem>
                <SelectItem value="scheduled">Programada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Historial d'Alertes ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipus</TableHead>
                  <TableHead>Assumpte</TableHead>
                  <TableHead>Empleat</TableHead>
                  <TableHead>Data Enviament</TableHead>
                  <TableHead>Estat Email</TableHead>
                  <TableHead>Detalls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert: Alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Badge className={getAlertTypeColor(alert.type)}>
                        {getAlertTypeName(alert.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{alert.subject}</TableCell>
                    <TableCell>{alert.employeeName}</TableCell>
                    <TableCell>
                      {new Date(alert.sentAt).toLocaleString('ca-ES')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={alert.emailSent ? "default" : "destructive"}>
                        {alert.emailSent ? "Enviat" : "Pendent"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {alert.delayMinutes && (
                        <span className="text-sm text-orange-600">
                          +{alert.delayMinutes}min
                        </span>
                      )}
                      {alert.accumulatedMinutes && (
                        <span className="text-sm text-red-600">
                          Total: {alert.accumulatedMinutes}min
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredAlerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No s'han trobat alertes amb els filtres aplicats
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

export default AlertsManagement;