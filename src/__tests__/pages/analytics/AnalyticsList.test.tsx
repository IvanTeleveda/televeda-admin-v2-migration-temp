jest.mock("@ant-design/plots", () => ({
    Line: () => <div>Line Chart</div>,
    Pie : () => <div>Pie Chart</div>,
}));
  
jest.mock("dayjs", () => {
    const actualDayjs = jest.requireActual("dayjs");
    const dayjsMock: any = (arg?: any) => actualDayjs(arg);
    Object.assign(dayjsMock, actualDayjs);
    dayjsMock.default = dayjsMock;
    return dayjsMock;
  });
  

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Refine, useCustom } from "@refinedev/core";
import { ConfigProvider } from "antd";
import "@testing-library/jest-dom";
import AnalyticsList from "../../../pages/analytics/list";

jest.mock("@refinedev/core", () => {
    const original = jest.requireActual("@refinedev/core");
    return {
        ...original,
        useApiUrl: () => "http://localhost:3000/api",
        useCustom: jest.fn(),
    };
});

jest.mock("@refinedev/antd", () => {
    const original = jest.requireActual("@refinedev/antd");
    return {
        ...original,
        useSelect: jest.fn().mockReturnValue({
            selectProps: {
                options: [
                    { label: "Default Community", value: 1 },
                    { label: "Other Community", value: 2 },
                ],
            },
            query: {
                refetch: jest.fn(() =>
                    Promise.resolve({
                        data: {
                            data: [
                                { id: 1, name: "Default Community" },
                                { id: 2, name: "Other Community" },
                            ],
                            total: 2,
                        },
                    })
                ),
                data: {
                    data: [
                        { id: 1, name: "Default Community" },
                        { id: 2, name: "Other Community" },
                    ],
                    total: 2,
                },
                isFetching: false,
                isLoading: false,
                isError: false,
                error: null,
            },
        }),
    };
});

jest.mock("../../../components/analytics/charts/attendanceChart", () => ({
    AttendanceChart: () => <div>Mocked AttendanceChart</div>,
}));
jest.mock("../../../components/analytics/charts/remindersChart/index", () => ({
    ReminderChart: () => <div>Mocked ReminderChart</div>,
}));
jest.mock("../../../components/analytics/charts/communityEventsChart", () => ({
    CommunityEventsCharts: () => <div>Mocked CommunityEventsCharts</div>,
}));
jest.mock("../../../components/analytics/charts/newRegistrationChart", () => ({
    NewRegistrationsChart: () => <div>Mocked NewRegistrationsChart</div>,
}));
jest.mock("../../../components/analytics/charts/retentionChart", () => ({
    RetentionChart: () => <div>Mocked RetentionChart</div>,
}));


const mockDataProvider = {
    getList: jest.fn(),
    getOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteOne: jest.fn(),
    getApiUrl: () => "http://localhost:3000/api",
};

describe("AnalyticsList", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useCustom as jest.Mock).mockImplementation(({ url }) => {
            if (url.includes("/community/current")) {
                return {
                    data: { data: { id: 1, name: "Default Community" } },
                    isLoading: false,
                };
            }
            if (url.includes("/community-sponsors/get-user-sponsors")) {
                return {
                    data: { data: [{ id: 1, name: "Sponsor A" }] },
                    isLoading: false,
                };
            }
            return { data: { data: [] }, isLoading: false };
        });
    });

    it("renders correctly", () => {
        // TODO: need to update the tests later :_)
    })

    // it("renders chart components when community is selected", async () => {
    //     render(
    //         <ConfigProvider>
    //             <Refine dataProvider={{ default: mockDataProvider }} resources={[]}>
    //                 <AnalyticsList />
    //             </Refine>
    //         </ConfigProvider>
    //     );
    //
    //     await waitFor(() => {
    //         expect(screen.getByRole("button", { name: /filter/i })).toBeInTheDocument();
    //     });
    //
    //     fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    //
    //     await waitFor(() => {
    //         expect(screen.getByText("Search by community")).toBeInTheDocument();
    //     });
    //
    //     await waitFor(() => {
    //         expect(screen.getByText("Mocked ReminderChart")).toBeInTheDocument();
    //         expect(screen.getByText("Mocked NewRegistrationsChart")).toBeInTheDocument();
    //         expect(screen.getByText("Mocked AttendanceChart")).toBeInTheDocument();
    //         expect(screen.getByText("Mocked RetentionChart")).toBeInTheDocument();
    //         expect(screen.getByText("Mocked CommunityEventsCharts")).toBeInTheDocument();
    //     });
    // });
});
