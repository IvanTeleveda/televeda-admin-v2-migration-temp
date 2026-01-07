import { render, screen, fireEvent } from "@testing-library/react";
import { useCreate } from "@refinedev/core";
import { Button } from "antd";
import { EmailHistory } from "../../interfaces";
import { EmailHistoryTable } from "../../components/tables/emailHistoryTable";

jest.mock("@refinedev/core", () => ({
  useCreate: jest.fn(),
}));

jest.mock("@refinedev/antd", () => ({
  ...jest.requireActual("@refinedev/antd"),
  DeleteButton: ({ onSuccess }: { onSuccess: () => void }) => {
    return <Button onClick={onSuccess}>Undo</Button>;
  },
  pickNotDeprecated: jest.fn().mockImplementation((value) => value),
  useTable: jest.fn().mockReturnValue({
    tableProps: {},
    filters: [],
    tableQueryResult: { refetch: jest.fn() },
    setFilters: jest.fn(),
    setSorter: jest.fn(),
  }),
  useModal: jest.fn(() => ({
    open: true,
    confirm: jest.fn(),
    modalProps: {
      open: true,
    },
    show: jest.fn(),
    close: jest.fn(),
  })),
}));

describe("EmailHistoryTable Component", () => {
  const mockRefetch = jest.fn();

  const mockData: EmailHistory[] = [
    {
      id: "1",
      associationId: "assoc-1",
      sender: { email: "test1@example.com" },
      totalUsers: 100,
      status: "awaiting_confirm",
      configJson: {},
      createdAt: "2025-04-01T00:00:00Z",
    },
    {
      id: "2",
      associationId: "assoc-2",
      sender: { email: "test2@example.com" },
      totalUsers: 200,
      status: "sent",
      configJson: {},
      createdAt: "2025-04-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    (useCreate as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });
  });

  it("renders action buttons when status is 'awaiting_confirm'", () => {
    render(<EmailHistoryTable resource="emails" templateId="123" record={mockData} refetch={mockRefetch} />);

    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });

  it("calls refetch when Undo button is clicked", async () => {
    render(<EmailHistoryTable resource="emails" templateId="123" record={mockData} refetch={mockRefetch} />);

    fireEvent.click(screen.getByText("Undo"));

    expect(mockRefetch).toHaveBeenCalled();
  });
});
