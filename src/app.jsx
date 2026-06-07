import { useEffect, lazy, Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CallProvider } from "@/contexts/CallContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import LoadingScreen from "@/components/LoadingScreen";
import { requestNotificationPermission } from "@/lib/notifications";

const Chat = lazy(() => import("./pages/Chat"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Profile = lazy(() => import("./pages/Profile"));
const Calls = lazy(() => import("./pages/Calls"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IncomingCallModal = lazy(() => import("@/components/calls/IncomingCallModal"));
const ActiveCallOverlay = lazy(() => import("@/components/calls/ActiveCallOverlay"));

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
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={null}>
            <IncomingCallModal />
            <ActiveCallOverlay />
          </Suspense>
          <Suspense fallback={<LoadingScreen />}>
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
          </Suspense>
        </BrowserRouter>
      </CallProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};
export default App;
