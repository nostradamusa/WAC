export default function CommunityHub() {
  return (
    <section id="community-hub" className="py-24 px-4 bg-[var(--background)]">
      <div className="mx-auto max-w-6xl text-center">
        <span className="wac-eyebrow mb-4 inline-block">Collaboration</span>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl mb-12">
          Beyond the Directory
        </h2>

        <div className="grid gap-12 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Mentorship</h3>
            <p className="opacity-70 text-lg leading-relaxed">
              Find experienced professionals willing to open doors and guide the
              next generation of diaspora talent.
            </p>
          </div>

          <div className="text-center">
            <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" x2="9.01" y1="9" y2="9" />
                <line x1="15" x2="15.01" y1="9" y2="9" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Hiring</h3>
            <p className="opacity-70 text-lg leading-relaxed">
              Filter profiles by "Open to Work" or locate businesses flagged as
              "Actively Hiring" to keep talent in the community.
            </p>
          </div>

          <div className="text-center">
            <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Verification</h3>
            <p className="opacity-70 text-lg leading-relaxed">
              Interact with verified professionals and trusted businesses to
              ensure secure, high-quality collaboration.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
