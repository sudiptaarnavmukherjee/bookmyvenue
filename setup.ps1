# Interactive Setup Script for BookMyVenue
# This script will help you configure everything step by step

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BookMyVenue - Interactive Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
Write-Host "Checking for PostgreSQL..." -ForegroundColor Yellow
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlExists) {
    Write-Host ""
    Write-Host "❌ PostgreSQL is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "OPTION 1: Use SQLite (Quick & Easy - No setup needed)" -ForegroundColor Green
    Write-Host "  - No installation required" -ForegroundColor Gray
    Write-Host "  - File-based database" -ForegroundColor Gray
    Write-Host "  - Perfect for development" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OPTION 2: Install PostgreSQL (Production-like)" -ForegroundColor Yellow
    Write-Host "  - Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "  - Better for production" -ForegroundColor Gray
    Write-Host ""
    $choice = Read-Host "Choose option (1 for SQLite, 2 to exit and install PostgreSQL)"
    
    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "✓ Using SQLite (file-based database)" -ForegroundColor Green
        
        # Create .env for SQLite
        $envContent = @"
# Database Connection (SQLite - No setup needed!)
DATABASE_URL="file:./dev.db"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# NextAuth Configuration
NEXTAUTH_SECRET="$((-join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})))"
NEXTAUTH_URL="http://localhost:3000"
"@
        Set-Content -Path ".env" -Value $envContent
        Write-Host "✓ .env file configured for SQLite" -ForegroundColor Green
        
    } else {
        Write-Host ""
        Write-Host "Please install PostgreSQL first, then run this script again" -ForegroundColor Yellow
        Write-Host "Download: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
        exit 0
    }
    
} else {
    Write-Host "✓ PostgreSQL found" -ForegroundColor Green
    Write-Host ""
    
    # PostgreSQL setup
    Write-Host "Let's configure PostgreSQL..." -ForegroundColor Yellow
    Write-Host ""
    
    $dbPassword = Read-Host "Enter your PostgreSQL password (the one you set during installation)" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
    
    # Test connection
    Write-Host ""
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    
    $env:PGPASSWORD = $dbPasswordPlain
    $testConnection = psql -U postgres -c "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connected to PostgreSQL successfully" -ForegroundColor Green
        
        # Check if database exists
        Write-Host "Checking if 'bookmyvenue' database exists..." -ForegroundColor Yellow
        $dbExists = psql -U postgres -lqt 2>&1 | Select-String -Pattern "bookmyvenue" -Quiet
        
        if (-not $dbExists) {
            Write-Host "Creating 'bookmyvenue' database..." -ForegroundColor Yellow
            psql -U postgres -c "CREATE DATABASE bookmyvenue;" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Database 'bookmyvenue' created" -ForegroundColor Green
            }
        } else {
            Write-Host "✓ Database 'bookmyvenue' already exists" -ForegroundColor Green
        }
        
        # Create .env
        $envContent = @"
# Database Connection
DATABASE_URL="postgresql://postgres:$dbPasswordPlain@localhost:5432/bookmyvenue?schema=public"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# NextAuth Configuration
NEXTAUTH_SECRET="$((-join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})))"
NEXTAUTH_URL="http://localhost:3000"
"@
        Set-Content -Path ".env" -Value $envContent
        Write-Host "✓ .env file configured" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Failed to connect to PostgreSQL" -ForegroundColor Red
        Write-Host "Please check your password and try again" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting Up Database Tables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Generate Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Push database schema
Write-Host "Creating database tables..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database tables created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create tables" -ForegroundColor Red
    Write-Host "Run 'npx prisma db push' manually to see the error" -ForegroundColor Yellow
    exit 1
}

# Seed database
Write-Host "Adding sample data..." -ForegroundColor Yellow
npm run db:seed 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Sample data added" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: Could not add sample data" -ForegroundColor Yellow
    Write-Host "  You can add it manually later with: npm run db:seed" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Once running, open: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm run dev
