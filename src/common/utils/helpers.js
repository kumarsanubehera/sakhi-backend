export class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
export function pageQuery(query) {
  const page = Math.max(parseInt(query.page || '1', 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}
export function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj && obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}
export function endOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}
export function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}
export function eddFromLmp(lmp) {
  return addDays(lmp, 280);
}
export function makeRegistrationNo() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SKH-${year}-${rand}`;
}
export function motherScope(user) {
  if (!user) return { _id: null };
  if (user.role === 'admin') return {};
  if (user.role === 'asha') return { assignedAsha: user.id };
  if (user.role === 'mother') return { userAccount: user.id };
  if (user.location && (user.role === 'anm' || user.role === 'medical_officer')) {
    return {
      $or: [
        { block: user.location },
        { district: user.location },
        { village: user.location },
        { facility: user.location },
      ],
    };
  }
  return { _id: null };
}
export const STAFF_ROLES = ['admin', 'asha', 'anm', 'medical_officer'];
export const ANC_WEEKS = [12, 20, 26, 30, 34, 36, 38, 40];