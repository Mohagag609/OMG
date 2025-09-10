// This is a workaround to silence the TypeScript error for the 'pg' module.
// The Netlify build environment is failing to find the @types/pg package,
// even though it is listed in dependencies. This declaration tells TypeScript
// to assume the 'pg' module exists and has type 'any'.
declare module 'pg';
