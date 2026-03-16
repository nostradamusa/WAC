export default function PeopleSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="mx-auto w-full max-w-[28rem] md:max-w-none">
          <div className="wac-card group relative flex h-full min-h-[160px] animate-pulse flex-col p-6 transition-all">
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex gap-4">
                <div className="h-16 w-16 shrink-0 rounded-full bg-[rgba(255,255,255,0.05)]" />
                <div className="mt-1 flex flex-1 flex-col gap-2">
                  <div className="h-5 w-3/4 rounded bg-[rgba(255,255,255,0.05)]" />
                  <div className="h-4 w-1/2 rounded bg-[rgba(255,255,255,0.05)]" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="h-4 w-1/3 rounded bg-[rgba(255,255,255,0.05)]" />
                <div className="h-4 w-1/4 rounded bg-[rgba(255,255,255,0.05)]" />
              </div>
              <div className="mt-auto pt-5">
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-16 rounded-full bg-[rgba(255,255,255,0.05)]" />
                  <div className="h-6 w-20 rounded-full bg-[rgba(255,255,255,0.05)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
