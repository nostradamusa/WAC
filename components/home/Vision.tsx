export default function Vision() {
  return (
    <section id="vision" className="py-24 px-4 bg-[var(--background)]">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl font-serif tracking-tight sm:text-6xl mb-4 text-white">
            <span className="text-[#D4AF37] italic font-light opacity-90">
              Future
            </span>{" "}
            Capabilities
          </h2>
          <p className="text-xl opacity-70 max-w-2xl mx-auto leading-relaxed">
            The World Albanian Congress platform is continuously evolving to
            provide deeper value to the diaspora.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="wac-card p-8 flex flex-col text-center border-dashed border-white/20 opacity-70">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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
            <h3 className="text-xl font-bold mb-3">Mentorship</h3>
            <p className="opacity-70 text-sm leading-relaxed">
              Find experienced professionals willing to guide the next
              generation.
            </p>
          </div>

          <div className="wac-card p-8 flex flex-col text-center border-dashed border-white/20 opacity-70">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Hiring</h3>
            <p className="opacity-70 text-sm leading-relaxed">
              Discover talent and career opportunities within the diaspora.
            </p>
          </div>

          <div className="wac-card p-8 flex flex-col text-center border-dashed border-white/20 opacity-70">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Verification</h3>
            <p className="opacity-70 text-sm leading-relaxed">
              Interact with trusted, verified businesses and professionals.
            </p>
          </div>

          <div className="wac-card p-8 flex flex-col text-center border-dashed border-white/20 opacity-70">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Projects</h3>
            <p className="opacity-70 text-sm leading-relaxed">
              Collaborate on large-scale diaspora initiatives and funds.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
