import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import ErrorModal from "../components/feedback/ErrorModal";
import type { UserFacingError } from "../services/errorHandler";

type ErrorFeedbackContextValue = {
  showError: (error: UserFacingError, onAction?: () => void) => void;
  hideError: () => void;
};

const ErrorFeedbackContext = createContext<ErrorFeedbackContextValue | undefined>(undefined);

export function ErrorFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [currentError, setCurrentError] = useState<UserFacingError | null>(null);
  const [action, setAction] = useState<(() => void) | undefined>();

  const hideError = useCallback(() => {
    setCurrentError(null);
    setAction(undefined);
  }, []);

  const showError = useCallback((error: UserFacingError, onAction?: () => void) => {
    setCurrentError(error);
    setAction(() => onAction);
  }, []);

  const value = useMemo(() => ({ showError, hideError }), [showError, hideError]);

  const handleAction = useCallback(() => {
    const retry = action;
    hideError();
    retry?.();
  }, [action, hideError]);

  return (
    <ErrorFeedbackContext.Provider value={value}>
      {children}
      <ErrorModal
        visible={currentError !== null}
        title={currentError?.title ?? ""}
        message={currentError?.message ?? ""}
        actionLabel={action ? currentError?.actionLabel : undefined}
        onAction={action ? handleAction : undefined}
        onClose={hideError}
      />
    </ErrorFeedbackContext.Provider>
  );
}

export function useErrorFeedback() {
  const context = useContext(ErrorFeedbackContext);
  if (!context) {
    throw new Error("useErrorFeedback must be used inside ErrorFeedbackProvider.");
  }
  return context;
}
