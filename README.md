# Caliversity 2nd Anniversary Board

A responsive, black-and-white event board. Members can post their name/nickname, item, optional category, and optional image/video. Posts appear in the shared gallery.

## Tech stack
- HTML, CSS and vanilla JavaScript
- Supabase Database + Storage (shared online backend)
- Vercel or Netlify for hosting

## 1. Install tools
1. Install [Visual Studio Code](https://code.visualstudio.com/).
2. In VS Code, install the **Live Server** extension (Ritwick Dey).
3. Create a free Supabase account at https://supabase.com and create a project.
4. Optional: install Git for Windows if you want to deploy through GitHub.

## 2. Connect Supabase
1. In Supabase, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` in VS Code, copy all its contents, paste into the SQL Editor and click **Run**.
3. In Supabase, open **Project Settings → API** (sometimes labelled **Data API / API Keys**).
4. Copy the **Project URL** and the **anon/public key**. The browser key may be labelled `anon` or `publishable`.
5. Open `js/config.js` and replace:
   - `YOUR_SUPABASE_PROJECT_URL`
   - `YOUR_SUPABASE_ANON_PUBLIC_KEY`
6. Save the file. Do not use the `service_role` or secret key in browser code. The anon/public key is expected to be visible; Row Level Security is what limits access.

## 3. Run on your Acer laptop
1. Extract the ZIP to a normal folder, for example `Documents/caliversity-anniversary`.
2. Open VS Code → **File → Open Folder** → select that folder.
3. Open `index.html`.
4. Right-click inside the editor and choose **Open with Live Server**.
5. Your browser opens a local preview. Submit a test item and confirm it appears in the showcase.
6. Test on your phone using the laptop's local network address shown by Live Server, with both devices on the same Wi-Fi. For phone testing, allow Live Server through Windows Firewall if prompted. This local address is only for testing, not the public Telegram link.

## 4. Deploy to get a shareable public link
### Option A — Vercel (recommended)
1. Create a GitHub account if you do not have one: https://github.com.
2. Create a new GitHub repository, e.g. `caliversity-anniversary`.
3. Upload the extracted project files (keep the folder structure).
4. Sign in at https://vercel.com using GitHub.
5. Choose **Add New → Project**, import the repository, and deploy. This is a static site: no build command is required and the output directory is the project root (`.`).
6. Vercel gives you a public HTTPS URL such as `https://your-project.vercel.app`.

### Option B — Netlify
1. Sign in at https://www.netlify.com.
2. Choose **Add new site → Deploy manually** and drag the project folder into the deploy area, or connect the GitHub repository.
3. Netlify gives you a public HTTPS URL.

## 5. Configure Telegram preview
After deployment:
1. Open `index.html`.
2. Replace `https://YOUR-DOMAIN/assets/preview-image.png` in both `og:image` and `twitter:image` with the full public URL of your deployed image, e.g. `https://your-project.vercel.app/assets/preview-image.png`.
3. Replace `YOUR-DOMAIN` only in those image URLs; the site itself uses relative asset paths.
4. Commit/push the updated file to GitHub, or redeploy the updated folder.
5. Paste the HTTPS website URL into a Telegram chat. Telegram may cache previews; use its link-preview refresh controls if available, or test with a changed URL/query string. Ensure the preview image URL opens directly in a browser.

## 6. Before sharing with the whole community
- Test a text-only post, each category, an image and a short MP4/WebM video.
- Test the site on a real phone and desktop.
- The board is public: anyone with the link can view posts and submit content. Uploaded media is public too.
- This starter project does not include member login, edit/delete, spam protection, CAPTCHA, or admin moderation. Since posts appear immediately, add CAPTCHA/rate limiting and a way to remove inappropriate posts before a large public launch.
- Never upload sensitive personal information. Ask members to upload only media they have permission to share.
- The anniversary date is not hard-coded because “this Sunday” needs confirming; edit the heading/copy in `index.html` if you want to display a specific date.

## Troubleshooting
- **“Connect your board”**: check the URL and anon/public key in `js/config.js`; save and refresh.
- **Posts fail**: confirm `schema.sql` ran successfully and the `anniversary_items` table exists.
- **Media upload fails**: check that the `anniversary-media` bucket exists and its file size/MIME settings match the SQL script.
- **Telegram has no preview**: use the deployed absolute image URL in Open Graph tags, make sure it is publicly reachable over HTTPS, and give Telegram time to refresh its cache.
- **Changes not showing**: hard refresh with Ctrl+F5 or wait for the deployment to finish.
