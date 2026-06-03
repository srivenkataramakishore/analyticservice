import { useState } from 'react';

/**
 * DeletePanel
 * UI component for deleting analytics events by user or device.
 * REQ-007 / KN-5
 *
 * Props:
 *   apiBase {string} - Base URL for API calls (default: '')
 *                      Endpoint called: `${apiBase}/analytics/user` or `.../device`
 */
function DeletePanel({ apiBase = '' }) {
  const [target, setTarget] = useState('user');
  const [id, setId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | { type: 'success', deleted: number } | { type: 'error', message: string }

  const idLabel = target === 'user' ? 'User ID' : 'Device ID';
  const idPlaceholder = target === 'user' ? 'Enter user ID' : 'Enter device ID';

  function handleDeleteClick(e) {
    e.preventDefault();
    setStatus(null);
    setConfirming(true);
  }

  function handleCancel() {
    setConfirming(false);
  }

  async function handleConfirm() {
    setConfirming(false);
    setLoading(true);
    setStatus(null);

    const paramKey = target === 'user' ? 'userId' : 'deviceId';
    const params = new URLSearchParams({ [paramKey]: id });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const url = `${apiBase}/analytics/${target}?${params.toString()}`;

    try {
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || 'Unexpected error from server';
        setStatus({ type: 'error', message: msg });
      } else {
        setStatus({ type: 'success', deleted: data.deleted });
        setId('');
        setStartDate('');
        setEndDate('');
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error — could not reach the server' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="delete-panel" role="region" aria-label="Delete analytics events">
      <h2 className="delete-panel__title">Delete Analytics Events</h2>

      {/* Target selector */}
      <fieldset className="delete-panel__fieldset">
        <legend className="delete-panel__legend">Delete by</legend>
        <label className="delete-panel__radio-label">
          <input
            type="radio"
            name="target"
            value="user"
            checked={target === 'user'}
            onChange={() => { setTarget('user'); setId(''); }}
            disabled={loading}
          />
          {' '}User
        </label>
        <label className="delete-panel__radio-label">
          <input
            type="radio"
            name="target"
            value="device"
            checked={target === 'device'}
            onChange={() => { setTarget('device'); setId(''); }}
            disabled={loading}
          />
          {' '}Device
        </label>
      </fieldset>

      {/* ID input */}
      <div className="delete-panel__field">
        <label htmlFor="delete-panel-id" className="delete-panel__label">
          {idLabel} <span aria-hidden="true">*</span>
        </label>
        <input
          id="delete-panel-id"
          type="text"
          className="delete-panel__input"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder={idPlaceholder}
          aria-required="true"
          aria-label={idLabel}
          disabled={loading}
        />
      </div>

      {/* Optional date range */}
      <div className="delete-panel__date-range">
        <div className="delete-panel__field">
          <label htmlFor="delete-panel-start" className="delete-panel__label">Start date (optional)</label>
          <input
            id="delete-panel-start"
            type="date"
            className="delete-panel__input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Start date"
            disabled={loading}
          />
        </div>
        <div className="delete-panel__field">
          <label htmlFor="delete-panel-end" className="delete-panel__label">End date (optional)</label>
          <input
            id="delete-panel-end"
            type="date"
            className="delete-panel__input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="End date"
            disabled={loading}
          />
        </div>
      </div>

      {/* Status feedback */}
      {status?.type === 'success' && (
        <div className="delete-panel__feedback delete-panel__feedback--success" role="status" aria-live="polite">
          ✓ {status.deleted} event{status.deleted !== 1 ? 's' : ''} deleted successfully.
        </div>
      )}
      {status?.type === 'error' && (
        <div className="delete-panel__feedback delete-panel__feedback--error" role="alert">
          ✖ {status.message}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="delete-panel__loading" aria-live="polite" aria-busy="true">
          Deleting…
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        className="delete-panel__btn delete-panel__btn--delete"
        onClick={handleDeleteClick}
        disabled={loading || !id.trim()}
        aria-disabled={loading || !id.trim()}
      >
        {loading ? 'Deleting…' : 'Delete'}
      </button>

      {/* Confirmation dialog */}
      {confirming && (
        <div
          className="delete-panel__overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
        >
          <div className="delete-panel__dialog">
            <h3 id="confirm-dialog-title" className="delete-panel__dialog-title">
              Confirm deletion
            </h3>
            <p id="confirm-dialog-desc" className="delete-panel__dialog-body">
              This will permanently delete all analytics events for {idLabel.toLowerCase()}{' '}
              <strong>{id}</strong>
              {startDate && endDate ? ` between ${startDate} and ${endDate}` : ''}.
              This action cannot be undone.
            </p>
            <div className="delete-panel__dialog-actions">
              <button
                type="button"
                className="delete-panel__btn delete-panel__btn--cancel"
                onClick={handleCancel}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-panel__btn delete-panel__btn--confirm"
                onClick={handleConfirm}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeletePanel;
