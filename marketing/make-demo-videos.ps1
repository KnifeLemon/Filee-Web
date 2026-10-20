<#
.SYNOPSIS
  Renders the feature demo clips (expand, flip, browser) from Filee's real donut UI into marketing/out/demo-videos.

.DESCRIPTION
  Builds and runs marketing/demo-videos against the Filee app repository next to this one (../Filee, or FILEE_REPO).
  Every build output, the app's projects' included, goes under marketing/out/build: nothing is written into the app
  repository. See marketing/README.md for the files it makes and where they are used.

.EXAMPLE
  pwsh marketing/make-demo-videos.ps1
.EXAMPLE
  pwsh marketing/make-demo-videos.ps1 -Clips flip -Formats square -Stills 2,3.2 -Quick
#>
[CmdletBinding()]
param(
    [string]$Output = (Join-Path $PSScriptRoot 'out/demo-videos'),
    [string]$FFmpeg,
    [string[]]$Clips = @(),
    [ValidateSet('square', 'vertical', 'wide')] [string[]]$Formats = @(),
    [ValidateSet('light', 'dark')] [string[]]$Themes = @(),
    [double[]]$Stills = @(),
    [switch]$Quick
)

$ErrorActionPreference = 'Stop'
$project = Join-Path $PSScriptRoot 'demo-videos/DemoVideos.csproj'
$build = Join-Path $PSScriptRoot 'out/build'

$arguments = @('--out', [IO.Path]::GetFullPath($Output))
if ($FFmpeg) { $arguments += '--ffmpeg', $FFmpeg }
if ($Clips) { $arguments += '--clips', ($Clips -join ',') }
if ($Formats) { $arguments += '--formats', ($Formats -join ',') }
if ($Themes) { $arguments += '--themes', ($Themes -join ',') }
if ($Stills) { $arguments += '--stills', (($Stills | ForEach-Object { $_.ToString([Globalization.CultureInfo]::InvariantCulture) }) -join ',') }
if ($Quick) { $arguments += '--quick' }

dotnet run --project $project -c Release --artifacts-path $build -- @arguments
if ($LASTEXITCODE -ne 0) { throw "Rendering failed ($LASTEXITCODE)." }
