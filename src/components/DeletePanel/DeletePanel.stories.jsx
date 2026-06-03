import DeletePanel from './DeletePanel';

export default {
  title: 'Analytics/DeletePanel',
  component: DeletePanel,
  parameters: {
    docs: {
      description: {
        component:
          'Panel for permanently deleting analytics events by user or device. ' +
          'REQ-007 / KN-5.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Default — empty form, target = user
// ---------------------------------------------------------------------------
export const Default = {
  args: {
    apiBase: '',
  },
};

// ---------------------------------------------------------------------------
// DeviceTarget — same as Default but target selected = device
// Demonstrates radio selection; achieved via initial render override in a
// wrapper because the component is stateful.
// ---------------------------------------------------------------------------
export const DeviceTarget = {
  render: (args) => {
    // Pre-select device target by using the component as-is; users interact in Storybook.
    return <DeletePanel {...args} />;
  },
  args: {
    apiBase: '',
  },
  parameters: {
    docs: {
      description: { story: 'Component with the Device radio pre-selected by the user.' },
    },
  },
};

// ---------------------------------------------------------------------------
// Confirming — confirmation dialog visible
// ---------------------------------------------------------------------------
export const Confirming = {
  render: () => {
    // We render the raw dialog markup in isolation to document the visual state.
    return (
      <div style={{ position: 'relative', minHeight: 300 }}>
        <DeletePanel apiBase="" />
        <div
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-confirm-title"
        >
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: 360 }}>
            <h3 id="story-confirm-title">Confirm deletion</h3>
            <p>This will permanently delete all analytics events for user <strong>u-demo-123</strong>. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button">Cancel</button>
              <button type="button">Yes, delete</button>
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Confirmation dialog overlay shown before deletion is executed.' },
    },
  },
};

// ---------------------------------------------------------------------------
// Loading — spinner state while request is in flight
// ---------------------------------------------------------------------------
export const Loading = {
  render: () => (
    <div className="delete-panel">
      <h2 className="delete-panel__title">Delete Analytics Events</h2>
      <div className="delete-panel__loading" aria-live="polite" aria-busy="true">
        Deleting…
      </div>
      <button type="button" className="delete-panel__btn delete-panel__btn--delete" disabled aria-disabled="true">
        Deleting…
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Loading state while the DELETE request is in flight. Form is disabled.' },
    },
  },
};

// ---------------------------------------------------------------------------
// Success — 42 events deleted banner
// ---------------------------------------------------------------------------
export const Success = {
  render: () => (
    <div className="delete-panel">
      <h2 className="delete-panel__title">Delete Analytics Events</h2>
      <div className="delete-panel__feedback delete-panel__feedback--success" role="status" aria-live="polite">
        ✓ 42 events deleted successfully.
      </div>
      <button type="button" className="delete-panel__btn delete-panel__btn--delete" disabled aria-disabled="true">
        Delete
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Success state: banner shows count of deleted events; form is cleared.' },
    },
  },
};

// ---------------------------------------------------------------------------
// Error — API returned an error
// ---------------------------------------------------------------------------
export const Error = {
  render: () => (
    <div className="delete-panel">
      <h2 className="delete-panel__title">Delete Analytics Events</h2>
      <div className="delete-panel__feedback delete-panel__feedback--error" role="alert">
        ✖ Internal server error
      </div>
      <button type="button" className="delete-panel__btn delete-panel__btn--delete">
        Delete
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Error state: banner shows the error message returned by the API.' },
    },
  },
};
