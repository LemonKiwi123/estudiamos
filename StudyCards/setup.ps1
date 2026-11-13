# Sets up Estudiamos on this PC: checks Node.js, finds your data, makes shortcuts,
# lets phones on your home Wi-Fi connect, starts the app and shows the address for your phone.
# Run it with "Set up Estudiamos.cmd". You can run it again any time; it only fixes what is missing.
param([switch]$Quiet, [string]$DataDir = '', [switch]$NoShortcuts, [switch]$NoStart)
$ErrorActionPreference = 'Stop'
$app  = Split-Path -Parent $MyInvocation.MyCommand.Path
$data = if ($DataDir) { $DataDir } else { Join-Path (Split-Path -Parent $app) 'EstudiarData' }
$port = 5178
$ruleName = 'Estudiamos (phone sync)'

function Say($t, $c = 'Gray') { Write-Host $t -ForegroundColor $c }
function Ask($q, $default = $true) {
  if ($Quiet) { return $default }
  while ($true) { $a = Read-Host "$q (Y/N)"; if ($a -match '^[Yy]') { return $true }; if ($a -match '^[Nn]') { return $false } }
}
function Done($code) { if (-not $Quiet) { Read-Host "`nPress Enter to close" | Out-Null }; exit $code }

Say '======================================' Cyan
Say '   Set up Estudiamos on this PC' Cyan
Say '======================================' Cyan
Say "App folder:  $app"
Say "Data folder: $data"

# ---- 1. Node.js -------------------------------------------------------------
Say "`n[1/6] Checking for Node.js (needed for syncing with your phone)..." White
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Say '  Node.js is not installed on this PC.' Yellow
  if ((Get-Command winget -ErrorAction SilentlyContinue) -and (Ask '  Install Node.js (LTS) now? Windows may ask for permission.' $false)) {
    winget install --id OpenJS.NodeJS.LTS -e
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
    $node = Get-Command node -ErrorAction SilentlyContinue
  }
  if (-not $node) {
    Say '  Please install the LTS version from https://nodejs.org and run this setup again.' Yellow
    if (-not $Quiet) { Start-Process 'https://nodejs.org/en/download' }
    Done 1
  }
}
Say ('  OK: Node.js ' + (& $node.Source --version) + ' is installed.') Green

# ---- 2. Data folder ---------------------------------------------------------
Say "`n[2/6] Looking for your decks and progress..." White
$syncFile = Join-Path $data 'sync.json'
if (Test-Path $syncFile) {
  $mb = [math]::Round((Get-Item $syncFile).Length / 1MB, 1)
  $phones = 0; try { $phones = @((Get-Content (Join-Path $data 'devices.json') -Raw | ConvertFrom-Json).devices.PSObject.Properties).Count } catch {}
  Say "  OK: found your data ($mb MB, $phones connected device(s) on record)." Green
} else {
  Say '  There is no Estudiamos data on this PC yet.' Yellow
  Say '  To bring your decks from another PC: close this window, copy the "EstudiarData" folder'
  Say '  from that PC into the same folder as "StudyCards", then run this setup again.'
  if (-not (Ask '  Start with a new, empty Estudiamos instead?')) { Done 0 }
  New-Item -ItemType Directory -Force $data | Out-Null
  # Nothing to move from an older copy on a brand-new PC, so open the synced version straight away.
  Set-Content -Path (Join-Path $data 'migrated.flag') -Value (Get-Date -Format o) -Encoding ascii
  Say '  OK: made a new data folder.' Green
}

