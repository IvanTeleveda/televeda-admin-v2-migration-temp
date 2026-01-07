import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateModalFormForCommunityButton } from '../../components/buttons/createModalFormForCommunity';

jest.mock('@pankod/refine-antd', () => {
  const actual = jest.requireActual('@pankod/refine-antd');

  const FakeForm = (props: any) => <form {...props}>{props.children}</form>;
  FakeForm.useForm = () => {
    const fakeForm = {
      getFieldsValue: jest.fn(() => ({})),
      resetFields: jest.fn(),
      validateFields: jest.fn(() => Promise.resolve({})),
    };
    return [fakeForm];
  };

  FakeForm.Item = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  const MockButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  );
  const MockModal = ({ children, open, title }: { children: React.ReactNode; open: boolean; title: string }) =>
    open ? (
      <div data-testid="modal">
        {title}
        {children}
      </div>
    ) : null;
  const MockSelect = () => <select />;
  const MockCheckbox = () => <input type="checkbox" />;
  const MockInput = () => <input />;

  return {
    ...actual,
    Button: MockButton,
    Form: FakeForm,
    Input: MockInput,
    Modal: MockModal,
    Select: MockSelect,
    Checkbox: MockCheckbox,
  };
});

jest.mock('@refinedev/antd', () => ({
  useSelect: () => ({ selectProps: { options: [] } }),
}));

jest.mock('@refinedev/core', () => ({
  useCreate: () => ({ mutate: jest.fn() }),
}));

describe('CreateModalFormForCommunityButton', () => {
  const defaultProps = {
    communityId: '123',
    url: '/api/communities',
    modalTitle: 'Test Modal',
    modalField: 'email',
    onSuccessFn: jest.fn(),
    associationType: 'user',
    modalBtnTxt: 'Open Modal',
    modalBtnIcon: <div></div>,
  };

  it('renders the button', () => {
    render(<CreateModalFormForCommunityButton {...defaultProps} />);
    expect(screen.getByText('Open Modal')).toBeInTheDocument();
  });

  it('opens the modal on button click', async () => {
    render(<CreateModalFormForCommunityButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Open Modal'));
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());
  });

  it('renders modal title', async () => {
    render(<CreateModalFormForCommunityButton {...defaultProps} />);
    fireEvent.click(screen.getByText('Open Modal'));
    await waitFor(() => expect(screen.getByText('Test Modal')).toBeInTheDocument());
  });
});