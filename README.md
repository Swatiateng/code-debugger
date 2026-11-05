# Debugging System

A code debugging app for students, with compiler diagnostics and beginner-friendly AI explanations.

## Configure Groq AI

The backend calls Groq's OpenAI-compatible chat completions API. Set your Groq API key in the same PowerShell session used to start Spring Boot. This keeps the key out of project files:

```powershell
$secureKey = Read-Host "Groq API key" -AsSecureString
$env:GROQ_API_KEY = [System.Net.NetworkCredential]::new("", $secureKey).Password
$dbPassword = Read-Host "MySQL root password" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $dbPassword).Password
cd system
./mvnw.cmd spring-boot:run
```

The default model is `qwen/qwen3.8-27b`. Override it with `$env:GROQ_MODEL` if your Groq account has access to another model. The default API URL is `https://api.groq.com/openai/v1/chat/completions`; set `$env:GROQ_BASE_URL` only if you use a compatible endpoint. Groq usage may incur charges according to your account and selected model.
