import { render, screen } from "@testing-library/react";
import { useCustom } from "@refinedev/core";
import SponsorAnalyticsList from "../../../pages/analytics/sponsor-list";
import { useApiUrl } from "@refinedev/core";

jest.mock("@refinedev/core", () => {
    const original = jest.requireActual("@refinedev/core");
    return {
        ...original,
        useCustom: jest.fn(),
        useApiUrl: jest.fn(),
    };
});

jest.mock("../../../components/analytics/charts/sponsorEventsCharts", () => ({
    SponsorEventsCharts: jest.fn(() => <div>Mock SponsorEventsCharts</div>),
}));

jest.mock("../../../components/analytics/charts/sponsorEventsCharts/sponsorMemberEvents", () => ({
    SponsorMemberEvents: jest.fn(() => <div>Mock SponsorMemberEvents</div>),
}));

describe("SponsorAnalyticsList", () => {
    it("renders the SponsorEventsCharts and SponsorMemberEvents after data is fetched", async () => {
        (useCustom as jest.Mock).mockReturnValue({
            data: { sponsors: [] },
            isLoading: false,
        });

        (useApiUrl as jest.Mock).mockReturnValue("http://mock-api-url");

        render(<SponsorAnalyticsList />);

        expect(screen.getByText("Mock SponsorEventsCharts")).toBeInTheDocument();
        expect(screen.getByText("Mock SponsorMemberEvents")).toBeInTheDocument();
    });

    it("renders the layout structure correctly", async () => {
        (useCustom as jest.Mock).mockReturnValue({
            data: { sponsors: [] },
            isLoading: false,
        });

        (useApiUrl as jest.Mock).mockReturnValue("http://mock-api-url");

        render(<SponsorAnalyticsList />);

        const cards = screen.getAllByTestId("sponsor-card");
        expect(cards).toHaveLength(2);

        const rows = screen.getAllByTestId("sponsor-row");
        expect(rows).toHaveLength(1);
    });

    it("displays the correct content when data is available", async () => {
        (useCustom as jest.Mock).mockReturnValue({
            data: { sponsors: [{ name: "Sponsor A" }, { name: "Sponsor B" }] },
            isLoading: false,
        });

        (useApiUrl as jest.Mock).mockReturnValue("http://mock-api-url");

        render(<SponsorAnalyticsList />);

        expect(screen.getByText("Mock SponsorEventsCharts")).toBeInTheDocument();
        expect(screen.getByText("Mock SponsorMemberEvents")).toBeInTheDocument();
    });
});
