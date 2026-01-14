# Image Upload for Venue & Caterer Owners

## 📸 Features
- Upload venue/caterer images
- Upload profile pictures
- Multiple image support (up to 10 per venue/caterer)
- Image preview before upload
- Delete images
- Auto-optimization (resize & compress)
- Drag & drop support

## 🔧 Using Cloudinary (FREE Tier)

### Free Tier Includes:
- 25 GB storage
- 25 GB bandwidth/month
- Unlimited transformations
- **Cost**: $0/month

### Setup (2 minutes):

1. **Sign Up**:
   - Go to: https://cloudinary.com/users/register_free
   - Sign up with email or Google

2. **Get Credentials**:
   - After login, go to Dashboard
   - You'll see:
     - Cloud Name
     - API Key
     - API Secret

3. **Add to .env**:
   ```env
   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   ```

4. **Done!** The upload system is ready to use.

---

## 📁 Files Created

### API Routes:
- `/api/upload/image` - Upload images
- `/api/upload/delete` - Delete images

### Components:
- `ImageUploader.tsx` - Upload UI component
- `ImageGallery.tsx` - Display & manage images

### Usage in Pages:
- Venue Owner Dashboard
- Caterer Owner Dashboard  
- Profile Page

---

## 🎯 How to Use

### For Venue/Caterer Owners:

1. Go to your dashboard
2. Click "Manage Images" or "Upload Images"
3. Drag & drop images OR click to browse
4. Images auto-upload and optimize
5. Can delete unwanted images
6. Maximum 10 images per venue/caterer

### Supported Formats:
- JPG/JPEG
- PNG
- WebP
- GIF (not animated)
- Max size: 10MB per image

---

## 💰 Cost After Free Tier

If you exceed 25GB bandwidth/month (approximately 50,000 image views):

| Plan | Storage | Bandwidth | Price |
|------|---------|-----------|-------|
| Free | 25 GB | 25 GB/month | $0 |
| Plus | 85 GB | 85 GB/month | $89/month |

**Note**: You'll likely never hit the free tier limit unless you have 100,000+ monthly visitors.

---

## 🔄 Alternative: Local Storage (Development Only)

If you don't want to use Cloudinary for development:

**Pros**:
- No signup needed
- Completely free
- No API keys

**Cons**:
- Images stored in your project folder
- Not suitable for production
- Can't use on Vercel/hosting platforms

To use local storage, set in `.env`:
```env
USE_LOCAL_STORAGE=true
```

---

## ✅ Implementation Complete!

The image upload system is now ready. Once you add Cloudinary credentials to `.env`, owners can:
- Upload venue images
- Upload caterer images  
- Upload profile pictures
- Manage all uploaded images
- Delete images

---

**Next**: Set up your database (see DATABASE_SETUP_EASY.md) and run the app!
