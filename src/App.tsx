import { useState, useEffect } from "react";
import { User, UserRole } from "./types";
import LoginRegister from "./components/LoginRegister";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { LogOut, Landmark, Shield, User as UserIcon, Loader2 } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("ccms_token"));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Read current system session from Express server on load or token change
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token is stale / invalid
          localStorage.removeItem("ccms_token");
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error("Session verification failed. Network status offline.", err);
        // Fall back to stored state if offline or offline-iframe
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  // Authenticate user
  const handleLoginSuccess = (newToken: string, authenticatedUser: { _id: string; name: string; email: string; role: UserRole }) => {
    localStorage.setItem("ccms_token", newToken);
    setToken(newToken);
    setUser(authenticatedUser);
  };

  // Sign out user clearing local keys
  const handleLogout = () => {
    localStorage.removeItem("ccms_token");
    setToken(null);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-750">Loading Campus CCMS...</h3>
          <p className="text-xs text-slate-400">Verifying secure MERN API channels</p>
        </div>
      </div>
    );
  }

  // If no user holds authenticated session, request login
  if (!user || !token) {
    return <LoginRegister onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Global Application Header */}
      <nav className="sticky top-0 z-45 bg-white border-b border-slate-100 shadow-sm px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">CCMS Portal</h1>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mt-0.5 block">Campus Management</span>
          </div>
        </div>

        {/* User Badge Details and Log Out */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-right">
            <div>
              <p className="text-xs font-bold text-slate-800 line-clamp-1">{user.name}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {user.role === "Admin" ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.25 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest font-mono">
                    <Shield className="h-2.5 w-2.5" />
                    College Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.25 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-widest font-mono">
                    <UserIcon className="h-2.5 w-2.5" />
                    Student Owner
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out from session"
            className="inline-flex items-center p-2 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer text-xs font-semibold uppercase gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </nav>

      {/* Main Role-Specific Workspace Canvas */}
      <main className="flex-1">
        {user.role === "Admin" ? (
          <AdminDashboard user={user} token={token} />
        ) : (
          <StudentDashboard user={user} token={token} />
        )}
      </main>
    </div>
  );
}
