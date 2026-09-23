import { StoreUser, StoreUserPermissions, StoreUserRole } from '../types.ts';
import { AuthService, AdminSession } from './authService.ts';

const USERS_STORAGE_KEY = 'pms_admin_users_v2';

export const DEFAULT_ADMIN_PERMISSIONS: StoreUserPermissions = {
  canManageProducts: true,
  canManageRateList: true,
  canManageValuations: true,
  canManageRepairs: true,
  canManageUpcoming: true,
  canAccessAccounting: true,
  canManageSettings: true,
  canManageUsers: true
};

export const DEFAULT_SECONDARY_ADMIN_PERMISSIONS: StoreUserPermissions = {
  canManageProducts: true,
  canManageRateList: true,
  canManageValuations: true,
  canManageRepairs: true,
  canManageUpcoming: true,
  canAccessAccounting: true,
  canManageSettings: false,
  canManageUsers: false
};

export const DEFAULT_STAFF_PERMISSIONS: StoreUserPermissions = {
  canManageProducts: true,
  canManageRateList: true,
  canManageValuations: true,
  canManageRepairs: true,
  canManageUpcoming: false,
  canAccessAccounting: true,
  canManageSettings: false,
  canManageUsers: false
};

export const DEFAULT_CASHIER_PERMISSIONS: StoreUserPermissions = {
  canManageProducts: false,
  canManageRateList: true,
  canManageValuations: true,
  canManageRepairs: false,
  canManageUpcoming: false,
  canAccessAccounting: true,
  canManageSettings: false,
  canManageUsers: false
};

export const DEFAULT_TECHNICIAN_PERMISSIONS: StoreUserPermissions = {
  canManageProducts: false,
  canManageRateList: false,
  canManageValuations: false,
  canManageRepairs: true,
  canManageUpcoming: false,
  canAccessAccounting: false,
  canManageSettings: false,
  canManageUsers: false
};

