import { useEffect, useState, useCallback } from "react";
import { UserProvider, useUser } from "@/app/auth/UserContext";
import { canAccessScreen } from "@/app/auth/authService";
import { AppShell } from "@/shell/AppShell";
import { LandingScreen } from "@/app/pages/LandingScreen";
import { NewDeclarationScreen } from "@/app/pages/NewDeclarationScreen";
import { MyDeclarationsScreen } from "@/app/pages/MyDeclarationsScreen";
import { ApproverDashboard } from "@/app/pages/ApproverDashboard";
import { ApprovalQueue } from "@/app/pages/ApprovalQueue";
import { ApprovalDetail } from "@/app/pages/ApprovalDetail";
import { AdminDashboard } from "@/app/pages/admin/AdminDashboard";
import { AdminUsers } from "@/app/pages/admin/AdminUsers";
import { AdminWorkflows } from "@/app/pages/admin/AdminWorkflows";
import { AdminDropdowns } from "@/app/pages/admin/AdminDropdowns";
import { AdminConfig } from "@/app/pages/admin/AdminConfig";
import { AdminReports } from "@/app/pages/admin/AdminReports";
import { AdminApprovalOptions } from "@/app/pages/admin/AdminApprovalOptions";
import { TravelAnalysis } from "@/app/features/analysis/TravelAnalysis";
import { SuccessModal } from "@/app/components/SuccessModal";
import { DraftBanner } from "@/app/components/DraftBanner";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { Screen, Role, Declaration } from "@/types/declaration";

function AppInner() {
  const { user, logout } = useUser();
  const [screen, setScreen] = useState<Screen>("landing");
  const [selectedDecl, setSelectedDecl] = useState<Declaration | null>(null);
  const [submittedData, setSubmittedData] = useState<Declaration | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSubmittedView, setShowSubmittedView] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Declaration | null>(null);
  // Bumped on every navigation to the form so it remounts fresh instead of
  // showing stale values from a previous session.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!showSubmittedView) return;
    const scrollToTop = () => {
      const main = document.querySelector("main") as HTMLElement | null;
      if (main) {
        main.scrollTo({ top: 0, behavior: "auto" });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    };
    scrollToTop();
    const id = setTimeout(scrollToTop, 100);
    return () => clearTimeout(id);
  }, [showSubmittedView]);

  const getRoleForScreen = (s: Screen): Role =>
    s === "admin-dashboard" || s === "admin-users" || s === "admin-workflows" || s === "admin-dropdowns" || s === "admin-config" || s === "admin-reports" || s === "admin-approval-options" ? "admin"
    : s === "approver-dashboard" || s === "approval-queue" || s === "approval-detail" || s === "travel-analysis" ? "approver"
    : "teamMember";

  const handleLogin = (r: Role) => {
    setScreen(r === "admin" ? "admin-dashboard" : r === "approver" ? "approver-dashboard" : "new-declaration");
  };

  const handleSignOut = () => {
    logout();
    setScreen("landing");
    setSelectedDecl(null);
    setSubmittedData(null);
    setShowSuccess(false);
    setShowSubmittedView(false);
  };

  const handleSubmitSuccess = useCallback((data: Declaration) => {
    setSubmittedData(data);
    setShowSuccess(true);
    setShowSubmittedView(false);
  }, []);

  const guardedNavigate = (s: Screen) => {
    if (s === "new-declaration" || s === "travel-request") {
      setEditingDraft(null);
      setFormKey((k) => k + 1);
    }
    if (!canAccessScreen(user, s)) {
      setScreen("landing");
      return;
    }
    setScreen(s);
  };

  const handleEditDraft = (d: Declaration) => {
    setEditingDraft(d);
    setFormKey((k) => k + 1);
    if (!canAccessScreen(user, "new-declaration")) {
      setScreen("landing");
      return;
    }
    setScreen("new-declaration");
  };

  if (screen === "landing" || screen === "login") {
    return <LandingScreen onEnter={handleLogin} />;
  }

  if (!canAccessScreen(user, screen)) {
    return <LandingScreen onEnter={handleLogin} />;
  }

  return (
    <>
      {showDraftBanner && <DraftBanner onDismiss={() => setShowDraftBanner(false)} />}

      <AppShell role={user?.role || getRoleForScreen(screen)} screen={screen} userName={user?.name || ""} onNavigate={guardedNavigate} onSignOut={handleSignOut} user={user}>
        {(screen === "new-declaration" || screen === "travel-request") && !showSubmittedView && (
          <NewDeclarationScreen
            key={formKey}
            onSubmitSuccess={(data) => { setEditingDraft(null); handleSubmitSuccess(data); }}
            onDraftSaved={() => setShowDraftBanner(true)}
            draft={editingDraft}
          />
        )}
        {(screen === "new-declaration" || screen === "travel-request") && showSubmittedView && submittedData && (
          <ApprovalDetail declaration={submittedData} onBack={() => setShowSubmittedView(false)} readOnly />
        )}
        {screen === "my-declarations" && <MyDeclarationsScreen onEditDraft={handleEditDraft} />}
        {screen === "approver-dashboard" && <ApproverDashboard onNavigate={guardedNavigate} onReview={(d) => { setSelectedDecl(d); guardedNavigate("approval-detail"); }} />}
        {screen === "approval-queue" && <ApprovalQueue onReview={(d) => { setSelectedDecl(d); guardedNavigate("approval-detail"); }} />}
        {screen === "approval-detail" && selectedDecl && <ApprovalDetail declaration={selectedDecl} onBack={() => guardedNavigate("approval-queue")} />}
        {screen === "admin-dashboard" && <AdminDashboard onNavigate={guardedNavigate} />}
        {screen === "admin-users" && <AdminUsers />}
        {screen === "admin-workflows" && <AdminWorkflows />}
        {screen === "admin-dropdowns" && <AdminDropdowns />}
        {screen === "admin-config" && <AdminConfig />}
        {screen === "admin-reports" && <AdminReports />}
        {screen === "admin-approval-options" && <AdminApprovalOptions />}
        {screen === "travel-analysis" && <TravelAnalysis />}
      </AppShell>

      {showSuccess && submittedData && (
        <SuccessModal
          data={submittedData}
          onClose={() => setShowSuccess(false)}
          onView={() => {
            setShowSuccess(false);
            setShowSubmittedView(true);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </UserProvider>
  );
}
