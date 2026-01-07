import { render, screen } from "@testing-library/react";
import { CreateButtonProps } from "@refinedev/antd";
import { TelevedaCreate } from "../../components/page-containers/create";

describe("TelevedaCreate Component", () => {
  it("renders the title when passed as a prop", () => {
    const title = "Create New Item";
    render(<TelevedaCreate title={title} saveButtonProps={{}} footerButtons={null}>Test Content</TelevedaCreate>);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("sets the save button size to large when saveButtonProps is passed", () => {
    const saveButtonProps: CreateButtonProps = { size: "small" };
    render(
      <TelevedaCreate title="Create" saveButtonProps={saveButtonProps} footerButtons={null}>
        Test Content
      </TelevedaCreate>
    );

    expect(saveButtonProps.size).toBe("large");
  });

  it("renders the footer buttons when passed as a prop", () => {
    const footerButtons = <button data-testid="footer-button">Footer Button</button>;
    render(
      <TelevedaCreate title="Create" saveButtonProps={{}} footerButtons={footerButtons}>
        Test Content
      </TelevedaCreate>
    );

    expect(screen.getByTestId("footer-button")).toBeInTheDocument();
  });

  it("renders children content correctly", () => {
    const childrenContent = <div data-testid="children">Child Component</div>;
    render(
      <TelevedaCreate title="Create" saveButtonProps={{}} footerButtons={null}>
        {childrenContent}
      </TelevedaCreate>
    );

    expect(screen.getByTestId("children")).toBeInTheDocument();
  });
});
