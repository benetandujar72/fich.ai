import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileText, UserCheck, Database, Clock, Mail } from "lucide-react";

export default function Privacy() {
  const { language } = useLanguage();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            {language === "ca" ? "Política de Privacitat i RGPD" : "Política de Privacidad y RGPD"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ca" 
              ? "Compliment integral del Reglament General de Protecció de Dades"
              : "Cumplimiento integral del Reglamento General de Protección de Datos"}
          </p>
        </div>

        {/* Informació general RGPD */}
        <Card className="mb-6" data-testid="gdpr-info-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-green-600" />
              {language === "ca" ? "Compliment RGPD" : "Cumplimiento RGPD"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-3">
                {language === "ca" 
                  ? "Aquest sistema compleix completament amb el Reglament General de Protecció de Dades (UE) 2016/679 i la Llei Orgànica 3/2018 de Protecció de Dades Personals i garantia dels drets digitals."
                  : "Este sistema cumple completamente con el Reglamento General de Protección de Datos (UE) 2016/679 y la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales."}
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• {language === "ca" ? "Base legal: Compliment d'obligació legal (control laboral)" : "Base legal: Cumplimiento de obligación legal (control laboral)"}</li>
                <li>• {language === "ca" ? "Finalitat específica: Control d'assistència i presència laboral" : "Finalidad específica: Control de asistencia y presencia laboral"}</li>
                <li>• {language === "ca" ? "Principi de minimització de dades aplicat" : "Principio de minimización de datos aplicado"}</li>
                <li>• {language === "ca" ? "Conservació limitada: 4 anys màxim" : "Conservación limitada: 4 años máximo"}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Drets dels interessats */}
        <Card className="mb-6" data-testid="rights-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="mr-2 h-5 w-5 text-blue-600" />
              {language === "ca" ? "Drets dels Treballadors" : "Derechos de los Trabajadores"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">
                    {language === "ca" ? "Dret d'accés (Art. 15)" : "Derecho de acceso (Art. 15)"}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {language === "ca" 
                      ? "Consultar les seves dades d'assistència i horaris"
                      : "Consultar sus datos de asistencia y horarios"}
                  </p>
                </div>
                
                <div className="p-3 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">
                    {language === "ca" ? "Dret de rectificació (Art. 16)" : "Derecho de rectificación (Art. 16)"}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {language === "ca" 
                      ? "Corregir dades incorrectes o incompletes"
                      : "Corregir datos incorrectos o incompletos"}
                  </p>
                </div>
                
                <div className="p-3 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">
                    {language === "ca" ? "Dret de supressió (Art. 17)" : "Derecho de supresión (Art. 17)"}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {language === "ca" 
                      ? "Sol·licitar l'eliminació de dades quan sigui procedent"
                      : "Solicitar la eliminación de datos cuando proceda"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">
                    {language === "ca" ? "Dret de limitació (Art. 18)" : "Derecho de limitación (Art. 18)"}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {language === "ca" 
                      ? "Limitar el tractament en circumstàncies específiques"
                      : "Limitar el tratamiento en circunstancias específicas"}
                  </p>
                </div>
                
                <div className="p-3 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">
                    {language === "ca" ? "Dret de portabilitat (Art. 20)" : "Derecho de portabilidad (Art. 20)"}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {language === "ca" 
                      ? "Rebre les dades en format estructurat"
                      : "Recibir los datos en formato estructurado"}
                  </p>
                </div>
                
                <div className="p-3 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">
                    {language === "ca" ? "Dret d'oposició (Art. 21)" : "Derecho de oposición (Art. 21)"}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {language === "ca" 
                      ? "Oposar-se al tractament en casos específics"
                      : "Oponerse al tratamiento en casos específicos"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">
                {language === "ca" ? "Com exercir els teus drets:" : "Cómo ejercer tus derechos:"}
              </p>
              <p className="text-sm text-blue-700">
                {language === "ca" 
                  ? "Contacta amb l'administrador del centre o envia un correu a proteccion.datos@centre.edu"
                  : "Contacta con el administrador del centro o envía un correo a proteccion.datos@centro.edu"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tractament de dades */}
        <Card className="mb-6" data-testid="data-processing-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5 text-purple-600" />
              {language === "ca" ? "Tractament de Dades" : "Tratamiento de Datos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">
                    {language === "ca" ? "Dades tractades" : "Datos tratados"}
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• {language === "ca" ? "Nom i cognoms" : "Nombre y apellidos"}</li>
                    <li>• {language === "ca" ? "DNI" : "DNI"}</li>
                    <li>• {language === "ca" ? "Correu electrònic" : "Correo electrónico"}</li>
                    <li>• {language === "ca" ? "Horaris d'entrada i sortida" : "Horarios de entrada y salida"}</li>
                    <li>• {language === "ca" ? "Absències justificades" : "Ausencias justificadas"}</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">
                    {language === "ca" ? "Finalitats" : "Finalidades"}
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• {language === "ca" ? "Control laboral obligatori" : "Control laboral obligatorio"}</li>
                    <li>• {language === "ca" ? "Gestió d'absències" : "Gestión de ausencias"}</li>
                    <li>• {language === "ca" ? "Elaboració d'informes" : "Elaboración de informes"}</li>
                    <li>• {language === "ca" ? "Compliment normatiu" : "Cumplimiento normativo"}</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">
                    {language === "ca" ? "Base legal" : "Base legal"}
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• {language === "ca" ? "Obligació legal (Art. 6.1.c)" : "Obligación legal (Art. 6.1.c)"}</li>
                    <li>• {language === "ca" ? "Estatut dels Treballadors" : "Estatuto de los Trabajadores"}</li>
                    <li>• {language === "ca" ? "Normativa educativa" : "Normativa educativa"}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mesures de seguretat */}
        <Card className="mb-6" data-testid="security-measures-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-red-600" />
              {language === "ca" ? "Mesures de Seguretat" : "Medidas de Seguridad"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-red-800">
                  {language === "ca" ? "Mesures tècniques" : "Medidas técnicas"}
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• {language === "ca" ? "Xifratge de dades en repòs (AES-256)" : "Cifrado de datos en reposo (AES-256)"}</li>
                  <li>• {language === "ca" ? "Xifratge en trànsit (TLS 1.3)" : "Cifrado en tránsito (TLS 1.3)"}</li>
                  <li>• {language === "ca" ? "Autenticació robusta amb hash bcrypt" : "Autenticación robusta con hash bcrypt"}</li>
                  <li>• {language === "ca" ? "Còpies de seguretat diàries" : "Copias de seguridad diarias"}</li>
                  <li>• {language === "ca" ? "Logs d'auditoria" : "Logs de auditoría"}</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-red-800">
                  {language === "ca" ? "Mesures organitzatives" : "Medidas organizativas"}
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• {language === "ca" ? "Control d'accés basat en rols" : "Control de acceso basado en roles"}</li>
                  <li>• {language === "ca" ? "Formació en protecció de dades" : "Formación en protección de datos"}</li>
                  <li>• {language === "ca" ? "Política de contrasenyes" : "Política de contraseñas"}</li>
                  <li>• {language === "ca" ? "Procediments d'incident" : "Procedimientos de incidente"}</li>
                  <li>• {language === "ca" ? "Auditories periòdiques" : "Auditorías periódicas"}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conservació i supressió */}
        <Card className="mb-6" data-testid="retention-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-600" />
              {language === "ca" ? "Conservació i Supressió" : "Conservación y Supresión"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">
                  {language === "ca" ? "Període de conservació" : "Período de conservación"}
                </h4>
                <p className="text-sm text-orange-700 mb-2">
                  {language === "ca" 
                    ? "Les dades d'assistència es conserven durant 4 anys des de la finalització de la relació laboral, segons estableix la normativa laboral."
                    : "Los datos de asistencia se conservan durante 4 años desde la finalización de la relación laboral, según establece la normativa laboral."}
                </p>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• {language === "ca" ? "Registres d'assistència: 4 anys" : "Registros de asistencia: 4 años"}</li>
                  <li>• {language === "ca" ? "Dades d'absències: 4 anys" : "Datos de ausencias: 4 años"}</li>
                  <li>• {language === "ca" ? "Logs del sistema: 1 any" : "Logs del sistema: 1 año"}</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  {language === "ca" ? "Supressió automàtica" : "Supresión automática"}
                </h4>
                <p className="text-sm text-gray-700">
                  {language === "ca" 
                    ? "El sistema elimina automàticament les dades quan s'acompleix el període de conservació, garantint el compliment del principi de limitació d'emmagatzematge."
                    : "El sistema elimina automáticamente los datos cuando se cumple el período de conservación, garantizando el cumplimiento del principio de limitación de almacenamiento."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacte DPO */}
        <Card className="mb-6" data-testid="dpo-contact-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-blue-600" />
              {language === "ca" ? "Contacte amb el DPD" : "Contacto con el DPD"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === "ca" 
                  ? "Si tens qualsevol dubte sobre el tractament de les teves dades o vols exercir els teus drets, pots contactar amb el Delegat de Protecció de Dades:"
                  : "Si tienes cualquier duda sobre el tratamiento de tus datos o quieres ejercer tus derechos, puedes contactar con el Delegado de Protección de Datos:"}
              </p>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-2">
                  <p className="text-sm"><strong>Email:</strong> proteccion.datos@centre.edu</p>
                  <p className="text-sm"><strong>{language === "ca" ? "Telèfon" : "Teléfono"}:</strong> +34 xxx xxx xxx</p>
                  <p className="text-sm">
                    <strong>{language === "ca" ? "Adreça" : "Dirección"}:</strong> 
                    {language === "ca" 
                      ? " Carrer del Centre Educatiu, 123, 08000 Barcelona"
                      : " Calle del Centro Educativo, 123, 08000 Barcelona"}
                  </p>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {language === "ca" 
                  ? "També tens dret a presentar una reclamació davant l'Autoritat Catalana de Protecció de Dades (APDCAT) o l'Agència Española de Protección de Datos (AEPD)."
                  : "También tienes derecho a presentar una reclamación ante la Autoridad Catalana de Protección de Datos (APDCAT) o la Agencia Española de Protección de Datos (AEPD)."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botó per sol·licitar informació */}
        <div className="text-center">
          <Button className="bg-primary text-primary-foreground" data-testid="request-info-button">
            <FileText className="mr-2 h-4 w-4" />
            {language === "ca" ? "Sol·licitar còpia de les meves dades" : "Solicitar copia de mis datos"}
          </Button>
        </div>
      </div>
    </main>
  );
}