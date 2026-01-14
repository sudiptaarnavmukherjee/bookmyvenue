# 📋 ShubhSpace - Installation Checklist

Use this checklist to ensure everything is set up correctly.

## ✅ Pre-Installation

- [ ] Node.js 18.x or higher installed
- [ ] npm or yarn package manager
- [ ] VS Code or preferred editor
- [ ] At least 500MB free disk space
- [ ] Git installed (optional, for version control)

## ✅ Project Setup

- [x] **Project files created** - All files scaffolded
- [x] **Configuration files ready** - next.config.ts, tsconfig.json, tailwind.config.ts
- [x] **Prisma schema defined** - Complete database models
- [x] **Component library created** - VenueCard, CatererCard, MobileNav, ModeToggle
- [x] **Documentation written** - README, SETUP, DEV_NOTES, etc.

## ⚠️ Installation Steps (DO THIS NOW)

### Step 1: Install Dependencies
```bash
cd C:\Bookmyvenue
npm install
```

**If errors occur:**
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

- [ ] Dependencies installed successfully
- [ ] No error messages
- [ ] `node_modules/` folder created

### Step 2: Database Setup

#### Option A: Supabase (Recommended)
1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Copy database URL from Settings → Database

- [ ] Supabase account created
- [ ] Project created
- [ ] Database URL copied

#### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb shubhspace`
3. Note your connection details

- [ ] PostgreSQL installed
- [ ] Database created
- [ ] Connection string ready

### Step 3: Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
DATABASE_URL="postgresql://user:password@host:5432/shubhspace"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] `.env` file created
- [ ] DATABASE_URL added
- [ ] NEXT_PUBLIC_APP_URL added

### Step 4: Prisma Setup
```bash
npx prisma generate
npx prisma db push
```

- [ ] Prisma Client generated
- [ ] Schema pushed to database
- [ ] No migration errors

### Step 5: Run Development Server
```bash
npm run dev
```

- [ ] Server started successfully
- [ ] No compilation errors
- [ ] Accessible at http://localhost:3000

## ✅ Verification Tests

Open http://localhost:3000 and verify:

### Home Page
- [ ] Page loads without errors
- [ ] "ShubhSpace" header visible
- [ ] Mode toggle works (Venues ↔ Catering)
- [ ] Search bars visible
- [ ] Venue cards display (in Venues mode)
- [ ] Caterer cards display (in Catering mode)
- [ ] Images load correctly
- [ ] Bottom navigation visible on mobile (resize browser)

### Navigation
- [ ] Click "Wishlist" tab → Navigates to /wishlist
- [ ] Click "Trips" tab → Navigates to /trips
- [ ] Click "Profile" tab → Navigates to /profile
- [ ] Active tab highlighted in rose color
- [ ] Can return to Home

### Responsive Design
- [ ] Desktop view (> 1024px): 3 columns, no bottom nav
- [ ] Tablet view (768-1024px): 2 columns, no bottom nav
- [ ] Mobile view (< 768px): 1 column, bottom nav visible

### Animations
- [ ] Mode toggle switch is smooth
- [ ] Cards have hover effect (lift on hover)
- [ ] Page transitions are smooth

## ✅ Optional: Prisma Studio
```bash
npx prisma studio
```

- [ ] Prisma Studio opens at http://localhost:5555
- [ ] Can see all database tables
- [ ] Tables are empty (ready for data)

## 🔧 Troubleshooting

### Error: "Cannot find module 'next'"
**Solution**: Dependencies not installed
```bash
npm install
```

### Error: "Prisma Client not found"
**Solution**: Generate Prisma Client
```bash
npx prisma generate
```

### Error: "Database connection failed"
**Solution**: Check DATABASE_URL in .env
- Ensure database is running
- Verify connection string format
- Check username/password

### Error: "Port 3000 already in use"
**Solution**: Use different port
```bash
npm run dev -- -p 3001
```

### Error: "Out of memory" during npm install
**Solution**: Increase Node memory
```bash
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm install
```

## 📦 Installed Packages

After `npm install`, verify these are installed:

### Core Dependencies
- [ ] next (15.x)
- [ ] react (19.x)
- [ ] react-dom (19.x)

### Database
- [ ] @prisma/client
- [ ] prisma (devDependency)

### UI & Animations
- [ ] framer-motion
- [ ] lucide-react
- [ ] tailwindcss
- [ ] tailwindcss-animate

### Utilities
- [ ] clsx
- [ ] tailwind-merge
- [ ] class-variance-authority
- [ ] zod

### TypeScript
- [ ] typescript
- [ ] @types/node
- [ ] @types/react
- [ ] @types/react-dom

## 🎯 Next Steps After Installation

Once everything is checked:

1. **Explore the Application**
   - [ ] Browse venue listings
   - [ ] Switch to catering mode
   - [ ] Test navigation
   - [ ] Check mobile responsive view

2. **Review Documentation**
   - [ ] Read [GETTING_STARTED.md](GETTING_STARTED.md)
   - [ ] Review [DEV_NOTES.md](DEV_NOTES.md) for architecture
   - [ ] Check [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for file layout
   - [ ] Reference [DESIGN_GUIDE.md](DESIGN_GUIDE.md) for UI components

3. **Start Development**
   - [ ] Create a new Git branch for your work
   - [ ] Choose a feature to build (see DEV_NOTES.md sprint plan)
   - [ ] Start coding!

## 🎉 Success Criteria

You're ready to develop when:

- ✅ All checkboxes above are marked
- ✅ Development server runs without errors
- ✅ Home page displays correctly
- ✅ Navigation works
- ✅ Database connection is established
- ✅ You can modify files and see hot-reload

## 📞 Need Help?

If you're stuck:

1. **Check error messages** - They often contain the solution
2. **Review documentation** - README.md, SETUP.md
3. **Verify environment** - Node version, disk space, database connection
4. **Clear cache** - `npm cache clean --force`
5. **Restart** - Stop dev server, clear .next folder, restart

## 🚀 You're All Set!

Once this checklist is complete, you have a fully functional development environment for ShubhSpace!

---

**Happy Coding! 🎊**

*Need to add this checklist to your project management tool? Copy it to Notion, Trello, or your preferred platform.*
