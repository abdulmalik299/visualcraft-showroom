import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/SectionTitle";
import { BehanceIcon, InstagramIcon, LinkedInIcon, MailIcon } from "../components/icons";

const tools = ["Blender", "After Effects", "Premiere Pro", "Photoshop"];

const links = [
  { href: "mailto:abdulmelikdilshad@gmail.com", label: "Email", icon: MailIcon },
  { href: "https://instagram.com", label: "Instagram", icon: InstagramIcon },
  { href: "https://behance.net", label: "Behance", icon: BehanceIcon },
  { href: "https://linkedin.com", label: "LinkedIn", icon: LinkedInIcon }
];

export function About() {
  return (
    <div className="shell section-gap">
      <SectionTitle
        title="About"
        subtitle="3D artist and motion designer focused on clear, commercial visual storytelling."
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5 p-7 shadow-reveal" interactive>
          <p className="label">Profile</p>
          <p className="text-lg leading-relaxed text-slate-200">
            I am Abdulmalek Dlshad Ahmed, a Blender-based 3D artist and motion graphics designer. I build complete visuals from concept to final delivery, with a strong focus on lighting, material quality, and clean composition.
          </p>
          <p className="leading-relaxed text-slate-300">
            My work spans product visuals, interiors, and short-form motion pieces for portfolio, client previews, and digital campaigns. I am based in Erbil, Iraq, and available for remote freelance or studio collaborations.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {tools.map((tool) => <span key={tool} className="badge">{tool}</span>)}
          </div>
        </Card>

        <Card className="space-y-5 p-7 shadow-reveal" interactive>
          <p className="label">Strengths</p>
          <ul className="list-disc space-y-2 pl-4 text-slate-300">
            <li>End-to-end visual production with reliable delivery.</li>
            <li>Realistic shading, lighting, and compositing workflows.</li>
            <li>Strong independent execution and remote communication.</li>
          </ul>
          <div className="pt-2">
            <p className="text-sm text-slate-400">Let’s build premium product visuals and motion assets.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map(({ href, label, icon: Icon }) => (
                <a key={label} className="icon-btn" href={href} target="_blank" rel="noreferrer" aria-label={label}>
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
