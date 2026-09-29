import React, { useState, useEffect, useMemo } from 'react';
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
  Power,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  LayoutGrid,
  List,
  ArrowRight,
  ShieldAlert,
  Save,
  CheckSquare,
  Square
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
import { AuthService } from '../../services/authService.ts';
import { AuditLogService } from '../../services/auditService.ts';
import { SecurityPinManager } from './SecurityPinManager.tsx';

interface UserManagerProps {
  onUserSwitched?: (user: StoreUser) => void;
  onPinChanged?: () => void;
  initialSubTab?: 'users' | 'security';
}

export const UserManager: React.FC<UserManagerProps> = ({ onUserSwitched, onPinChanged }) => {
  const [users, setUsers] = useState<StoreUser[]>([]);
  const [activeUser, setActiveUser] = useState<StoreUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Master Admin Quick Security Controls State
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  const [showMasterPin6, setShowMasterPin6] = useState(false);
  const [quickMasterPin, setQuickMasterPin] = useState(() => AuthService.getMasterPin6Digit());
  const [quickAdminPassword, setQuickAdminPassword] = useState(() => AuthService.getCustomPassword() || 'pandey123');
  const [isChangingMasterPin, setIsChangingMasterPin] = useState(false);
  const [newMasterPinInput, setNewMasterPinInput] = useState('');
  const [confirmMasterPinInput, setConfirmMasterPinInput] = useState('');
  const [isChangingAdminPass, setIsChangingAdminPass] = useState(false);
  const [newAdminPassInput, setNewAdminPassInput] = useState('');

  // Quick Test PIN
  const [testPinInput, setTestPinInput] = useState('');
  const [testPinResult, setTestPinResult] = useState<{ status: 'idle' | 'success' | 'fail'; msg: string }>({ status: 'idle', msg: '' });

  // Add / Edit Modal State
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
  const [showFormPin, setShowFormPin] = useState(false);
  const [formPassword, setFormPassword] = useState('');
  const [showFormPass, setShowFormPass] = useState(false);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPermissions, setFormPermissions] = useState<StoreUserPermissions>({ ...DEFAULT_STAFF_PERMISSIONS });

  const loadData = () => {
    const list = UserService.getUsers();
    setUsers(list);
    const curr = UserService.getActiveUser();
    setActiveUser(curr);
    setQuickMasterPin(AuthService.getMasterPin6Digit());
    setQuickAdminPassword(AuthService.getCustomPassword() || 'pandey123');
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

  // Open Add Modal
  const openAddModal = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('staff');
    setFormPin('');
    setShowFormPin(false);
    setFormPassword('');
    setShowFormPass(false);
    setFormStatus('active');
    setFormPermissions({ ...DEFAULT_STAFF_PERMISSIONS });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (user: StoreUser) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email || '');
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormPin(user.pin);
    setShowFormPin(false);
    setFormPassword(user.password || '');
    setShowFormPass(false);
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

    if (!formName.trim()) {
      showToast('error', 'कृपया कर्मचारीको पूरा नाम राख्नुहोस् (Full name is required).');
      return;
    }

    if (!formUsername.trim()) {
      showToast('error', 'लगइन युजरनेम राख्नुहोस् (Username is required).');
      return;
    }

    if (!/^\d{4}$/.test(formPin.trim())) {
      showToast('error', '४-अङ्कको पिन ठीक ४ अङ्कको (०-९) संख्या हुनुपर्छ (PIN must be exactly 4 digits).');
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
        AuditLogService.logAction({
          action: 'USER_UPDATED',
          category: 'USER_MGMT',
          status: 'SUCCESS',
          details: `प्रयोगकर्ता सम्पादन: ${formName.trim()} (@${formUsername.trim().toLowerCase()}) - पद: ${formRole}`
        });
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
        AuditLogService.logAction({
          action: 'USER_CREATED',
          category: 'USER_MGMT',
          status: 'SUCCESS',
          details: `नयाँ कर्मचारी थप: ${formName.trim()} (@${formUsername.trim().toLowerCase()}) - पद: ${formRole}`
        });
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
      showToast('error', 'Primary Store Administrator हटाउन सकिँदैन।');
      return;
    }

    if (window.confirm(`के तपाईं निश्चित हुनुहुन्छ कि कर्मचारी "${user.name}" लाई हटाउन चाहनुहुन्छ?`)) {
      const res = UserService.deleteUser(user.id);
      if (res.success) {
        AuditLogService.logAction({
          action: 'USER_DELETED',
          category: 'USER_MGMT',
          status: 'SUCCESS',
          details: `कर्मचारी हटाइयो: ${user.name} (@${user.username})`
        });
        showToast('success', res.message);
        loadData();
      } else {
        showToast('error', res.message);
      }
    }
  };

  const handleToggleStatus = (user: StoreUser) => {
    if (user.isPrimaryAdmin) {
      showToast('error', 'Primary Admin लाई निष्क्रिय गर्न सकिँदैन।');
      return;
    }

    const res = UserService.toggleStatus(user.id);
    if (res.success) {
      AuditLogService.logAction({
        action: 'USER_STATUS_TOGGLED',
        category: 'USER_MGMT',
        status: 'SUCCESS',
        details: `कर्मचारी स्थिति परिवर्तन: ${user.name} -> ${res.user?.status}`
      });
      showToast('success', `प्रयोगकर्ता खाता ${res.user?.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'} गरियो।`);
      loadData();
    } else {
      showToast('error', res.message);
    }
  };

  const handleSwitchUser = (user: StoreUser) => {
    if (user.status !== 'active') {
      showToast('error', 'निष्क्रिय खातामा स्विच गर्न सकिँदैन।');
      return;
    }

    UserService.switchActiveUser(user);
    setActiveUser(user);
    AuditLogService.logAction({
      action: 'USER_SWITCHED',
      category: 'AUTH',
      status: 'SUCCESS',
      details: `सत्र स्विच गरियो: ${user.name} (${user.role})`
    });
    onUserSwitched?.(user);
    showToast('success', `सफल स्विच: ${user.name} (${user.role})`);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Quick Master PIN 6-digit save
  const handleQuickSaveMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newMasterPinInput.trim())) {
      showToast('error', 'मास्टर पिन ठीक ६ अङ्कको हुनुपर्छ (Must be exactly 6 digits).');
      return;
    }
    if (newMasterPinInput.trim() !== confirmMasterPinInput.trim()) {
      showToast('error', 'नयाँ पिन र कन्फर्म पिन मिलेन (PINs do not match).');
      return;
    }
    const res = AuthService.setMasterPin6Digit(newMasterPinInput.trim());
    if (res.success) {
      AuditLogService.logAction({
        action: 'MASTER_PIN_CHANGED',
        category: 'SECURITY',
        status: 'SUCCESS',
        details: 'नयाँ ६-अङ्कको मास्टर सुरक्षा पिन सफलतापूर्वक परिवर्तन गरियो'
      });
      showToast('success', '६-अङ्कको मास्टर पिन सफलतापूर्वक अपडेट भयो!');
      setIsChangingMasterPin(false);
      setNewMasterPinInput('');
      setConfirmMasterPinInput('');
      loadData();
      onPinChanged?.();
    } else {
      showToast('error', res.message);
    }
  };

  // Quick Admin Password save
  const handleQuickSaveAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassInput.trim()) {
      showToast('error', 'कृपया नयाँ पासवर्ड टाइप गर्नुहोस्।');
      return;
    }
    const res = AuthService.setCustomPassword(newAdminPassInput.trim());
    if (res.success) {
      AuditLogService.logAction({
        action: 'ADMIN_PASSWORD_CHANGED',
        category: 'SECURITY',
        status: 'SUCCESS',
        details: 'मुख्य एडमिन पासवर्ड सफलतापूर्वक अपडेट गरियो'
      });
      showToast('success', 'मुख्य एडमिन पासवर्ड सफलतापूर्वक परिवर्तन भयो!');
      setIsChangingAdminPass(false);
      setNewAdminPassInput('');
      loadData();
    } else {
      showToast('error', res.message);
    }
  };

  // Quick Test PIN verification
  const handleTestPin = () => {
    const clean = testPinInput.trim();
    if (!clean) return;
    const isMaster6 = clean === AuthService.getMasterPin6Digit();
    const isCustom4 = clean === AuthService.getCustomPin();
    const matchedUser = users.find(u => u.pin === clean && u.status === 'active');

    if (isMaster6) {
      setTestPinResult({ status: 'success', msg: `✓ मान्य ६-अङ्कको MASTER PIN (Primary Store Owner)` });
    } else if (isCustom4) {
      setTestPinResult({ status: 'success', msg: `✓ मान्य ४-अङ्कको Admin PIN (Primary Admin)` });
    } else if (matchedUser) {
      setTestPinResult({ status: 'success', msg: `✓ मान्य PIN: ${matchedUser.name} (${matchedUser.role})` });
    } else {
      setTestPinResult({ status: 'fail', msg: `✕ कुनै पनि खाता वा मास्टर पिनसँग मेल खाएन!` });
    }
  };

  const primaryAdmin = useMemo(() => users.find(u => u.isPrimaryAdmin) || users[0], [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm)) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const getRoleBadge = (role: StoreUserRole, isPrimary?: boolean) => {
    if (isPrimary) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>PRIMARY OWNER</span>
        </span>
      );
    }

    switch (role) {
      case 'secondary_admin':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span>SECONDARY ADMIN</span>
          </span>
        );
      case 'staff':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-sky-600" />
            <span>COUNTER STAFF</span>
          </span>
        );
      case 'cashier':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Calculator className="w-3 h-3 text-amber-600" />
            <span>BILLING CASHIER</span>
          </span>
        );
      case 'technician':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-purple-600" />
            <span>TECHNICIAN</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all shadow-sm ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP COMPACT UNIFIED HEADER: ADMIN & STAFF TOGETHER IN ONE PLACE */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-indigo-900/50 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Title & Brand */}
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white font-serif">
                  प्रयोगकर्ता तथा एडमिन सुरक्षा कन्सोल
                </h2>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  Admin + Staff Unified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                मुख्य एडमिन (Master PIN & Password) र कर्मचारी (Staff, Cashier, Sub-Admin) एकै ठाउँमा व्यवस्थापन
              </p>
            </div>
          </div>

          {/* Quick Action Buttons on Top Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={openAddModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>नयाँ कर्मचारी थप्नुहोस् (Add Staff)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>{isSecurityExpanded ? 'सुरक्षा प्यानल लुकाउनुहोस्' : 'मास्टर सुरक्षा सेटिङ'}</span>
              {isSecurityExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>

        {/* ACTIVE PRIMARY ADMIN STRIP (Clean & Compact) */}
        {primaryAdmin && (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                P
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-white text-xs sm:text-sm">{primaryAdmin.name}</span>
                  {getRoleBadge('admin', true)}
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                    ● सक्रिय
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-300 font-mono mt-0.5 flex-wrap">
                  <span>User: <strong className="text-white">@{primaryAdmin.username}</strong></span>
                  <span>इमेल: <strong className="text-indigo-300">{primaryAdmin.email}</strong></span>
                  <span>फोन: <strong className="text-slate-200">{primaryAdmin.phone}</strong></span>
                </div>
              </div>
            </div>

            {/* Credentials Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* 6-Digit Master PIN Display */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-slate-400 font-bold">मास्टर ६-PIN:</span>
                <span className="font-mono font-black text-amber-300 text-xs tracking-wider">
                  {showMasterPin6 ? quickMasterPin : '••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowMasterPin6(!showMasterPin6)}
                  className="text-slate-400 hover:text-white p-0.5 ml-0.5 cursor-pointer"
                  title="Show/Hide Master PIN"
                >
                  {showMasterPin6 ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>

              {/* Password Display */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] text-slate-400 font-bold">पासवर्ड:</span>
                <span className="font-mono font-bold text-slate-200 text-xs">
                  {showMasterPin6 ? quickAdminPassword : '••••••••'}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* COLLAPSIBLE ADMIN MASTER SECURITY & PIN SECTION */}
      {isSecurityExpanded && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm space-y-4 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  मुख्य एडमिन सुरक्षा नियन्त्रण (Admin Master PIN & Password Management)
                </h3>
                <p className="text-[11px] text-slate-500">
                  मास्टर ६-अङ्कको PIN र एडमिन लगइन पासवर्ड तुरुन्त परिवर्तन वा परीक्षण गर्नुहोस्
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSecurityExpanded(false)}
              className="text-slate-400 hover:text-slate-700 text-xs p-1"
            >
              ✕ बन्द
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            
            {/* Box 1: Change 6-Digit Master PIN */}
            <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>६-अङ्कको मास्टर पिन (Master PIN)</span>
                  </span>
                  <span className="font-mono font-bold text-amber-800 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                    {quickMasterPin}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-2">
                  प्रशासनिक परिवर्तन र सुपर-एडमिन पहुँचका लागि प्रयोग हुने ६-अङ्कको मास्टर कोड।
                </p>
              </div>

              {!isChangingMasterPin ? (
                <button
                  type="button"
                  onClick={() => setIsChangingMasterPin(true)}
                  className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  नयाँ मास्टर PIN सेट गर्नुहोस्
                </button>
              ) : (
                <form onSubmit={handleQuickSaveMasterPin} className="space-y-2 mt-2 pt-2 border-t border-amber-200">
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="नयाँ ६-अङ्कको पिन (e.g. 985703)"
                    value={newMasterPinInput}
                    onChange={(e) => setNewMasterPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg font-mono text-center font-bold tracking-widest text-slate-900 text-xs outline-hidden"
                    required
                  />
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="पिन पुनः पुष्टि गर्नुहोस्"
                    value={confirmMasterPinInput}
                    onChange={(e) => setConfirmMasterPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg font-mono text-center font-bold tracking-widest text-slate-900 text-xs outline-hidden"
                    required
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      सुरक्षित गर्नुहोस्
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingMasterPin(false)}
                      className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      रद्द
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Box 2: Change Admin Password */}
            <div className="bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>एडमिन पासवर्ड (Password)</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-800 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                    {quickAdminPassword}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-2">
                  एडमिन लगइन स्क्रिनमा युजरनेमसँगै प्रयोग हुने मुख्य व्यवस्थापक पासवर्ड।
                </p>
              </div>

              {!isChangingAdminPass ? (
                <button
                  type="button"
                  onClick={() => setIsChangingAdminPass(true)}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  पासवर्ड परिवर्तन गर्नुहोस्
                </button>
              ) : (
                <form onSubmit={handleQuickSaveAdminPassword} className="space-y-2 mt-2 pt-2 border-t border-indigo-200">
                  <input
                    type="text"
                    placeholder="नयाँ पासवर्ड राख्नुहोस्"
                    value={newAdminPassInput}
                    onChange={(e) => setNewAdminPassInput(e.target.value)}
                    className="w-full p-2 bg-white border border-indigo-300 rounded-lg font-mono text-slate-900 text-xs outline-hidden"
                    required
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      सुरक्षित गर्नुहोस्
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingAdminPass(false)}
                      className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      रद्द
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Box 3: Quick PIN Tester */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                  <span>पिन परीक्षण (Quick PIN Verification)</span>
                </span>
                <p className="text-[11px] text-slate-500 mb-2">
                  कुनै पनि पिन टाइप गरी कुन खाता वा मास्टर पिन हो तुरुन्त परीक्षण गर्नुहोस्:
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="पिन टाइप गर्नुहोस्..."
                    value={testPinInput}
                    onChange={(e) => setTestPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleTestPin}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                  >
                    टेस्ट
                  </button>
                </div>
              </div>

              {testPinResult.status !== 'idle' && (
                <div className={`mt-2 p-2 rounded-lg text-[11px] font-bold ${
                  testPinResult.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {testPinResult.msg}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* STICKY SEARCH & FILTER TOOLBAR (REMAINS VISIBLE WHEN SCROLLED) */}
      <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="नाम, युजरनेम वा फोन खोजी..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-hidden focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition"
          />
        </div>

        {/* Role Filters & View Mode */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: 'all', label: `सबै (${users.length})` },
              { id: 'admin', label: 'Admin' },
              { id: 'secondary_admin', label: 'Sub-Admin' },
              { id: 'staff', label: 'Staff' },
              { id: 'cashier', label: 'Cashier' },
              { id: 'technician', label: 'Tech' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoleFilter(r.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  roleFilter === r.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1 rounded-md transition ${viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded-md transition ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="Compact Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* COMPACT & USER-FRIENDLY USER LIST: CARDS VIEW */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredUsers.map(user => {
            const isCurrentActive = activeUser?.id === user.id;
            const isRevealed = !!revealedPins[user.id];

            return (
              <div
                key={user.id}
                className={`rounded-2xl border transition-all p-3.5 sm:p-4 shadow-xs hover:shadow-md flex flex-col justify-between gap-2.5 relative ${
                  user.isPrimaryAdmin
                    ? 'border-indigo-300 bg-gradient-to-br from-white via-indigo-50/20 to-indigo-50/40 ring-1 ring-indigo-400/20'
                    : user.status === 'inactive'
                    ? 'border-slate-200 opacity-60 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Top Row: User Avatar, Name, Role Badge, and Action Buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs ${
                        user.avatarColor || (user.isPrimaryAdmin ? 'bg-indigo-600' : 'bg-slate-700')
                      }`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {user.name}
                        </h3>
                        {getRoleBadge(user.role, user.isPrimaryAdmin)}
                        {user.status === 'inactive' && (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] font-bold rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        @{user.username} {user.phone && <span className="text-slate-400 font-sans">• {user.phone}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Action Controls: Power, Edit, Delete */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {!user.isPrimaryAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400 border-slate-300 hover:bg-slate-200'
                        }`}
                        title={user.status === 'active' ? 'Deactivate User (निष्क्रिय गर्नुहोस्)' : 'Activate User (सक्रिय गर्नुहोस्)'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition cursor-pointer"
                      title="सम्पादन गर्नुहोस् (Edit User)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!user.isPrimaryAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                        title="मेटाउनुहोस् (Delete User)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Compact Middle: Credentials & Module Permissions in one tight row */}
                <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  {/* PIN & Password */}
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">PIN:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs tracking-wider bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {isRevealed ? user.pin : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePinReveal(user.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                        title="Show/Hide PIN"
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>

                    {user.password && (
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Pass:</span>
                        <span className="font-mono font-bold text-slate-700 text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {isRevealed ? user.password : '••••'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Permission Micro-Pills */}
                  <div className="flex items-center gap-1 flex-wrap text-[10px]">
                    {user.permissions.canManageProducts && (
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 flex items-center gap-0.5 font-medium" title="Products">
                        <Layers className="w-2.5 h-2.5 text-indigo-500" /> Prod
                      </span>
                    )}
                    {user.permissions.canManageRateList && (
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 flex items-center gap-0.5 font-medium" title="Rates">
                        <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-500" /> Rates
                      </span>
                    )}
                    {user.permissions.canManageValuations && (
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 flex items-center gap-0.5 font-medium" title="Valuation">
                        <Smartphone className="w-2.5 h-2.5 text-amber-500" /> Val
                      </span>
                    )}
                    {user.permissions.canManageRepairs && (
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 flex items-center gap-0.5 font-medium" title="Repairs">
                        <Wrench className="w-2.5 h-2.5 text-purple-500" /> Repair
                      </span>
                    )}
                    {user.permissions.canAccessAccounting && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-0.5 font-bold" title="Accounting / ERP">
                        <Calculator className="w-2.5 h-2.5 text-emerald-600" /> ERP
                      </span>
                    )}
                    {user.permissions.canManageSettings && (
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 flex items-center gap-0.5 font-medium" title="Settings">
                        <Settings className="w-2.5 h-2.5 text-slate-500" /> Config
                      </span>
                    )}
                    {user.permissions.canManageUsers && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-0.5 font-bold" title="User Management">
                        <Users className="w-2.5 h-2.5 text-indigo-600" /> Users
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Status Indicator & Switch Session Button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div>
                    {isCurrentActive ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>वर्तमान सत्र (Active Session)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {user.status === 'active' ? 'लगइनको लागि तयार' : 'खाता निष्क्रिय'}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSwitchUser(user)}
                    disabled={isCurrentActive || user.status !== 'active'}
                    className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCurrentActive
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isCurrentActive ? 'वर्तमान' : 'स्विच गर्नुहोस्'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">कर्मचारी (Staff Name)</th>
                <th className="py-2.5 px-3">भूमिका (Role)</th>
                <th className="py-2.5 px-3">पिन / पासवर्ड</th>
                <th className="py-2.5 px-3">सम्पर्क (Contact)</th>
                <th className="py-2.5 px-3">मोड्युल पहुँच (Access)</th>
                <th className="py-2.5 px-3 text-right">कार्यहरू (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => {
                const isCurrentActive = activeUser?.id === user.id;
                const isRevealed = !!revealedPins[user.id];

                return (
                  <tr key={user.id} className={`hover:bg-slate-50/80 transition ${isCurrentActive ? 'bg-indigo-50/20' : ''}`}>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${user.avatarColor || 'bg-slate-700'}`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block truncate">{user.name}</span>
                          <span className="font-mono text-[10px] text-slate-500">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {getRoleBadge(user.role, user.isPrimaryAdmin)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          PIN: {isRevealed ? user.pin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinReveal(user.id)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                      {user.phone || user.email || '—'}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1 flex-wrap max-w-xs text-[10px]">
                        {user.permissions.canManageProducts && <span className="px-1 py-0.2 bg-slate-100 rounded text-slate-700">Prod</span>}
                        {user.permissions.canManageRateList && <span className="px-1 py-0.2 bg-slate-100 rounded text-slate-700">Rates</span>}
                        {user.permissions.canManageValuations && <span className="px-1 py-0.2 bg-slate-100 rounded text-slate-700">Val</span>}
                        {user.permissions.canManageRepairs && <span className="px-1 py-0.2 bg-slate-100 rounded text-slate-700">Rep</span>}
                        {user.permissions.canAccessAccounting && <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">ERP</span>}
                        {user.permissions.canManageSettings && <span className="px-1 py-0.2 bg-slate-100 rounded text-slate-700">Config</span>}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleSwitchUser(user)}
                          disabled={isCurrentActive || user.status !== 'active'}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                            isCurrentActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isCurrentActive ? 'वर्तमान' : 'स्विच'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="p-1 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!user.isPrimaryAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* REDESIGNED "ADD / EDIT USER" MODAL (COMPACT, FRIENDLY & FULLY VISIBLE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* FIXED MODAL HEADER */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {editingUserId ? 'कर्मचारी विवरण सम्पादन (Edit User)' : 'नयाँ कर्मचारी थप्नुहोस् (Add New Staff / User)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    पद अनुसार स्वचालित अनुमतिहरू र ४-अङ्कको क्विक लगइन पिन तोक्नुहोस्
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY (SMOOTH & FRIENDLY) */}
            <form onSubmit={handleSaveUser} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto max-h-[calc(92vh-130px)]">
                
                {/* 1. ROLE PRESETS (COMPACT & FRIENDLY CARDS) */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                    <span>१. कर्मचारी पद तथा भूमिका (Select Role / 1-Click Preset) *</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">क्लिक गर्दा स्वतः अनुमति सेट हुन्छ</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    
                    <button
                      type="button"
                      onClick={() => applyRolePreset('secondary_admin')}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        formRole === 'secondary_admin'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate text-xs">Sub-Admin</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight">पूर्ण स्टोर तथा लेखा पहुँच</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyRolePreset('staff')}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        formRole === 'staff'
                          ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs ring-1 ring-sky-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate text-xs">Counter Staff</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight">सामान, रेट तथा एक्सचेन्ज</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyRolePreset('cashier')}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        formRole === 'cashier'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs ring-1 ring-amber-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Calculator className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate text-xs">Billing Cashier</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight">POS र ग्राहक बिलिङ</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyRolePreset('technician')}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        formRole === 'technician'
                          ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs ring-1 ring-purple-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Wrench className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="truncate text-xs">Technician</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight">मर्मत तथा सेवा ट्र्याकिङ</p>
                    </button>

                  </div>
                </div>

                {/* 2. GENERAL FIELDS (COMPACT 2-COLUMN GRID) */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    २. कर्मचारीको आधारभूत विवरण (General Details) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">पूरा नाम (Full Name) *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Suman Thapa"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-xl outline-hidden focus:border-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">लगइन युजरनेम (Username) *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. suman.sales"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono text-xs outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">सम्पर्क फोन (Phone Number)</span>
                      <input
                        type="tel"
                        placeholder="98XXXXXXXX"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-xl outline-hidden focus:border-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">इमेल (Email - Optional)</span>
                      <input
                        type="email"
                        placeholder="staff@pandeymobile.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-xl outline-hidden focus:border-indigo-500 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SECURITY & CREDENTIALS (PIN & PASSWORD) */}
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-2">
                  <label className="font-bold text-slate-900 block flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>३. लगइन सुरक्षा (Quick 4-Digit PIN & Password) *</span>
                    </span>
                    <span className="text-[10px] text-amber-800 font-normal">काउन्टरमा छिटो लगइनको लागि</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-800">४-अङ्कको क्विक पिन (4-Digit PIN) *</span>
                        <span className="text-[10px] font-mono font-bold text-amber-700">{formPin.length}/4 digits</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showFormPin ? 'text' : 'password'}
                          required
                          maxLength={4}
                          placeholder="1234"
                          value={formPin}
                          onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-2 pr-8 border border-amber-300 bg-white rounded-xl font-mono text-sm font-black tracking-widest text-slate-900 outline-hidden focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFormPin(!showFormPin)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showFormPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block mb-1">पासवर्ड (Optional Password)</span>
                      <div className="relative">
                        <input
                          type={showFormPass ? 'text' : 'password'}
                          placeholder="e.g. staff123"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          className="w-full p-2 pr-8 border border-amber-300 bg-white rounded-xl font-mono text-xs outline-hidden focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFormPass(!showFormPass)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showFormPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. GRANULAR MODULE PERMISSIONS (CLEAN & FRIENDLY CHECKBOXES) */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-900 block">
                      ४. विस्तृत मोड्युल पहुँच अनुमतिहरू (Module Permissions)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormPermissions({ ...DEFAULT_ADMIN_PERMISSIONS })}
                        className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        सबै अन गर्नुहोस् (Select All)
                      </button>
                      <span className="text-slate-300">•</span>
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
                        className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                      >
                        खाली गर्नुहोस् (Clear All)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                    
                    <label className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageProducts}
                        onChange={(e) => setFormPermissions({ ...formPermissions, canManageProducts: e.target.checked })}
                        className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" /> Products Catalog
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">उत्पादन तथा स्टक सम्पादन</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageRateList}
                        onChange={(e) => setFormPermissions({ ...formPermissions, canManageRateList: e.target.checked })}
                        className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Market Rate Sheet
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">दैनिक मूल्य तथा रेट सूची</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageValuations}
                        onChange={(e) => setFormPermissions({ ...formPermissions, canManageValuations: e.target.checked })}
                        className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-amber-500" /> Phone Valuations
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">एक्सचेन्ज फोन मूल्याङ्कन</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageRepairs}
                        onChange={(e) => setFormPermissions({ ...formPermissions, canManageRepairs: e.target.checked })}
                        className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-purple-500" /> Repair Bookings
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">मर्मत अर्डर तथा स्थिति</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200 bg-emerald-50/50">
                      <input
                        type="checkbox"
                        checked={formPermissions.canAccessAccounting}
                        onChange={(e) => setFormPermissions({ ...formPermissions, canAccessAccounting: e.target.checked })}
                        className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-emerald-900 flex items-center gap-1">
                          <Calculator className="w-3.5 h-3.5 text-emerald-600" /> Accounting / ERP
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">बिक्री बिलिङ तथा खरिद खाता</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageUpcoming}
                        onChange={(e) => setFormPermissions({ ...formPermissions, canManageUpcoming: e.target.checked })}
                        className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Upcoming Models
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">आगामी फोन र प्रि-बुकिङ</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageSettings}
                        onChange={(e) => setFormPermissions({ ...formPermissions, canManageSettings: e.target.checked })}
                        className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          <Settings className="w-3.5 h-3.5 text-slate-500" /> Store Settings
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">वेबसाइट सेटिङ तथा ब्याकअप</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200">
                      <input
                        type="checkbox"
                        checked={formPermissions.canManageUsers}
                        onChange={(e) => setFormPermissions({ ...formPermissions, canManageUsers: e.target.checked })}
                        className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-indigo-800 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-600" /> User Management
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">कर्मचारी थप्ने/हटाउने अधिकार</span>
                      </div>
                    </label>

                  </div>
                </div>

                {/* 5. ACCOUNT STATUS */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800">खाता स्थिति (Account Status):</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormStatus('active')}
                      className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition ${
                        formStatus === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Active (सक्रिय)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('inactive')}
                      className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition ${
                        formStatus === 'inactive' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Inactive (निष्क्रिय)
                    </button>
                  </div>
                </div>

              </div>

              {/* FIXED MODAL FOOTER (ALWAYS VISIBLE & NEVER CUT OFF) */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  रद्द गर्नुहोस् (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUserId ? 'अपडेट सुरक्षित गर्नुहोस् (Save Changes)' : 'प्रयोगकर्ता थप्नुहोस् (Add User)'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
