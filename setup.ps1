# Unified Media Library - Quick Start Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Unified Media Library Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✓ Docker found" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Ollama is installed and running
Write-Host ""
Write-Host "Checking Ollama (required for embeddings)..." -ForegroundColor Yellow
try {
    $ollamaVersion = ollama --version 2>$null
    if ($ollamaVersion) {
        Write-Host "✓ Ollama found: $ollamaVersion" -ForegroundColor Green
        
        # Check if embedding model is available
        Write-Host "Checking for embedding model..." -ForegroundColor Yellow
        $models = ollama list 2>$null
        if ($models -match "embeddinggemma") {
            Write-Host "✓ Embedding model (embeddinggemma) found" -ForegroundColor Green
        } else {
            Write-Host "Pulling embedding model (embeddinggemma:300m)..." -ForegroundColor Yellow
            Write-Host "  This may take a few minutes (~620MB download)" -ForegroundColor Gray
            ollama pull embeddinggemma:300m
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Embedding model downloaded" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Failed to pull embedding model. You can try manually:" -ForegroundColor Yellow
                Write-Host "   ollama pull embeddinggemma:300m" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "⚠️  Ollama not found. Embeddings require Ollama to be installed." -ForegroundColor Yellow
    Write-Host "   Download from: https://ollama.com/download" -ForegroundColor Cyan
    Write-Host "   After installing, run: ollama pull embeddinggemma:300m" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue without Ollama? Semantic search will not work. (y/n)"
    if ($continue -ne "y") {
        Write-Host "Please install Ollama and run this script again." -ForegroundColor Yellow
        exit 0
    }
}

# Check if .env exists
Write-Host ""
Write-Host "Checking environment file..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "✗ .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please edit .env and add your GOOGLE_GEMINI_API_KEY" -ForegroundColor Red
    Write-Host "   Get your API key from: https://ai.google.dev/" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Have you added your API key to .env? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Please update .env with your API key and run this script again." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# Create media storage directories
Write-Host ""
Write-Host "Creating media storage directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".\media-storage\covers" | Out-Null
Write-Host "✓ Directories created" -ForegroundColor Green

# Build Docker containers
Write-Host ""
Write-Host "Building Docker containers (this may take 5-10 minutes)..." -ForegroundColor Yellow
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build complete" -ForegroundColor Green

# Start services
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start services" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Services started" -ForegroundColor Green

# Wait for services to be ready
Write-Host ""
Write-Host "Waiting for services to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Initialize database
Write-Host ""
Write-Host "Initializing database..." -ForegroundColor Yellow
docker-compose exec -T next-app pnpm prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Database initialization failed" -ForegroundColor Red
    Write-Host "Tip: Services might need more time. Try running:" -ForegroundColor Yellow
    Write-Host "  docker-compose exec next-app pnpm prisma migrate deploy" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Database initialized" -ForegroundColor Green

# Check service status
Write-Host ""
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Verify custom server is running
Write-Host ""
Write-Host "Verifying custom server startup..." -ForegroundColor Yellow
$serverReady = $false
$maxAttempts = 10
$attempt = 0

while (-not $serverReady -and $attempt -lt $maxAttempts) {
    try {
        $logs = docker-compose logs next-app | Select-String "Ready on http"
        if ($logs) {
            $serverReady = $true
            Write-Host "✓ Custom server is ready" -ForegroundColor Green
        } else {
            $attempt++
            Start-Sleep -Seconds 2
        }
    } catch {
        $attempt++
        Start-Sleep -Seconds 2
    }
}

if (-not $serverReady) {
    Write-Host "⚠️  Server startup verification timed out" -ForegroundColor Yellow
    Write-Host "The server may still be starting. Please check logs:" -ForegroundColor Yellow
    Write-Host "  docker-compose logs -f next-app" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your Unified Media Library is now running!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access your library at:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:    docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop:         docker-compose down" -ForegroundColor White
Write-Host "  Restart:      docker-compose restart next-app" -ForegroundColor White
Write-Host "  Rebuild:      docker-compose up --build" -ForegroundColor White
Write-Host ""
Write-Host "Requirements:" -ForegroundColor Yellow
Write-Host "  - Docker Desktop must be running" -ForegroundColor White
Write-Host "  - Ollama must be running (for semantic search)" -ForegroundColor White
Write-Host "  - Start Ollama with: ollama serve" -ForegroundColor White
Write-Host ""
