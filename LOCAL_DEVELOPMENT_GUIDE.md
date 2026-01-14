# 🚀 Local Development Guide - Start Here!

This guide will help you run BookMyVenue on your computer in **5 minutes** without any external services.

## Why Test Locally First?

✅ **No account creation needed** - No Vercel, no database signup  
✅ **Instant feedback** - See changes immediately  
✅ **Free forever** - Uses SQLite (built into your app)  
✅ **Easy to reset** - Delete database file, start fresh  

Once you're happy with local testing, we'll deploy to Vercel.

---

## 📋 Prerequisites (You Already Have These!)

- ✅ Node.js installed
- ✅ Project files downloaded
- ✅ npm packages installed

---

## 🎯 Quick Start (3 Steps)

### Step 1: Setup Local Database

Open PowerShell in your project folder and run:

```powershell
.\start.ps1
```

**What this does:**
- Creates a local SQLite database (a single file)
- Sets up all tables (users, venues, bookings, etc.)
- Adds sample data so you can test immediately

**Expected output:**
```
✓ Database file created
✓ Tables created
✓ Sample data added
✓ Ready to start!
```

### Step 2: Start Development Server

The script automatically starts the server. If not, run:

```powershell
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000
- Local:   http://localhost:3000
```

### Step 3: Open Your Browser

Visit: http://localhost:3000

**Test login with sample account:**
- Email: `user@test.com`
- Password: `password123`

---

## 🎉 What You Can Test Locally

### As a Regular User:
1. ✅ Browse venues and caterers
2. ✅ Search by location, capacity, price
3. ✅ View venue details with photos
4. ✅ Add venues to wishlist
5. ✅ Create bookings
6. ✅ View your trips/bookings
7. ✅ Cancel bookings

### As a Venue Owner:
1. ✅ Add new venues
2. ✅ Manage your venues
3. ✅ View bookings for your venues
4. ✅ Check availability calendar
5. ✅ Block dates

### As a Caterer:
1. ✅ Add catering services
2. ✅ Manage menu items
3. ✅ View catering bookings

---

## 🔧 Common Issues & Solutions

### Issue 1: `npm run dev` shows database error

**Solution:**
```powershell
# Delete old database and recreate
Remove-Item .\prisma\dev.db -ErrorAction SilentlyContinue
npx prisma db push
npm run db:seed
npm run dev
```

### Issue 2: Port 3000 already in use

**Error:** `Port 3000 is already in use`

**Solution:**
```powershell
# Find and kill process on port 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
}
npm run dev
```

### Issue 3: Prisma Client not generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```powershell
npx prisma generate
npm run dev
```

### Issue 4: Module not found errors

**Solution:**
```powershell
# Clean install
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
npm run dev
```

---

## 📁 Your Local Database

**Location:** `c:\Bookmyvenue\prisma\dev.db`

**What is SQLite?**
- A single file database (like an Excel file)
- No server needed
- Perfect for development
- Used by apps like WhatsApp, Apple Mail, Firefox

**Database Management:**

```powershell
# View database in browser
npx prisma studio
```

Opens at http://localhost:5555 - you can:
- See all tables
- Add/edit/delete records
- View relationships
- Export data

**Reset database:**
```powershell
Remove-Item .\prisma\dev.db
npx prisma db push
npm run db:seed
```

---

## 🎨 Making Changes & Testing

### 1. Edit Code
Change any file in `src/` folder

### 2. See Changes Instantly
Next.js auto-refreshes the browser (Hot Reload)

### 3. Check Database Changes
```powershell
npx prisma studio
```

### 4. View Logs
Check the terminal where `npm run dev` is running

---

## 📊 Sample Data Included

After running `npm run db:seed`, you get:

### Test Accounts:

| Email | Password | Role |
|-------|----------|------|
| user@test.com | password123 | User |
| owner@test.com | password123 | Venue Owner |
| caterer@test.com | password123 | Caterer |

### Sample Venues:
- The Grand Ballroom (Kolkata)
- Riverside Garden (Kolkata)
- 5 more venues with photos

### Sample Caterers:
- Royal Caterers (Kolkata)
- Tasty Bites (Kolkata)
- 3 more caterers

---

## 🚀 Next Steps After Local Testing

Once you're satisfied with local testing:

### Option 1: Deploy to Vercel (Recommended)
```powershell
.\deploy-vercel.ps1
```

Follow the [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) for complete instructions.

### Option 2: Continue Local Development

Keep working locally until you're ready to go live. You can:
- Add features
- Test with friends
- Build complete functionality
- Deploy when ready

---

## 💡 Development Tips

### 1. Keep Terminal Open
Don't close the terminal running `npm run dev` - you'll see errors/logs here

### 2. Browser DevTools
Press `F12` in browser to see:
- Console errors
- Network requests
- Component structure

### 3. File Changes
- Edit files in `src/app/` for pages
- Edit files in `src/components/` for UI components
- Changes appear instantly in browser

### 4. Database Changes
After changing `schema.prisma`:
```powershell
npx prisma db push
npx prisma generate
```

### 5. Fresh Start Anytime
```powershell
# Complete reset
Remove-Item .\prisma\dev.db -ErrorAction SilentlyContinue
npx prisma db push
npm run db:seed
```

---

## ❓ When to Use What

### Use Local Development When:
- ✅ Learning the app
- ✅ Testing new features
- ✅ Making frequent changes
- ✅ No internet available
- ✅ Want to experiment safely

### Deploy to Vercel When:
- ✅ Ready to show others
- ✅ Want public URL
- ✅ Testing on mobile devices
- ✅ Ready to collect real bookings
- ✅ Want to start earning

---

## 🆘 Need Help?

### Quick Checks:

1. **Is Node.js installed?**
   ```powershell
   node --version
   ```
   Should show: v18.x.x or higher

2. **Are packages installed?**
   ```powershell
   Test-Path .\node_modules
   ```
   Should return: True

3. **Is database file present?**
   ```powershell
   Test-Path .\prisma\dev.db
   ```
   Should return: True after first setup

### Still Stuck?

Run this diagnostic:
```powershell
Write-Host "Node Version: $(node --version)"
Write-Host "npm Version: $(npm --version)"
Write-Host "Project Folder: $PWD"
Write-Host "Package.json exists: $(Test-Path .\package.json)"
Write-Host "node_modules exists: $(Test-Path .\node_modules)"
Write-Host "Database exists: $(Test-Path .\prisma\dev.db)"
Write-Host ".env exists: $(Test-Path .\.env)"
```

Copy the output and we'll debug together!

---

## 🎯 Your Local Development Checklist

- [ ] Run `.\start.ps1`
- [ ] See "ready" message in terminal
- [ ] Open http://localhost:3000
- [ ] Login with test account
- [ ] Browse venues
- [ ] Create a test booking
- [ ] View booking in trips page
- [ ] Open Prisma Studio to see database

**All working? 🎉 You're ready to develop!**

**Not working?** Check "Common Issues" section above or run diagnostic.

---

## 📚 Related Guides

- [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) - Deploy to production
- [DATABASE_SETUP_EASY.md](DATABASE_SETUP_EASY.md) - Cloud database options
- [IMAGE_UPLOAD_GUIDE.md](IMAGE_UPLOAD_GUIDE.md) - Enable photo uploads
- [PRODUCTION_ROADMAP.md](PRODUCTION_ROADMAP.md) - Remaining features

---

Happy coding! 🚀
