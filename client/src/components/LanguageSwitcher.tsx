import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-surface rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <Button
          variant={language === "ca" ? "default" : "ghost"}
          size="sm"
          onClick={() => setLanguage("ca")}
          className="rounded-none border-r font-semibold"
          data-testid="language-ca"
        >
          CA
        </Button>
        <Button
          variant={language === "es" ? "default" : "ghost"}
          size="sm"
          onClick={() => setLanguage("es")}
          className="rounded-none font-semibold"
          data-testid="language-es"
        >
          ES
        </Button>
      </div>
    </div>
  );
}