# ---- 3. Shortcuts -----------------------------------------------------------
Say "`n[3/6] Making shortcuts..." White
$vbs = Join-Path $app 'Start Estudiamos.vbs'
$ico = Join-Path $app 'estudiar.ico'
$sh = New-Object -ComObject WScript.Shell
function MakeLink($path, $vbsArgs, $desc) {
  $l = $sh.CreateShortcut($path)
  $l.TargetPath = "$env:WINDIR\System32\wscript.exe"
  $l.Arguments = $vbsArgs
  $l.WorkingDirectory = $app
  $l.IconLocation = "$ico,0"
  $l.Description = $desc
  $l.Save()
}
if (-not $NoShortcuts) {
  $desk = [Environment]::GetFolderPath('Desktop')
  $menu = Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs'
  MakeLink (Join-Path $desk 'Estudiamos.lnk') "`"$vbs`"" 'Estudiamos flashcards'
  MakeLink (Join-Path $menu 'Estudiamos.lnk') "`"$vbs`"" 'Estudiamos flashcards'
  Say '  OK: Estudiamos is on your Desktop and in the Start menu.' Green
  Say '      (To pin it to the taskbar: Start > right-click Estudiamos > Pin to taskbar.)'
  $auto = Join-Path ([Environment]::GetFolderPath('Startup')) 'Estudiamos sync server.lnk'
  if (Ask '  Start the sync server when you sign in to Windows, so your phone can connect even before you open the app?' $false) {
    MakeLink $auto "`"$vbs`" /server" 'Runs the Estudiamos sync server in the background'
    Say '  OK: the sync server will start when you sign in.' Green
  } elseif (Test-Path $auto) { Remove-Item $auto -Confirm:$false; Say '  The sync server will no longer start by itself.' }
} else { Say '  Skipped.' }

# ---- 4. Let phones connect --------------------------------------------------
Say "`n[4/6] Letting phones on your home Wi-Fi connect..." White
$rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($rule) { Say '  OK: Windows already allows it.' Green }
elseif (Ask '  Allow phones on your home (private) network to reach Estudiamos? Windows will ask for permission.' $false) {
  $cmd = "New-NetFirewallRule -DisplayName '$ruleName' -Description 'Lets your phone sync with Estudiamos on this PC' -Direction Inbound -Program '$($node.Source)' -Protocol TCP -LocalPort $port -Profile Private -Action Allow | Out-Null"
  try {
    Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList @('-NoProfile', '-Command', $cmd)
    if (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue) { Say '  OK: phones on your home Wi-Fi can connect.' Green }
    else { Say '  It was not added. Windows will ask again the first time a phone connects; choose Allow.' Yellow }
  } catch { Say '  Skipped (permission was not given). Windows may ask the first time a phone connects; choose Allow.' Yellow }
} else { Say '  Skipped. Windows may ask the first time a phone connects; choose Allow for private networks.' }
try {
  $public = @(Get-NetConnectionProfile | Where-Object { $_.NetworkCategory -eq 'Public' })
  foreach ($n in $public) {
    Say "  Note: the network '$($n.Name)' is set to Public, so phones can't connect over it." Yellow
    Say '        If it is your home Wi-Fi: Settings > Network & internet > Wi-Fi > (your network) > Private network.'
  }
} catch {}

# ---- 5. Start and show the address -----------------------------------------
Say "`n[5/6] Starting Estudiamos..." White
function Up { try { return (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "http://127.0.0.1:$port/api/ping").Content -match 'estudiar' } catch { return $false } }
if (-not $NoStart) {
  Start-Process "$env:WINDIR\System32\wscript.exe" -ArgumentList "`"$vbs`""
  for ($i = 0; $i -lt 30 -and -not (Up); $i++) { Start-Sleep -Milliseconds 500 }
  if (Up) { Say '  OK: Estudiamos is running.' Green } else { Say '  The sync server did not answer yet. Open Estudiamos from the Desktop shortcut.' Yellow }
}
# ---- 6. Tailscale (optional): use your phone anywhere, securely -------------
Say "`n[6/6] Using your phone away from home (optional)..." White
Say '  Tailscale is a free app that links your own devices in a private, encrypted network,'
Say '  so your phone can reach this PC from school, work or mobile data, with a secure https:// address.'
$ts = (Get-Command tailscale -ErrorAction SilentlyContinue).Source
if (-not $ts -and (Test-Path "$env:ProgramFiles\Tailscale\tailscale.exe")) { $ts = "$env:ProgramFiles\Tailscale\tailscale.exe" }
$tsUrl = $null
if (-not $ts) {
  Say '  Tailscale is not installed on this PC.'
  if (Ask '  Open the Tailscale download page now? (You can also skip this and only use your home Wi-Fi.)' $false) {
    Start-Process 'https://tailscale.com/download'
    Say '  Install it, sign in, then run this setup again to finish.' Yellow
  } else { Say '  Skipped. You can set it up later: Estudiamos > Settings > Phone & sync > Setup guide.' }
} else {
  $st = $null; try { $st = (& $ts status --json 2>$null | Out-String) | ConvertFrom-Json } catch {}
  if (-not $st -or $st.BackendState -ne 'Running') {
    Say '  Tailscale is installed but not signed in. Open Tailscale (near the clock), log in, then run this setup again.' Yellow
  } else {
    $dns = "$($st.Self.DNSName)".TrimEnd('.'); $tsUrl = "https://$dns"
    $serving = $false; try { $serving = ((& $ts serve status --json 2>$null | Out-String) -match "127\.0\.0\.1:$port") } catch {}
    if ($serving) { Say "  OK: Estudiamos is already shared on your Tailscale network." Green }
    elseif (Ask '  Share Estudiamos on your Tailscale network now? Only your own signed-in devices can open it.' $true) {
      $job = Start-Job { param($exe, $p) & $exe serve --bg $p 2>&1 | Out-String } -ArgumentList $ts, $port
      if (Wait-Job $job -Timeout 25) { $out = Receive-Job $job } else { $out = Receive-Job $job; Stop-Job $job }
      Remove-Job $job -Force
      $serving = $false; try { $serving = ((& $ts serve status --json 2>$null | Out-String) -match "127\.0\.0\.1:$port") } catch {}
      if ($serving) { Say '  OK: Estudiamos is shared on your Tailscale network.' Green }
      else {
        Say '  Not yet: secure (HTTPS) addresses need to be turned on for your Tailscale account first.' Yellow
        $link = [regex]::Match("$out", 'https://login\.tailscale\.com/\S+').Value
        if (-not $link) { $link = 'https://login.tailscale.com/admin/dns' }
        Say "  Opening $link : turn on MagicDNS and HTTPS, then run this setup again."
        Start-Process $link
        $tsUrl = $null
      }
    } else { $tsUrl = $null; Say '  Skipped.' }
    if ($tsUrl -and -not $serving) { $tsUrl = $null }
    $phones = @($st.Peer.PSObject.Properties.Value | Where-Object { $_.OS -match 'iOS|android' })
    if (-not $phones.Count) { Say '  Next: install Tailscale on your phone too and sign in with the same account.' }
  }
}

$ips = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {
  $_.IPAddress -notmatch '^(127\.|169\.254\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)' -and $_.InterfaceAlias -notmatch 'vEthernet|VirtualBox|VMware|Loopback|Tailscale' } | Select-Object -ExpandProperty IPAddress)
Say "`n======================================" Cyan
if ($ips.Count) {
  Say 'On your phone (on the same Wi-Fi), open Safari and go to:' White
  foreach ($ip in $ips) { Say "     http://${ip}:$port" Green }
  Say 'Then connect with your connect password, or with the QR code in'
  Say 'Estudiamos on this PC: Settings > Phone & sync > Connect a phone or tablet.'
  Say 'Tip: in your router, reserve this address for this PC so it never changes.'
} else { Say 'This PC is not on a network right now. Connect to Wi-Fi to use your phone.' Yellow }
if ($tsUrl) {
  Say "`nAway from home (Tailscale on, on the phone too), open:" White
  Say "     $tsUrl" Green
  Say 'Add that one to your home screen: it works everywhere, and offline too.'
}
Say '======================================' Cyan
Done 0
