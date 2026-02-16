import { FooterCrest } from "./artwork/FooterCrest";

export function Footer() {
  return (
    <footer className="relative mt-16 border-t border-white/10">
      <FooterCrest />
      <div className="shell py-10 text-sm text-slate-400">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>VisualCraft Showroom — cinematic stills and motion frames.</p>
          <div className="flex items-center gap-4">
            <a className="hover:text-white" href="mailto:artist@example.com">artist@example.com</a>
            <a className="hover:text-white" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
