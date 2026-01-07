import { render, screen } from "@testing-library/react";
import { ConfigProvider } from "antd";
import "@testing-library/jest-dom";
import { ResourceUsersShow } from "../../../pages/analytics/show";

jest.mock("@refinedev/antd", () => {
    const original = jest.requireActual("@refinedev/antd");
    return {
        ...original,
        useTable: jest.fn().mockReturnValue({
            tableProps: {
                dataSource: [
                    {
                        id: "1",
                        first_name: "John",
                        last_name: "Doe",
                    },
                    {
                        id: "2",
                        first_name: "Jane",
                        last_name: "Smith",
                    },
                ],
            },
            tableQuery: {
                refetch: jest.fn(),
            },
            sorters: [],
            searchFormProps: {},
            filters: [],
        }),
        TextField: jest.fn(({ value }) => <span>{value}</span>),
        DatePicker: {
            RangePicker: jest.fn(({ placeholder, onChange }) => (
                <div>
                    <input
                        placeholder={placeholder[0]}
                        onChange={(e) => onChange([e.target.value, ''])}
                    />
                    <input
                        placeholder={placeholder[1]}
                        onChange={(e) => onChange(['', e.target.value])}
                    />
                </div>
            )),
        },
        Space: jest.fn(({ children }) => <div>{children}</div>),
        Form: {
            useForm: jest.fn().mockReturnValue([{}]),
            Item: jest.fn(({ children }) => <div>{children}</div>),
        },
    };
});

jest.mock("@refinedev/core", () => {
    const original = jest.requireActual("@refinedev/core");
    return {
        ...original,
        useParsed: jest.fn().mockReturnValue({ id: "123" }),
    };
});

jest.mock('dayjs', () => {
    const originalDayjs = jest.requireActual('dayjs');
    return {
        __esModule: true,
        default: originalDayjs,
        extend: jest.fn().mockReturnValue(originalDayjs),
        tz: originalDayjs.tz,
    };
});

jest.mock("moment", () => {
    const actualMoment = jest.requireActual("moment");

    return {
        __esModule: true,
        default: Object.assign(() => actualMoment(), actualMoment, {
            tz: {
                guess: jest.fn().mockReturnValue("America/Chicago"),
            },
        }),
    };
});

describe("ResourceUsersShow", () => {
    it("renders table data based on filters", async () => {
        render(
            <ConfigProvider>
                <ResourceUsersShow />
            </ConfigProvider>
        );

        expect(screen.getByText("John")).toBeInTheDocument();
        expect(screen.getByText("Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane")).toBeInTheDocument();
        expect(screen.getByText("Smith")).toBeInTheDocument();
    });
});
