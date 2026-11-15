# Estudiamos setup, with a window instead of a text screen.
# Opened by "Set up Estudiamos.cmd". Does the same steps as setup.ps1 (still there: "Set up Estudiamos.cmd /text").
#   -DataDir <path>   use another data folder        -NoShortcuts / -NoStart   skip those steps
#   -DryRun           show everything but change nothing on this PC (for testing)
param([string]$DataDir = '', [switch]$NoShortcuts, [switch]$NoStart, [switch]$DryRun)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$app  = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $app
$data = if ($DataDir) { $DataDir } else { Join-Path $root 'EstudiarData' }
$port = 5178
$ruleName = 'Estudiamos (phone sync)'
$vbs = Join-Path $app 'Start Estudiamos.vbs'
$ico = Join-Path $app 'estudiar.ico'
$S = @{ node = $null; ts = $null; tsUrl = $null; ips = @(); log = New-Object System.Collections.Generic.List[string] }
function Log($t) { $S.log.Add($t) }

# ---------- look ----------
$blue = [Drawing.Color]::FromArgb(59, 84, 232); $ink = [Drawing.Color]::FromArgb(30, 34, 48); $muted = [Drawing.Color]::FromArgb(110, 116, 130)
$green = [Drawing.Color]::FromArgb(31, 154, 82); $amber = [Drawing.Color]::FromArgb(201, 138, 0)
$fTitle = New-Object Drawing.Font('Segoe UI', 18, [Drawing.FontStyle]::Bold)
$fText  = New-Object Drawing.Font('Segoe UI', 10.5)
$fBold  = New-Object Drawing.Font('Segoe UI', 10.5, [Drawing.FontStyle]::Bold)
$fBig   = New-Object Drawing.Font('Consolas', 17, [Drawing.FontStyle]::Bold)
$fStep  = New-Object Drawing.Font('Segoe UI', 10)

$form = New-Object Windows.Forms.Form
$form.Text = 'Set up Estudiamos'; $form.ClientSize = New-Object Drawing.Size(780, 520); $form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'; $form.MaximizeBox = $false; $form.BackColor = [Drawing.Color]::White; $form.Font = $fText
if (Test-Path $ico) { try { $form.Icon = New-Object Drawing.Icon($ico) } catch {} }

# the step list on the left
$side = New-Object Windows.Forms.Panel; $side.SetBounds(0, 0, 200, 520); $side.BackColor = $blue; $form.Controls.Add($side)
$logoBox = New-Object Windows.Forms.PictureBox; $logoBox.SetBounds(20, 18, 64, 64); $logoBox.SizeMode = 'Zoom'
$png = Join-Path $app 'icon-256.png'; if (Test-Path $png) { $logoBox.Image = [Drawing.Image]::FromFile($png) }; $side.Controls.Add($logoBox)
$brand = New-Object Windows.Forms.Label; $brand.Text = 'Estudiamos'; $brand.ForeColor = [Drawing.Color]::White; $brand.Font = $fBold; $brand.SetBounds(20, 86, 170, 24); $side.Controls.Add($brand)
$stepNames = @('Welcome', 'Where to keep it', 'Node.js', 'Your cards', 'Options', 'Your phone', 'All done')
$stepLabels = @()
for ($i = 0; $i -lt $stepNames.Count; $i++) {
  $l = New-Object Windows.Forms.Label; $l.Text = "  $($i + 1).  $($stepNames[$i])"; $l.Font = $fStep; $l.SetBounds(12, 128 + $i * 34, 178, 28)
  $l.ForeColor = [Drawing.Color]::FromArgb(205, 214, 255); $l.TextAlign = 'MiddleLeft'; $side.Controls.Add($l); $stepLabels += $l
}
# bottom buttons
$bar = New-Object Windows.Forms.Panel; $bar.SetBounds(200, 462, 580, 58); $bar.BackColor = [Drawing.Color]::FromArgb(246, 247, 251); $form.Controls.Add($bar)
function Btn($text, $x, $w, $primary) {
  $b = New-Object Windows.Forms.Button; $b.Text = $text; $b.SetBounds($x, 12, $w, 34); $b.FlatStyle = 'Flat'; $b.Font = $fBold; $b.Cursor = 'Hand'
  if ($primary) { $b.BackColor = $blue; $b.ForeColor = [Drawing.Color]::White; $b.FlatAppearance.BorderSize = 0 } else { $b.BackColor = [Drawing.Color]::White; $b.ForeColor = $ink; $b.FlatAppearance.BorderColor = [Drawing.Color]::FromArgb(205, 210, 222) }
  return $b
}
$btnBack = Btn '< Back' 300 110 $false; $btnNext = Btn 'Next >' 420 140 $true
$bar.Controls.Add($btnBack); $bar.Controls.Add($btnNext)
$dry = New-Object Windows.Forms.Label; $dry.Text = if ($DryRun) { 'Test mode: nothing is changed on this PC' } else { '' }; $dry.ForeColor = $amber; $dry.SetBounds(14, 18, 280, 24); $bar.Controls.Add($dry)

