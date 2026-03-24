import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl wac-card p-8 sm:p-12">
        <h1 className="text-4xl font-serif tracking-tight font-bold mb-8 text-[var(--accent)]">
          Privacy Policy
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
              1. Information We Collect
            </h2>
            <p>
              When you use the World Albanian Congress platform, we collect
              information that you voluntarily provide to us, such as your name,
              email address, profile details, and network connections.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              2. How We Use Your Information
            </h2>
            <p>
              We use your information to provide, maintain, and improve our
              services. This includes showing your profile in the directory to
              help other authenticated members of the diaspora connect with you,
              and facilitating direct messaging and group interactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              3. Information Sharing
            </h2>
            <p>
              Your public profile details will be visible to other authenticated
              users on the platform. We do not sell your personal data to third
              parties. We may share information with trusted third-party service
              providers who assist us in operating our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Data Security
            </h2>
            <p>
              We implement reasonable security measures to protect your personal
              information from unauthorized access, alteration, disclosure, or
              destruction. However, no method of transmission over the Internet
              or electronic storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Your Choices
            </h2>
            <p>
              You can update your profile information at any time. You may also
              request account deletion by contacting our support team, at which
              point your personal data will be removed from our active databases.
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
