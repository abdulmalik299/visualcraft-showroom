import { Route, Routes, Navigate } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import { Footer } from "../components/Footer";
import { Home } from "./Home";
import { Videos } from "./Videos";
import { Gallery } from "./Gallery";
import { About } from "./About";
import { ConstellationBackground } from "../components/constellation/ConstellationBackground";
import { RouteTransitionOverlay } from "../components/RouteTransitionOverlay";
import { CursorHalo } from "../components/CursorHalo";
import { ScrollRevealManager } from "../components/ScrollRevealManager";

export default function App() {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden">
      <ConstellationBackground />
      <CursorHalo />
      <RouteTransitionOverlay />
      <div className="relative z-10">
        <ScrollRevealManager />
        <TopNav />
        <main className="min-h-[75vh]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}
