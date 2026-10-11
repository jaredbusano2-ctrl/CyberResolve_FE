export interface AppAlert {
  message: string
  type: 'success' | 'danger' | 'warning' | 'info'
}

export function AppAlertBanner({
  alert,
  onClose,
}: {
  alert: AppAlert | null
  onClose: () => void
}) {
  if (!alert) {
    return null
  }

  return (
    <div className={`cr-alert cr-alert--${alert.type} alert-dismissible fade show mb-4`} role="alert">
      <div className="cr-alert__dot" aria-hidden="true" />
      <div className="cr-alert__message">{alert.message}</div>
      <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose} />
    </div>
  )
}