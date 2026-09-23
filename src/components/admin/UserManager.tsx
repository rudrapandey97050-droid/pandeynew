import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  Key,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Check,
  X,
  Smartphone,
  Layers,
  FileSpreadsheet,
  Wrench,
  Sparkles,
  Calculator,
  Settings,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Phone,
  Mail,
  User,
  Power
} from 'lucide-react';
import { StoreUser, StoreUserPermissions, StoreUserRole } from '../../types.ts';
import {
  UserService,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_SECONDARY_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
  DEFAULT_CASHIER_PERMISSIONS,
  DEFAULT_TECHNICIAN_PERMISSIONS
} from '../../services/userService.ts';

interface UserManagerProps {
  onUserSwitched?: (user: StoreUser) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ onUserSwitched }) => {
  const [users, setUsers] = useState<StoreUser[]>([]);
  const [activeUser, setActiveUser] = useState<StoreUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<StoreUserRole>('staff');
  const [formPin, setFormPin] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPermissions, setFormPermissions] = useState<StoreUserPermissions>({ ...DEFAULT_STAFF_PERMISSIONS });

  const loadData = () => {
    const list = UserService.getUsers();
    setUsers(list);
    const curr = UserService.getActiveUser();
    setActiveUser(curr);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const togglePinReveal = (id: string) => {
    setRevealedPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('staff');
    setFormPin('');
    setFormPassword('');
    setFormStatus('active');
    setFormPermissions({ ...DEFAULT_STAFF_PERMISSIONS });
    setIsModalOpen(true);
  };

  const openEditModal = (user: StoreUser) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email || '');
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormPin(user.pin);
    setFormPassword(user.password || '');
    setFormStatus(user.status);
    setFormPermissions({ ...user.permissions });
    setIsModalOpen(true);
  };

  // Handle preset selection
  const applyRolePreset = (role: StoreUserRole) => {
    setFormRole(role);
    if (role === 'admin') {
      setFormPermissions({ ...DEFAULT_ADMIN_PERMISSIONS });
    } else if (role === 'secondary_admin') {
      setFormPermissions({ ...DEFAULT_SECONDARY_ADMIN_PERMISSIONS });
    } else if (role === 'staff') {
      setFormPermissions({ ...DEFAULT_STAFF_PERMISSIONS });
    } else if (role === 'cashier') {
      setFormPermissions({ ...DEFAULT_CASHIER_PERMISSIONS });
    } else if (role === 'technician') {
      setFormPermissions({ ...DEFAULT_TECHNICIAN_PERMISSIONS });
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{4}$/.test(formPin.trim())) {
      showToast('error', '4-digit PIN must be exactly 4 numeric digits (०-९).');
      return;
    }

    if (editingUserId) {
      const res = UserService.updateUser(editingUserId, {
        name: formName.trim(),
        username: formUsername.trim().toLowerCase(),
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        role: formRole,
        pin: formPin.trim(),
        password: formPassword.trim() || undefined,
        permissions: formPermissions,
        status: formStatus
      });

      if (res.success) {
        showToast('success', res.message);
        setIsModalOpen(false);
        loadData();
      } else {
        showToast('error', res.message);
      }
    } else {
      const res = UserService.addUser({
        name: formName.trim(),
        username: formUsername.trim().toLowerCase(),
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        role: formRole,
        pin: formPin.trim(),
        password: formPassword.trim() || undefined,
        permissions: formPermissions,
        status: formStatus
      });

      if (res.success) {
        showToast('success', res.message);
        setIsModalOpen(false);
        loadData();
      } else {
        showToast('error', res.message);
      }
    }
  };

  const handleDeleteUser = (user: StoreUser) => {
    if (user.isPrimaryAdmin) {
      showToast('error', 'Primary Store Administrator cannot be deleted.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove secondary user "${user.name}"?`)) {
      const res = UserService.deleteUser(user.id);
      if (res.success) {
        showToast('success', res.message);
        loadData();
      } else {
        showToast('error', res.message);
      }
    }
  };

  const handleToggleStatus = (user: StoreUser) => {
    if (user.isPrimaryAdmin) {
      showToast('error', 'Primary Admin cannot be deactivated.');
      return;
    }

    const res = UserService.toggleStatus(user.id);
    if (res.success) {
      showToast('success', `User status changed to ${res.user?.status}.`);
      loadData();
    } else {
      showToast('error', res.message);
    }
  };

  const handleSwitchUser = (user: StoreUser) => {
    if (user.status !== 'active') {
      showToast('error', 'Cannot switch to a deactivated user account.');
      return;
    }

    UserService.switchActiveUser(user);
    setActiveUser(user);
    onUserSwitched?.(user);
    showToast('success', `Switched active session to: ${user.name} (${user.role})`);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: StoreUserRole, isPrimary?: boolean) => {
    if (isPrimary) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>PRIMARY OWNER / ADMIN</span>
        </span>
      );
    }

    switch (role) {
      case 'secondary_admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span>SECONDARY ADMIN</span>
          </span>
        );
      case 'staff':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-sky-600" />
            <span>COUNTER STAFF</span>
          </span>
        );
      case 'cashier':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Calculator className="w-3 h-3 text-amber-600" />
            <span>CASHIER & POS</span>
          </span>
        );
      case 'technician':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-purple-600" />
            <span>TECHNICIAN</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-serif tracking-tight">
                User Management (प्रयोगकर्ता तथा कर्मचारी व्यवस्थापन)
              </h2>
              <p className="text-xs text-slate-500">
                Primary Store Admin र Secondary Users (Cashier, Staff, Technician, Sub-Admin) थप्नुहोस् तथा अनुमति तोक्नुहोस्
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={openAddModal}
            className="w-full md:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>नयाँ सेकेन्डरी प्रयोगकर्ता थप्नुहोस् (Add Secondary User)</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Active Session Persona Indicator */}
      {activeUser && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-indigo-900/60 shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-white font-bold text-sm">
              {activeUser.name.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block">
                हाल सक्रिय लगइन (Currently Active Session):
              </span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">{activeUser.name}</span>
                {getRoleBadge(activeUser.role, activeUser.isPrimaryAdmin)}
              </div>
              <p className="text-[11px] text-slate-300">
                Username: <span className="font-mono text-white font-bold">{activeUser.username}</span> | 
                PIN: <span className="font-mono text-amber-300 font-bold">{activeUser.pin}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-300">अर्को प्रयोगकर्तामा स्विच:</span>
            <select
              value={activeUser.id}
              onChange={(e) => {
                const target = users.find(u => u.id === e.target.value);
                if (target) handleSwitchUser(target);
              }}
              className="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-2.5 py-1.5 outline-hidden cursor-pointer"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) {u.isPrimaryAdmin ? '★ Admin' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 block text-[11px]">कुल प्रयोगकर्ताहरू</span>
          <span className="text-xl font-black text-slate-900">{users.length} Users</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <span className="text-indigo-600 font-semibold block text-[11px]">Primary Admin</span>
          <span className="text-xl font-black text-indigo-900">
            {users.filter(u => u.isPrimaryAdmin).length} Owner
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-emerald-600 font-semibold block text-[11px]">सक्रिय सेकेन्डरी प्रयोगकर्ता</span>
          <span className="text-xl font-black text-emerald-900">
            {users.filter(u => !u.isPrimaryAdmin && u.status === 'active').length} Active
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 block text-[11px]">Secondary Roles</span>
          <span className="text-xs font-bold text-slate-700 block mt-1">
            Sub-Admin, Staff, Cashier
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search user by name, username, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-slate-500 shrink-0 font-medium">Filter Role:</span>
          {['all', 'admin', 'secondary_admin', 'staff', 'cashier', 'technician'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.map(user => {
          const isCurrentActive = activeUser?.id === user.id;
          const isRevealed = !!revealedPins[user.id];

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-xs space-y-4 relative ${
                user.isPrimaryAdmin
                  ? 'border-indigo-300 bg-gradient-to-br from-white via-indigo-50/10 to-indigo-50/20'
                  : user.status === 'inactive'
                  ? 'border-slate-200 opacity-60 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header Details */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm ${
                    user.avatarColor || (user.isPrimaryAdmin ? 'bg-indigo-600' : 'bg-slate-700')
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">{user.name}</h3>
                      {user.status === 'inactive' && (
                        <span className="px-2 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">{getRoleBadge(user.role, user.isPrimaryAdmin)}</div>
                  </div>
                </div>

                {/* Status Switch / Badge */}
                {!user.isPrimaryAdmin && (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(user)}
                    className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      user.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                    }`}
                    title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{user.status === 'active' ? 'Active' : 'Inactive'}</span>
                  </button>
                )}
              </div>

              {/* Account Credentials Summary */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Username / Login ID</span>
                  <span className="font-mono font-bold text-slate-900">{user.username}</span>
                  {user.phone && <p className="text-[11px] text-slate-600 mt-0.5">Ph: {user.phone}</p>}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">4-Digit Login PIN</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                      {isRevealed ? user.pin : '••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePinReveal(user.id)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                      title="Reveal / Hide PIN"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {user.password && (
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      Pass: {isRevealed ? user.password : '••••••'}
                    </p>
                  )}
                </div>
              </div>

              {/* Module Permissions Grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  अनुमति दिइएका मोड्युलहरू (Allowed Modules):
                </span>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {user.permissions.canManageProducts && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600" /> Products
                    </span>
                  )}
                  {user.permissions.canManageRateList && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Rate Sheet
                    </span>
                  )}
                  {user.permissions.canManageValuations && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-amber-600" /> Valuation
                    </span>
                  )}
                  {user.permissions.canManageRepairs && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-purple-600" /> Repairs
                    </span>
                  )}
                  {user.permissions.canAccessAccounting && (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-semibold">
                      <Calculator className="w-3 h-3 text-emerald-600" /> Billing / ERP
                    </span>
                  )}
                  {user.permissions.canManageUpcoming && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Upcoming
                    </span>
                  )}
                  {user.permissions.canManageSettings && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1 font-semibold">
                      <Settings className="w-3 h-3 text-slate-600" /> Settings
                    </span>
                  )}
                  {user.permissions.canManageUsers && (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1 font-bold">
                      <Users className="w-3 h-3 text-indigo-600" /> User Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchUser(user)}
                    disabled={isCurrentActive || user.status !== 'active'}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isCurrentActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-default'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isCurrentActive ? 'वर्तमान प्रयोगकर्ता (Active)' : 'यो प्रयोगकर्तामा स्विच गर्नुहोस्'}</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Edit user details & permissions"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!user.isPrimaryAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      title="Delete secondary user"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingUserId ? 'प्रयोगकर्ता सम्पादन (Edit User)' : 'नयाँ सेकेन्डरी प्रयोगकर्ता थप्नुहोस् (Add Secondary User)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    कर्मचारी वा सह-व्यवस्थापकको नाम, ४-अङ्कको पिन र पहुँच अनुमतिहरू तोक्नुहोस्
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              
              {/* Role Presets */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  कर्मचारी पद तथा भूमिका (Select Role / Preset) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyRolePreset('secondary_admin')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      formRole === 'secondary_admin'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Secondary Admin</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal">Full store & accounting access</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRolePreset('staff')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      formRole === 'staff'
                        ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Counter Staff</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal">Products, Rates, Valuations</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRolePreset('cashier')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      formRole === 'cashier'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Calculator className="w-3.5 h-3.5 text-amber-600" />
                      <span>Billing Cashier</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal">POS & Customer Invoicing</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRolePreset('technician')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      formRole === 'technician'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Wrench className="w-3.5 h-3.5 text-purple-600" />
                      <span>Technician</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal">Repairs & Diagnostic</p>
                  </button>
                </div>
              </div>

              {/* General Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">पूरा नाम (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suman Thapa"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    लगइन युजरनेम (Username / Login ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. suman.sales"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">सम्पर्क फोन (Phone Number)</label>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">इमेल (Email - Optional)</label>
                  <input
                    type="email"
                    placeholder="staff@pandeymobile.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* PIN & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                <div>
                  <label className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>४-अङ्कको क्विक लगइन पिन (4-Digit PIN) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="1234"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2.5 border border-amber-300 bg-white rounded-xl font-mono text-base font-black tracking-widest text-slate-900 outline-hidden focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    काउन्टरमा छिटो लगइन गर्न यो ४-अङ्कको पिन प्रयोग हुनेछ।
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>पासवर्ड (Optional Password)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. staff123"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full p-2.5 border border-amber-300 bg-white rounded-xl font-mono outline-hidden focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    पिनको सट्टा पासवर्डबाट लगइन गर्न चाहेमा।
                  </span>
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 block">
                    मोड्युल अनुमतिहरू (Granular Permissions)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPermissions({ ...DEFAULT_ADMIN_PERMISSIONS })}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPermissions({
                        canManageProducts: false,
                        canManageRateList: false,
                        canManageValuations: false,
                        canManageRepairs: false,
                        canManageUpcoming: false,
                        canAccessAccounting: false,
                        canManageSettings: false,
                        canManageUsers: false
                      })}
                      className="text-[10px] text-slate-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageProducts}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageProducts: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block">Products Catalog</span>
                      <span className="text-[10px] text-slate-500">उत्पादन तथा स्टक सम्पादन</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageRateList}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageRateList: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block">Market Rate Sheet</span>
                      <span className="text-[10px] text-slate-500">दैनिक मूल्य तथा रेट सूची</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageValuations}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageValuations: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block">Phone Valuations</span>
                      <span className="text-[10px] text-slate-500">एक्सचेन्ज फोन मूल्याङ्कन</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageRepairs}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageRepairs: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block">Repair Bookings</span>
                      <span className="text-[10px] text-slate-500">मर्मत अर्डर तथा स्थिति</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canAccessAccounting}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canAccessAccounting: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block text-emerald-800">Accounting / ERP Portal</span>
                      <span className="text-[10px] text-slate-500">बिक्री बिलिङ तथा खरिद खाता</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageUpcoming}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageUpcoming: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block">Upcoming & Pre-Book</span>
                      <span className="text-[10px] text-slate-500">आगामी फोन र प्रि-बुकिङ</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageSettings}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageSettings: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block">Web Store Settings</span>
                      <span className="text-[10px] text-slate-500">वेबसाइट सेटिङ तथा ब्याकअप</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageUsers}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageUsers: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block text-indigo-700">User Management</span>
                      <span className="text-[10px] text-slate-500">अन्य कर्मचारी थप्ने/हटाउने</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-bold text-slate-700">खाता स्थिति (Account Status):</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('active')}
                    className={`px-3 py-1 rounded-lg font-bold ${
                      formStatus === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Active (सक्रिय)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('inactive')}
                    className={`px-3 py-1 rounded-lg font-bold ${
                      formStatus === 'inactive' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Inactive (निष्क्रिय)
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  रद्द गर्नुहोस् (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUserId ? 'अपडेट गर्नुहोस् (Save Changes)' : 'प्रयोगकर्ता सुरक्षित गर्नुहोस् (Add User)'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
