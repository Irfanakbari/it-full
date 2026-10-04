process.env.DATABASE_URL ??=
  "postgresql://itam:itam-development@localhost:55432/itam?schema=public";
process.env.VUTEQ_SSO_SECRET ??= "e2e-only-secret";
process.env.LICENSE_ENCRYPTION_KEY ??=
  "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
