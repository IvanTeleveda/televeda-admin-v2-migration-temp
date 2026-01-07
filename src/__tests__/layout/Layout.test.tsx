import { render, screen } from "@testing-library/react";
import { Layout } from "../../components/layout/layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

jest.mock("antd", () => {
  const actualAntd = jest.requireActual("antd");
  return {
    ...actualAntd,
    Grid: {
      useBreakpoint: jest.fn(() => ({ sm: true })),
    },
  };
});

const renderWithProviders = (ui: React.ReactNode) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("Layout", () => {
  it("renders with a custom Header and Footer", () => {
    const CustomHeader = () => <header>Custom Header</header>;
    const CustomFooter = () => <footer>Custom Footer</footer>;

    renderWithProviders(
      <Layout Header={CustomHeader} Footer={CustomFooter}>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText("Custom Header")).toBeInTheDocument();
    expect(screen.getByText("Custom Footer")).toBeInTheDocument();
  });

  it("renders OffLayoutArea when provided", () => {
    const OffLayoutArea = () => <div>Off Layout Content</div>;

    renderWithProviders(
      <Layout OffLayoutArea={OffLayoutArea}>
        <div>Main Content</div>
      </Layout>
    );

    expect(screen.getByText("Off Layout Content")).toBeInTheDocument();
  });
});