# page helpers
$pages = @()
function NewPage($title, $intro) {
  $p = New-Object Windows.Forms.Panel; $p.SetBounds(200, 0, 580, 462); $p.BackColor = [Drawing.Color]::White; $p.Visible = $false; $form.Controls.Add($p)
  $t = New-Object Windows.Forms.Label; $t.Text = $title; $t.Font = $fTitle; $t.ForeColor = $ink; $t.SetBounds(28, 24, 530, 40); $p.Controls.Add($t)
  if ($intro) { $i = New-Object Windows.Forms.Label; $i.Text = $intro; $i.ForeColor = $muted; $i.SetBounds(30, 68, 520, 48); $p.Controls.Add($i) }
  $script:pages += $p; return $p
}
function Text($p, $text, $y, $h = 24, $color = $null, $font = $null) {
  $l = New-Object Windows.Forms.Label; $l.UseMnemonic = $false; $l.Text = $text; $l.SetBounds(30, $y, 520, $h); if ($color) { $l.ForeColor = $color } else { $l.ForeColor = $ink }; if ($font) { $l.Font = $font }; $p.Controls.Add($l); return $l
}
function Check($p, $text, $y, $on) { $c = New-Object Windows.Forms.CheckBox; $c.Text = $text; $c.Checked = $on; $c.SetBounds(32, $y, 510, 26); $p.Controls.Add($c); return $c }
function Radio($p, $text, $y, $on) { $r = New-Object Windows.Forms.RadioButton; $r.Text = $text; $r.Checked = $on; $r.SetBounds(32, $y, 510, 26); $p.Controls.Add($r); return $r }
function Link($p, $text, $x, $y, $w) { $b = Btn $text $x $w $false; $b.Top = $y; $p.Controls.Add($b); return $b }
function Busy($on) { $form.UseWaitCursor = $on; $btnNext.Enabled = -not $on; $btnBack.Enabled = -not $on; [Windows.Forms.Application]::DoEvents() }
function WaitFor($proc) { while (-not $proc.HasExited) { Start-Sleep -Milliseconds 200; [Windows.Forms.Application]::DoEvents() } }

# ---------- 1. Welcome ----------
$pWelcome = NewPage 'Welcome to Estudiamos!' 'Flashcards, quizzes and games for learning languages, on your PC and your phone.'
Text $pWelcome 'This will take about two minutes. Setup will:' 130 | Out-Null
$i = 0; foreach ($t in @('choose a good place to keep Estudiamos', 'check for Node.js, the free helper that syncs your phone', 'make a place for your cards', 'put Estudiamos on your Desktop and Start menu', 'let your phone connect on your home Wi-Fi', 'start Estudiamos')) { Text $pWelcome "   •  $t" (160 + $i * 28) | Out-Null; $i++ }
Text $pWelcome 'You can run setup again any time. It only fixes what is missing.' 340 24 $muted | Out-Null

