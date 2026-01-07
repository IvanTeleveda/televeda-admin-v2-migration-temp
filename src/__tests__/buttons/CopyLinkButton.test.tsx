import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CopyLinkButton from '../../components/buttons/copyLinks';

describe('CopyLinkButton', () => {
  const mockCopyURL = jest.fn();

  beforeEach(() => {
    mockCopyURL.mockClear();
  });

  it('should render the button with the correct text and icon', () => {
    render(
      <CopyLinkButton
        code={"https://example.com"}
        icon={<span>🔗</span>}
        btnShape="round"
        copyURL={mockCopyURL}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Copy link');
    expect(button).toContainHTML('🔗');
  });

  it('should call copyURL when the button is clicked', async () => {
    render(
      <CopyLinkButton
        code="https://example.com"
        icon={<span>🔗</span>}
        btnShape="round"
        copyURL={mockCopyURL}
      />
    );

    const button = screen.getByRole('button');
    userEvent.click(button);

    await waitFor(() => {
      expect(mockCopyURL).toHaveBeenCalledWith('https://example.com');
    });
  });

  it('should display "Link copied" after the button is clicked', async () => {
    render(
      <CopyLinkButton
        code="https://example.com"
        icon={<span>🔗</span>}
        btnShape="round"
        copyURL={mockCopyURL}
      />
    );

    const button = screen.getByRole('button');
    userEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Link copied');
    });
  });

  it('should reset button text back to "Copy link" after 1 second', async () => {
    render(
      <CopyLinkButton
        code="https://example.com"
        icon={<span>🔗</span>}
        btnShape="round"
        copyURL={mockCopyURL}
      />
    );

    const button = screen.getByRole('button');
    userEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Link copied');
    });

    await waitFor(() => {
      expect(button).toHaveTextContent('Copy link');
    }, { timeout: 1000 });
  });
});
