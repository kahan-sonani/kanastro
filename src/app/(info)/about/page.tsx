import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Kanastro",
  description: "Free, open-source Vedic astrology charts and profile comparison.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <h1>Kanastro</h1>
      <p>Free, open-source Vedic astrology charts, built by Kahan Sonani.</p>
      <ul>
        <li>North Indian kundlis and sixteen divisional charts, using Swiss Ephemeris with Lahiri and other ayanamsas.</li>
        <li>Planetary degrees, nakshatras, padas, Vimshottari periods, and core Parashari and Jaimini calculations.</li>
        <li>Named birth profiles and simple side-by-side chart comparison.</li>
      </ul>
      <h2>Your profiles</h2>
      <p>Use Kanastro without an account to save profiles on your device. Sign in with Google to save private profiles to your account and access them on other devices.</p>
      <p>Google sign-in supplies your basic account identity to authenticate you. Kanastro uses your name and email for your account; it does not request Gmail, Drive, Calendar, or contacts access.</p>
      <p><a href="/">Open Kanastro ↗</a></p>
      <h2>Methods and source</h2>
      <p>Calculations run in your browser. Traditions and calculation settings can produce different results; implemented methods and remaining features are documented in the <a href="https://github.com/kahan-sonani/kanastro/blob/main/METHODS.md">calculation reference</a> and <a href="https://github.com/kahan-sonani/kanastro">source repository</a>.</p>
      <h2>Contact</h2>
      <p><a href="mailto:kahansonani1008@gmail.com">kahansonani1008@gmail.com</a></p>
      <p>Read the <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Use</a>.</p>
    </>
  );
}