# ---------- 2. Where to keep it ----------
$pWhere = NewPage 'Where to keep Estudiamos' 'Estudiamos keeps your cards next to the app, so it should live somewhere permanent.'
Text $pWhere 'Estudiamos is in:' 130 | Out-Null
Text $pWhere $root 154 40 $blue $fBold | Out-Null
$target = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Estudiamos'
$temporary = @([Environment]::GetFolderPath('Desktop'), (Join-Path $env:USERPROFILE 'Downloads'), $env:TEMP) | Where-Object { $_ -and $root.StartsWith($_, [StringComparison]::OrdinalIgnoreCase) }
if ($temporary) {
  Text $pWhere 'That folder is easy to clean out or move by accident.' 200 24 $amber | Out-Null
  $rCopy = Radio $pWhere "Copy Estudiamos to $target (recommended)" 236 $true
  Radio $pWhere 'Keep it where it is' 266 $false | Out-Null
  Text $pWhere 'After copying, setup carries on from the new place. You can delete this copy afterwards.' 304 40 $muted | Out-Null
} else {
  $rCopy = $null
  Text $pWhere '✔  That is a good place for it.' 204 24 $green $fBold | Out-Null
}
Text $pWhere 'To move it later: run "Stop Estudiamos" in the StudyCards folder, move the folder, then run setup again.' 360 44 $muted | Out-Null

# ---------- 3. Node.js ----------
$pNode = NewPage 'Node.js' 'Estudiamos uses Node.js (free) to run a small server on this PC, so your phone can sync with it.'
$nodeStatus = Text $pNode '' 140 28 $ink $fBold
$nodeHelp = Text $pNode '' 172 48 $muted
$btnInstall = Link $pNode 'Install Node.js for me' 30 230 220
$btnNodeSite = Link $pNode 'Open the Node.js website' 260 230 220
$btnRecheck = Link $pNode 'Check again' 30 274 140
$prog = New-Object Windows.Forms.ProgressBar; $prog.SetBounds(30, 320, 500, 18); $prog.Style = 'Marquee'; $prog.Visible = $false; $pNode.Controls.Add($prog)
function FindNode {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  $n = Get-Command node -ErrorAction SilentlyContinue; $script:S.node = $n
  if ($n) { $v = & $n.Source --version; $nodeStatus.Text = "✔  Node.js $v is installed."; $nodeStatus.ForeColor = $green; $nodeHelp.Text = 'All good. Press Next.'; $btnInstall.Visible = $false; $btnNodeSite.Visible = $false; $btnRecheck.Visible = $false }
  else { $nodeStatus.Text = 'Node.js is not installed yet.'; $nodeStatus.ForeColor = $amber; $nodeHelp.Text = 'Press "Install Node.js for me" (Windows may ask for permission), or install the LTS version from the website, then press Check again.'
    $btnInstall.Visible = [bool](Get-Command winget -ErrorAction SilentlyContinue); $btnNodeSite.Visible = $true; $btnRecheck.Visible = $true }
}
$btnNodeSite.Add_Click({ Start-Process 'https://nodejs.org/en/download' })
$btnRecheck.Add_Click({ FindNode; Update-Buttons })
$btnInstall.Add_Click({
  if ($DryRun) { [Windows.Forms.MessageBox]::Show('Test mode: Node.js would be installed now.', 'Estudiamos') | Out-Null; return }
  $prog.Visible = $true; $nodeHelp.Text = 'Installing Node.js... Windows may ask for permission. This can take a minute.'; Busy $true
  WaitFor (Start-Process winget -ArgumentList 'install', '--id', 'OpenJS.NodeJS.LTS', '-e', '--accept-source-agreements', '--accept-package-agreements' -PassThru -WindowStyle Minimized)
  $prog.Visible = $false; Busy $false; FindNode; Update-Buttons
})

