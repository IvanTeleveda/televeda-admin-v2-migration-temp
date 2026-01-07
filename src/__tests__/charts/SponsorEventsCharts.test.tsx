import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SponsorEventsCharts } from "../../components/analytics/charts/sponsorEventsCharts";
import { useCustom } from "@refinedev/core";
import { useSelect } from "@refinedev/antd";

const mockRefetch = jest.fn();

jest.mock("@refinedev/core", () => ({
    useCustom: jest.fn(),
}));

jest.mock("@refinedev/antd", () => ({
    useSelect: jest.fn(),
}));

jest.mock("@ant-design/plots", () => ( {} ));

jest.mock('dayjs', () => {
    const originalDayjs = jest.requireActual('dayjs');
    return {
        __esModule: true,
        default: originalDayjs,
        extend: jest.fn().mockReturnValue(originalDayjs),
        tz: originalDayjs.tz,
    };
});

(useSelect as jest.Mock).mockReturnValue({
    selectProps: {},
    query: {
        refetch: mockRefetch
    }
});

describe("SponsorEventsCharts", () => {
    const mockSponsorData = {
        data: [
            {
                id: "1",
                name: "Sponsor A",
                email: "sponsorA@example.com",
                logo: "logoA.png",
                phone: "1234567890",
                siteLink: "http://exampleA.com",
                sponsorInfo: "Info A",
                sponsorForm: "Form A"
            },
            {
                id: "2",
                name: "Sponsor B",
                email: "sponsorB@example.com",
                logo: "logoB.png",
                phone: "0987654321",
                siteLink: "http://exampleB.com",
                sponsorInfo: "Info B",
                sponsorForm: "Form B"
            }
        ],
        total: 2,
    };

    const mockApiUrl = "https://api.mockurl.com";
    const mockUseCustom = useCustom as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseCustom.mockReturnValue({
            data: {
                sponsorEvents: [],
                sponsorEventsPeriod: 0,
                sponsorEventsToDate: 0,
                pageVisits: [],
                pageVisitsPeriod: 0,
                pageVisitsToDate: 0,
            },
            isLoading: false,
            refetch: jest.fn(),
        });
    });

    it("calls useCustom hook with correct query params", async () => {
        render(
            <SponsorEventsCharts
                sponsorData={mockSponsorData}
                apiUrl={mockApiUrl}
            />
        );

        await waitFor(() => {
            const calls = mockUseCustom.mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            const query = calls[0][0].config.query;
            expect(query.start).toBeDefined();
            expect(query.end).toBeDefined();
            expect(query.sponsorId).toBeUndefined();
            expect(query.communityIds).toBeUndefined();
        });
    });
});