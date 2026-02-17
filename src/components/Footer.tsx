import { ArrowIcon, FilmIcon, GalleryIcon, LinkedInIcon, MailIcon } from "./icons";
import { FooterCrest } from "./artwork/FooterCrest";

const links = [
  { href: "mailto:abdulmelikdilshad@gmail.com", label: "Email", icon: MailIcon },
  { href: "https://www.linkedin.com/in/abdulmalek-ahmed-616b7a174", label: "LinkedIn", icon: LinkedInIcon },
  { href: "https://abdulmalekd1.artstation.com/", label: "ArtStation", icon: GalleryIcon },
  { href: "https://www.freelancer.com/u/abdulmalek3D?sb=t", label: "Freelancer", icon: ArrowIcon },
  { href: "https://vimeo.com/abdulmalekdlshad", label: "Vimeo", icon: FilmIcon }
];

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/10 bg-black/20">
      <FooterCrest />
      <div className="shell py-12 text-sm text-slate-400">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <p className="label">VisualCraft Showroom</p>
            <p className="max-w-lg text-lg text-slate-200">Frames that merge texture, brand presence, and cinematic motion into a single digital portfolio experience.</p>
          </div>
          <div className="space-y-3 md:justify-self-end">
            <p className="label">Connect</p>
            <div className="flex flex-wrap items-center gap-2">
              {links.map(({ href, label, icon: Icon }) => (
                <a key={label} className="icon-btn" href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