# ---------- 4. Your cards ----------
$pCards = NewPage 'Your cards' 'Your decks and progress are kept in a folder called EstudiarData, next to the app.'
$cardsStatus = Text $pCards '' 140 28 $ink $fBold
$cardsHelp = Text $pCards '' 174 64 $muted
$rFresh = Radio $pCards 'Start with a new, empty Estudiamos' 246 $true
$btnOpenRoot = Link $pCards 'Open the Estudiamos folder' 30 290 240
$btnCardsCheck = Link $pCards 'Check again' 284 290 140
$btnOpenRoot.Add_Click({ Start-Process explorer.exe $root })
function FindCards {
  $sync = Join-Path $data 'sync.json'
  if (Test-Path $sync) {
    $mb = [math]::Round((Get-Item $sync).Length / 1MB, 1)
    $cardsStatus.Text = "✔  Found your cards ($mb MB)."; $cardsStatus.ForeColor = $green; $cardsHelp.Text = $data
    $rFresh.Visible = $false; $btnCardsCheck.Visible = $false; $btnOpenRoot.Visible = $false
  } else {
    $cardsStatus.Text = 'There are no Estudiamos cards on this PC yet.'; $cardsStatus.ForeColor = $ink
    $cardsHelp.Text = 'Moving from another PC? Copy its "EstudiarData" folder into the Estudiamos folder (next to "StudyCards"), then press Check again. Otherwise, start fresh.'
    $rFresh.Visible = $true; $btnCardsCheck.Visible = $true; $btnOpenRoot.Visible = $true
  }
}
$btnCardsCheck.Add_Click({ FindCards })

