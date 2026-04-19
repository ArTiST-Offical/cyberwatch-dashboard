# CyberWatch Dashboard - Deployment on Vercel

## ✅ Status: Ready for Deployment

All errors have been fixed and the application has been successfully built locally. The repository now contains all necessary configuration files for Vercel deployment.

## Quick Start - Deploy to Vercel

### Option 1: Deploy Frontend Only (Easiest)

This deploys just the React dashboard to Vercel.

**Steps:**

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect this is a monorepo

3. **Configure Build Settings:**
   - **Framework:** Vite
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `artifacts/cyber-threat-dashboard/dist/public`
   - **Install Command:** `pnpm install`
   - **Node Version:** 20.x (recommended)

4. **Add Environment Variables:**
   - No additional environment variables are needed for frontend deployment

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your dashboard will be live at your Vercel domain

**Result:** Static React app with no backend API

---

### Option 2: Full Stack Deployment (Backend on Separate Service)

This deploys the frontend to Vercel and backend to a different service.

#### Step 1: Deploy Frontend to Vercel (same as Option 1)

#### Step 2: Deploy Backend to Render.com (Recommended)

1. **Create Render.com Account:**
   - Go to [https://render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Select your repository
   - Authorize Render to access GitHub

3. **Configure Service:**
   - **Name:** cyberwatch-api (or your preferred name)
   - **Environment:** Node 20
   - **Build Command:** `pnpm install && cd artifacts/api-server && npm run build`
   - **Start Command:** `cd artifacts/api-server && npm start`
   - **Plan:** Free or paid

4. **Set Environment Variables:**
   - Add `NODE_ENV` = `production`
   - Add any database connection strings if needed

5. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy your API

#### Step 3: Connect Frontend to Backend

Once backend is deployed, you'll have an API URL like `https://cyberwatch-api.onrender.com`

1. **In Vercel Dashboard:**
   - Go to your frontend project settings
   - Add Environment Variable: `VITE_API_URL` = `https://cyberwatch-api.onrender.com/api`

2. **Redeploy:**
   - Vercel will automatically redeploy with the new env var

3. **Test:**
   - Open your dashboard
   - Check that API calls work (threats should load, etc.)

---

## ✅ What Was Fixed

### 1. **Vite Configuration**
   - Made `PORT` and `BASE_PATH` optional with sensible defaults
   - Vite can now build without these environment variables

### 2. **TypeScript Errors**
   - Fixed RSS parser type issue with description field
   - Added missing `imageUrl` property to NewsArticle type
   - Fixed React Query hook type definitions
   - Added type declarations for react-simple-maps

### 3. **Dependencies**
   - Fixed platform-specific binary support for Apple Silicon Macs
   - Ensured rollup, lightningcss, and other native modules work on macOS ARM64

### 4. **Build Configuration**
   - Updated vercel.json for proper monorepo setup
   - Created .vercelignore to exclude unnecessary files
   - All package.json build scripts are properly configured

---

## 📝 Deployment Files Reference

### vercel.json
- Root configuration for Vercel deployment
- Specifies build command, output directory, and environment variables

### .vercelignore
- Tells Vercel which files/folders to skip during deployment
- Ignores server code, lock files, documentation, etc.

### VERCEL_DEPLOYMENT.md
- Comprehensive deployment guide (in repository root)
- Contains three deployment options and troubleshooting

### Fixed Files
- `artifacts/cyber-threat-dashboard/vite.config.ts` - Now has PORT/BASE_PATH defaults
- `pnpm-workspace.yaml` - Fixed to include ARM64 native modules
- `lib/api-client-react/src/generated/api.ts` - Fixed React Query hook types
- `lib/api-zod/src/generated/types/newsArticle.ts` - Added imageUrl property
- `artifacts/api-server/src/lib/realData.ts` - Fixed RSS parser type issue

---

## 🚀 After Deployment

### Test Your Application
1. Visit your Vercel deployment URL
2. Check that the dashboard loads
3. Navigate through different pages
4. Verify data is loading (if using Option 2 with backend)

### Monitor Performance
- Vercel Analytics shows build time, page load time, etc.
- Check Vercel Logs for any runtime errors

### Custom Domain (Optional)
- In Vercel dashboard, go to "Domains"
- Add your custom domain
- Configure DNS if needed

### Auto-Deployment
- Every push to main automatically redeploys
- Set up branch deployments for staging if desired

---

## ⚠️ Important Notes

### API Backend
- **Option 1 (Frontend Only):** Dashboard will have no live backend API
  - Threat data won't load
  - Use for demo/static view purposes
  
- **Option 2 (Full Stack):** Backend provides real data
  - Recommended for full functionality
  - Note: Render.com free tier shuts down after 15 minutes of inactivity
  - Upgrade to paid for always-on service

### Environment Variables
- Frontend uses `VITE_*` prefix for environment variables
- Backend uses standard NODE_ENV, DATABASE_URL, etc.
- Set these in respective dashboards (Vercel for frontend, Render for backend)

### Database
- Currently uses data fetching from external sources (RSS feeds, CVE databases)
- No database configuration needed out of the box
- Can add database later if needed

---

## 🆘 Troubleshooting

### Build Fails on Vercel
1. Check build logs in Vercel dashboard
2. Ensure `pnpm install` command works
3. Verify Node.js version is 18+ 

### Frontend loads but no API data
1. Check VITE_API_URL environment variable is set
2. Ensure backend is running
3. Check browser console (F12) for CORS errors
4. Verify backend service is accessible from Vercel

### Chunk Size Warnings
- Build succeeds despite warnings about chunk size
- These are only warnings, not errors
- Can optimize later if needed

### Module not found errors
- Clear Vercel cache and redeploy
- Ensure pnpm-lock.yaml is committed to git

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev)
- [Render.com Documentation](https://render.com/docs)

---

## Next Steps

1. **Choose deployment option** (frontend-only or full-stack)
2. **Push code to GitHub** - all fixes are already committed
3. **Create Vercel project** - follow steps above
4. **Deploy!** - Vercel will handle the rest
5. **Test your application** - verify everything works

---

**Good luck with your deployment! 🎉**

If you encounter any issues, check the troubleshooting section or review the Vercel/Render logs for specific error messages.
