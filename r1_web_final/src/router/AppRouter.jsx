import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore.js';
import { ROLES } from '../config/constants.js';
import AppShell from '../components/shared/AppShell.jsx';

// ── Public pages ──────────────────────────────────────────────────────────────
const LandingPage  = lazy(() => import('../pages/landing/LandingPage.jsx'));   
const LoginPage    = lazy(() => import('../pages/auth/LoginPage.jsx'));
const OtpPage      = lazy(() => import('../pages/auth/OtpVerifyPage.jsx'));    
const TermsPage    = lazy(() => import('../pages/legal/TermsPage.jsx'));       
const PrivacyPage  = lazy(() => import('../pages/legal/PrivacyPage.jsx'));     

// ── User ──────────────────────────────────────────────────────────────────────
const UserDashboard     = lazy(() => import('../pages/user/UserDashboard.jsx'));
const PorterBookingPage = lazy(() => import('../pages/user/PorterBookingPage.jsx'));
const PnrPage           = lazy(() => import('../pages/user/PnrPage.jsx'));
const StationRoomsPage  = lazy(() => import('../pages/user/RoomsPage.jsx'));   
const LockersPage       = lazy(() => import('../pages/user/LockersPage.jsx'));
const AiChatPage        = lazy(() => import('../pages/user/AiChatPage.jsx'));
const ItineraryPlannerPage = lazy(() => import('../pages/user/ItineraryPlannerPage.jsx'));
const BookingsPage      = lazy(() => import('../pages/user/BookingsPage.jsx'));
const UserProfilePage   = lazy(() => import('../pages/user/ProfilePage.jsx'));

// ── Porter ────────────────────────────────────────────────────────────────────
const PorterDashboard = lazy(() => import('../pages/porter/PorterDashboard.jsx'));
const PorterRequests  = lazy(() => import('../pages/porter/IncomingRequestsPage.jsx')); 
const PorterActiveJob = lazy(() => import('../pages/porter/ActiveServicePage.jsx'));    
const PorterEarnings  = lazy(() => import('../pages/porter/EarningsPage.jsx'));         
const PorterProfile   = lazy(() => import('../pages/porter/PorterProfile.jsx'));        

// ── Supervisor ────────────────────────────────────────────────────────────────
const SupervisorDashboard = lazy(() => import('../pages/supervisor/SupervisorDashboard.jsx'));
const LivePorterMap       = lazy(() => import('../pages/supervisor/LivePorterMapPage.jsx')); 
const UnassignedQueue     = lazy(() => import('../pages/supervisor/UnassignedQueuePage.jsx'));
const PorterDirectory     = lazy(() => import('../pages/supervisor/PorterDirectoryPage.jsx'));
const CreatePorter        = lazy(() => import('../pages/supervisor/CreatePorterPage.jsx'));
const ManualAssignment   = lazy(() => import('../pages/supervisor/ManualAssignmentPage.jsx'));

// ── RPF ───────────────────────────────────────────────────────────────────────
const RpfDashboard    = lazy(() => import('../pages/rpf/RpfDashboard.jsx'));
const LiveSosMap      = lazy(() => import('../pages/rpf/SosMapPage.jsx'));         
const IncidentHistory = lazy(() => import('../pages/rpf/IncidentHistoryPage.jsx'));
const RpfProfile      = lazy(() => import('../pages/rpf/RpfProfile.jsx'));         

// ── Station Control ───────────────────────────────────────────────────────────
const StationControlDashboard = lazy(() => import('../pages/station-control/StationControlDashboard.jsx'));
const StationAnalytics        = lazy(() => import('../pages/station-control/StationAnalyticsPage.jsx'));
const ManageStaff             = lazy(() => import('../pages/station-control/ManageStaffPage.jsx'));
const AllBookings             = lazy(() => import('../pages/station-control/AllBookingsPage.jsx'));
const StationRoomsMgmt        = lazy(() => import('../pages/station-control/StationRoomsPage.jsx'));  
const DigitalLockersMgmt      = lazy(() => import('../pages/station-control/DigitalLockersPage.jsx'));
const StationAuditLogs        = lazy(() => import('../pages/station-control/AuditLogsPage.jsx'));
const StationBroadcastPage    = lazy(() => import('../pages/station-control/BroadcastPage.jsx'));     
const StaffOnboardingPage     = lazy(() => import('../pages/station-control/StaffOnboardingPage.jsx')); 

// ── SuperAdmin ────────────────────────────────────────────────────────────────
const SuperAdminDashboard = lazy(() => import('../pages/superadmin/SuperAdminDashboard.jsx'));
const UserManagement      = lazy(() => import('../pages/superadmin/UserManagementPage.jsx'));
const StationOnboarding   = lazy(() => import('../pages/superadmin/StationOnboardingPage.jsx')); 
const AiKnowledgeBase     = lazy(() => import('../pages/superadmin/AiKnowledgeBasePage.jsx'));
const SystemConfig        = lazy(() => import('../pages/superadmin/SystemConfigPage.jsx'));
const GlobalAuditLogs     = lazy(() => import('../pages/superadmin/GlobalAuditLogsPage.jsx'));

