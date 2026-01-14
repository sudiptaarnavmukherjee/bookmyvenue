# Simple Setup Script for BookMyVenue
Write-Host "BookMyVenue - Quick Setup" -ForegroundColor Cyan
Write-Host ""

# Check PostgreSQL
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlExists) {
    Write-Host "PostgreSQL not found. Using SQLite (file-based database)" -ForegroundColor Yellow
    Write-Host ""
    
    # Create .env for SQLite
    $secret = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    @"
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="$secret"
NEXTAUTH_URL="http://localhost:3000"
"@ | Set-Content .env
    
    Write-Host "Done! Using SQLite database" -ForegroundColor Green
} else {
    Write-Host "Enter your PostgreSQL password:" -ForegroundColor Yellow
    $password = Read-Host -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    
    # Create database
    $env:PGPASSWORD = $passwordPlain
    psql -U postgres -c "CREATE DATABASE bookmyvenue;" 2>$null
    
    # Create .env
    $secret = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    @"
DATABASE_URL="postgresql://postgres:$passwordPlain@localhost:5432/bookmyvenue?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="$secret"
NEXTAUTH_URL="http://localhost:3000"
"@ | Set-Content .env
    
    Write-Host "Done! PostgreSQL configured" -ForegroundColor Green
}

Write-Host ""
Write-Host "Setting up database..." -ForegroundColor Yellow
npx prisma generate
npx prisma db push --accept-data-loss
npm run db:seed

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
Write-Host "Open: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
npm run dev
