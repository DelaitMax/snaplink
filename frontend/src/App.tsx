import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { useThemeEffect } from "@/features/theme/useThemeEffect";
import { CreateLinkPage } from "@/pages/CreateLinkPage";
import { LinkStatsPage } from "@/pages/LinkStatsPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { MyLinksPage } from "@/pages/MyLinksPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  useThemeEffect();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CreateLinkPage />} />
        <Route path="/s/:statsToken" element={<LinkStatsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/my-links"
          element={
            <ProtectedRoute>
              <MyLinksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
