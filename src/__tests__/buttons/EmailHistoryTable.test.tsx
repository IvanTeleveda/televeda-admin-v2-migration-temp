import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmailHistoryTable } from "../../components/tables/emailHistoryTable";
import { EmailHistory } from "../../interfaces";

const queryClient = new QueryClient();

const refetch = jest.fn();

describe("EmailHistoryTable", () => {

  const mockData: EmailHistory[] = [
    {
        id: "1",
        sender: { email: "sender1@example.com" },
        totalUsers: 10,
        status: "awaiting_confirm",
        createdAt: "2025-01-01T12:00:00Z",
        associationId: "",
        configJson: undefined
    },
    {
        id: "2",
        sender: { email: "sender2@example.com" },
        totalUsers: 20,
        status: "sent",
        createdAt: "2025-01-02T12:00:00Z",
        associationId: "",
        configJson: undefined
    },
  ];

  it("renders the table with correct data", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EmailHistoryTable
          resource="emails"
          templateId="template-1"
          record={mockData}
          refetch={refetch}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText("Send by")).toBeInTheDocument();
    expect(screen.getByText("Number of Recipients")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Send at")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });

  it("opens EmailDetailsButton modal when details button is clicked", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EmailHistoryTable
          resource="emails"
          templateId="template-1"
          record={mockData}
          refetch={refetch}
        />
      </QueryClientProvider>
    );
  
    const detailsButtons = screen.getAllByText("Details...");
    fireEvent.click(detailsButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText("Email Details")).toBeInTheDocument();
    });
  });
});
