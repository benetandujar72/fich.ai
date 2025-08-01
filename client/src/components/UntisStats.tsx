import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, BookOpen, Users2 } from "lucide-react";

interface UntisStatistics {
  totalSessions: number;
  linkedSessions: number;
  uniqueTeachers: number;
  uniqueSubjects: number;
  uniqueGroups: number;
}

interface UntisStatsProps {
  institutionId: string;
  academicYearId: string;
}

export function UntisStats({ institutionId, academicYearId }: UntisStatsProps) {
  const { data: stats, isLoading, refetch } = useQuery<UntisStatistics>({
    queryKey: ['/api/schedule-import/statistics', institutionId, academicYearId],
    queryFn: async () => {
      const response = await fetch(`/api/schedule-import/statistics/${institutionId}/${academicYearId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch import statistics');
      }
      return response.json();
    },
    enabled: !!institutionId && !!academicYearId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Estadístiques GP UNTIS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Estadístiques GP UNTIS
          </CardTitle>
          <CardDescription>
            No s'han importat dades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Importa un fitxer CSV per veure les estadístiques
          </p>
        </CardContent>
      </Card>
    );
  }

  const linkingProgress = stats.totalSessions > 0 ? (stats.linkedSessions / stats.totalSessions) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Estadístiques GP UNTIS
            </CardTitle>
            <CardDescription>
              Resum de l'estat actual de la importació
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Statistics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Sessions vinculades a professors
            </span>
            <Badge variant={linkingProgress === 100 ? "default" : linkingProgress > 50 ? "secondary" : "destructive"}>
              {Math.round(linkingProgress)}%
            </Badge>
          </div>
          <Progress value={linkingProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stats.linkedSessions} vinculades</span>
            <span>{stats.totalSessions} total</span>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">{stats.uniqueTeachers}</div>
            <div className="text-xs text-muted-foreground">Professors</div>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{stats.uniqueSubjects}</div>
            <div className="text-xs text-muted-foreground">Matèries</div>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">{stats.uniqueGroups}</div>
            <div className="text-xs text-muted-foreground">Grups</div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              {linkingProgress === 100 ? (
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              ) : linkingProgress > 50 ? (
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              ) : (
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {linkingProgress === 100 
                  ? 'Totes les sessions estan vinculades'
                  : linkingProgress > 50 
                    ? 'Vinculació parcial completada'
                    : 'Vinculació deficient detectada'
                }
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {linkingProgress === 100 
                  ? 'Excel·lent! Tots els horaris estan correctament assignats als professors.'
                  : 'Alguns horaris no s\'han pogut vincular automàticament. Revisa els noms dels professors.'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}