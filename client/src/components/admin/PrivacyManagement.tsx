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
  Shield, 
  Search, 
  Eye, 
  Check, 
  X,
  Clock,
  AlertTriangle,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PrivacyRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestType: string;
  description: string;
  status: string;
  adminResponse?: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  resolvedAt?: string;
  createdAt: string;
}

export function PrivacyManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<PrivacyRequest | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);

  // Fetch privacy requests
  const { data: privacyRequests = [], isLoading } = useQuery({
    queryKey: ['/api/admin/privacy-requests', user?.institutionId],
    enabled: !!user?.institutionId,
  });

  // Filter requests
  const filteredRequests = privacyRequests.filter((request: PrivacyRequest) => {
    const matchesSearch = 
      request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesType = typeFilter === "all" || request.requestType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Update request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: {
      requestId: string;
      status: string;
      adminResponse: string;
    }) => {
      return apiRequest(`/api/admin/privacy-requests/${data.requestId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: data.status,
          adminResponse: data.adminResponse,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Sol·licitud actualitzada",
        description: "L'estat de la sol·licitud s'ha actualitzat correctament.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/privacy-requests'] });
      setResponseDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error actualitzant sol·licitud",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initiated': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'initiated': return 'Iniciada';
      case 'in_progress': return 'En Tràmit';
      case 'resolved': return 'Resolta';
      case 'rejected': return 'Rebutjada';
      default: return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'access': return 'bg-blue-100 text-blue-800';
      case 'rectification': return 'bg-orange-100 text-orange-800';
      case 'deletion': return 'bg-red-100 text-red-800';
      case 'portability': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'access': return 'Accés a Dades';
      case 'rectification': return 'Rectificació';
      case 'deletion': return 'Eliminació';
      case 'portability': return 'Portabilitat';
      default: return type;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleResponse = (request: PrivacyRequest) => {
    setSelectedRequest(request);
    setResponseDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestió de Política de Privacitat</h2>
          <p className="text-muted-foreground">
            Seguiment i gestió de sol·licituds GDPR i drets dels usuaris
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div className="text-sm">
                <p className="font-semibold">
                  {filteredRequests.filter((r: PrivacyRequest) => r.status === 'initiated').length}
                </p>
                <p className="text-muted-foreground">Iniciades</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div className="text-sm">
                <p className="font-semibold">
                  {filteredRequests.filter((r: PrivacyRequest) => r.status === 'in_progress').length}
                </p>
                <p className="text-muted-foreground">En Tràmit</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <div className="text-sm">
                <p className="font-semibold">
                  {filteredRequests.filter((r: PrivacyRequest) => r.status === 'resolved').length}
                </p>
                <p className="text-muted-foreground">Resoltes</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-500" />
              <div className="text-sm">
                <p className="font-semibold">
                  {filteredRequests.filter((r: PrivacyRequest) => 
                    r.dueDate && isOverdue(r.dueDate)
                  ).length}
                </p>
                <p className="text-muted-foreground">Vençudes</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cercar per usuari o descripció..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar per estat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tots els estats</SelectItem>
                <SelectItem value="initiated">Iniciades</SelectItem>
                <SelectItem value="in_progress">En Tràmit</SelectItem>
                <SelectItem value="resolved">Resoltes</SelectItem>
                <SelectItem value="rejected">Rebutjades</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar per tipus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tots els tipus</SelectItem>
                <SelectItem value="access">Accés a Dades</SelectItem>
                <SelectItem value="rectification">Rectificació</SelectItem>
                <SelectItem value="deletion">Eliminació</SelectItem>
                <SelectItem value="portability">Portabilitat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sol·licituds de Privacitat ({filteredRequests.length})
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
                  <TableHead>Tipus Sol·licitud</TableHead>
                  <TableHead>Usuari</TableHead>
                  <TableHead>Descripció</TableHead>
                  <TableHead>Estat</TableHead>
                  <TableHead>Data Creació</TableHead>
                  <TableHead>Data Límit</TableHead>
                  <TableHead>Accions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: PrivacyRequest) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Badge className={getTypeColor(request.requestType)}>
                        {getTypeName(request.requestType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.userName}</p>
                        <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={request.description}>
                        {request.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusName(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString('ca-ES')}
                    </TableCell>
                    <TableCell>
                      {request.dueDate && (
                        <div className={`${isOverdue(request.dueDate) ? 'text-red-600' : ''}`}>
                          {new Date(request.dueDate).toLocaleDateString('ca-ES')}
                          {isOverdue(request.dueDate) && (
                            <AlertTriangle className="inline h-4 w-4 ml-1" />
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResponse(request)}
                          disabled={request.status === 'resolved'}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No s'han trobat sol·licituds amb els filtres aplicats
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      {selectedRequest && (
        <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Respondre Sol·licitud de Privacitat</DialogTitle>
              <DialogDescription>
                Gestiona la resposta a la sol·licitud de {selectedRequest.userName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalls de la Sol·licitud</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Tipus:</strong> {getTypeName(selectedRequest.requestType)}</div>
                  <div><strong>Usuari:</strong> {selectedRequest.userName} ({selectedRequest.userEmail})</div>
                  <div><strong>Descripció:</strong> {selectedRequest.description}</div>
                  <div><strong>Data Creació:</strong> {new Date(selectedRequest.createdAt).toLocaleString('ca-ES')}</div>
                  {selectedRequest.dueDate && (
                    <div><strong>Data Límit:</strong> {new Date(selectedRequest.dueDate).toLocaleString('ca-ES')}</div>
                  )}
                </CardContent>
              </Card>

              {/* Response Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateStatusMutation.mutate({
                  requestId: selectedRequest.id,
                  status: formData.get('status') as string,
                  adminResponse: formData.get('adminResponse') as string,
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nou Estat</label>
                    <Select name="status" required defaultValue={selectedRequest.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initiated">Iniciada</SelectItem>
                        <SelectItem value="in_progress">En Tràmit</SelectItem>
                        <SelectItem value="resolved">Resolta</SelectItem>
                        <SelectItem value="rejected">Rebutjada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Resposta Administrativa</label>
                    <Textarea 
                      name="adminResponse" 
                      placeholder="Escriu la resposta o explicació per a l'usuari..."
                      rows={4}
                      defaultValue={selectedRequest.adminResponse || ''}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setResponseDialogOpen(false)}>
                      Cancel·lar
                    </Button>
                    <Button type="submit" disabled={updateStatusMutation.isPending}>
                      {updateStatusMutation.isPending ? "Guardant..." : "Guardar Resposta"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default PrivacyManagement;