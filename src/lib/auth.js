// ============================================================================
// NOBO FASHION — Authentication Helpers (JWT / Session)
// ============================================================================
const bcrypt = require('bcryptjs');
const { get, run, insert } = require('./db');

// Verify user password
function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

// Hash password
function hashPassword(plainPassword) {
  return bcrypt.hashSync(plainPassword, 10);
}

// Authenticate user with email/phone & password
function authenticateUser(identifier, password) {
  if (!identifier || !password) return null;

  const normalizedIdentifier = identifier.toLowerCase().trim();

  // Search by email or phone
  let user = get(
    `SELECT u.*, r.name AS role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE (u.email = ? OR u.phone = ?) AND u.status = 'active'`,
    [normalizedIdentifier, identifier.trim()]
  );

  // Preserve access to the existing Super Admin when the configured admin
  // email has changed since the local database was seeded.
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  if (!user && configuredAdminEmail && normalizedIdentifier === configuredAdminEmail) {
    user = get(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.user_type = 'admin' AND u.status = 'active' AND r.name = 'Super Admin'
       ORDER BY u.id ASC LIMIT 1`
    );
  }

  if (!user) return null;

  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  // Update last login
  run("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", [user.id]);

  // Don't return password hash
  delete user.password_hash;
  return user;
}

// Get user by ID with permissions
function getUserWithPermissions(userId) {
  const user = get(
    `SELECT u.id, u.name, u.email, u.phone, u.avatar, u.role_id, u.user_type, u.status,
            r.name AS role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = ? AND u.status = 'active'`,
    [userId]
  );

  if (!user) return null;

  if (user.user_type === 'admin' && user.role_id) {
    const { all } = require('./db');
    const perms = all(
      `SELECT p.name
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );
    user.permissions = perms.map((p) => p.name);
  } else {
    user.permissions = [];
  }

  return user;
}

// Check if user has permission
function hasPermission(user, permissionName) {
  if (!user || user.user_type !== 'admin') return false;
  if (user.role_name === 'Super Admin') return true;
  return user.permissions && user.permissions.includes(permissionName);
}

module.exports = {
  verifyPassword,
  hashPassword,
  authenticateUser,
  getUserWithPermissions,
  hasPermission,
};
