import { Route, Routes, Navigate } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import { Footer } from "../components/Footer";
import { Home } from "./Home";
import { Videos } from "./Videos";
import { Gallery } from "./Gallery";

export default function App() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="min-h-[75vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
