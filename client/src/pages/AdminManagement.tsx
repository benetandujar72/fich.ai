import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, FileText, MessageSquare, Shield, Download, Upload, Calendar, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

// Import individual admin components
import StaffManagement from "@/components/admin/StaffManagement";
import AlertsManagement from "@/components/admin/AlertsManagement";
import ReportsManagement from "@/components/admin/ReportsManagement";
import CommunicationsManagement from "@/components/admin/CommunicationsManagement";
import PrivacyManagement from "@/components/admin/PrivacyManagement";
import RiskAssessmentDashboard from "@/components/admin/RiskAssessmentDashboard";
import EmailConfigurationPanel from "@/components/admin/EmailConfigurationPanel";

export default function AdminManagement() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState("staff");

  // Only allow admins and superadmins
  if (!permissions.canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Accés Restringit
            </CardTitle>
            <CardDescription>
              No tens permisos per accedir a la gestió administrativa.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get admin overview stats
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/overview', user?.institutionId],
    enabled: !!user?.institutionId && permissions.canManageUsers,
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestió Administrativa</h1>
          <p className="text-muted-foreground">
            Panell de control per a la gestió del centre educatiu
          </p>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          {statsLoading ? (
            <div className="animate-pulse bg-gray-200 h-16 w-20 rounded"></div>
          ) : (
            <>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div className="text-sm">
                    <p className="font-semibold">{adminStats?.totalEmployees || 0}</p>
                    <p className="text-muted-foreground">Personal</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div className="text-sm">
                    <p className="font-semibold">{adminStats?.pendingAlerts || 0}</p>
                    <p className="text-muted-foreground">Alertes</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <div className="text-sm">
                    <p className="font-semibold">{adminStats?.totalCommunications || 0}</p>
                    <p className="text-muted-foreground">Comunicacions</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  <div className="text-sm">
                    <p className="font-semibold">{adminStats?.privacyRequests || 0}</p>
                    <p className="text-muted-foreground">Sol·licituds GDPR</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertes
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informes
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comunicacions
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacitat
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Riscos
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <StaffManagement />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsManagement />
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <CommunicationsManagement />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <PrivacyManagement />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <RiskAssessmentDashboard />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailConfigurationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}