import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const MCPPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (newPrompt: string) => {
      return apiRequest('/api/mcp/execute', {
        method: 'POST',
        body: JSON.stringify({ prompt: newPrompt }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Éxito',
        description: 'La automatización se ha ejecutado correctamente.',
      });
    },
    onError: (error: any) => {
      setResult({ error: error.message });
      toast({
        title: 'Error',
        description: error.message || 'Ha ocurrido un error al ejecutar la automatización.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'El comando no puede estar vacío.',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate(prompt);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Protocolo de Contexto de Modelo (MCP)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Escribe tu comando aquí. Por ejemplo: 'Crear un usuario para Juan Pérez...'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={mutation.isPending}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                'Ejecutar'
              )}
            </Button>
          </form>

          {result && (
            <div className="mt-6">
              <h3 className="font-semibold">Resultado:</h3>
              <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPPage;
