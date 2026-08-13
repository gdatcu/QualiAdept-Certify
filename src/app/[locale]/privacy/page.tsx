import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politica de Confidențialitate | QualiAdept',
  description: 'Politica de confidențialitate și protecția datelor cu caracter personal conform GDPR pe platforma QualiAdept.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <span>← Înapoi la Platformă</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              Q
            </div>
            <span className="font-semibold text-zinc-100 text-xs sm:text-sm font-mono">
              QualiAdept GDPR
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto w-full flex-1 px-4 sm:px-6 md:px-8 py-8 sm:py-12 flex flex-col gap-8">
        <section className="border-b border-zinc-800 pb-6">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60 inline-block mb-3">
            Protecția Datelor (GDPR Compliance)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-50 tracking-tight">
            Politica de Confidențialitate
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-2">
            Ultima actualizare: 13 August 2026 &bull; QualiAdept Platform (`qualiadept.eu`)
          </p>
        </section>

        <article className="prose prose-invert max-w-none text-sm text-zinc-300 leading-relaxed flex flex-col gap-6 font-sans">
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
              <span className="text-emerald-400">1.</span> Colectarea Datelor cu Caracter Personal
            </h2>
            <p>
              QualiAdept colectează și prelucrează date cu caracter personal exclusiv în scopul furnizării serviciilor educaționale și de evaluare automată a codului QA. Colectarea datelor se realizează prin intermediul autentificării securizate <strong>GitHub OAuth</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 font-mono text-xs pl-2">
              <li>Numele complet și numele de utilizator GitHub</li>
              <li>Adresa de email publică sau asociată contului GitHub</li>
              <li>Fotografia de profil (avatar) furnizată de GitHub</li>
              <li>Identificatorul unic (User ID) atribuit de platformă</li>
            </ul>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
              <span className="text-emerald-400">2.</span> Utilizarea Datelor și Stocarea Codului
            </h2>
            <p>
              Datele colectate sunt utilizate pentru:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 font-mono text-xs pl-2">
              <li>Autentificarea securizată și gestionarea sesiunilor de utilizator</li>
              <li>Evaluarea automată a temelor (Cod HTML, selectori Playwright, scripturi de testare)</li>
              <li>Afișarea istoricului de trimiteri și generarea Portofoliului Public Verificabil</li>
              <li>Prevenirea atacurilor cibernetice și a încercărilor neautorizate de acces</li>
            </ul>
            <p className="text-xs text-zinc-400 mt-2">
              Codul trimis pentru evaluare este salvat în baza de date securizată a platformei și asociat contului dvs. pentru a vă permite vizualizarea evoluției tehnice.
            </p>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
              <span className="text-emerald-400">3.</span> Fișierele Cookie și Stocarea Locală (LocalStorage)
            </h2>
            <p>
              Platforma QualiAdept utilizează cookie-uri esențiale și tehnologii de stocare locală:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 font-mono text-xs pl-2">
              <li><strong>Cookie-uri de sesiune NextAuth (JWT):</strong> Necesare pentru menținerea autentificării active.</li>
              <li><strong>Browser LocalStorage:</strong> Utilizat pentru salvarea automată a schițelor de cod din editor (Draft Data Retention) în cazul întreruperilor de rețea.</li>
            </ul>
            <p className="text-xs text-zinc-400 mt-2">
              Nu folosim cookie-uri de urmărire terțe în scopuri de marketing sau promovare comercială.
            </p>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
              <span className="text-emerald-400">4.</span> Drepturile Dvs. conform Regulamentului GDPR
            </h2>
            <p>
              În calitate de utilizator înregistrat, beneficiați de următoarele drepturi garantate de Regulamentul General privind Protecția Datelor (GDPR):
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 font-mono text-xs pl-2">
              <li><strong>Dreptul de Acces:</strong> Puteți solicita o copie a datelor cu caracter personal stocate.</li>
              <li><strong>Dreptul la Rectificare:</strong> Puteți modifica informațiile din profilul public în orice moment.</li>
              <li><strong>Dreptul la Ștergere (&quot;Dreptul de a fi uitat&quot;):</strong> Puteți solicita ștergerea integrală a contului, temelor și portofoliului dvs.</li>
              <li><strong>Control asupra Portofoliului Public:</strong> Puteți seta profilul pe mod privat din panoul de configurare al contului.</li>
            </ul>
          </section>

          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
              <span className="text-emerald-400">5.</span> Contact și Solicitări GDPR
            </h2>
            <p>
              Pentru exercitarea drepturilor dvs. sau pentru orice întrebări legate de protecția datelor, ne puteți contacta la adresa de email: <code className="text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-mono">privacy@qualiadept.eu</code> sau prin intermediul domeniului oficial <code className="text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-mono">qualiadept.eu</code>.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
