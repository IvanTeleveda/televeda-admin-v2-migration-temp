import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLink, useParsed } from "@refinedev/core";
import { SurveySubmissions } from "../../../pages/surveys/show";

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

jest.mock("@refinedev/core", () => {
  const actual = jest.requireActual("@refinedev/core");
  return {
    ...actual,
    useApiUrl: jest.fn(),
    useParsed: jest.fn(),
    useLink: jest.fn(() => ({ to, children, ...rest }: any) => (
      <a href={to} {...rest}>
        {children}
      </a>
    )),
  };
});

jest.mock("@refinedev/antd", () => {
  const actual = jest.requireActual("@pankod/refine-antd");
  return {
    ...actual,
    useTable: jest.fn(),
    Table: ({ columns }: any) => (
      <div data-testid="mock-table">
        {columns?.map((col: any) => (
          <div key={col.key}>{col.title}</div>
        ))}
      </div>
    ),
    Button: ({ children }: any) => <button>{children}</button>,
    Space: ({ children }: any) => <div>{children}</div>,
  };
});

jest.mock("@ant-design/icons", () => {
  const actualIcons = jest.requireActual("@ant-design/icons");
  return {
    ...actualIcons,
    PlusSquareOutlined: () => <span>Icon</span>,
  };
});

jest.mock("../../../components/page-containers/show", () => ({
  TelevedaShow: ({ children, title, headerButtons }: any) => (
    <div>
      <h1>{title}</h1>
      {headerButtons}
      {children}
    </div>
  ),
}));

jest.mock("dayjs", () => {
  const originalDayjs = jest.requireActual("dayjs");
  return {
    __esModule: true,
    default: originalDayjs,
    extend: jest.fn().mockReturnValue(originalDayjs),
    tz: originalDayjs.tz,
  };
});

(useLink as jest.Mock).mockReturnValue(({ to, children, ...rest }: any) => (
  <a href={to} {...rest}>
    {children}
  </a>
));


describe("SurveySubmissions", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    (useParsed as jest.Mock).mockReturnValue({ id: "123" });

    (require("@refinedev/antd").useTable as jest.Mock).mockReturnValue({
      tableProps: {},
      tableQuery: {
        isLoading: false,
        data: {
          data: {
            resultData: [
              {
                sendBy: {
                  email: "sender@example.com",
                  firstName: "Sender",
                  lastName: "Example",
                },
                onBehalfOf: {
                  email: "recipient@example.com",
                  firstName: "Recipient",
                  lastName: "Example",
                },
                timestamp: Date.now(),
                json: {
                  Question1: "Answer1",
                  Question2: "Answer2",
                },
              },
            ],
            metadata: [
              {
                questions: ["Question1", "Question2"],
                timestamp: Date.now(),
                refId: "ref-1",
              },
            ],
            totalVersions: 1,
          },
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it("should render title and manual entry button", async () => {
    renderWithProviders(<SurveySubmissions />);
    expect(screen.getByText("Submissions")).toBeInTheDocument();
    expect(screen.getByText("Manual Entry")).toBeInTheDocument();
  });

  it("should render dynamic question columns", async () => {
    renderWithProviders(<SurveySubmissions />);
    await waitFor(() => {
      expect(screen.getByText("Question1")).toBeInTheDocument();
      expect(screen.getByText("Question2")).toBeInTheDocument();
    });
  });
});