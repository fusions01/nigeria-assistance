import { RouterProvider, createRouter, createRoute, createRootRoute, redirect, Outlet } from "@tanstack/react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import RequestMoney from "./pages/RequestMoney";
import SendMoney from "./pages/SendMoney";
import TransactionHistory from "./pages/TransactionHistory";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Check if user is authenticated via any method
function isUserAuthenticated(): boolean {
  try {
    const emailAuth = sessionStorage.getItem("emailAuth");
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const userSession = sessionStorage.getItem("userSession");
    const iiAuth = sessionStorage.getItem("iiAuth");

    if (emailAuth && emailAuth !== "null" && emailAuth !== "") return true;
    if (isLoggedIn === "true") return true;
    if (userSession && userSession !== "null" && userSession !== "") return true;
    if (iiAuth && iiAuth !== "null" && iiAuth !== "") return true;

    return false;
  } catch {
    return false;
  }
}

function isAdminAuthenticated(): boolean {
  try {
    return sessionStorage.getItem("isAdmin") === "true";
  } catch {
    return false;
  }
}

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: Signup,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: () => {
    if (!isUserAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: Dashboard,
});

const requestMoneyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/request-money",
  beforeLoad: () => {
    if (!isUserAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: RequestMoney,
});

const sendMoneyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/send-money",
  beforeLoad: () => {
    if (!isUserAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: SendMoney,
});

const transactionHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  beforeLoad: () => {
    if (!isUserAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: TransactionHistory,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: () => {
    if (!isUserAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: Profile,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLogin,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  beforeLoad: () => {
    if (!isAdminAuthenticated()) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminDashboard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  dashboardRoute,
  requestMoneyRoute,
  sendMoneyRoute,
  transactionHistoryRoute,
  profileRoute,
  adminLoginRoute,
  adminDashboardRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
