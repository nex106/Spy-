import React, { useEffect, useState } from 'react';
import {
  X,
  Shield,
  UserPlus,
  Trash2,
  Key,
  Users,
  AlertCircle,
  CheckCircle2,
  Crown,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { ThemeToggle } from './ThemeToggle.js';

interface HostDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StoredUserItem {
  id: string;
  username: string;
  role: 'HOST' | 'ADMIN' | 'PLAYER';
  createdAt: number;
}

export function HostDashboardModal({ isOpen, onClose }: HostDashboardModalProps) {
  const { token, user, clearGlobalChat, deleteUserAccount, updateUserRole } = useGame();
  const [usersList, setUsersList] = useState<StoredUserItem[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [isConfirmingClearChat, setIsConfirmingClearChat] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/host/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setError(null);
      setSuccessMsg(null);
      setIsConfirmingClearChat(false);
      setUserToDelete(null);
    }
  }, [isOpen]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) {
      setError('Both username and password are required.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/host/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create user');
      } else {
        setSuccessMsg(`Player "${data.user.username}" account created successfully!`);
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
      }
    } catch {
      setError('Network error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeClearChatHistory = async () => {
    setIsClearingChat(true);
    setError(null);
    setSuccessMsg(null);
    const ok = await clearGlobalChat();
    setIsClearingChat(false);
    setIsConfirmingClearChat(false);
    if (ok) {
      setSuccessMsg('Global chat history wiped and cleared across all devices successfully!');
    } else {
      setError('Failed to clear chat history.');
    }
  };

  const confirmExecuteDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    setError(null);
    setSuccessMsg(null);
    const targetId = userToDelete.id;
    const targetName = userToDelete.username;
    const result = await deleteUserAccount(targetId);
    setIsDeletingUser(false);
    setUserToDelete(null);
    if (result.success) {
      setSuccessMsg(`Player account "${targetName}" deleted successfully.`);
      setUsersList((prev) => prev.filter((u) => u.id !== targetId));
    } else {
      setError(result.error || 'Failed to delete user account');
    }
  };

  const handleToggleHostRole = async (targetUser: StoredUserItem) => {
    const isCurrentlyHost = targetUser.role === 'HOST' || targetUser.role === 'ADMIN';
    const newRole = isCurrentlyHost ? 'PLAYER' : 'HOST';
    setUpdatingRoleId(targetUser.id);
    setError(null);
    setSuccessMsg(null);
    const res = await updateUserRole(targetUser.id, newRole);
    setUpdatingRoleId(null);
    if (res.success) {
      setSuccessMsg(
        newRole === 'HOST'
          ? `User "${targetUser.username}" is now granted 2nd Host / Host powers!`
          : `Host role revoked from "${targetUser.username}". User is now a standard Player.`
      );
      fetchUsers();
    } else {
      setError(res.error || 'Failed to update user role');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fade-in transition-colors duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>HOST ACCESS DASHBOARD · NAFIUL</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Host Access Dashboard"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Create User Section */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Create New Player Credentials</span>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl text-red-700 dark:text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-emerald-700 dark:text-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Player Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Assigned Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newUsername.trim() || !newPassword}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs tracking-wider rounded-xl transition-all shadow-md dark:shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'CREATING...' : 'GENERATE ACCOUNT'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* User List Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Authorized Player Registry ({usersList.length})</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Encrypted & Scrypt-Hashed Passwords
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/80 bg-slate-50 dark:bg-slate-950/40">
              {usersList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No accounts registered yet.
                </div>
              ) : (
                usersList.map((item) => {
                  const isPrimaryHost = item.username.toLowerCase() === 'nafiul';
                  const isSecondHostOrAdmin = !isPrimaryHost && (item.role === 'HOST' || item.role === 'ADMIN');
                  const isPlayer = !isPrimaryHost && !isSecondHostOrAdmin;
                  const isUpdatingThisUser = updatingRoleId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                            isPrimaryHost
                              ? 'bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-amber-800 dark:text-amber-300'
                              : isSecondHostOrAdmin
                              ? 'bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/80 text-purple-800 dark:text-purple-300'
                              : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {item.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {item.username}
                            </span>
                            {isPrimaryHost && (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5" />
                                PRIMARY HOST
                              </span>
                            )}
                            {isSecondHostOrAdmin && (
                              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5 text-purple-500" />
                                2ND HOST
                              </span>
                            )}
                            {isPlayer && (
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                                PLAYER
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ID: {item.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 2nd Host Promotion / Revocation Controls */}
                        {!isPrimaryHost && (
                          <>
                            {isPlayer ? (
                              <button
                                type="button"
                                disabled={isUpdatingThisUser}
                                onClick={() => handleToggleHostRole(item)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-white font-bold text-[11px] tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                title={`Promote "${item.username}" to 2nd Host`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                                <span>{isUpdatingThisUser ? 'PROMOTING...' : 'MAKE 2ND HOST'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isUpdatingThisUser}
                                onClick={() => handleToggleHostRole(item)}
                                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                title={`Revoke host privileges from "${item.username}"`}
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                <span>{isUpdatingThisUser ? 'REVOKING...' : 'REVOKE HOST'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setUserToDelete({ id: item.id, username: item.username })}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                              title={`Delete account "${item.username}"`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Global Chat Maintenance Section */}
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                <Trash2 className="w-4 h-4" />
                <span>Global Chat Moderation & Purge</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Clear all messages from the global frequency database and wipe all message history immediately across all connected users and devices.
            </p>

            {isConfirmingClearChat ? (
              <div className="p-3.5 bg-red-100/90 dark:bg-red-950/90 border border-red-300 dark:border-red-800 rounded-xl space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Confirm wipe of ALL global chat transmissions across all users?</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClearChat(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isClearingChat}
                    onClick={executeClearChatHistory}
                    className="py-2 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isClearingChat ? 'CLEARING...' : 'YES, CLEAR CHAT HISTORY NOW'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingClearChat(true)}
                  className="py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider rounded-xl transition-all shadow-md dark:shadow-red-950/50 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>CLEAR CHAT HISTORY NOW</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            CLOSE
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {userToDelete && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUserToDelete(null);
          }}
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Delete Player Account?</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete player account{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                "{userToDelete.username}"
              </strong>
              ? Their session will be terminated immediately and they will be disconnected.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={confirmExecuteDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingUser ? 'DELETING...' : 'YES, DELETE ACCOUNT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
