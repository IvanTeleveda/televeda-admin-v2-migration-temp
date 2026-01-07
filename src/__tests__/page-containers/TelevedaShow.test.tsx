import { render, screen } from "@testing-library/react";
import { TelevedaShow } from "../../components/page-containers/show";
import { Button } from "antd";

describe("TelevedaShow Component", () => {

  it("renders the title when passed as a prop", () => {
    const title = "Details of Item";
    render(<TelevedaShow title={title} headerButtons={undefined} children={null} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("renders header buttons when passed as a prop", () => {
    const headerButtons = <Button>Test Button</Button>;
    render(
      <TelevedaShow title="Details of Item" headerButtons={headerButtons} children={null} />
    );

    expect(screen.getByText("Test Button")).toBeInTheDocument();
  });

  it("renders children content correctly", () => {
    const childrenContent = <div data-testid="children">Child Component</div>;
    render(
      <TelevedaShow title="Details of Item" headerButtons={undefined}>
        {childrenContent}
      </TelevedaShow>
    );

    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("renders default empty headerButtons if not passed", () => {
    render(
      <TelevedaShow title="Details of Item" headerButtons={undefined} children={null} />
    );

    const headerButtons = screen.queryByText("Test Button");
    expect(headerButtons).not.toBeInTheDocument();
  });

  it("renders empty contentProps if not passed", () => {
    render(
      <TelevedaShow title="Details of Item" headerButtons={undefined} children={null} />
    );

    const content = screen.queryByTestId("children");
    expect(content).not.toBeInTheDocument();
  });
});
