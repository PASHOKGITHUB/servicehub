export enum Roles {
  ADMIN = 'admin',
  USER = 'user',
  PROVIDER = 'provider',
}

export const ROLE_PERMISSIONS = {
  [Roles.ADMIN]: [
    'manage_users',
    'manage_providers',
    'manage_services',
    'manage_bookings',
    'view_analytics',
    'manage_system',
  ],
  [Roles.USER]: [
    'book_services',
    'manage_bookings',
    'write_reviews',
    'manage_wallet',
  ],
  [Roles.PROVIDER]: [
    'manage_services',
    'manage_bookings',
    'view_earnings',
    'respond_reviews',
  ],
};