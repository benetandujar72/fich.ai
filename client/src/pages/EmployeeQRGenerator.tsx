import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  QrCode, 
  Download, 
  Printer, 
  Users, 
  FileText,
  RefreshCw,
  User,
  Building2
} from 'lucide-react';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  position?: string;
  teacherCode?: string;
  departmentId?: string;
}

export default function EmployeeQRGenerator() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [qrSize, setQrSize] = useState<number>(200);
  const [includeNames, setIncludeNames] = useState<boolean>(true);
  const [includePosition, setIncludePosition] = useState<boolean>(true);
  const [generatedQRs, setGeneratedQRs] = useState<Array<{employeeId: string, qrData: string, canvas?: HTMLCanvasElement}>>([]);
  
  const institutionId = user?.institutionId;

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", institutionId],
    enabled: !!institutionId && (user?.role === "admin" || user?.role === "superadmin"),
  });

  const generateQRCode = async (employeeId: string, employeeName: string) => {
    try {
      const QRCode = await import('qrcode');
      const canvas = document.createElement('canvas');
      
      // QR data contains only employee ID for security
      const qrData = employeeId;
      
      await QRCode.toCanvas(canvas, qrData, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return { employeeId, qrData, canvas };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const generateAllQRs = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? "Selecciona almenys un empleat" : "Selecciona al menos un empleado",
        variant: "destructive",
      });
      return;
    }

    try {
      const qrs = [];
      for (const employeeId of selectedEmployees) {
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
          const qr = await generateQRCode(employeeId, employee.fullName);
          qrs.push(qr);
        }
      }
      setGeneratedQRs(qrs);
      
      toast({
        title: language === "ca" ? "Èxit" : "Éxito",
        description: language === "ca" ? 
          `${qrs.length} codis QR generats correctament` : 
          `${qrs.length} códigos QR generados correctamente`,
      });
    } catch (error) {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? 
          "Error generant els codis QR" : 
          "Error generando los códigos QR",
        variant: "destructive",
      });
    }
  };

  const downloadPrintablePDF = async () => {
    if (generatedQRs.length === 0) return;

    try {
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 20;
      const qrWidth = 60;
      const qrHeight = includeNames ? 80 : 60;
      const cols = 2;
      const rows = Math.floor((pageHeight - 2 * margin) / qrHeight);
      
      let x = margin;
      let y = margin;
      let currentPage = 0;
      
      // Add title
      pdf.setFontSize(16);
      pdf.text('Codis QR de Fitxatge - fich.ai', pageWidth / 2, y, { align: 'center' });
      y += 15;
      
      pdf.setFontSize(10);
      pdf.text(`Data de generació: ${new Date().toLocaleDateString('ca-ES')}`, pageWidth / 2, y, { align: 'center' });
      y += 15;

      for (let i = 0; i < generatedQRs.length; i++) {
        const qr = generatedQRs[i];
        const employee = employees.find(e => e.id === qr.employeeId);
        
        if (!employee) continue;

        // Check if we need a new page
        if (i > 0 && i % (cols * rows) === 0) {
          pdf.addPage();
          y = margin;
          
          // Add title to new page
          pdf.setFontSize(16);
          pdf.text('Codis QR de Fitxatge - fich.ai', pageWidth / 2, y, { align: 'center' });
          y += 15;
          
          pdf.setFontSize(10);
          pdf.text(`Data de generació: ${new Date().toLocaleDateString('ca-ES')}`, pageWidth / 2, y, { align: 'center' });
          y += 15;
        }

        // Calculate position
        const col = i % cols;
        const row = Math.floor((i % (cols * rows)) / cols);
        x = margin + col * (qrWidth + 10);
        y = margin + 30 + row * (qrHeight + 10);

        // Add QR code
        if (qr.canvas) {
          const imgData = qr.canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', x, y, qrWidth, qrWidth);
        }

        // Add employee info
        if (includeNames) {
          pdf.setFontSize(8);
          pdf.text(employee.fullName, x + qrWidth/2, y + qrWidth + 5, { align: 'center' });
          
          if (includePosition && employee.position) {
            pdf.text(employee.position, x + qrWidth/2, y + qrWidth + 10, { align: 'center' });
          }
          
          if (employee.teacherCode) {
            pdf.text(`Codi: ${employee.teacherCode}`, x + qrWidth/2, y + qrWidth + 15, { align: 'center' });
          }
        }

        // Add employee ID (small text)
        pdf.setFontSize(6);
        pdf.text(`ID: ${employee.id.substring(0, 8)}`, x, y + qrWidth + (includeNames ? 20 : 5));
      }
      
      // Save PDF
      pdf.save(`qr-codes-fitxatge-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: language === "ca" ? "Èxit" : "Éxito",
        description: language === "ca" ? "PDF descarregat correctament" : "PDF descargado correctamente",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? "Error generant el PDF" : "Error generando el PDF",
        variant: "destructive",
      });
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(e => e.id));
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {language === "ca" ? "Generador de Codis QR" : "Generador de Códigos QR"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ca" ? 
              "Genera codis QR únics per a cada empleat per al sistema de fitxatge" : 
              "Genera códigos QR únicos para cada empleado para el sistema de fichaje"}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {language === "ca" ? "Configuració" : "Configuración"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Size */}
            <div className="space-y-2">
              <Label>{language === "ca" ? "Mida del QR (pixels)" : "Tamaño del QR (píxeles)"}</Label>
              <Select value={qrSize.toString()} onValueChange={(value) => setQrSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="150">150px - {language === "ca" ? "Petit" : "Pequeño"}</SelectItem>
                  <SelectItem value="200">200px - {language === "ca" ? "Mitjà" : "Medio"}</SelectItem>
                  <SelectItem value="250">250px - {language === "ca" ? "Gran" : "Grande"}</SelectItem>
                  <SelectItem value="300">300px - {language === "ca" ? "Extra Gran" : "Extra Grande"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label>{language === "ca" ? "Opcions d'impressió" : "Opciones de impresión"}</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeNames}
                    onChange={(e) => setIncludeNames(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">{language === "ca" ? "Incloure noms" : "Incluir nombres"}</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includePosition}
                    onChange={(e) => setIncludePosition(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">{language === "ca" ? "Incloure càrrec" : "Incluir cargo"}</span>
                </label>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="space-y-2">
              <Label>{language === "ca" ? "Selecció d'empleats" : "Selección de empleados"}</Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={selectAllEmployees} size="sm">
                  {language === "ca" ? "Seleccionar tots" : "Seleccionar todos"}
                </Button>
                <Button variant="outline" onClick={clearSelection} size="sm">
                  {language === "ca" ? "Netejar selecció" : "Limpiar selección"}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                {selectedEmployees.length} de {employees.length} empleats seleccionats
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button 
                onClick={generateAllQRs}
                disabled={selectedEmployees.length === 0}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === "ca" ? "Generar Codis QR" : "Generar Códigos QR"}
              </Button>
              
              {generatedQRs.length > 0 && (
                <Button 
                  onClick={downloadPrintablePDF}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {language === "ca" ? "Descarregar PDF Imprimible" : "Descargar PDF Imprimible"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {language === "ca" ? "Empleats" : "Empleados"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedEmployees.includes(employee.id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleEmployeeSelection(employee.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{employee.fullName}</p>
                      <p className="text-sm text-gray-600">{employee.email}</p>
                      {employee.position && (
                        <p className="text-xs text-gray-500">{employee.position}</p>
                      )}
                      {employee.teacherCode && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Codi: {employee.teacherCode}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated QRs Preview */}
      {generatedQRs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {language === "ca" ? "Vista prèvia dels Codis QR" : "Vista previa de los Códigos QR"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedQRs.map((qr) => {
                const employee = employees.find(e => e.id === qr.employeeId);
                return (
                  <div key={qr.employeeId} className="text-center p-4 border rounded-lg">
                    {qr.canvas && (
                      <img 
                        src={qr.canvas.toDataURL()} 
                        alt={`QR for ${employee?.fullName}`}
                        className="w-full max-w-32 mx-auto mb-2"
                      />
                    )}
                    {includeNames && employee && (
                      <div className="text-sm">
                        <p className="font-medium">{employee.fullName}</p>
                        {includePosition && employee.position && (
                          <p className="text-gray-600">{employee.position}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <Alert className="mt-4">
              <Printer className="h-4 w-4" />
              <AlertDescription>
                <strong>{language === "ca" ? "Consell d'impressió:" : "Consejo de impresión:"}</strong>{" "}
                {language === "ca" ? 
                  "Imprimeix en qualitat alta per assegurar que els codis QR siguin llegibles. Recomana paper A4 blanc." :
                  "Imprime en calidad alta para asegurar que los códigos QR sean legibles. Se recomienda papel A4 blanco."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}