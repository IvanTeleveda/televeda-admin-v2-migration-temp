import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterButton } from '../../components/buttons/filter';
import { CrudFilters } from '@refinedev/core';

describe('FilterButton', () => {
  const popoverContentText = 'Popover Content';

  const defaultProps = {
    filters: [],
    children: <div>{popoverContentText}</div>,
  };

  it('renders a button with the default label "Filter"', () => {
    render(<FilterButton {...defaultProps} />);
    const button = screen.getByRole('button', { name: /filter/i });
    expect(button).toBeInTheDocument();
  });

  it('renders a button with a custom label', () => {
    render(<FilterButton {...defaultProps} label="Custom Filter" />);
    const button = screen.getByRole('button', { name: /custom filter/i });
    expect(button).toBeInTheDocument();
  });

  it('displays the correct badge count based on valid filters', () => {
    const filters: CrudFilters = [
      { field: 'name', operator: 'contains', value: 'John' },
      { field: 'status', operator: 'eq', value: 'active' },
      { field: 'empty', operator: 'eq', value: '' },
      { field: 'array', operator: 'in', value: [] },
    ];
    render(<FilterButton {...defaultProps} filters={filters} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
  

  it('shows popover content and title when the button is clicked', () => {
    const customTitle = 'My Popover Title';
    render(<FilterButton {...defaultProps} title={customTitle} />);
    
    expect(screen.queryByText(popoverContentText)).not.toBeInTheDocument();
    expect(screen.queryByText(customTitle)).not.toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(button);
    
    expect(screen.getByText(popoverContentText)).toBeInTheDocument();
    expect(screen.getByText(customTitle)).toBeInTheDocument();
  });

  it('uses the default title "Filter by" when no title is provided', () => {
    render(<FilterButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Filter by')).toBeInTheDocument();
  });
});