# ---------- 5. Options ----------
$pOpts = NewPage 'Options' 'Choose what setup does. You can change these later by running setup again.'
$cDesk = Check $pOpts 'Put Estudiamos on my Desktop' 132 (-not $NoShortcuts)
$cMenu = Check $pOpts 'Put Estudiamos in my Start menu' 162 (-not $NoShortcuts)
$cAuto = Check $pOpts 'Start the sync server when I sign in (so my phone can connect any time)' 192 $false
$cFire = Check $pOpts 'Let my phone connect on my home Wi-Fi (Windows will ask for permission)' 222 $true
$fireNote = Text $pOpts '' 256 24 $muted
$netNote = Text $pOpts '' 284 70 $amber
$optsResult = Text $pOpts '' 360 80 $green
$autoLink = Join-Path ([Environment]::GetFolderPath('Startup')) 'Estudiamos sync server.lnk'
function HasRule { [bool](Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue) }
function PrepOptions {
  $cAuto.Checked = (Test-Path $autoLink)
  if (HasRule) { $cFire.Checked = $true; $cFire.Enabled = $false; $fireNote.Text = 'Windows already lets your phone connect.' }
  try { $lanIf = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)' -and $_.InterfaceAlias -notmatch 'vEthernet|VirtualBox|VMware|Tailscale' } | Select-Object -ExpandProperty InterfaceIndex)
    $public = @(Get-NetConnectionProfile | Where-Object { $_.NetworkCategory -eq 'Public' -and $lanIf -contains $_.InterfaceIndex })
    if ($public.Count) { $netNote.Text = "Note: the network '$($public[0].Name)' is set to Public, so phones can't connect over it. If it is your home Wi-Fi: Settings > Network & internet > Wi-Fi > your network > Private network." } } catch {}
}
$sh = New-Object -ComObject WScript.Shell
function MakeLink($path, $vbsArgs, $desc) {
  if ($DryRun) { Log "Would make shortcut: $path"; return }
  $l = $sh.CreateShortcut($path); $l.TargetPath = "$env:WINDIR\System32\wscript.exe"; $l.Arguments = $vbsArgs
  $l.WorkingDirectory = $env:USERPROFILE; $l.IconLocation = "$ico,0"; $l.Description = $desc; $l.Save()
}
function ApplyOptions {
  $done = @()
  if ($cDesk.Checked) { MakeLink (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Estudiamos.lnk') "`"$vbs`"" 'Estudiamos flashcards'; $done += 'Desktop shortcut' }
  if ($cMenu.Checked) { MakeLink (Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs\Estudiamos.lnk') "`"$vbs`"" 'Estudiamos flashcards'; $done += 'Start menu shortcut' }
  if ($cAuto.Checked) { MakeLink $autoLink "`"$vbs`" /server" 'Runs the Estudiamos sync server in the background'; $done += 'starts when you sign in' }
  elseif ((Test-Path $autoLink) -and -not $DryRun) { Remove-Item $autoLink -Confirm:$false }
  if ($cFire.Checked -and $cFire.Enabled -and $S.node) {
    if ($DryRun) { Log 'Would allow phones through Windows Firewall'; $done += 'phones can connect' }
    else {
      $rule = @('advfirewall', 'firewall', 'add', 'rule', "name=$ruleName", 'dir=in', 'action=allow', 'protocol=TCP', "localport=$port", 'profile=private', "program=$($S.node.Source)")
      try { WaitFor (Start-Process netsh -Verb RunAs -ArgumentList (($rule | ForEach-Object { if ($_ -match ' ') { "`"$_`"" } else { $_ } }) -join ' ') -PassThru -WindowStyle Minimized) } catch {}
      if (HasRule) { $done += 'phones can connect' } else { $done += 'phone access not allowed yet (Windows will ask again when a phone connects)' }
    }
  }
  $optsResult.Text = if ($done.Count) { '✔  ' + ($done -join ' · ') } else { '' }
}

# ---------- 6. Your phone ----------
$pPhone = NewPage 'Use it on your phone' 'On your phone, connected to the same Wi-Fi as this PC, open Safari or Chrome and type:'
$addr = Text $pPhone '' 122 66 $blue $fBig
$qr = New-Object Windows.Forms.PictureBox; $qr.SetBounds(400, 120, 150, 150); $qr.SizeMode = 'Zoom'; $pPhone.Controls.Add($qr)
$qrNote = New-Object Windows.Forms.Label; $qrNote.Text = 'Or scan it with the camera'; $qrNote.ForeColor = $muted; $qrNote.SetBounds(372, 274, 206, 22); $qrNote.TextAlign = 'MiddleCenter'; $pPhone.Controls.Add($qrNote)
$phoneHelp = Text $pPhone 'Then sign in with your connect password, or use the QR code in Estudiamos: Settings > Phone & sync.' 200 44 $muted
$addr.Width = 360; $phoneHelp.Width = 360
Text $pPhone 'Away from home (optional): Tailscale' 300 24 $ink $fBold | Out-Null
$tsText = Text $pPhone '' 326 44 $muted
$btnTs = Link $pPhone 'Get Tailscale' 30 376 200
$btnTsShare = Link $pPhone 'Share Estudiamos on Tailscale' 240 376 260
$tsUrlLbl = Text $pPhone '' 380 30 $green $fBold
function Up { try { return (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "http://127.0.0.1:$port/api/ping").Content -match 'estudiar' } catch { return $false } }
function StartApp {
  if ($NoStart -or $DryRun) { return }
  if (-not (Up)) { Start-Process "$env:WINDIR\System32\wscript.exe" -ArgumentList "`"$vbs`" /server"; for ($i = 0; $i -lt 30 -and -not (Up); $i++) { Start-Sleep -Milliseconds 400; [Windows.Forms.Application]::DoEvents() } }
}
function QrPicture($text) {
  if (-not $S.node) { return $null }
  try {
    $js = 'const QR=require(process.argv[1]);process.stdout.write(JSON.stringify(QR.encode(process.argv[2]).modules))'
    $m = (& $S.node.Source -e $js (Join-Path $app 'qr.js') $text) | ConvertFrom-Json; $n = $m.Count; $px = 6; $pad = 4
    $bmp = New-Object Drawing.Bitmap((($n + $pad * 2) * $px), (($n + $pad * 2) * $px)); $g = [Drawing.Graphics]::FromImage($bmp); $g.Clear([Drawing.Color]::White)
    for ($y = 0; $y -lt $n; $y++) { $row = $m[$y]; for ($x = 0; $x -lt $n; $x++) { if ($row[$x]) { $g.FillRectangle([Drawing.Brushes]::Black, ($x + $pad) * $px, ($y + $pad) * $px, $px, $px) } } }
    $g.Dispose(); return $bmp
  } catch { return $null }
}
function FindTailscale {
  $ts = (Get-Command tailscale -ErrorAction SilentlyContinue).Source
  if (-not $ts -and (Test-Path "$env:ProgramFiles\Tailscale\tailscale.exe")) { $ts = "$env:ProgramFiles\Tailscale\tailscale.exe" }
  $S.ts = $ts; $btnTsShare.Visible = $false
  if (-not $ts) { $tsText.Text = 'Tailscale (free) lets your phone reach this PC from anywhere, with a secure https:// address. Install it on this PC and your phone.'; $btnTs.Visible = $true; return }
  $btnTs.Visible = $false
  $st = $null; try { $st = (& $ts status --json 2>$null | Out-String) | ConvertFrom-Json } catch {}
  if (-not $st -or $st.BackendState -ne 'Running') { $tsText.Text = 'Tailscale is installed but not signed in. Open Tailscale (near the clock), sign in, then run setup again.'; return }
  $url = 'https://' + "$($st.Self.DNSName)".TrimEnd('.')
  $serving = $false; try { $serving = ((& $ts serve status --json 2>$null | Out-String) -match "127\.0\.0\.1:$port") } catch {}
  if ($serving) { $S.tsUrl = $url; $tsText.Text = 'On your phone (with Tailscale on it too), open this from anywhere and add it to your home screen:'; $tsUrlLbl.Text = $url }
  else { $tsText.Text = 'Tailscale is ready. Share Estudiamos on it, so only your own signed-in devices can open it from anywhere.'; $btnTsShare.Visible = $true }
}
$btnTs.Add_Click({ Start-Process 'https://tailscale.com/download' })
$btnTsShare.Add_Click({
  if ($DryRun) { [Windows.Forms.MessageBox]::Show('Test mode: Estudiamos would be shared on Tailscale now.', 'Estudiamos') | Out-Null; return }
  Busy $true
  $outFile = Join-Path ([IO.Path]::GetTempPath()) 'estudiamos-tailscale.txt'
  WaitFor (Start-Process $S.ts -ArgumentList 'serve', '--bg', "$port" -PassThru -WindowStyle Hidden -RedirectStandardOutput $outFile)
  $out = Get-Content $outFile -Raw -ErrorAction SilentlyContinue; Busy $false; FindTailscale
  if (-not $S.tsUrl) { $link = [regex]::Match("$out", 'https://login\.tailscale\.com/\S+').Value; if (-not $link) { $link = 'https://login.tailscale.com/admin/dns' }
    $tsText.Text = 'Secure (HTTPS) addresses need to be turned on for your Tailscale account. Turn on MagicDNS and HTTPS on the page that opened, then press Share again.'; Start-Process $link }
})
function PrepPhone {
  StartApp
  $S.ips = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)' -and $_.InterfaceAlias -notmatch 'vEthernet|VirtualBox|VMware|Loopback|Tailscale' } | Select-Object -ExpandProperty IPAddress)
  if ($S.ips.Count) { $addr.Text = ($S.ips | Select-Object -First 2 | ForEach-Object { "http://${_}:$port" }) -join "`n"; $img = QrPicture "http://$($S.ips[0]):$port"; $qr.Image = $img; $qrNote.Visible = [bool]$img }
  else { $addr.Text = 'Not on a network'; $addr.ForeColor = $amber; $phoneHelp.Text = 'Connect this PC to Wi-Fi to use your phone. You can still use Estudiamos on this PC.'; $qrNote.Visible = $false }
  FindTailscale
}

# ---------- 7. Done ----------
$pDone = NewPage 'All done!' 'Estudiamos is set up on this PC.'
Text $pDone 'Open it any time with the Estudiamos icon on your Desktop or in the Start menu.' 130 48 | Out-Null
Text $pDone 'Pick a name and a picture, and a short tour shows you around.' 182 24 $muted | Out-Null
$btnOpen = Link $pDone 'Open Estudiamos' 30 230 220; $btnOpen.BackColor = $blue; $btnOpen.ForeColor = [Drawing.Color]::White; $btnOpen.FlatAppearance.BorderSize = 0
$btnOpen.Add_Click({ if (-not $DryRun) { Start-Process "$env:WINDIR\System32\wscript.exe" -ArgumentList "`"$vbs`"" }; $form.Close() })
Text $pDone 'Need help? In Estudiamos: Settings > Phone & sync > Setup guide.' 290 24 $muted | Out-Null

# ---------- moving between pages ----------
$script:cur = 0
function Update-Buttons {
  $btnBack.Visible = $script:cur -gt 0 -and $script:cur -lt ($pages.Count - 1)
  $btnNext.Text = if ($script:cur -eq $pages.Count - 1) { 'Close' } elseif ($script:cur -eq 0) { "Let's go >" } else { 'Next >' }
  $btnNext.Enabled = -not ($script:cur -eq 2 -and -not $S.node)
}
function Show-Page($n) {
  for ($i = 0; $i -lt $pages.Count; $i++) { $pages[$i].Visible = ($i -eq $n) }
  for ($i = 0; $i -lt $stepLabels.Count; $i++) {
    $stepLabels[$i].ForeColor = if ($i -eq $n) { [Drawing.Color]::White } elseif ($i -lt $n) { [Drawing.Color]::FromArgb(170, 230, 190) } else { [Drawing.Color]::FromArgb(205, 214, 255) }
    $stepLabels[$i].Font = if ($i -eq $n) { $fBold } else { $fStep }
    $stepLabels[$i].Text = $(if ($i -lt $n) { '  ✔  ' } else { "  $($i + 1).  " }) + $stepNames[$i]
  }
  $script:cur = $n
  if ($n -eq 2) { FindNode }; if ($n -eq 3) { FindCards }; if ($n -eq 4) { PrepOptions }; if ($n -eq 5) { Busy $true; PrepPhone; Busy $false }
  Update-Buttons
}
$btnBack.Add_Click({ if ($script:cur -gt 0) { Show-Page ($script:cur - 1) } })
$btnNext.Add_Click({
  switch ($script:cur) {
    1 { if ($rCopy -and $rCopy.Checked -and -not $DryRun) {
          if (Test-Path (Join-Path $target 'StudyCards')) { [Windows.Forms.MessageBox]::Show("There is already an Estudiamos in $target. Run 'Set up Estudiamos' from there, or rename that folder first.", 'Estudiamos') | Out-Null; return }
          Busy $true; New-Item -ItemType Directory -Force $target | Out-Null; Copy-Item -Path (Join-Path $root '*') -Destination $target -Recurse -Force; Busy $false
          Start-Process (Join-Path $target 'StudyCards\Set up Estudiamos.cmd') -WorkingDirectory (Join-Path $target 'StudyCards')
          $form.Close(); return } }
    3 { if (-not (Test-Path (Join-Path $data 'sync.json'))) {
          if ($DryRun) { Log "Would make $data" } else { New-Item -ItemType Directory -Force $data | Out-Null; Set-Content -Path (Join-Path $data 'migrated.flag') -Value (Get-Date -Format o) -Encoding ascii } } }
    4 { Busy $true; ApplyOptions; Busy $false }
    6 { $form.Close(); return }
  }
  Show-Page ($script:cur + 1)
})

Show-Page 0
[void]$form.ShowDialog()
