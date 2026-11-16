/** Railway / produção — não confiar só em NODE_ENV (pode faltar no boot script). */
export function isProdRuntime(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.RAILWAY_ENVIRONMENT) return true;
  if (process.env.RAILWAY_SERVICE_ID) return true;
  if (process.env.RAILWAY_PROJECT_ID) return true;
  return false;
}