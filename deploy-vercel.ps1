# Vercel Deployment Script for BookMyVenue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BookMyVenue - Vercel Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✓ Vercel CLI installed" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Starting deployment process..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Login to Vercel
Write-Host "[Step 1/5] Login to Vercel" -ForegroundColor Cyan
Write-Host "Opening browser for authentication..." -ForegroundColor Gray
vercel login

Write-Host ""
Write-Host "✓ Logged in to Vercel" -ForegroundColor Green
Write-Host ""

# Step 2: Create Vercel Postgres Database
Write-Host "[Step 2/5] Database Setup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose your option:" -ForegroundColor Yellow
Write-Host "1. Create NEW Vercel Postgres database" -ForegroundColor White
Write-Host "2. I already have a database (skip)" -ForegroundColor White
Write-Host ""
$dbChoice = Read-Host "Enter choice (1 or 2)"

if ($dbChoice -eq "1") {
    Write-Host ""
    Write-Host "Creating Vercel Postgres database..." -ForegroundColor Yellow
    vercel postgres create bookmyvenue-db
    
    Write-Host ""
    Write-Host "✓ Database created!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Copy the connection string shown above" -ForegroundColor Yellow
    Write-Host "and update it in your .env file as DATABASE_URL" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter after updating .env file"
} else {
    Write-Host "✓ Skipping database creation" -ForegroundColor Green
}

Write-Host ""

# Step 3: Generate Prisma Client
Write-Host "[Step 3/5] Generating Prisma Client" -ForegroundColor Cyan
npx prisma generate
Write-Host "✓ Prisma Client generated" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy to Vercel
Write-Host "[Step 4/5] Deploying to Vercel" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose deployment type:" -ForegroundColor Yellow
Write-Host "1. Preview (test deployment)" -ForegroundColor White
Write-Host "2. Production (live deployment)" -ForegroundColor White
Write-Host ""
$deployChoice = Read-Host "Enter choice (1 or 2)"

Write-Host ""
Write-Host "Deploying..." -ForegroundColor Yellow

if ($deployChoice -eq "2") {
    vercel --prod
} else {
    vercel
}

Write-Host ""
Write-Host "✓ Deployment complete!" -ForegroundColor Green
Write-Host ""

# Step 5: Set up database tables
Write-Host "[Step 5/5] Database Setup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Do you want to push database schema now? (y/n)" -ForegroundColor Yellow
$pushDb = Read-Host

if ($pushDb -eq "y" -or $pushDb -eq "Y") {
    Write-Host ""
    Write-Host "Pushing database schema..." -ForegroundColor Yellow
    npx prisma db push
    
    Write-Host ""
    Write-Host "Do you want to seed sample data? (y/n)" -ForegroundColor Yellow
    $seedDb = Read-Host
    
    if ($seedDb -eq "y" -or $seedDb -eq "Y") {
        npm run db:seed
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check your deployment at the URL shown above" -ForegroundColor White
Write-Host "2. Test login functionality" -ForegroundColor White
Write-Host "3. Configure custom domain (optional)" -ForegroundColor White
Write-Host "4. Add environment variables in Vercel Dashboard" -ForegroundColor White
Write-Host ""
Write-Host "View your project: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
