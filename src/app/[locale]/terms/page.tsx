import type { Metadata } from 'next';
import { Link } from '@/i18n/routing';

export const metadata: Metadata = {
  title: 'Terms of Service | QualiAdept',
  description: 'Terms of service and usage policy for the QualiAdept auto-validation platform.',
};

function TermsRO() {
  return (
    <>
      <section className="border-b border-zinc-800 pb-6">
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/60 inline-block mb-3">
          Acord Legal de Utilizare
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-50 tracking-tight">
          Termeni și Condiții de Utilizare
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-2">
          Ultima actualizare: 13 August 2026 &bull; QualiAdept Platform (`qualiadept.eu`)
        </p>
      </section>

      <article className="prose prose-invert max-w-none text-sm text-zinc-300 leading-relaxed flex flex-col gap-6 font-sans">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">1.</span> Acceptarea Termenilor
          </h2>
          <p>
            Prin accesarea, autentificarea și utilizarea platformei <strong>QualiAdept</strong> (`qualiadept.eu`), sunteți de acord să respectați în întregime acești Termeni și Condiții. Dacă nu sunteți de acord cu acești termeni, vă rugăm să nu utilizați serviciile platformei.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">2.</span> Reguli de Utilizare a Platformei
          </h2>
          <p>
            Platforma QualiAdept este destinată pregătirii și evaluării tehnice în domeniul QA Automation (HTML, CSS, Playwright E2E). Utilizatorii se obligă să respecte următoarele reguli:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 font-mono text-xs pl-2">
            <li>Să nu încerce executarea de cod malțios sau atacuri de tip Denial of Service (DoS/DDoS) asupra infrastructurii.</li>
            <li>Să nu distribuie codul de acces privat (Enrollment Token) către persoane neînregistrate în curs.</li>
            <li>Să nu încerce ocolirea sistemelor de securitate, a rate-limiting-ului sau a verificării de autentificare.</li>
            <li>Să utilizeze un limbaj adecvat și profesional în cadrul profilului public.</li>
          </ul>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">3.</span> Proprietatea Intelectuală
          </h2>
          <p>
            Întregul conținut al platformei, inclusiv dar fără a se limita la: arhitectura motorului de evaluare automată (Cheerio &amp; Playwright Integration Engine), interfața grafică, textele modulare ale cerințelor și codul sursă proprietary al aplicației QualiAdept sunt protejate de legile privind dreptul de autor și proprietatea intelectuală.
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Codul trimis de studenți pentru rezolvarea temelor rămâne proprietatea autorilor respectivi, însă QualiAdept primește o licență neexclusivă de a stoca, procesa și afișa codul în cadrul Portofoliului Public Verificabil.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">4.</span> Limitarea Răspunderii
          </h2>
          <p>
            Platforma QualiAdept este furnizată &quot;așa cum este&quot; (&quot;as is&quot;), fără garanții explicite sau implicite privind disponibilitatea neîntreruptă. Echipa QualiAdept nu este răspunzătoare pentru eventualele pierderi temporare de date cauzate de întreruperi ale furnizorilor de cloud (Vercel, Supabase, Neon).
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">5.</span> Modificări ale Termenilor și Contact
          </h2>
          <p>
            QualiAdept își rezervă dreptul de a actualiza acești termeni în orice moment. Modificările devin efective imediat după publicarea pe această pagină. Pentru orice întrebări sau clarificări privind termenii de utilizare, vă rugăm să ne contactați la <code className="text-cyan-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-mono">legal@qualiadept.eu</code>.
          </p>
        </section>
      </article>
    </>
  );
}

function TermsEN() {
  return (
    <>
      <section className="border-b border-zinc-800 pb-6">
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/60 inline-block mb-3">
          Legal Terms of Service
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-50 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-2">
          Last updated: August 13, 2026 &bull; QualiAdept Platform (`qualiadept.eu`)
        </p>
      </section>

      <article className="prose prose-invert max-w-none text-sm text-zinc-300 leading-relaxed flex flex-col gap-6 font-sans">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">1.</span> Acceptance of Terms
          </h2>
          <p>
            By accessing, authenticating, and using the <strong>QualiAdept</strong> platform (`qualiadept.eu`), you agree to be fully bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use platform services.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">2.</span> Platform Usage Rules
          </h2>
          <p>
            QualiAdept is designed for practical training and technical assessment in QA Automation (HTML, CSS, Playwright E2E). Users undertake to strictly follow these rules:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 font-mono text-xs pl-2">
            <li>Refrain from attempting malicious code execution or Denial of Service (DoS/DDoS) attacks against infrastructure.</li>
            <li>Do not distribute private enrollment tokens to unregistered individuals.</li>
            <li>Do not attempt to bypass security systems, rate-limiting rules, or authentication checks.</li>
            <li>Maintain appropriate, professional language across public profile fields.</li>
          </ul>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">3.</span> Intellectual Property
          </h2>
          <p>
            All platform content, including but not limited to automated validation engine architecture (Cheerio &amp; Playwright Integration Engine), graphic interface, assignment descriptions, and proprietary source code are protected by copyright and intellectual property laws.
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Code submitted by students for assignments remains the intellectual property of their respective authors. QualiAdept receives a non-exclusive license to store, process, and display code within the Verifiable Public Portfolio.
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">4.</span> Limitation of Liability
          </h2>
          <p>
            The QualiAdept platform is provided &quot;as is&quot;, without explicit or implicit warranties of uninterrupted availability. The QualiAdept team is not liable for temporary data unavailability caused by third-party cloud service provider disruptions (Vercel, Supabase, Neon).
          </p>
        </section>

        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
            <span className="text-cyan-400">5.</span> Terms Modifications and Contact
          </h2>
          <p>
            QualiAdept reserves the right to update these terms at any time. Modifications take effect immediately upon publication. For questions regarding terms of use, contact us at <code className="text-cyan-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-mono">legal@qualiadept.eu</code>.
          </p>
        </section>
      </article>
    </>
  );
}

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <span>{locale === 'ro' ? '← Înapoi la Platformă' : '← Back to Platform'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              Q
            </div>
            <span className="font-semibold text-zinc-100 text-xs sm:text-sm font-mono">
              QualiAdept Legal
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto w-full flex-1 px-4 sm:px-6 md:px-8 py-8 sm:py-12 flex flex-col gap-8">
        {locale === 'ro' ? <TermsRO /> : <TermsEN />}
      </main>
    </div>
  );
}
