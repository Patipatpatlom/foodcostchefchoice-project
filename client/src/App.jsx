import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ChefHat, List, LayoutDashboard, Menu, BookOpen, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import MasterList from './pages/MasterList';
import RecipeBuilder from './pages/RecipeBuilder';
import RecipesList from './pages/RecipesList';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/authStore';
import api from './utils/api';

function NavLinks() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  if (!token) return null; // Don't show nav links if not logged in

  return (
    <>
      <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}>
        <LayoutDashboard className="w-5 h-5" />
        Dashboard
      </Link>
      <Link to="/master-list" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/master-list') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}>
        <List className="w-5 h-5" />
        Master List
      </Link>
      <Link to="/recipe-builder" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/recipe-builder') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}>
        <ChefHat className="w-5 h-5" />
        Recipe Builder
      </Link>
      <Link to="/recipes" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/recipes') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}>
        <BookOpen className="w-5 h-5" />
        Recipe Book
      </Link>
      
      <div className="pt-4 mt-4 border-t border-gray-800 space-y-2">
        <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-gray-800">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-gray-300">{user?.name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.restaurantName || user?.name || 'My Kitchen'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role?.replace('_', ' ') || 'Line Cook'}</p>
          </div>
        </Link>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-400 hover:text-red-300 hover:bg-gray-800"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );
}

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  React.useEffect(() => {
    if (token && !user) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => logout());
    }
  }, [token, user, setUser, logout]);

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 font-sans">
        {/* Sidebar (Only show if logged in) */}
        {token && (
          <aside className="w-64 bg-gray-900 text-white flex-col hidden md:flex shadow-xl z-20 print:hidden">
            <div className="p-6 flex items-center gap-3 border-b border-gray-800">
              <ChefHat className="text-orange-500 w-8 h-8" />
              <h1 className="text-xl font-bold tracking-tight">KitchenManager</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <NavLinks />
            </nav>
          </aside>
        )}

        {/* Mobile Header (Only show if logged in) */}
        {token && (
          <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 text-white flex items-center justify-between px-4 z-20 shadow-md print:hidden">
            <div className="flex items-center gap-2">
              <ChefHat className="text-orange-500 w-6 h-6" />
              <h1 className="text-lg font-bold">KitchenManager</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && token && (
          <div className="md:hidden fixed inset-0 z-10 pt-16 bg-gray-900">
             <nav className="p-4 space-y-2" onClick={() => setIsMobileMenuOpen(false)}>
                <NavLinks />
             </nav>
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto ${token ? 'pt-16 md:pt-0' : ''}`}>
          <div className={token ? "p-6 md:p-10 max-w-7xl mx-auto" : ""}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <Register />} />
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/master-list" element={<ProtectedRoute><MasterList /></ProtectedRoute>} />
              <Route path="/recipe-builder" element={<ProtectedRoute><RecipeBuilder /></ProtectedRoute>} />
              <Route path="/recipes" element={<ProtectedRoute><RecipesList /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
