import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmailDetailsButton } from "../../components/buttons/emailDetails";

const queryClient = new QueryClient();

describe("EmailDetailsButton", () => {

  it("renders the button", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EmailDetailsButton id="test-id" btnSize="small" />
      </QueryClientProvider>
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("opens the modal when the button is clicked", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EmailDetailsButton id="test-id" btnSize="small" />
      </QueryClientProvider>
    );
    
    fireEvent.click(screen.getByText("Details..."));
    await waitFor(() => {
      expect(screen.getByText("Email Details")).toBeInTheDocument();
    });
  });
  
  it("calls close function when Ok button is clicked", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EmailDetailsButton id="test-id" btnSize="small" />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText("Details..."));
    
    const okButton = screen.getByText("Ok");
    fireEvent.click(okButton);

    await waitFor(() => {
      expect(screen.queryByText("Email Details")).toBeNull();
    });
  });

});
