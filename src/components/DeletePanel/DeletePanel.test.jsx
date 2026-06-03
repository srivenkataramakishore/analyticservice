import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeletePanel from './DeletePanel';

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DeletePanel', () => {
  it('renders the form with user target selected by default', () => {
    render(<DeletePanel />);
    expect(screen.getByRole('radio', { name: /user/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /device/i })).not.toBeChecked();
    expect(screen.getByLabelText(/user id/i)).toBeInTheDocument();
  });

  it('Delete button is disabled when id is empty', () => {
    render(<DeletePanel />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  it('Delete button is enabled after entering an id', () => {
    render(<DeletePanel />);
    fireEvent.change(screen.getByLabelText(/user id/i), { target: { value: 'u1' } });
    expect(screen.getByRole('button', { name: /^delete$/i })).not.toBeDisabled();
  });

  it('shows confirmation dialog when Delete is clicked (AC-8)', () => {
    render(<DeletePanel />);
    fireEvent.change(screen.getByLabelText(/user id/i), { target: { value: 'u1' } });
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
  });

  it('closes dialog on Cancel without making any request (AC-8)', () => {
    render(<DeletePanel />);
    fireEvent.change(screen.getByLabelText(/user id/i), { target: { value: 'u1' } });
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls API and shows success message after confirmation (AC-9)', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deleted: 5 }),
    });
    render(<DeletePanel />);
    fireEvent.change(screen.getByLabelText(/user id/i), { target: { value: 'u1' } });
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/5 events deleted/)
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/analytics/user?userId=u1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('shows error message when API returns error (AC-10)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }),
    });
    render(<DeletePanel />);
    fireEvent.change(screen.getByLabelText(/user id/i), { target: { value: 'u1' } });
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/internal server error/i)
    );
  });

  it('shows error message on network failure (AC-10)', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    render(<DeletePanel />);
    fireEvent.change(screen.getByLabelText(/user id/i), { target: { value: 'u1' } });
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
    );
  });

  it('switches label to Device ID when device radio is selected', () => {
    render(<DeletePanel />);
    fireEvent.click(screen.getByRole('radio', { name: /device/i }));
    expect(screen.getByLabelText(/device id/i)).toBeInTheDocument();
  });
});
