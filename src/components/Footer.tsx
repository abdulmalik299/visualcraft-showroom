export function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10">
      <div className="shell py-10 text-sm text-slate-400">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>VisualCraft Showroom — moving image, still frame, visual atmosphere.</p>
          <div className="flex items-center gap-4">
            <a className="hover:text-white" href="mailto:artist@example.com">artist@example.com</a>
            <a className="hover:text-white" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
