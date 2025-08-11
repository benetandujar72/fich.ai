import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsTest() {
  const [testValue, setTestValue] = useState("");
  const [savedValue, setSavedValue] = useState("");

  const handleSave = () => {
    setSavedValue(testValue);
    alert(`Valor guardado: ${testValue}`);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test de Entrada de Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-input">
                Campo de Prueba
              </Label>
              <Input
                id="test-input"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="Escribe algo aquí..."
              />
            </div>
            
            <Button onClick={handleSave}>
              Guardar Valor
            </Button>
            
            {savedValue && (
              <div className="p-3 bg-green-100 border border-green-300 rounded">
                <p><strong>Último valor guardado:</strong> {savedValue}</p>
              </div>
            )}
            
            <div className="p-3 bg-blue-100 border border-blue-300 rounded">
              <p><strong>Valor actual:</strong> {testValue || "(vacío)"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}