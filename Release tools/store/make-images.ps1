# Makes the Microsoft Store tile and logo images from StudyCards\icon-512.png (run by make-msix.js).
param([string]$Out = (Join-Path $PSScriptRoot 'images'))
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot '..\..\StudyCards\icon-512.png'))
$bg = ([System.Drawing.Bitmap]$src).GetPixel(4, 4)
New-Item -ItemType Directory -Force -Path $Out | Out-Null
function Save-Img([string]$name, [int]$w, [int]$h, [int]$icon) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear($bg)
  $g.DrawImage($src, [int](($w - $icon) / 2), [int](($h - $icon) / 2), $icon, $icon)
  $g.Dispose()
  $bmp.Save((Join-Path $Out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
Save-Img 'Square44x44Logo.png' 44 44 44
Save-Img 'Square44x44Logo.targetsize-44_altform-unplated.png' 44 44 44
Save-Img 'Square71x71Logo.png' 71 71 71
Save-Img 'Square150x150Logo.png' 150 150 150
Save-Img 'Square310x310Logo.png' 310 310 310
Save-Img 'Wide310x150Logo.png' 310 150 150
Save-Img 'StoreLogo.png' 50 50 50
Save-Img 'SplashScreen.png' 620 300 300
$src.Dispose()
Write-Output ("background " + $bg.Name)
