[CmdletBinding()]
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $projectRoot

function Test-DockerEngine {
    try {
        $version = docker version --format '{{.Server.Version}}' 2>$null
        return -not [string]::IsNullOrWhiteSpace($version)
    } catch {
        return $false
    }
}

if (-not (Test-DockerEngine)) {
    throw 'Docker 引擎未运行，请先启动 Docker Desktop。'
}

$composeArgs = @('compose', 'up', '-d')
if (-not $SkipBuild) { $composeArgs += '--build' }

Write-Host '正在启动 Platform Integrated（单运行时、四逻辑应用）...' -ForegroundColor Cyan
& docker @composeArgs
if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose 启动失败，退出码：$LASTEXITCODE"
}

docker compose ps
Write-Host ''
Write-Host 'Platform Integrated 已启动：' -ForegroundColor Green
Write-Host '  Platform  http://localhost:3200/dashboard'
Write-Host '  Task      http://localhost:3200/task/'
Write-Host '  AI        http://localhost:3200/ai/'
Write-Host '  Tool      http://localhost:3200/tool/'
Write-Host '  Health    http://localhost:3200/actuator/health'
