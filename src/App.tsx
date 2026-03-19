import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AuthProvider } from "./hooks/useAuth";
import { I18nProvider } from "./hooks/useI18n";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RaidPage } from "./pages/RaidPage";
import { ReferralsPage } from "./pages/ReferralsPage";
import { ShopPage } from "./pages/ShopPage";

const App = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="/raid" element={<RaidPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/shop" element={<ShopPage />} />
          </Route>
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;
