import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSelect } from "@refinedev/antd";
import { SurveysCreate } from "../../../pages/surveys/create";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

jest.mock("../../../env", () => ({
    TRANSLATION_API_KEY: "test-api-key",
  }));

jest.mock('dayjs', () => {
    const originalDayjs = jest.requireActual('dayjs');
    return {
      __esModule: true,
      default: originalDayjs,
      extend: jest.fn().mockReturnValue(originalDayjs),
      tz: originalDayjs.tz,
    };
});

jest.mock("survey-creator-react", () => {
    const mockCreator = {
        JSON: { title: "Test Survey", pages: [] },
        doSave: jest.fn(),
        saveSurveyFunc: jest.fn(),
        theme: {},
        onMachineTranslate: {
            add: jest.fn(),
          },

    };

    return {
        SurveyCreator: jest.fn(() => mockCreator),
        SurveyCreatorComponent: ({ creator }: any) => (
            <div data-testid="survey-creator">{JSON.stringify(creator.JSON)}</div>
        ),
    };
});

jest.mock("@refinedev/antd", () => ({
    ...jest.requireActual("@refinedev/antd"),
    useSelect: jest.fn(),
}));

beforeEach(() => {
    (useSelect as jest.Mock).mockImplementation(({ resource }) => {
        if (resource === "Community") {
            return {
                selectProps: {
                    options: [
                        { label: "Community 1", value: "community-1" },
                        { label: "Community 2", value: "community-2" },
                    ],
                },
            };
        }
        if (resource === "scheduled-class/select") {
            return {
                selectProps: {
                    options: [
                        { label: "Yoga Class,2023-09-01", value: "event-1" },
                        { label: "Meditation Class,2023-09-02", value: "event-2" },
                    ],
                },
            };
        }

        return { selectProps: { options: [] } };
    });
});

describe("SurveysCreate", () => {
    it("renders without crashing and displays main fields", async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <SurveysCreate />
            </QueryClientProvider>
        );

        expect(await screen.findByText("Choose where to render the survey")).toBeInTheDocument();

        const renderSelect = screen.getByLabelText(/Choose where to render the survey/i);
        fireEvent.mouseDown(renderSelect);

        fireEvent.change(renderSelect, { target: { value: ["feedback"] } });

        await waitFor(() => {
            expect(screen.getByTestId("survey-creator")).toBeInTheDocument();
        });

        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
});
