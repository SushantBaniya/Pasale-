# Final verification - check for any remaining old colors
$oldColors = @('#D4623A','#B8502E','#8A3A1E','#3D2B1A','#FAF7F3','#F5EDE3','#EDE5DA','#E5D8CC','#111111','#1A1A1A','#0A0A0A','#E0E0E0','#CCCCCC','#555555','#444444','#FDF1EC')
$extensions = @('*.tsx','*.ts','*.css','*.js','*.jsx')
$results = @()

Get-ChildItem -Path '.\src' -Include $extensions -Recurse | ForEach-Object {
    $filePath = $_.FullName
    $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
    foreach ($color in $oldColors) {
        if ($content.Contains($color)) {
            $results += "$($_.Name): $color"
        }
    }
}

if ($results.Count -eq 0) {
    Write-Host "ALL CLEAR - No old colors found! Ink & Cashmere palette is fully applied."
} else {
    Write-Host "Remaining old colors found:"
    $results | ForEach-Object { Write-Host "  $_" }
}
