import { TWITTER_HANDLE, TWITTER_URL } from "@/lib/site";

export function TwitterLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={TWITTER_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow @${TWITTER_HANDLE} on X`}
      title={`@${TWITTER_HANDLE}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-900/70 px-2.5 py-1.5 text-[0.62rem] font-extrabold text-white/75 backdrop-blur transition hover:border-white/30 hover:bg-white/10 hover:text-white ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      @{TWITTER_HANDLE}
    </a>
  );
}
