import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteScheduledClassButton, ScheduledClassAlterOccurrenceTypes } from '../../components/buttons/deleteScheduledClass';

describe('DeleteScheduledClassButton', () => {
  const mockOnSuccessFn = jest.fn();
  const mockSetHidePopover = jest.fn();

  beforeEach(() => {
    mockOnSuccessFn.mockClear();
    mockSetHidePopover.mockClear();
  });

  it('should render the button with the correct text and icon', () => {
    render(
      <DeleteScheduledClassButton
        onSuccessFn={mockOnSuccessFn}
        setHidePopover={mockSetHidePopover}
        modalBtnType="default"
        modalBtnIcon={<span>🗑️</span>}
        classRecurring={true}
        modalBtnTxt="Delete"
        modalTitle="Delete Class"
        modalMessage="Are you sure you want to delete this class?"
      />
    );

    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toBeInTheDocument();
    expect(button).toContainHTML('🗑️');
  });

  it('should display the modal when the button is clicked', async () => {
    render(
      <DeleteScheduledClassButton
        onSuccessFn={mockOnSuccessFn}
        setHidePopover={mockSetHidePopover}
        modalBtnType="default"
        modalBtnIcon={<span>🗑️</span>}
        classRecurring={true}
        modalBtnTxt="Delete"
        modalTitle="Delete Class"
        modalMessage="Are you sure you want to delete this class?"
      />
    );

    const button = screen.getByRole('button', { name: /delete/i });
    userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete this class?')).toBeInTheDocument();
    });
  });

  it('should call onSuccessFn with the selected radio value when OK is clicked', async () => {
    render(
      <DeleteScheduledClassButton
        onSuccessFn={mockOnSuccessFn}
        setHidePopover={mockSetHidePopover}
        modalBtnType="default"
        modalBtnIcon={<span>🗑️</span>}
        classRecurring={true}
        modalBtnTxt="Delete"
        modalTitle="Delete Class"
        modalMessage="Are you sure you want to delete this class?"
      />
    );

    userEvent.click(screen.getByRole('button', { name: /delete/i }));

    const radioOption = await screen.findByText('This and following events');
    userEvent.click(radioOption);

    const okButton = await screen.findByRole('button', { name: /ok/i });
    userEvent.click(okButton);

    await waitFor(() => {
      expect(mockOnSuccessFn).toHaveBeenCalledWith(ScheduledClassAlterOccurrenceTypes.After);
    });
  });

  
  it('should close the modal when Cancel is clicked', async () => {
    render(
      <DeleteScheduledClassButton
        onSuccessFn={mockOnSuccessFn}
        setHidePopover={mockSetHidePopover}
        modalBtnType="default"
        modalBtnIcon={<span>🗑️</span>}
        classRecurring={true}
        modalBtnTxt="Delete"
        modalTitle="Delete Class"
        modalMessage="Are you sure you want to delete this class?"
      />
    );

    userEvent.click(screen.getByRole('button', { name: /delete/i }));

    await screen.findByText('Are you sure you want to delete this class?');

    const cancelButton = screen.getByText('Cancel');
    userEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockSetHidePopover).toHaveBeenCalledWith(false);
    });
  });
});
