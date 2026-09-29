Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\HP\.gemini\antigravity-ide\brain\c3377249-7020-4bf3-8235-5618333252fb\.user_uploaded\media_1790010116953.jpg"
$destPath = "D:\project\AgriN Intelligence Network\apps\web\public\images\agrisaarthi-mascot.png"

$orig = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $orig.Width
$height = $orig.Height

Write-Host "Processing original image: $width x $height"

# Create ARGB bitmap
$output = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Step 1: Copy every pixel from original at 100% opacity
for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $p = $orig.GetPixel($x, $y)
        $output.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
    }
}

# Step 2: Flood-fill from borders only (BFS)
$visited = New-Object 'bool[,]' $width, $height
$queue = New-Object System.Collections.Generic.Queue[System.Drawing.Point]

# Enqueue border pixels that are dark (exterior black background)
for ($x = 0; $x -lt $width; $x++) {
    $topP = $orig.GetPixel($x, 0)
    if ($topP.R -le 20 -and $topP.G -le 20 -and $topP.B -le 20) {
        $visited[$x, 0] = $true
        $queue.Enqueue((New-Object System.Drawing.Point($x, 0)))
    }
    $botP = $orig.GetPixel($x, $height - 1)
    if ($botP.R -le 20 -and $botP.G -le 20 -and $botP.B -le 20) {
        $visited[$x, $height - 1] = $true
        $queue.Enqueue((New-Object System.Drawing.Point($x, $height - 1)))
    }
}

for ($y = 0; $y -lt $height; $y++) {
    $leftP = $orig.GetPixel(0, $y)
    if (-not $visited[0, $y] -and $leftP.R -le 20 -and $leftP.G -le 20 -and $leftP.B -le 20) {
        $visited[0, $y] = $true
        $queue.Enqueue((New-Object System.Drawing.Point(0, $y)))
    }
    $rightP = $orig.GetPixel($width - 1, $y)
    if (-not $visited[$width - 1, $y] -and $rightP.R -le 20 -and $rightP.G -le 20 -and $rightP.B -le 20) {
        $visited[$width - 1, $y] = $true
        $queue.Enqueue((New-Object System.Drawing.Point($width - 1, $y)))
    }
}

$dx = @(1, -1, 0, 0)
$dy = @(0, 0, 1, -1)

$transparentCount = 0

while ($queue.Count -gt 0) {
    $pt = $queue.Dequeue()
    $output.SetPixel($pt.X, $pt.Y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $transparentCount++

    for ($i = 0; $i -lt 4; $i++) {
        $nx = $pt.X + $dx[$i]
        $ny = $pt.Y + $dy[$i]

        if ($nx -ge 0 -and $nx -lt $width -and $ny -ge 0 -and $ny -lt $height) {
            if (-not $visited[$nx, $ny]) {
                $p = $orig.GetPixel($nx, $ny)
                if ($p.R -le 22 -and $p.G -le 22 -and $p.B -le 22) {
                    $visited[$nx, $ny] = $true
                    $queue.Enqueue((New-Object System.Drawing.Point($nx, $ny)))
                } elseif ($p.R -le 38 -and $p.G -le 38 -and $p.B -le 38) {
                    # Feather the anti-aliased edge touching the background
                    $visited[$nx, $ny] = $true
                    $alpha = [int]([Math]::Max(0, ($p.R + $p.G + $p.B) / 3 - 10) * 255 / 28)
                    $output.SetPixel($nx, $ny, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
                }
            }
        }
    }
}

Write-Host "Made $transparentCount exterior background pixels transparent."
Write-Host "All interior pixels (eyes, face, clothes, leaves, badge) remain 100% untouched!"

# Save as PNG
$output.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$orig.Dispose()
$output.Dispose()
Write-Host "Successfully generated transparent original mascot PNG at: $destPath"
