import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { SponsorEventColumn } from "../../components/analytics/charts/sponsorEventsCharts/sponsorEventColumn";

jest.mock("@ant-design/plots", () => ({
    Column: () => <div data-testid="mock-chart">Mock Chart</div>,
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

describe("SponsorEventColumn", () => {
    const mockDateRange: [dayjs.Dayjs, dayjs.Dayjs] = [
        dayjs("2025-01-01"),
        dayjs("2025-01-31"),
    ];

    const mockEvents = [
        {
            event_date: "2025-01-15",
            event_count: 5,
            community: "Community A",
            eventType: "Type 1"
        },
        {
            event_date: "2025-01-20",
            event_count: 3,
            community: "Community B",
            eventType: "Type 2"
        },
    ];

    it("renders loading skeleton", () => {
        const { container } = render(
            <SponsorEventColumn
                events={undefined}
                dateRange={mockDateRange}
                periodEvents={undefined}
                toDateEvents={undefined}
                isLoading={true}
                title="Sponsor Events"
                isGroup={false}
            />
        );
        expect(container.querySelector(".ant-skeleton")).toBeInTheDocument();
    });

    it("renders message when no data is available", () => {
        render(
            <SponsorEventColumn
                events={[]}
                dateRange={mockDateRange}
                periodEvents={0}
                toDateEvents={0}
                isLoading={false}
                title="Sponsor Events"
                isGroup={false}
            />
        );
        expect(screen.getByText("Sponsor Events")).toBeInTheDocument();
        expect(screen.getByText("No events for this period")).toBeInTheDocument();
    });

    it("renders chart and totals correctly", () => {
        render(
            <SponsorEventColumn
                events={mockEvents}
                dateRange={mockDateRange}
                periodEvents={8}
                toDateEvents={20}
                isLoading={false}
                title="Sponsor Events"
                isGroup={true}
            />
        );
        expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
        expect(screen.getByText("Sponsor Events")).toBeInTheDocument();
        expect(screen.getByText("8")).toBeInTheDocument();
        expect(screen.getByText("20")).toBeInTheDocument();
    });
});