# Debugging System

A code debugging app for students, with compiler diagnostics and beginner-friendly AI explanations.

## Configure Groq AI

The backend calls Groq's OpenAI-compatible chat completions API. Set your Groq API key in the same PowerShell session used to start Spring Boot. This keeps the key out of project files.

## Configure MySQL credentials

Create a database account for this project (run as a MySQL administrator, for example in MySQL Workbench):

```sql
CREATE DATABASE IF NOT EXISTS debuggingsystem;
CREATE USER 'debugger_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON debuggingsystem.* TO 'debugger_app'@'localhost';
```

In PowerShell, set the connection details in the same terminal you use to start the backend. The app uses `SPRING_DATASOURCE_*`; the Flyway Maven plugin uses `DB_*`:

```powershell
$secureKey = Read-Host "Groq API key" -AsSecureString
$env:GROQ_API_KEY = [System.Net.NetworkCredential]::new("", $secureKey).Password
$env:DB_URL = "jdbc:mysql://localhost:3306/debuggingsystem?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME = Read-Host "MySQL project username"
$secureDbPassword = Read-Host "MySQL project password" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $secureDbPassword).Password
$env:SPRING_DATASOURCE_URL = $env:DB_URL
$env:SPRING_DATASOURCE_USERNAME = $env:DB_USERNAME
$env:SPRING_DATASOURCE_PASSWORD = $env:DB_PASSWORD
cd system
./mvnw.cmd spring-boot:run
```

These environment variables last only for the current PowerShell session. The Flyway Maven plugin reads `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` too, so run its commands from this same terminal.

The default model is `qwen/qwen3.8-27b`. Override it with `$env:GROQ_MODEL` if your Groq account has access to another model. The default API URL is `https://api.groq.com/openai/v1/chat/completions`; set `$env:GROQ_BASE_URL` only if you use a compatible endpoint. Groq usage may incur charges according to your account and selected model.
