# Quick Start Script for BookMyVenue - Local Development

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BookMyVenue - Local Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "[1/5] Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[1/5] Dependencies already installed ✓" -ForegroundColor Green
    Write-Host ""
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="bookmyvenue-local-dev-secret-$(Get-Random)"
NEXTAUTH_URL="http://localhost:3000"
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[2/5] Checking database..." -ForegroundColor Yellow

# Check if database exists
$dbExists = Test-Path "prisma\dev.db"

if (-not $dbExists) {
    Write-Host "Creating local database..." -ForegroundColor Gray
    npx prisma db push --accept-data-loss 2>$null
    Write-Host "✓ Database created" -ForegroundColor Green
} else {
    Write-Host "✓ Database already exists" -ForegroundColor Green
}
Write-Host ""

Write-Host "[3/5] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate 2>$null
Write-Host "✓ Prisma Client ready" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Checking sample data..." -ForegroundColor Yellow
Write-Host "Adding sample data for testing..." -ForegroundColor Gray

# Try to seed database
if (Test-Path "prisma\seed.ts") {
    npx tsx prisma/seed.ts 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Sample data added" -ForegroundColor Green
    } else {
        Write-Host "! Seed had issues (non-critical)" -ForegroundColor Yellow
    }
} else {
    Write-Host "! No seed script found" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[5/5] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Server starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Local URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Database: prisma\dev.db (SQLite)" -ForegroundColor Gray
Write-Host "🎨 Prisma Studio: npx prisma studio" -ForegroundColor Gray
Write-Host ""
Write-Host "Test accounts:" -ForegroundColor Yellow
Write-Host "  Email: user@test.com" -ForegroundColor White
Write-Host "  Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop server" -ForegroundColor Gray
Write-Host ""

npm run dev
