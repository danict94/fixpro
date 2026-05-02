export async function register() {
  // Sentry disattivato in development per evitare OpenTelemetry/Prisma instrumentation.
  // Prima della produzione potremo riattivarlo con una config production-only leggera.
}