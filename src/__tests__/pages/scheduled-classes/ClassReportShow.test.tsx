import { render, screen, fireEvent } from "@testing-library/react";
import MutateContainer from "../../../pages/scheduled-class/create-container";

jest.mock("@refinedev/antd", () => ({
  Create: ({ children, footerButtons }: any) => (
    <div>
      <div>Create Layout</div>
      {children}
      <div data-testid="footer">{footerButtons()}</div>
    </div>
  ),
  Edit: ({ children, footerButtons }: any) => (
    <div>
      <div>Edit Layout</div>
      {children}
      <div data-testid="footer">{footerButtons()}</div>
    </div>
  ),
  SaveButton: () => <button>Save</button>,
}));

describe("MutateContainer", () => {
  const defaultProps = {
    saveButtonProps: {},
    isFormLoading: false,
    isTemplateBtnDisabled: false,
    createTemplate: jest.fn(),
    action: "create" as const,
    children: <div>Form Content</div>,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders Create when action is 'create'", () => {
    render(<MutateContainer {...defaultProps} />);
    expect(screen.getByText("Create Layout")).toBeInTheDocument();
    expect(screen.getByText("Form Content")).toBeInTheDocument();
  });

  it("renders Edit when action is not 'create'", () => {
    render(<MutateContainer {...defaultProps} action="edit" />);
    expect(screen.getByText("Edit Layout")).toBeInTheDocument();
  });
  
  it("calls createTemplate on button click", () => {
    render(<MutateContainer {...defaultProps} />);
    fireEvent.click(screen.getByText("Create Template"));
    expect(defaultProps.createTemplate).toHaveBeenCalledTimes(1);
  });

  it("disables Create Template button when isTemplateBtnDisabled is true", () => {
    render(<MutateContainer {...defaultProps} isTemplateBtnDisabled={true} />);
    const buttonText = screen.getByText("Create Template");
    const button = buttonText.closest("button");
    expect(button).toBeDisabled();
  });

  it("renders Save button", () => {
    render(<MutateContainer {...defaultProps} />);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });
});
