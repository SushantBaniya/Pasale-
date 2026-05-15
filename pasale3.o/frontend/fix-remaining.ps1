# Fix files with bracketed names using LiteralPath
$colorMap = @{
    '#3D2B1A' = '#1A1C20'
    '#8A7060' = '#6B7280'
    '#E5D8CC' = '#DDD7CC'
    '#EDE5DA' = '#E3DDD2'
    '#FAF7F3' = '#F4F0EA'
    '#1A1A1A' = '#15161C'
    '#111111' = '#0D0E12'
    '#222222' = '#1C1D24'
    '#333333' = '#2A2B36'
    '#2A2A2A' = '#22232C'
    '#555555' = '#44454F'
    '#444444' = '#35363F'
    '#CCCCCC' = '#C8C3BC'
    '#E0E0E0' = '#EAE5DF'
    '#FDF1EC' = '#F5F0E6'
    '#D4623A' = '#A3876A'
    '#B8502E' = '#8E7356'
    '#8A3A1E' = '#6B5340'
    '#0A0A0A' = '#080A0F'
    '#8A7060 dark' = '#6B7280 dark'
}

$files = @(
    'C:\Users\ACER\OneDrive\Desktop\pasale\pasale3.o\frontend\src\app\parties\[partyId]\page.tsx',
    'C:\Users\ACER\OneDrive\Desktop\pasale\pasale3.o\frontend\src\app\dashboard\kpi\[type]\page.tsx'
)

foreach ($fullPath in $files) {
    if (-not [System.IO.File]::Exists($fullPath)) {
        Write-Host "NOT FOUND: $fullPath"
        continue
    }
    $lines = [System.IO.File]::ReadAllLines($fullPath, [System.Text.Encoding]::UTF8)
    $changed = $false
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        foreach ($kv in $colorMap.GetEnumerator()) {
            if ($line.Contains($kv.Key)) {
                $line = $line.Replace($kv.Key, $kv.Value)
                $changed = $true
            }
        }
        $lines[$i] = $line
    }
    if ($changed) {
        [System.IO.File]::WriteAllLines($fullPath, $lines, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $fullPath"
    } else {
        Write-Host "No changes needed: $fullPath"
    }
}
Write-Host "Done."
