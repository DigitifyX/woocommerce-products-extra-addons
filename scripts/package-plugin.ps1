$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$packageJsonPath = Join-Path $projectRoot 'package.json'
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

$pluginSlug = $packageJson.name
$stageBase = Join-Path $projectRoot '.package-tmp'
$stageRoot = Join-Path $stageBase $pluginSlug
$zipPath = Join-Path $projectRoot ($pluginSlug + '.zip')

if (Test-Path $stageBase) {
    Remove-Item $stageBase -Recurse -Force
}

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

foreach ($entry in $packageJson.files) {
    $sourcePath = Join-Path $projectRoot $entry
    if (-not (Test-Path $sourcePath)) {
        throw "Package source not found: $entry"
    }

    $destinationPath = Join-Path $stageRoot $entry
    $destinationDir = Split-Path -Parent $destinationPath

    if (-not (Test-Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }

    Copy-Item $sourcePath -Destination $destinationPath -Recurse -Force
}

Push-Location $stageBase
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $stageRoot,
        $zipPath,
        [System.IO.Compression.CompressionLevel]::Optimal,
        $true
    )
}
finally {
    Pop-Location
}

Remove-Item $stageBase -Recurse -Force
Write-Host "Created $zipPath"
