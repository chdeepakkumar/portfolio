# Resume Resources

This folder contains static resume PDF files that are bundled with the application.

## File Structure

- `DeepakKumarChResume.pdf` - Static resume PDF file (bundled with build)

## Note on Resume Storage

**Two ways to manage resumes:**

1. **Static Resume (this folder)**: 
   - Files in `public/resources/` are bundled with the build
   - Good for initial/default resume
   - Requires rebuild to update

2. **Dynamic Resume Upload (Admin Panel)**:
   - Upload resumes via Admin Panel → Resume Editor
   - Stored in persistent storage (Vercel Blob on Vercel, file system locally)
   - Persists across deployments
   - No rebuild needed
   - **Recommended for production use**

## Updating Your Resume

### Option 1: Via Admin Panel (Recommended)
1. Login to Admin Panel
2. Go to Resume Editor
3. Upload your new resume PDF
4. Set it as active
5. Changes persist across deployments

### Option 2: Static File (Requires Rebuild)
1. Replace `DeepakKumarChResume.pdf` with your new resume PDF file
2. Keep the same filename: `DeepakKumarChResume.pdf`
3. Rebuild the site: `npm run build`
4. Users can also reload the resume data using the reload button (🔄) in the chatbot interface

The chatbot uses knowledge files (uploaded via Admin Panel) and can reference resume content to answer questions about your background.

