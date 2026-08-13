export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const [{ startJobScheduler }, { purgeLegacyInjectedMessages }] = await Promise.all([
      import("@/server/jobs"),
      import("@/server/services/legacy-data-cleanup"),
    ]);
    await purgeLegacyInjectedMessages();
    startJobScheduler();
  }
}
