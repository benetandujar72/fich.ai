/**
 * Base de Coneixement per a l'assistent d'ajuda del MCP.
 * 
 * Aquest text serveix com a context principal per al LLM quan respon a preguntes
 * sobre el funcionament de l'aplicació EduPresència.
 * 
 * Està escrit en català i en format Markdown per a una millor llegibilitat.
 */
export const knowledgeBase = `
# Base de Coneixement d'EduPresència

## Visió General
EduPresència és una aplicació integral de control horari i gestió de personal dissenyada específicament per a centres educatius. Permet als empleats llegendar les seves entrades i sortides, justificar absències i comunicar-se, mentre que proporciona als administradors eines potents per a la gestió, l'anàlisi de dades i el compliment normatiu.

---

## Funcionalitats Clau

### 1. Sistema de Fitxatge
- **Mètodes:** Els empleats poden llegendar mitjançant un codi QR personal i intransferible o a través de la interfície web.
- **Registre:** Cada llegendar (entrada o sortida) queda registrat amb la data, hora, mètode i localització (si s'activa).
- **Validació:** El sistema comprova si un empleat ja ha fet l'entrada abans de permetre una sortida per evitar registres inconsistents.

### 2. Gestió d'Absències
- **Registre:** Les absències es generen automàticament quan un empleat no llegendar en un dia laborable programat.
- **Justificació:** Els empleats poden pujar documents (com un justificant mèdic) per a justificar les seves absències.
- **Revisió:** Els administradors tenen un panell per a revisar i aprovar o rebutjar les justificacions presentades.

### 3. Comunicacions Internes
- **Sistema de Missatgeria:** Permet l'enviament de missatges interns entre administradors i empleats.
- **Notificacions:** El sistema envia comunicacions automàtiques per a notificar sobre l'estat de les justificacions o altres esdeveniments importants.

### 4. Panell d'Administració
- **Gestió d'Empleats:** Permet crear, editar i eliminar perfils d'empleats.
- **Informes i Anàlisis:** Ofereix informes detallats sobre assistència, puntualitat i absentisme.
- **Configuració:** Permet als administradors configurar paràmetres clau de l'aplicació, com els llindars per a les alertes de retard.

### 5. Sistema d'Alertes Automàtiques
- **Alertes per Retard:** El sistema pot notificar automàticament a un administrador o a l'empleat si es produeixen retards reiterats.
- **Alertes d'Absentisme:** Es poden configurar alertes per a patrons d'absentisme que puguin indicar un problema.

---

## Protocol de Context del Model (MCP) - L'Assistent d'IA

L'MCP és l'assistent intel·ligent integrat a EduPresència, dissenyat per a ajudar els administradors. Funciona de la següent manera:
1.  **Rep una ordre:** Un administrador escriu una ordre en llenguatge natural (català).
2.  **Anàlisi amb IA:** L'ordre s'envia a un Model Lingüístic Gran (LLM) que l'analitza per a determinar la intenció ('action') i les dades clau ('parameters').
3.  **Execució:** El sistema busca l'acció corresponent en el seu "catàleg d'accions" i l'executa amb els paràmetres rebuts.
4.  **Resposta:** El resultat de l'acció es mostra a l'administrador.

**Accions disponibles a l'MCP:**
- \`createUser\`: Per a crear nous usuaris.
- \`sendMessage\`: Per a enviar comunicacions internes.
- \`getReport\`: Per a obtenir informes d'assistència.
- \`getForensicReport\`: Per a generar auditories legals detallades.
- \`getRiskAnalysis\`: Per a analitzar patrons i predir riscos d'absentisme.
- \`sendEmail\`: Per a enviar correus electrònics a adreces externes.
- \`getHelp\`: Per a respondre preguntes sobre el funcionament de l'aplicació (aquesta mateixa funcionalitat).
`;
