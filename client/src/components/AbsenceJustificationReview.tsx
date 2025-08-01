import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Check, 
  X, 
  MessageCircle, 
  Clock,
  User,
  FileText
} from "lucide-react";

interface AbsenceJustificationReviewProps {
  institutionId: string;
  language: string;
}

interface AbsenceJustification {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  createdAt: string;
}

export default function AbsenceJustificationReview({ institutionId, language }: AbsenceJustificationReviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedJustification, setSelectedJustification] = useState<AbsenceJustification | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  // Fetch pending absence justifications
  const { data: justifications = [], isLoading } = useQuery<AbsenceJustification[]>({
    queryKey: ["/api/absence-justifications/admin", institutionId],
    enabled: !!institutionId,
  });

  // Review justification mutation
  const reviewMutation = useMutation({
    mutationFn: async (data: { id: string; status: string; adminResponse: string }) => {
      return await apiRequest("PUT", `/api/absence-justifications/${data.id}/status`, {
        status: data.status,
        adminResponse: data.adminResponse
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: language === "ca" ? "Revisió completada" : "Revisión completada",
        description: variables.status === 'approved'
          ? (language === "ca" ? "Justificació aprovada correctament" : "Justificación aprobada correctamente")
          : (language === "ca" ? "Justificació rebutjada correctament" : "Justificación rechazada correctamente"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/absence-justifications"] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" 
          ? "Error processant la revisió" 
          : "Error procesando la revisión"),
        variant: "destructive",
      });
    },
  });

  const handleOpenReviewModal = (justification: AbsenceJustification, action: 'approve' | 'reject') => {
    setSelectedJustification(justification);
    setReviewAction(action);
    setAdminResponse("");
    setShowReviewModal(true);
  };

  const handleCloseModal = () => {
    setSelectedJustification(null);
    setReviewAction(null);
    setAdminResponse("");
    setShowReviewModal(false);
  };

  const handleSubmitReview = () => {
    if (selectedJustification && reviewAction) {
      reviewMutation.mutate({
        id: selectedJustification.id,
        status: reviewAction === 'approve' ? 'approved' : 'rejected',
        adminResponse: adminResponse.trim()
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">{language === "ca" ? "Aprovat" : "Aprobado"}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">{language === "ca" ? "Rebutjat" : "Rechazado"}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">{language === "ca" ? "Pendent" : "Pendiente"}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingJustifications = justifications.filter(j => j.status === 'pending');
  const reviewedJustifications = justifications.filter(j => j.status !== 'pending');

  if (isLoading) {
    return (
      <Card data-testid="justification-review-loading">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            {language === "ca" ? "Revisió de Justificacions" : "Revisión de Justificaciones"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Justifications */}
      <Card data-testid="pending-justifications">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-yellow-600" />
              {language === "ca" ? "Justificacions Pendents" : "Justificaciones Pendientes"}
            </div>
            <Badge variant="secondary">
              {pendingJustifications.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingJustifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>{language === "ca" ? "No hi ha justificacions pendents" : "No hay justificaciones pendientes"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ca" ? "Empleat" : "Empleado"}</TableHead>
                    <TableHead>{language === "ca" ? "Data" : "Fecha"}</TableHead>
                    <TableHead>{language === "ca" ? "Motiu" : "Motivo"}</TableHead>
                    <TableHead>{language === "ca" ? "Sol·licitat" : "Solicitado"}</TableHead>
                    <TableHead>{language === "ca" ? "Accions" : "Acciones"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingJustifications.map((justification) => (
                    <TableRow key={justification.id} data-testid={`pending-justification-${justification.id}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-gray-500" />
                          <span className="font-medium">{justification.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(justification.date).toLocaleDateString(language === "ca" ? "ca-ES" : "es-ES")}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={justification.reason}>
                          {justification.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(justification.createdAt).toLocaleDateString(language === "ca" ? "ca-ES" : "es-ES")}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleOpenReviewModal(justification, 'approve')}
                            data-testid={`approve-${justification.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {language === "ca" ? "Aprovar" : "Aprobar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenReviewModal(justification, 'reject')}
                            data-testid={`reject-${justification.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            {language === "ca" ? "Rebutjar" : "Rechazar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviewed Justifications */}
      {reviewedJustifications.length > 0 && (
        <Card data-testid="reviewed-justifications">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
              {language === "ca" ? "Justificacions Revisades" : "Justificaciones Revisadas"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ca" ? "Empleat" : "Empleado"}</TableHead>
                    <TableHead>{language === "ca" ? "Data" : "Fecha"}</TableHead>
                    <TableHead>{language === "ca" ? "Estat" : "Estado"}</TableHead>
                    <TableHead>{language === "ca" ? "Resposta Admin" : "Respuesta Admin"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedJustifications.slice(0, 10).map((justification) => (
                    <TableRow key={justification.id} data-testid={`reviewed-justification-${justification.id}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-gray-500" />
                          <span className="font-medium">{justification.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(justification.date).toLocaleDateString(language === "ca" ? "ca-ES" : "es-ES")}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(justification.status)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={justification.adminResponse}>
                          {justification.adminResponse || (language === "ca" ? "Sense comentaris" : "Sin comentarios")}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {reviewAction === 'approve' ? (
                <Check className="mr-2 h-5 w-5 text-green-600" />
              ) : (
                <X className="mr-2 h-5 w-5 text-red-600" />
              )}
              {reviewAction === 'approve'
                ? (language === "ca" ? "Aprovar Justificació" : "Aprobar Justificación")
                : (language === "ca" ? "Rebutjar Justificació" : "Rechazar Justificación")}
            </DialogTitle>
            <DialogDescription>
              {selectedJustification && (
                <div className="space-y-2 mt-4">
                  <p><strong>{language === "ca" ? "Empleat:" : "Empleado:"}</strong> {selectedJustification.employeeName}</p>
                  <p><strong>{language === "ca" ? "Data:" : "Fecha:"}</strong> {new Date(selectedJustification.date).toLocaleDateString(language === "ca" ? "ca-ES" : "es-ES")}</p>
                  <p><strong>{language === "ca" ? "Motiu:" : "Motivo:"}</strong> {selectedJustification.reason}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-response">
                {reviewAction === 'approve'
                  ? (language === "ca" ? "Comentaris d'aprovació (opcional)" : "Comentarios de aprobación (opcional)")
                  : (language === "ca" ? "Motiu del rebuig" : "Motivo del rechazo")}
              </Label>
              <Textarea
                id="admin-response"
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder={reviewAction === 'approve'
                  ? (language === "ca" ? "Afegeix comentaris sobre l'aprovació..." : "Añade comentarios sobre la aprobación...")
                  : (language === "ca" ? "Explica el motiu del rebuig..." : "Explica el motivo del rechazo...")}
                rows={3}
                data-testid="admin-response-input"
              />
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              data-testid="cancel-review"
            >
              {language === "ca" ? "Cancel·lar" : "Cancelar"}
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewMutation.isPending || (reviewAction === 'reject' && !adminResponse.trim())}
              className={reviewAction === 'approve' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              data-testid="submit-review"
            >
              {reviewMutation.isPending
                ? (language === "ca" ? "Processant..." : "Procesando...")
                : reviewAction === 'approve'
                ? (language === "ca" ? "Aprovar" : "Aprobar")
                : (language === "ca" ? "Rebutjar" : "Rechazar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}