import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X, Wallet, LogOut, User, ArrowDownCircle, Send, History, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

function getSessionAuth() {
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

function getIsAdmin() {
  try {
    return sessionStorage.getItem("isAdmin") === "true";
  } catch {
    return false;
  }
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionLoggedIn, setSessionLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = () => {
      setSessionLoggedIn(getSessionAuth());
      setIsAdmin(getIsAdmin());
    };
    check();
    // Re-check on storage events
    window.addEventListener("storage", check);
    // Also poll every second to catch sessionStorage changes within same tab
    const interval = setInterval(check, 1000);
    return () => {
      window.removeEventListener("storage", check);
      clearInterval(interval);
    };
  }, []);

  const isLoggedIn = !!identity || sessionLoggedIn;

  const handleLogout = async () => {
    try {
      await clear();
    } catch {
      // ignore
    }
    queryClient.clear();
    sessionStorage.removeItem("emailAuth");
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userSession");
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("iiAuth");
    sessionStorage.removeItem("currentUserEmail");
    setSessionLoggedIn(false);
    setIsAdmin(false);
    setMobileOpen(false);
    navigate({ to: "/" });
  };

  const navLinks = isLoggedIn
    ? [
        { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { to: "/request-money", label: "Request Money", icon: <ArrowDownCircle className="w-4 h-4" /> },
        { to: "/transactions", label: "History", icon: <History className="w-4 h-4" /> },
        { to: "/profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
        ...(isAdmin
          ? [{ to: "/send-money", label: "Send Money", icon: <Send className="w-4 h-4" /> }]
          : []),
      ]
    : [
        { to: "/login", label: "Login", icon: null },
        { to: "/signup", label: "Sign Up", icon: null },
      ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <Wallet className="w-6 h-6" />
              <span>NigeriaPay</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  activeProps={{ className: "text-primary bg-primary/10" }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  activeProps={{ className: "text-primary bg-primary/10" }}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              {isLoggedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  activeProps={{ className: "text-primary bg-primary/10" }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  activeProps={{ className: "text-primary bg-primary/10" }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Wallet className="w-5 h-5" />
              <span>NigeriaPay</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} NigeriaPay. Secure payments for Nigerians.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with{" "}
              <span className="text-red-500">♥</span>{" "}
              using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "nigeria-pay")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
