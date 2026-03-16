import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl wac-card p-8 sm:p-12">
        <h1 className="text-4xl font-serif tracking-tight font-bold mb-8 text-[var(--accent)]">
          Terms of Service
        </h1>

        <div className="prose prose-invert max-w-none opacity-80 space-y-6">
          <p>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using the World Albanian Congress networking
              platform, you accept and agree to be bound by the terms and
              provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Community Guidelines
            </h2>
            <p>
              Our platform is built for professional networking, community
              building, and collaboration within the global Albanian diaspora.
              Users agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide accurate information in their profiles.</li>
              <li>Maintain respectful and professional communication.</li>
              <li>
                Not use the platform for spam or unauthorized commercial
                solicitation.
              </li>
              <li>Not post discriminatory, offensive, or harmful content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              3. User Accounts
            </h2>
            <p>
              To access certain features of the platform, you must register for
              an account. You are responsible for maintaining the
              confidentiality of your account access via Magic Links and are
              fully responsible for all activities that occur under your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Privacy and Data
            </h2>
            <p>
              Your privacy is important to us. Information you share on your
              public profile will be visible to other authenticated users on the
              platform. By using the platform, you consent to the collection and
              use of this information as part of the directory networking
              services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Modifications
            </h2>
            <p>
              The World Albanian Congress reserves the right to modify or
              replace these Terms at any time. We will provide notice of any
              significant changes.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <Link
            href="/"
            className="inline-flex items-center text-[var(--accent)] hover:opacity-80 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
