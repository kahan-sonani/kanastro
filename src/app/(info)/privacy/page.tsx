import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Kanastro",
  description: "How Kanastro uses Google sign-in, birth profiles, and device storage.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p><small>Updated 15 November 2026</small></p>
      <p>Kanastro is operated by Kahan Sonani. This policy describes the data used by <a href="https://kanastro.kahansonani.com">kanastro.kahansonani.com</a>.</p>
      <h2>Google sign-in</h2>
      <p>When you choose Google sign-in, Google provides your account identifier, name, email address, and profile image URL if supplied. Supabase processes this information to authenticate you and maintain your Kanastro account. Kanastro displays your name and email and associates your saved profiles with your account ID.</p>
      <p>Kanastro requests only basic identity permissions: openid, email, and profile. It does not request access to your Gmail, Google Drive, Calendar, or contacts.</p>
      <h2>Birth profiles and calculations</h2>
      <p>Profiles contain the names, birth dates, birth times, locations, coordinates, time zones, time-accuracy choices, and notes you enter. Calculation preferences are also saved. These details are used to calculate, display, and compare charts.</p>
      <p>Without sign-in, profiles stay in this browser’s IndexedDB storage. Local profiles are not automatically uploaded when you sign in. When signed in, new or edited cloud profiles and account preferences are stored in Supabase. You can explicitly copy local profiles to your account.</p>
      <p>Chart calculations run on your device. Cloud profiles are restricted to their owning account through database access policies; they are not published to other users. Project administrators and infrastructure providers may have access needed to operate and support the service.</p>
      <h2>Service providers and storage</h2>
      <p>Vercel hosts the website, Supabase provides authentication and cloud storage, and Google provides sign-in and web fonts. These providers receive the information needed for those functions and may process technical request data, such as IP addresses, browser details, timestamps, and security logs. The cloud database is hosted in Singapore; infrastructure providers may process other service data internationally.</p>
      <p>Browser storage retains your sign-in session and interface preferences. Kanastro has no advertising, tracking-analytics, or AI-training integrations. Your Google account data and birth profiles are not sold or used for advertising.</p>
      <h2>Export, correction, and deletion</h2>
      <p>You can edit, export, and delete individual profiles in the app. Local data remains until you delete it or clear this site’s browser storage. Cloud profiles remain until deleted; signing out does not delete them. Downloaded exports are under your control.</p>
      <p>To request deletion of your Kanastro account or ask about your data, email <a href="mailto:kahansonani1008@gmail.com">kahansonani1008@gmail.com</a> from the account address. Account ownership must be verified before a deletion request is fulfilled. Operational logs and provider backups may have separate retention periods.</p>
      <p>You can also revoke Kanastro’s Google access in your <a href="https://myaccount.google.com/connections">Google Account connections</a>. Revoking access does not itself erase profiles already saved in Kanastro.</p>
      <h2>Changes and contact</h2>
      <p>Updates to this policy will appear here with a revised date. For privacy questions, contact <a href="mailto:kahansonani1008@gmail.com">kahansonani1008@gmail.com</a>.</p>
    </>
  );
}
