type SessionExpiredHandler = (expiredToken: string) => void;

let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function registerSessionExpiredHandler(
  handler: SessionExpiredHandler,
): () => void {
  sessionExpiredHandler = handler;

  return () => {
    if (sessionExpiredHandler === handler) {
      sessionExpiredHandler = null;
    }
  };
}

export function notifySessionExpired(expiredToken: string): void {
  sessionExpiredHandler?.(expiredToken);
}
