import { render, screen } from "@testing-library/react";
import { Title } from "../../components/layout/title";

describe("Title Component", () => {
  it("renders the logo with the correct alt text", () => {
    render(<Title collapsed={false} />);

    const logo = screen.getByAltText("Televeda");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/televeda/img/televeda-logo-lobby.svg");
  });

  it("should be wrapped in a link that navigates to '/'", () => {
    render(<Title collapsed={false} />);

    const link = screen.getByRole("link", { name: "Televeda" });
    expect(link).toHaveAttribute("href", "/");
  });
});
