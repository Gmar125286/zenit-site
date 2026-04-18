param(
    [string]$ProjectRoot = $PSScriptRoot,
    [int]$KeepCount = 20
)

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$projectName = Split-Path -Path $ProjectRoot -Leaf
$backupDir = Join-Path $ProjectRoot "backups"
$stagingDir = Join-Path $backupDir "_staging_$timestamp"
$zipPath = Join-Path $backupDir "$projectName-backup-$timestamp.zip"

$excludeNames = @(
    ".git",
    "__pycache__",
    "backups"
)

$excludeExtensions = @(
    ".pyc"
)

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

try {
    Get-ChildItem -Path $ProjectRoot -Force | Where-Object {
        $excludeNames -notcontains $_.Name
    } | ForEach-Object {
        $destination = Join-Path $stagingDir $_.Name

        if ($_.PSIsContainer) {
            Copy-Item -Path $_.FullName -Destination $destination -Recurse -Force
            return
        }

        if ($excludeExtensions -contains $_.Extension) {
            return
        }

        Copy-Item -Path $_.FullName -Destination $destination -Force
    }

    if (Test-Path $zipPath) {
        Remove-Item -Path $zipPath -Force
    }

    Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

    Get-ChildItem -Path $backupDir -Filter "*.zip" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -Skip $KeepCount |
        Remove-Item -Force

    Write-Output "Backup creato: $zipPath"
}
finally {
    if (Test-Path $stagingDir) {
        Remove-Item -Path $stagingDir -Recurse -Force
    }
}
