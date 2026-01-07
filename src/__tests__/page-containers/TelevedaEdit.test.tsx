import { render, screen } from "@testing-library/react";
import { EditButtonProps } from "@refinedev/antd";
import { TelevedaEdit } from "../../components/page-containers/edit";

describe("TelevedaEdit Component", () => {
  it("renders the title when passed as a prop", () => {
    const title = "Edit Item";
    render(<TelevedaEdit title={title} saveButtonProps={{}} footerButtons={null}>Test Content</TelevedaEdit>);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("sets the save button size to large when saveButtonProps is passed", () => {
    const saveButtonProps: EditButtonProps = { size: "small" };
    render(
      <TelevedaEdit title="Edit" saveButtonProps={saveButtonProps} footerButtons={null}>
        Test Content
      </TelevedaEdit>
    );

    expect(saveButtonProps.size).toBe("large");
  });

  it("renders the footer buttons when passed as a prop", () => {
    const footerButtons = <button data-testid="footer-button">Footer Button</button>;
    render(
      <TelevedaEdit title="Edit" saveButtonProps={{}} footerButtons={footerButtons}>
        Test Content
      </TelevedaEdit>
    );

    expect(screen.getByTestId("footer-button")).toBeInTheDocument();
  });

  it("renders children content correctly", () => {
    const childrenContent = <div data-testid="children">Child Component</div>;
    render(
      <TelevedaEdit title="Edit" saveButtonProps={{}} footerButtons={null}>
        {childrenContent}
      </TelevedaEdit>
    );

    expect(screen.getByTestId("children")).toBeInTheDocument();
  });
});
