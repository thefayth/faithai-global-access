param([string]$SshHost = 'linveo-new', [switch]$EnablePilot)
$ErrorActionPreference = 'Stop'
# Existing authorized credential remains in memory and SSH stdin only.
$pilotKey = [Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'Process')
if (-not $pilotKey) { $pilotKey = [Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'User') }
if (-not $pilotKey -or $pilotKey -match '[\r\n]') { throw 'Existing OpenAI credential unavailable or invalid.' }
$pilotSettings = @(
    'FAITHAI_ENVIRONMENT=production',
    'FAITHAI_PUBLIC_WRITES_ENABLED=false',
    ('FAITHAI_AI_ENABLED=' + $EnablePilot.IsPresent.ToString().ToLowerInvariant()),
    'FAITHAI_AI_ENDPOINT=https://api.openai.com/v1/chat/completions',
    ('FAITHAI_AI_API_KEY=' + $pilotKey),
    'FAITHAI_AI_MODEL=gpt-5.6-luna',
    'FAITHAI_AI_MAX_CALL_USD=0.005',
    'FAITHAI_AI_MAX_OUTPUT_TOKENS=512',
    'FAITHAI_AI_DAILY_USD_CAP=1',
    'FAITHAI_AI_MONTHLY_USD_CAP=25',
    'FAITHAI_AI_CALLS_PER_SESSION=3',
    'FAITHAI_AI_MAX_CHARS=2000',
    'FAITHAI_LIVE_TERRITORIES=us',
    'FAITHAI_EXOCLICK_ENABLED=false',
    'FAITHAI_ADSENSE_ENABLED=false'
) -join "`n"
$pilotProcess = New-Object System.Diagnostics.Process
$pilotProcess.StartInfo.FileName = 'ssh.exe'
$pilotProcess.StartInfo.Arguments = "-T $SshHost umask 077; if test -f /etc/faithai/openai.env; then cp -a /etc/faithai/openai.env /etc/faithai/openai.env.before-20261110; fi; install -m 0640 -o root -g faithai /dev/stdin /etc/faithai/openai.env"
$pilotProcess.StartInfo.UseShellExecute = $false
$pilotProcess.StartInfo.CreateNoWindow = $true
$pilotProcess.StartInfo.RedirectStandardInput = $true
$pilotProcess.StartInfo.RedirectStandardOutput = $true
$pilotProcess.StartInfo.RedirectStandardError = $true
[void]$pilotProcess.Start()
$pilotProcess.StandardInput.WriteLine($pilotSettings)
$pilotProcess.StandardInput.Close()
$pilotOutput = $pilotProcess.StandardOutput.ReadToEnd()
$pilotError = $pilotProcess.StandardError.ReadToEnd()
$pilotProcess.WaitForExit()
$pilotKey = $null
$pilotSettings = $null
if ($pilotProcess.ExitCode -ne 0) { throw 'Secure server-side OpenAI configuration did not complete; no credential value was logged.' }
Write-Output 'OpenAI environment staged securely; service not restarted by this script.'
