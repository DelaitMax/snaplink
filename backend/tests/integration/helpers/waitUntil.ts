/**
 * recordClick() в redirect-контроллере намеренно вызывается без await —
 * поэтому в тестах нужно немного подождать, пока запись в БД завершится,
 * вместо того чтобы проверять состояние сразу после ответа редиректа.
 */
export async function waitUntil(check: () => Promise<boolean>, timeoutMs = 3000, intervalMs = 50): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`waitUntil: condition not met within ${timeoutMs}ms`);
}