// ── Loader ────────────────────────────────────────────────────────────────────
const Loader = () => (
  <div className="loading-screen">
    <div className="spinner spinner-lg" />
    <span style={{ color: 'var(--c-text-3)', fontSize: '0.857rem' }}>Loading…</span>
  </div>
);

// ── Guards ────────────────────────────────────────────────────────────────────
function RequireAuth({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/landing" replace />;
  const MAP = {
    [ROLES.USER]:                 '/user',
    [ROLES.PORTER]:               '/porter',
    [ROLES.SUPERVISOR]:           '/supervisor',
    [ROLES.RPF]:                  '/rpf',
    [ROLES.STATION_CONTROL_ROOM]: '/station-control',
    [ROLES.SUPERADMIN]:           '/superadmin',
  };
  return <Navigate to={MAP[role] || '/login'} replace />;
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>

          {/* ── Public ────────────────────────────────────────────────────── */}
          <Route path="/"           element={<RoleRedirect />} />
          <Route path="/landing"    element={<LandingPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/verify-otp" element={<OtpPage />} />
          <Route path="/terms"      element={<TermsPage />} />
          <Route path="/privacy"    element={<PrivacyPage />} />

          {/* ── USER ──────────────────────────────────────────────────────── */}
          <Route path="/user" element={
            <RequireAuth allowedRoles={[ROLES.USER]}>
              <AppShell />
            </RequireAuth>
          }>
            <Route index           element={<UserDashboard />} />
            <Route path="porter"   element={<PorterBookingPage />} />
            <Route path="pnr"      element={<PnrPage />} />
            <Route path="rooms"    element={<StationRoomsPage />} />
            <Route path="lockers"  element={<LockersPage />} />
            <Route path="ai-chat"  element={<AiChatPage />} />
            <Route path="itinerary" element={<ItineraryPlannerPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="profile"  element={<UserProfilePage />} />
          </Route>

          {/* ── PORTER ────────────────────────────────────────────────────── */}
          <Route path="/porter" element={
            <RequireAuth allowedRoles={[ROLES.PORTER]}>
              <AppShell />
            </RequireAuth>
          }>
            <Route index           element={<PorterDashboard />} />
            <Route path="requests" element={<PorterRequests />} />
            <Route path="active"   element={<PorterActiveJob />} />
            <Route path="earnings" element={<PorterEarnings />} />
            <Route path="profile"  element={<PorterProfile />} />
          </Route>

          {/* ── SUPERVISOR ────────────────────────────────────────────────── */}
          <Route path="/supervisor" element={
            <RequireAuth allowedRoles={[ROLES.SUPERVISOR]}>
              <AppShell />
            </RequireAuth>
          }>
            <Route index                  element={<SupervisorDashboard />} />
            <Route path="map"             element={<LivePorterMap />} />
            <Route path="queue"           element={<UnassignedQueue />} />
            <Route path="porters"         element={<PorterDirectory />} />
            <Route path="create-porter"   element={<CreatePorter />} />
            <Route path="manual-assignment" element={<ManualAssignment />} />
          </Route>

          {/* ── RPF ───────────────────────────────────────────────────────── */}
          <Route path="/rpf" element={
            <RequireAuth allowedRoles={[ROLES.RPF]}>
              <AppShell />
            </RequireAuth>
          }>
            <Route index          element={<RpfDashboard />} />
            <Route path="map"     element={<LiveSosMap />} />
            <Route path="history" element={<IncidentHistory />} />
            <Route path="profile" element={<RpfProfile />} />
          </Route>

          {/* ── STATION CONTROL ───────────────────────────────────────────── */}
          <Route path="/station-control" element={
            <RequireAuth allowedRoles={[ROLES.STATION_CONTROL_ROOM]}>
              <AppShell />
            </RequireAuth>
          }>
            <Route index                element={<StationControlDashboard />} />
            <Route path="analytics"     element={<StationAnalytics />} />
            <Route path="staff"         element={<ManageStaff />} />
            <Route path="bookings"      element={<AllBookings />} />
            <Route path="rooms"         element={<StationRoomsMgmt />} />
            <Route path="lockers"       element={<DigitalLockersMgmt />} />
            <Route path="audit"         element={<StationAuditLogs />} />
            <Route path="broadcast"     element={<StationBroadcastPage />} />
            <Route path="onboarding"    element={<StaffOnboardingPage />} />
          </Route>

          {/* ── SUPERADMIN ────────────────────────────────────────────────── */}
          <Route path="/superadmin" element={
            <RequireAuth allowedRoles={[ROLES.SUPERADMIN]}>
              <AppShell />
            </RequireAuth>
          }>
            <Route index                 element={<SuperAdminDashboard />} />
            <Route path="users"          element={<UserManagement />} />
            <Route path="stations"       element={<StationOnboarding />} />
            <Route path="knowledge-base" element={<AiKnowledgeBase />} />
            <Route path="config"         element={<SystemConfig />} />
            <Route path="audit"          element={<GlobalAuditLogs />} />
          </Route>

          {/* ── Fallback ──────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}