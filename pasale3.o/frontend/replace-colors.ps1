# Ink & Cashmere Color Replacement Script
# Converts Warm Terracotta theme -> Ink & Cashmere palette

$srcPath = ".\src"
$extensions = @("*.tsx", "*.ts", "*.css", "*.js", "*.jsx")

# Color mapping: OldColor -> NewColor
# Case-insensitive matching will be done
$colorMap = [ordered]@{
    # ── PRIMARY ACCENT (Terracotta → Cashmere Camel) ──────────────────────────
    "#D4623A44"       = "#A3876A44"  # accent with alpha (scrollbar hover)
    "#D4623A22"       = "#A3876A22"  # muted accent
    "#D4623A30"       = "#A3876A30"  # border accent
    "#D4623A50"       = "#A3876A50"  # border accent
    "#D4623A/10"      = "#A3876A/10" # Tailwind opacity
    "#D4623A/15"      = "#A3876A/15"
    "#D4623A/20"      = "#A3876A/20"
    "#D4623A/30"      = "#A3876A/30"
    "#D4623A"         = "#A3876A"    # main accent
    "#B8502E"         = "#8E7356"    # hover / dark accent
    "#8A3A1E"         = "#6B5340"    # darkest accent
    # ── LIGHT THEME TEXT ──────────────────────────────────────────────────────
    "#3D2B1A"         = "#1A1C20"    # primary text (Ink)
    "#8A7060"         = "#6B7280"    # muted text
    # ── LIGHT THEME SURFACES (Cashmere) ───────────────────────────────────────
    "#FDF1EC"         = "#F5F0E6"    # accent-tinted light bg
    "#FAF7F3"         = "#F4F0EA"    # page background
    "#F5EDE3"         = "#EBE5DA"    # sidebar bg
    "#EDE5DA"         = "#E3DDD2"    # card bg
    "#E5D8CC"         = "#DDD7CC"    # border
    # ── DARK THEME SURFACES (Ink) ─────────────────────────────────────────────
    "#0A0A0A"         = "#080A0F"    # darkest strip
    "#111111"         = "#0D0E12"    # page bg dark
    "#1A1A1A"         = "#15161C"    # card bg dark
    "#222222"         = "#1C1D24"    # border dark / alert
    "#2A2A2A"         = "#22232C"    # inactive bar dark
    "#333333"         = "#2A2B36"    # button border dark / section label
    "#444444"         = "#35363F"    # very muted text dark
    "#555555"         = "#44454F"    # muted text dark
    "#CCCCCC"         = "#C8C3BC"    # secondary text dark (cashmere)
    "#E0E0E0"         = "#EAE5DF"    # primary text dark (cashmere)
    # ── GREEN ACCENTS (keep similar, slightly warmer) ─────────────────────────
    "#3A7A5A"         = "#3A7A5A"    # light-mode green (unchanged)
    "#4CAF82"         = "#4CAF82"    # dark-mode green (unchanged)
}

# Get all files
$files = Get-ChildItem -Path $srcPath -Include $extensions -Recurse

$totalReplaced = 0
$filesModified = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileModified = $false

    foreach ($pair in $colorMap.GetEnumerator()) {
        $oldColor = $pair.Key
        $newColor = $pair.Value

        if ($oldColor -eq $newColor) { continue }

        # Case-insensitive replace
        $before = $content
        $content = [regex]::Replace($content, [regex]::Escape($oldColor), $newColor, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($content -ne $before) {
            $fileModified = $true
        }
    }

    if ($fileModified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $filesModified++
        Write-Host "Updated: $($file.FullName.Replace((Resolve-Path $srcPath).Path, '.'))"
    }
}

Write-Host ""
Write-Host "Done! Modified $filesModified file(s)."
