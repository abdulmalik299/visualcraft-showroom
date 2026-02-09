import { Route, Routes, Navigate } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import { Footer } from "../components/Footer";
import { Home } from "./Home";
import { Videos } from "./Videos";
import { Gallery } from "./Gallery";
import { Store } from "./Store";
import { ModelDetails } from "./ModelDetails";
import { Login } from "./Login";
import { FinishSignIn } from "./FinishSignIn";
import { Admin } from "./admin/Admin";
import { useAuth } from "../state/auth";

function AdminRoute({ children }: { children: JSX.Element }) {
  const { loading, isAdmin } = useAuth();
  if (loading) return <div className="container-pad py-12 text-slate-300">Loading…</div>;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/store" element={<Store />} />
          <Route path="/model/:id" element={<ModelDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/finish-signin" element={<FinishSignIn />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
