# SEO Setup Checklist

## Required Tasks

### 1. Create Images ⏳

#### Open Graph Image
- **File:** `/public/og-image.png`
- **Size:** 1200 x 630 pixels
- **Content:** 
  - Quinite Vantage logo
  - Tagline: "AI-Powered Call Automation Platform"
  - Background: Purple gradient (#9333ea)
- **Format:** PNG

#### App Icons (PWA)
- **File:** `/public/icon-192.png`
  - Size: 192 x 192 pixels
  - Format: PNG
  
- **File:** `/public/icon-512.png`
  - Size: 512 x 512 pixels
  - Format: PNG

#### Logo
- **File:** `/public/logo.png`
- **Size:** 256 x 256 pixels (or larger)
- **Format:** PNG with transparent background

#### Favicon
- **File:** `/public/favicon.ico`
- **Size:** 32 x 32 pixels
- **Format:** ICO

---

### 2. Update Environment Variables ⏳

Edit `.env` file:
```env
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com
```

Replace `your-actual-domain.com` with your real domain.

---

### 3. Google Search Console ⏳

1. Go to: https://search.google.com/search-console
2. Add your website
3. Verify ownership (get verification code)
4. Update `app/layout.js`:
   ```javascript
   verification: {
     google: 'paste-your-verification-code-here'
   }
   ```

---

### 4. Update Social Media Handles ⏳

In `app/layout.js`, update:
- Twitter: `@quinitevantage` → Your actual Twitter handle
- LinkedIn: `/company/quinitevantage` → Your actual LinkedIn page

---

### 5. Fix Layout.js ⏳

The SEO code needs to be added to `app/layout.js`. 

**Copy this entire file content:**

```javascript
import './globals.css'

export const metadata = {
  title: {
    default: 'Quinite Vantage - AI-Powered Call Automation Platform',
    template: '%s | Quinite Vantage'
  },
  description: 'Automate lead calling with AI agents. Qualify prospects intelligently and transfer interested leads to your team. TRAI compliant call automation for businesses in India.',
  keywords: [
    'AI call automation',
    'lead calling software',
    'automated calling India',
    'AI voice agent',
    'call center automation',
    'lead qualification',
    'Plivo integration',
    'OpenAI voice',
    'TRAI compliant calling',
    'business automation India'
  ],
  authors: [{ name: 'Quinite Vantage' }],
  creator: 'Quinite Vantage',
  publisher: 'Quinite Vantage',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  
  openGraph: {
    title: 'Quinite Vantage - AI-Powered Call Automation Platform',
    description: 'Automate lead calling with AI agents. Qualify prospects and transfer interested leads to your team.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'Quinite Vantage',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Quinite Vantage - AI-Powered Call Automation',
    description: 'Automate lead calling with AI agents. TRAI compliant for India.',
    images: ['/og-image.png'],
  },
  
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

**Replace the entire content of `app/layout.js` with the above.**

---

### 6. Test SEO ⏳

After completing above steps, test with:

1. **Lighthouse (Chrome DevTools)**
   - Press F12 → Lighthouse tab
   - Run SEO audit
   - Target: 90+ score

2. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Enter your domain
   - Check Open Graph preview

3. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Check Twitter card preview

---

## Quick Summary

**Must Do:**
1. ✅ Create 5 images (og-image, 2 icons, logo, favicon)
2. ✅ Update NEXT_PUBLIC_SITE_URL in .env
3. ✅ Replace app/layout.js content
4. ✅ Get Google verification code
5. ✅ Test with Lighthouse

**Optional:**
- Submit sitemap to Google Search Console
- Update social media handles
- Add more structured data

---

## Image Creation Tools

**Free Tools:**
- Canva: https://canva.com
- Figma: https://figma.com
- GIMP: https://gimp.org

**Quick Tip:** Use Canva templates for social media images!
