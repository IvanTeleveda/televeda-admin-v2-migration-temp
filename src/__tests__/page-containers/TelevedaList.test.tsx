import { render, screen } from "@testing-library/react";
import { TelevedaList } from "../../components/page-containers/list";

jest.mock("@refinedev/core", () => ({
  useList: jest.fn(),
  useTranslate: jest.fn(() => (key: string) => key),
  useRefineContext: jest.fn(() => ({
    refineCore: { getList: jest.fn() }
  })),
  useRouterType: jest.fn(() => ({})),
  useUserFriendlyName: jest.fn(() => "User Friendly Name"),
  useResource: jest.fn(() => ({ resource: "Mocked Resource" })),
}));

describe("TelevedaList Component", () => {
  it("renders the title when passed as a prop", () => {
    const title = "List of Items";
    render(<TelevedaList title={title} listProps={{}}>{null}</TelevedaList>);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("renders children content correctly", () => {
    const childrenContent = <div data-testid="children">Child Component</div>;
    render(
      <TelevedaList title="List" listProps={{}}>{childrenContent}</TelevedaList>
    );

    expect(screen.getByTestId("children")).toBeInTheDocument();
  });
});