export class UserService {
  /**
   * Initialize and get all store users (Primary Admin + Secondary Users)
   */
  static getUsers(): StoreUser[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) {
        const parsed: StoreUser[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove any legacy fake users (e.g. user_secondary_admin_1 / bikash.pandey@gmail.com)
          const cleaned = parsed.filter(u => 
            u.id !== 'user_secondary_admin_1' && 
            u.username?.toLowerCase() !== 'bikash' &&
            u.email?.toLowerCase() !== 'bikash.pandey@gmail.com'
          );

          // Make sure primary admin exists
          const hasPrimaryAdmin = cleaned.some(u => u.isPrimaryAdmin || u.email?.toLowerCase() === 'pmesbutwal@gmail.com');
          if (!hasPrimaryAdmin) {
            cleaned.unshift({
              id: 'user_primary_admin',
              name: 'Pandey Mobile Store (Primary Admin)',
              username: 'admin',
              email: 'pmesbutwal@gmail.com',
              phone: '9857039988',
              role: 'admin',
              pin: AuthService.getCustomPin() || '9988',
              password: AuthService.getCustomPassword() || 'pandey123',
              permissions: { ...DEFAULT_ADMIN_PERMISSIONS },
              status: 'active',
              createdAt: '2025-01-01',
              isPrimaryAdmin: true,
              avatarColor: 'bg-indigo-600'
            });
          }

          const hasSecondaryAdmin = cleaned.some(u => u.email?.toLowerCase() === 'info.pandeymobilestore@gmail.com');
          if (!hasSecondaryAdmin) {
            cleaned.push({
              id: 'user_secondary_admin_pms',
              name: 'Pandey Mobile Store (Secondary Admin)',
              username: 'pandeymobile',
              email: 'info.pandeymobilestore@gmail.com',
              phone: '9847460603',
              role: 'admin',
              pin: '9847',
              password: 'pandeystore2026',
              permissions: { ...DEFAULT_ADMIN_PERMISSIONS },
              status: 'active',
              createdAt: '2025-01-01',
              isPrimaryAdmin: false,
              avatarColor: 'bg-emerald-600'
            });
          }

          if (cleaned.length !== parsed.length) {
            this.saveUsers(cleaned);
          }
          return cleaned;
        }
      }
    } catch {
      // ignore
    }

    // Default Seed: Primary Store Admin Only (No fake users)
    const primaryAdminPin = AuthService.getCustomPin() || '9988';
    const primaryAdminPassword = AuthService.getCustomPassword() || 'pandey123';

    const defaultUsers: StoreUser[] = [
      {
        id: 'user_primary_admin',
        name: 'Pandey Mobile Store (Primary Admin)',
        username: 'admin',
        email: 'pmesbutwal@gmail.com',
        phone: '9857039988',
        role: 'admin',
        pin: primaryAdminPin,
        password: primaryAdminPassword,
        permissions: { ...DEFAULT_ADMIN_PERMISSIONS },
        status: 'active',
        createdAt: '2025-01-01',
        isPrimaryAdmin: true,
        avatarColor: 'bg-indigo-600'
      }
    ];

    this.saveUsers(defaultUsers);
    return defaultUsers;
  }

  /**
   * Save users list to localStorage
   */
  static saveUsers(users: StoreUser[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }

  /**
   * Get user by ID
   */
  static getUserById(id: string): StoreUser | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  /**
   * Get user by username or email
   */
  static getUserByUsernameOrEmail(identifier: string): StoreUser | null {
    const clean = identifier.trim().toLowerCase();
    const users = this.getUsers();
    return users.find(u => 
      u.username.toLowerCase() === clean || 
      (u.email && u.email.toLowerCase() === clean)
    ) || null;
  }

  /**
   * Add a new secondary user
   */
  static addUser(userData: Omit<StoreUser, 'id' | 'createdAt'>): { success: boolean; message: string; user?: StoreUser } {
    const cleanName = userData.name.trim();
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanPin = userData.pin.trim();

    if (!cleanName) {
      return { success: false, message: 'Please enter the user full name.' };
    }

    if (!cleanUsername) {
      return { success: false, message: 'Please enter a username or email.' };
    }

    if (!/^\d{4}$/.test(cleanPin)) {
      return { success: false, message: '4-digit Login PIN must be exactly 4 numeric digits.' };
    }

    const users = this.getUsers();
    const existing = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      return { success: false, message: `Username "${cleanUsername}" is already taken by another user.` };
    }

    const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-sky-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: StoreUser = {
      ...userData,
      id: `user_sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      username: cleanUsername,
      pin: cleanPin,
      createdAt: new Date().toISOString().split('T')[0],
      isPrimaryAdmin: false,
      avatarColor: userData.avatarColor || randomColor
    };

    const updated = [...users, newUser];
    this.saveUsers(updated);

    return {
      success: true,
      message: `Secondary user "${cleanName}" created successfully with PIN ${cleanPin}.`,
      user: newUser
    };
  }

  /**
   * Update an existing user
   */
  static updateUser(id: string, updates: Partial<StoreUser>): { success: boolean; message: string; user?: StoreUser } {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return { success: false, message: 'User not found.' };
    }

    const current = users[idx];

    // Primary admin cannot change role away from admin or deactivate
    if (current.isPrimaryAdmin) {
      if (updates.role && updates.role !== 'admin') {
        return { success: false, message: 'Primary Store Admin role cannot be modified.' };
      }
      if (updates.status && updates.status !== 'active') {
        return { success: false, message: 'Primary Store Admin cannot be deactivated.' };
      }
    }

    // Check username uniqueness if changed
    if (updates.username && updates.username.trim().toLowerCase() !== current.username.toLowerCase()) {
      const cleanNewUsername = updates.username.trim().toLowerCase();
      const duplicate = users.find(u => u.id !== id && u.username.toLowerCase() === cleanNewUsername);
      if (duplicate) {
        return { success: false, message: `Username "${cleanNewUsername}" is already taken.` };
      }
    }

    // Check PIN validation if updated
    if (updates.pin && !/^\d{4}$/.test(updates.pin.trim())) {
      return { success: false, message: 'PIN must be exactly 4 numeric digits.' };
    }

    const updatedUser: StoreUser = {
      ...current,
      ...updates,
      id: current.id,
      isPrimaryAdmin: current.isPrimaryAdmin
    };

    users[idx] = updatedUser;
    this.saveUsers(users);

    // If updating currently logged in user, refresh session
    const session = AuthService.getLocalSession();
    if (session && (session.email === current.username || session.email === current.email)) {
      this.syncSessionForUser(updatedUser);
    }

    return {
      success: true,
      message: `User "${updatedUser.name}" updated successfully.`,
      user: updatedUser
    };
  }

  /**
   * Delete a secondary user (Primary admin cannot be deleted)
   */
  static deleteUser(id: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    if (user.isPrimaryAdmin) {
      return { success: false, message: 'Primary Store Admin cannot be deleted.' };
    }

    const filtered = users.filter(u => u.id !== id);
    this.saveUsers(filtered);

    return {
      success: true,
      message: `Secondary user "${user.name}" has been removed.`
    };
  }

  /**
   * Toggle user active/inactive status
   */
  static toggleStatus(id: string): { success: boolean; message: string; user?: StoreUser } {
    const user = this.getUserById(id);
    if (!user) return { success: false, message: 'User not found.' };
    if (user.isPrimaryAdmin) return { success: false, message: 'Primary Admin status cannot be altered.' };

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    return this.updateUser(id, { status: newStatus });
  }

  /**
   * Login validation for both Admin and Secondary Users (via username/email + PIN or Password)
   */
  static authenticate(identifier: string, secret: string): { success: boolean; message: string; user?: StoreUser } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanSecret = secret.trim();

    if (!cleanId || !cleanSecret) {
      return { success: false, message: 'Please provide both username/email and PIN or password.' };
    }

    const users = this.getUsers();
    const user = users.find(u => 
      u.username.toLowerCase() === cleanId || 
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.phone && u.phone === cleanId)
    );

    if (!user) {
      return { success: false, message: 'User account not found.' };
    }

    if (user.status !== 'active') {
      return { success: false, message: 'This user account is currently deactivated. Please contact store owner.' };
    }

    // Match either 4-digit PIN or password
    const pinMatches = user.pin === cleanSecret;
    const passMatches = user.password && user.password === cleanSecret;
    // Primary Admin fallback
    const primaryPinMatches = user.isPrimaryAdmin && (cleanSecret === AuthService.getCustomPin() || cleanSecret === AuthService.getMasterPin6Digit());
    const primaryPassMatches = user.isPrimaryAdmin && (cleanSecret === AuthService.getCustomPassword() || cleanSecret === 'pandey123' || cleanSecret === 'pmes123');

    if (!pinMatches && !passMatches && !primaryPinMatches && !primaryPassMatches) {
      return { success: false, message: 'Incorrect PIN or password.' };
    }

    // Update lastLoginAt
    this.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    // Establish session
    this.syncSessionForUser(user);

    return {
      success: true,
      message: `Welcome back, ${user.name}!`,
      user
    };
  }

  /**
   * Quick login by PIN directly (e.g. for fast shift handover on the POS counter)
   */
  static authenticateByPin(pin: string, preferredUserId?: string): { success: boolean; message: string; user?: StoreUser } {
    const cleanPin = pin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return { success: false, message: 'PIN must be 4 digits.' };
    }

    const users = this.getUsers().filter(u => u.status === 'active');

    if (preferredUserId) {
      const targeted = users.find(u => u.id === preferredUserId);
      if (targeted && targeted.pin === cleanPin) {
        this.updateUser(targeted.id, { lastLoginAt: new Date().toISOString() });
        this.syncSessionForUser(targeted);
        return { success: true, message: `Logged in as ${targeted.name}`, user: targeted };
      }
    }

    // Search matching user
    const matched = users.find(u => u.pin === cleanPin);
    if (matched) {
      this.updateUser(matched.id, { lastLoginAt: new Date().toISOString() });
      this.syncSessionForUser(matched);
      return { success: true, message: `Logged in as ${matched.name}`, user: matched };
    }

    return { success: false, message: 'No active user found with this 4-digit PIN.' };
  }

  /**
   * Switch the current active session to another user (for Admin to easily switch or test)
   */
  static switchActiveUser(user: StoreUser): void {
    this.syncSessionForUser(user);
  }

  /**
   * Sync AdminSession in authService so permissions and roles take effect across the entire app
   */
  private static syncSessionForUser(user: StoreUser): void {
    const roleLabels: Record<StoreUserRole, string> = {
      admin: 'Store Administrator & Owner',
      secondary_admin: 'Secondary Administrator',
      staff: 'Store Sales & Counter Staff',
      cashier: 'Counter Cashier & Billing',
      technician: 'Repair Technician'
    };

    const session: AdminSession = {
      token: `pms_admin_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: user.email || user.username,
      name: user.name,
      role: roleLabels[user.role] || user.role,
      storeBranch: 'Traffic Chowk, Butwal',
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      userId: user.id,
      isPrimaryAdmin: user.isPrimaryAdmin,
      permissions: user.permissions
    };

    AuthService.saveLocalSession(session);
  }

  /**
   * Get currently active logged-in user profile from session
   */
  static getActiveUser(): StoreUser | null {
    const session = AuthService.getLocalSession();
    if (!session) return null;

    const users = this.getUsers();
    if (session.userId) {
      const user = users.find(u => u.id === session.userId);
      if (user) return user;
    }

    // Fallback match by email or username
    const matched = users.find(u => 
      u.email?.toLowerCase() === session.email.toLowerCase() || 
      u.username.toLowerCase() === session.email.toLowerCase()
    );

    if (matched) return matched;

    // Default primary admin
    return users.find(u => u.isPrimaryAdmin) || users[0] || null;
  }
}
