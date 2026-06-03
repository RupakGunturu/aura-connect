import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CallProvider } from "@/contexts/CallContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import IncomingCallModal from "@/components/calls/IncomingCallModal";
import ActiveCallOverlay from "@/components/calls/ActiveCallOverlay";
import Chat from "./pages/Chat";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Calls from "./pages/Calls";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { requestNotificationPermission } from "@/lib/notifications";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => { requestNotificationPermission(); }, []);
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CallProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <BrowserRouter future={{ v7_startTransition: true }}>
          <IncomingCallModal />
          <ActiveCallOverlay />
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Chat />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:conversationId"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Chat />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calls"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Calls />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:handle"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Profile />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CallProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};
export default App;
