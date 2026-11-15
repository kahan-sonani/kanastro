import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use · Kanastro",
  description: "Use of Kanastro and its open-source astrology tools.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p><small>Updated 15 November 2026</small></p>
      <p>Kanastro is a free, open-source astrology application operated by Kahan Sonani. These terms describe use of the hosted service.</p>
      <h2>Using Kanastro</h2>
      <p>Use the service lawfully and only enter information you have permission to store. You are responsible for the birth details and notes you provide, protecting your account, and any files you export. Do not attempt to access other users’ records or disrupt the service.</p>
      <h2>Calculations and availability</h2>
      <p>Charts are tools for astrological study. Their results depend on the supplied birth details, time-zone data, selected calculation methods, and implemented conventions. No interpretation or predicted outcome is guaranteed.</p>
      <p>The hosted service is provided as available. Features and availability may change, and uninterrupted access or preservation of browser storage cannot be guaranteed. Keep exports of records you need. Nothing in these terms excludes rights that applicable law does not allow to be excluded.</p>
      <h2>Your data</h2>
      <p>Your profile content remains yours. Kanastro processes it to provide the functions described in the <a href="/privacy">Privacy Policy</a>. You can edit, export, and delete profiles, or contact us about account deletion.</p>
      <h2>Open source</h2>
      <p>The application’s source code is available under AGPL-3.0-or-later. Its license and dependency notices govern use and distribution of the software. <a href="/source/kanastro-source.tar.gz" download>Download the corresponding source</a> or view it on <a href="https://github.com/kahan-sonani/kanastro">GitHub</a>.</p>
      <h2>Contact</h2>
      <p>For support, privacy questions, or account requests, email <a href="mailto:kahansonani1008@gmail.com">kahansonani1008@gmail.com</a>.</p>
    </>
  );
}
