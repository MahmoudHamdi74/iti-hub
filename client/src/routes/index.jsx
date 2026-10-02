import { createBrowserRouter, RouterProvider, Navigate, useParams } from "react-router-dom";
import Layout from "@/layout/layout";
import AuthLayout from "@/layout/AuthLayout";
import ProtectedRoute from "@components/routes/ProtectedRoute";
import PublicRoute from "@components/routes/PublicRoute";
import AuthLoginController from "@pages/auth/AuthLoginController";
import RegisterController from "@pages/auth/RegisterController";
import PasswordResetRequestController from "@pages/auth/PasswordResetRequestController";
import PasswordResetConfirmController from "@pages/auth/PasswordResetConfirmController";
import EmailVerifyPage from "@pages/auth/EmailVerifyPage";
import ResendVerificationPage from "@pages/auth/ResendVerificationPage";
import EmailOtpController from "@pages/auth/EmailOtpController";
import FeedHomeController from "@pages/feed/FeedHomeController";
import FeedFollowingController from "@pages/feed/FeedFollowingController";
import FeedTrendingController from "@pages/feed/FeedTrendingController";
import SavedPostsController from "@pages/feed/SavedPostsController";
import PostDetailController from "@pages/post/PostDetailController";
import NotificationsCenterController from "@pages/notifications/NotificationsCenterController";
import ProfileController from "../pages/profile/ProfileController";
import FeedLayout from "../layout/FeedLayout";
import MessagesShell from "../layout/MessagesShell";
import ConversationDetail from "@pages/messages/ConversationDetail";
import CommunityManagement from "@pages/community/CommunityManagement";
import CommunitiesController from "@pages/community/CommunitiesController";
import Community from "@components/community/Community";
import SearchPage from "@pages/SearchPage";
import AskCommunityController from "@pages/ask/AskCommunityController";
import CoursesListController from "@pages/courses/CoursesListController";
import TrackDetailController from "@pages/courses/TrackDetailController";
import TrackWorkspaceController from "@pages/courses/TrackWorkspaceController";
import BranchesListController from "@pages/branches/BranchesListController";
import BranchDetailController from "@pages/branches/BranchDetailController";
import RoundTracksController from "@pages/branches/RoundTracksController";
import JobsListController from "@pages/jobs/JobsListController";
import EventsListController from "@pages/events/EventsListController";
import SettingsController from "@pages/settings/SettingsController";

// Placeholder components for routes not yet implemented
const NotFoundPage = () => <div>404 - Page Not Found</div>;

// Redirect legacy /courses/tracks/:trackId URLs to the corrected /tracks/:trackId
const LegacyTrackDetailRedirect = () => {
  const { trackId } = useParams();
  return <Navigate to={`/tracks/${trackId}`} replace />;
};

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/verify-email",
        element: <EmailVerifyPage />,
      },
      {
        path: "/resend-verification",
        element: <ResendVerificationPage />,
      },
      {
        element: <PublicRoute />,
        children: [
          {
            path: "/login",
            element: <AuthLoginController />,
          },
          {
            path: "/register",
            element: <RegisterController />,
          },
          {
            path: "/password-reset/request",
            element: <PasswordResetRequestController />,
          },
          {
            path: "/password-reset/confirm",
            element: <PasswordResetConfirmController />,
          },
          {
            path: "/verify-email",
            element: <EmailVerifyPage />,
          },
          {
            path: "/resend-verification",
            element: <ResendVerificationPage />,
          },
          {
            // 6-digit email OTP step after registration (work order item 3)
            path: "/verify-otp",
            element: <EmailOtpController />,
          },
        ],
      },
    ],
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        element: <FeedLayout />,
        children: [
          {
            path: "/",
            element: <FeedHomeController />,
          },
          {
            path: "/feed/trending",
            element: <FeedTrendingController />,
          },
          {
            path: "/posts/:postId",
            element: <PostDetailController />,
          },
          // Protected feed routes
          {
            element: <ProtectedRoute />,
            children: [
              {
                path: "/feed/following",
                element: <FeedFollowingController />,
              },
            ],
          },
        ],
      },
      {
        path: "/profile/:username",
        element: <ProfileController />,
      },
      {
        path: "/search",
        element: <SearchPage />,
      },
      {
        // Consolidated Communities page (work-order §2): All (browse grid,
        // public — the API is optional-auth) + My Communities (joined list,
        // auth-gated inside the page with a sign-in CTA for guests).
        path: "/communities",
        element: <CommunitiesController />,
      },
      // Legacy community-list URLs — redirect into the consolidated page
      // (former "Explore Communities" and "Community/Groups" pages).
      {
        path: "/explore",
        element: <Navigate to="/communities" replace />,
      },
      {
        path: "/ask",
        element: <AskCommunityController />,
      },
      {
        // X-style job board — API is auth-gated; page shows guests a sign-in CTA
        path: "/jobs",
        element: <JobsListController />,
      },
      {
        // Events (work order §1) — API is auth-gated; guests see a sign-in CTA
        path: "/events",
        element: <EventsListController />,
      },
      {
        // Branches → Rounds → Tracks drill-down (top-level entry)
        path: "/branches",
        element: <BranchesListController />,
      },
      {
        path: "/branches/:branchId",
        element: <BranchDetailController />,
      },
      {
        path: "/branches/:branchId/rounds/:roundId",
        element: <RoundTracksController />,
      },
      {
        // Flat tracks catalog (kept reachable at /tracks)
        path: "/tracks",
        element: <CoursesListController />,
      },
      {
        path: "/tracks/:trackId",
        element: <TrackDetailController />,
      },
      {
        // Gated Track workspace (Chat / Records / Files) — approved members only.
        // The optional :tab defaults to "chat" inside the controller.
        element: <ProtectedRoute />,
        children: [
          {
            path: "/tracks/:trackId/workspace",
            element: <TrackWorkspaceController />,
          },
          {
            path: "/tracks/:trackId/workspace/:tab",
            element: <TrackWorkspaceController />,
          },
        ],
      },
      // Legacy URLs — redirect to the corrected structure (no /courses prefix)
      {
        path: "/courses",
        element: <Navigate to="/branches" replace />,
      },
      {
        path: "/courses/tracks/:trackId",
        element: <LegacyTrackDetailRedirect />,
      },
      {
        // Legacy community-group list URL — consolidated into /communities
        path: "/groups",
        element: <Navigate to="/communities" replace />,
      },
      {
        path: "/community/:communityId",
        element: <Community />,
      },
      // Protected routes outside FeedLayout
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/community/:communityId/manage",
            element: <CommunityManagement />,
          },
          {
            path: "/notifications",
            element: <NotificationsCenterController />,
          },
          {
            path: "/saved",
            element: <SavedPostsController />,
          },
          {
            path: "/messages",
            element: <MessagesShell />,
            children: [
              // Index renders nothing in the right panel — the shell itself
              // always shows <MessagesList /> in the left panel.
              { index: true, element: null },
              {
                path: ":conversationId",
                element: <ConversationDetail />,
              },
            ],
          },
              {
                path: "/settings",
                element: <SettingsController />,
              },
        ],
      },
      // 404 route
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
