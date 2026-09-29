Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\HP\.gemini\antigravity-ide\brain\c3377249-7020-4bf3-8235-5618333252fb\.user_uploaded\media_1790005857580.jpg"
$destPath = "D:\project\AgriN Intelligence Network\apps\web\public\images\agrisaarthi-mascot.png"

$orig = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $orig.Width
$height = $orig.Height

# Create ARGB 32-bit bitmap with alpha support
$outputBmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Flood-fill or transparency keying from the corners/edges
# First let's check outer black pixels (threshold < 15)
for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $p = $orig.GetPixel($x, $y)
        # If very dark (near black background)
        if ($p.R -le 12 -and $p.G -le 12 -and $p.B -le 12) {
            $outputBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($p.R -le 25 -and $p.G -le 25 -and $p.B -le 25) {
            # Smooth anti-aliased edge
            $alpha = [int]([Math]::Max(0, ($p.R + $p.G + $p.B) / 3 - 12) * 255 / 13)
            $outputBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
        } else {
            $outputBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
        }
    }
}

$outputBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$orig.Dispose()
$outputBmp.Dispose()
Write-Host "Created transparent mascot PNG at: $destPath"
