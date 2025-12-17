export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'SUPER_ADMIN' | 'SUPPORT' | 'OWNER' | 'ADMIN' | 'SELLER';
      tenantId?: string;
    };
  }
}
