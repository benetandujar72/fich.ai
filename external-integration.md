# MCP Server External Integration Guide

## Overview

The fich.ai MCP (Model Context Protocol) server provides a natural language interface for managing the attendance tracking system. This guide explains how to integrate it with various AI platforms.

## Supported Platforms

### 1. ChatGPT (OpenAI)

#### Method: Custom GPT with Actions

1. **Create a Custom GPT**
   - Go to ChatGPT → Explore GPTs → Create a GPT
   - Name: "fich.ai Assistant"
   - Description: "Natural language interface for managing attendance and employee tracking"

2. **Configure the Action**
   ```json
   {
     "openapi": "3.0.0",
     "info": {
       "title": "fich.ai MCP API",
       "version": "1.0.0"
     },
     "servers": [
       {
         "url": "https://your-domain.com/api/mcp"
       }
     ],
     "paths": {
       "/chat": {
         "post": {
           "operationId": "processCommand",
           "summary": "Process natural language commands",
           "requestBody": {
             "required": true,
             "content": {
               "application/json": {
                 "schema": {
                   "type": "object",
                   "properties": {
                     "message": {
                       "type": "string",
                       "description": "Natural language command"
                     },
                     "context": {
                       "type": "object",
                       "properties": {
                         "institutionId": {"type": "string"},
                         "userId": {"type": "string"}
                       }
                     }
                   }
                 }
               }
             }
           },
           "responses": {
             "200": {
               "description": "Command processed successfully"
             }
           }
         }
       }
     }
   }
   ```

3. **Set Authentication**
   - Type: API Key
   - Header: X-API-Key
   - Value: [Your API Key]

4. **Test Commands**
   - "Show me today's attendance"
   - "Generate monthly report"
   - "Send alert for late arrivals"

### 2. Claude AI (Anthropic)

#### Method: MCP Protocol Integration

1. **Install the MCP Server**
   ```bash
   npm install -g @fichai/mcp-server
   ```

2. **Configure Claude Desktop**
   
   Edit `~/.config/claude/mcp-servers.json`:
   ```json
   {
     "fich-ai": {
       "command": "node",
       "args": ["/path/to/mcp-server/dist/index.js"],
       "env": {
         "DATABASE_URL": "your-database-url",
         "API_KEY": "your-api-key",
         "GMAIL_USER": "your-gmail",
         "GMAIL_PASSWORD": "your-app-password"
       }
     }
   }
   ```

3. **Restart Claude Desktop**
   The MCP server will appear in the tools menu

4. **Available Commands**
   Claude can now directly access all fich.ai functions through natural language

### 3. Google Gemini

#### Method: Function Calling API

1. **Set up Function Definitions**
   ```python
   import google.generativeai as genai
   
   # Configure Gemini
   genai.configure(api_key="YOUR_GEMINI_API_KEY")
   
   # Define functions
   functions = [
       {
           "name": "process_fichai_command",
           "description": "Process fich.ai attendance management commands",
           "parameters": {
               "type": "object",
               "properties": {
                   "command": {
                       "type": "string",
                       "description": "Natural language command for fich.ai"
                   },
                   "institution_id": {
                       "type": "string",
                       "description": "Institution identifier"
                   }
               },
               "required": ["command"]
           }
       }
   ]
   
   # Create model with functions
   model = genai.GenerativeModel(
       model_name="gemini-pro",
       tools=functions
   )
   ```

2. **Implement Function Handler**
   ```python
   import requests
   
   def process_fichai_command(command, institution_id=None):
       response = requests.post(
           "https://your-domain.com/api/mcp/gemini",
           json={
               "message": command,
               "institutionId": institution_id
           },
           headers={
               "X-API-Key": "your-api-key"
           }
       )
       return response.json()
   ```

3. **Use in Conversation**
   ```python
   chat = model.start_chat()
   response = chat.send_message(
       "Check who has checked in today at the school"
   )
   
   # Gemini will call the function automatically
   for part in response.parts:
       if part.function_call:
           result = process_fichai_command(
               part.function_call.args["command"]
           )
           print(result)
   ```

## Authentication Setup

### API Key Generation

1. Log into fich.ai as superadmin
2. Go to Settings → API Configuration
3. Generate new API key
4. Set permissions (read/write/admin)
5. Copy the key (shown only once)

### Environment Variables

Required for all integrations:
```bash
DATABASE_URL=postgresql://user:pass@host/db
API_KEY=your-generated-api-key
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-specific-password
```

## Common Use Cases

### 1. Daily Operations
```
"Who has checked in today?"
"Show late arrivals this week"
"List employees without attendance records"
```

### 2. Reporting
```
"Generate monthly attendance report"
"Send weekly summary to director@school.edu"
"Export attendance data for August"
```

### 3. Alerts & Notifications
```
"Send no-attendance alert"
"Notify about late arrivals"
"Alert department heads about absences"
```

### 4. Analytics
```
"Show attendance trends"
"Analyze punctuality patterns"
"Department attendance statistics"
```

### 5. Schedule Management
```
"Show John Smith's schedule"
"Weekly timetable for math department"
"Today's scheduled classes"
```

## Security Considerations

1. **API Key Protection**
   - Never expose API keys in client-side code
   - Rotate keys regularly
   - Use environment variables

2. **Rate Limiting**
   - Default: 60 requests/minute
   - 1000 requests/hour
   - Contact admin for higher limits

3. **Data Privacy**
   - All data is encrypted in transit (TLS 1.3)
   - GDPR compliant
   - Audit logs maintained

4. **Access Control**
   - Role-based permissions
   - Institution-level isolation
   - User authentication required

## Troubleshooting

### Connection Issues
- Verify API endpoint URL
- Check API key validity
- Ensure network connectivity
- Review firewall settings

### Authentication Errors
- Confirm API key is active
- Check key permissions
- Verify institution ID
- Review user roles

### Data Issues
- Ensure date formats are correct (ISO 8601)
- Verify employee names exist
- Check institution context
- Review language settings

## Support

- Documentation: https://your-domain.com/docs
- API Reference: https://your-domain.com/api/docs
- Support Email: support@fich.ai
- GitHub Issues: https://github.com/fichai/mcp-server

## Version History

- v1.0.0 - Initial release with ChatGPT, Claude, Gemini support
- v1.1.0 - Added batch operations and webhook support
- v1.2.0 - Enhanced natural language processing for Catalan

## License

MIT License - See LICENSE file for details