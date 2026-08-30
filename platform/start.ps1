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

function Start-DockerDesktopIfNeeded {
    if (Test-DockerEngine) { return }

    Write-Host '[!] Docker 引擎未就绪，正在启动 Docker Desktop...' -ForegroundColor Yellow
    $candidates = @(
        (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
        (Join-Path $env:LOCALAPPDATA 'Docker\Docker Desktop.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Docker\Docker\Docker Desktop.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe')
    )
    $dockerDesktop = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

    if (-not $dockerDesktop) {
        throw '未找到 Docker Desktop。请先安装或手动启动 Docker Desktop。'
    }

    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
    $deadline = (Get-Date).AddSeconds(120)
    while ((Get-Date) -lt $deadline) {
        if (Test-DockerEngine) { return }
        Start-Sleep -Seconds 3
        Write-Host '.' -NoNewline -ForegroundColor DarkGray
    }
    throw 'Docker Desktop 启动超时，请打开 Docker Desktop 查看状态后重试。'
}

Write-Host '=================================================' -ForegroundColor DarkCyan
Write-Host '  Platform Control OS · 本地应用与容器工作区' -ForegroundColor Cyan
Write-Host '=================================================' -ForegroundColor DarkCyan

Start-DockerDesktopIfNeeded
$dockerVersion = docker version --format '{{.Server.Version}}'
Write-Host "[✓] Docker 引擎已就绪 ($dockerVersion)" -ForegroundColor Green

$composeArgs = @('compose', 'up', '-d')
if (-not $SkipBuild) { $composeArgs += '--build' }

Write-Host '[*] 正在启动数据库、主平台与三个 Studio...' -ForegroundColor Cyan
& docker @composeArgs
if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose 启动失败，退出码：$LASTEXITCODE"
}

Write-Host '[*] 当前服务状态：' -ForegroundColor Cyan
docker compose ps

Write-Host '=================================================' -ForegroundColor DarkCyan
Write-Host ' [✓] Platform 已在本地运行' -ForegroundColor Green
Write-Host '  主控制台      http://localhost:3100' -ForegroundColor White
Write-Host '  Task Studio   http://localhost:3002' -ForegroundColor White
Write-Host '  AI Studio     http://localhost:3003' -ForegroundColor White
Write-Host '  DevTools      http://localhost:3004' -ForegroundColor White
Write-Host '  健康检查      http://localhost:8090/actuator/health' -ForegroundColor White
Write-Host '=================================================' -ForegroundColor DarkCyan
