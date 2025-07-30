import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function HeaderBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditorPage = location.pathname.startsWith('/editor/');

  const handleLogout = () => {
    navigate('/');
  };

  const handleCreate = () => {
    alert('Feature coming soon!');
  };

  const handleSettings = () => {
    alert('Settings coming soon!');
  };

  return (
    <header className="w-full bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 text-white shadow-md py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
        {/* Logo */}
        <div
          className="text-3xl font-extrabold tracking-wide cursor-pointer hover:opacity-90 transition"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          aria-label="Go to Home"
        >
          📄 CollabDocs
        </div>

        {/* Buttons */}
        <nav className="mt-4 sm:mt-0 flex flex-wrap gap-3 justify-center sm:justify-end items-center">
          {isEditorPage && (
            <button
              className="bg-white text-indigo-600 hover:bg-indigo-100 font-medium py-2 px-4 rounded-xl transition shadow-sm"
              onClick={() => navigate('/')}
              aria-label="Back to Home"
              title="Go back to Home"
            >
              🔙 Home
            </button>
          )}

          <button
            className="bg-white text-green-600 hover:bg-green-100 font-medium py-2 px-4 rounded-xl transition shadow-sm"
            onClick={handleCreate}
            aria-label="Create Document"
            title="Create a New Document"
          >
            ➕ Create
          </button>

          <button
            className="bg-white text-yellow-600 hover:bg-yellow-100 font-medium py-2 px-4 rounded-xl transition shadow-sm"
            onClick={handleSettings}
            aria-label="Open Settings"
            title="Settings"
          >
            ⚙️ Settings
          </button>

          <button
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition shadow-md"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            🚪 Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

export default HeaderBar;
