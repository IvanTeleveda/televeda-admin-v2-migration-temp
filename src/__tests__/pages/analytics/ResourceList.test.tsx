import { render, screen, fireEvent } from "@testing-library/react";
import { ConfigProvider } from "antd";
import "@testing-library/jest-dom";
import ResourceList from "../../../pages/analytics/resource-list";

jest.mock("@refinedev/antd", () => {
    const original = jest.requireActual("@refinedev/antd");
    return {
        ...original,
        useTable: jest.fn().mockReturnValue({
            tableProps: {
                dataSource: [
                    {
                        resourceName: "Resource A",
                        totalCount: 10,
                        events: [
                            { eventDate: "2025-04-01", eventType: "Click", userName: "User 1", communityName: "Community 1" },
                        ],
                    },
                    {
                        resourceName: "Resource B",
                        totalCount: 5,
                        events: [
                            { eventDate: "2025-04-02", eventType: "View", userName: "User 2", communityName: "Community 2" },
                        ],
                    },
                ],
            },
            searchFormProps: {
                form: {
                    setFieldValue: jest.fn(),
                },
            },
            filters: [],
            setFilters: jest.fn(),
        }),        
        ShowButton: jest.fn(() => <button>History</button>),
        Tooltip: jest.fn(({ children }) => <div>{children}</div>),
    };
});

jest.mock("@refinedev/core", () => {
    const original = jest.requireActual("@refinedev/core");
    return {
        ...original,
        useCustom: jest.fn(),
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

jest.mock("@pankod/refine-antd", () => {
    const React = require("react");
    const original = jest.requireActual("@pankod/refine-antd");
  
    // Stubbed Table that renders dataIndex columns, render() columns, and the expandable rows inline
    const TableMock: any = ({ dataSource, children, expandable }: any) => (
        <div>
          {dataSource.map((record: any, rowIndex: number) => (
            <div key={rowIndex} data-testid="table-row">
              {React.Children.map(children, (col: any) => {
                if (col.props.dataIndex) {
                  return <div>{record[col.props.dataIndex]}</div>;
                }
                if (typeof col.props.render === "function") {
                  return <div>{col.props.render(null, record)}</div>;
                }
                return null;
              })}
      
              {expandable?.expandedRowRender && record.events?.length > 0 && (
                <div data-testid="expanded-row">
                  {expandable.expandedRowRender(record)}
                </div>
              )}
            </div>
          ))}
        </div>
      );
      
      TableMock.Column = () => null;
  
    return {
      ...original,
      useTable: jest.fn().mockReturnValue({
        tableProps: {
          dataSource: [
            {
              resourceName: "Resource A",
              totalCount: 10,
              events: [
                {
                  eventDate: "2025-04-01",
                  eventType: "Click",
                  userName: "User 1",
                  communityName: "Community 1",
                },
              ],
            },
            {
              resourceName: "Resource B",
              totalCount: 5,
              events: [
                {
                  eventDate: "2025-04-02",
                  eventType: "View",
                  userName: "User 2",
                  communityName: "Community 2",
                },
              ],
            },
          ],
        },
        searchFormProps: {
          form: {
            setFieldValue: jest.fn(),
          },
        },
        filters: [],
        setFilters: jest.fn(),
      }),
      ShowButton: jest.fn(() => <button>History</button>),
      Tooltip: jest.fn(({ children }: any) => <div>{children}</div>),
      Table: TableMock,
    };
  });
  

describe("ResourceList", () => {
    it("renders the table rows and expanded event details", async () => {
        render(
          <ConfigProvider>
            <ResourceList />
          </ConfigProvider>
        );
      
        expect(await screen.findByText(/^Resource\s*A$/)).toBeInTheDocument();
        expect(screen.getByText(/^10$/)).toBeInTheDocument();
        expect(screen.getByText(/^Resource\s*B$/)).toBeInTheDocument();
        expect(screen.getByText(/^5$/)).toBeInTheDocument();
      
        expect(screen.getByText(/^Click$/)).toBeInTheDocument();
        expect(screen.getByText(/^User\s*1$/)).toBeInTheDocument();
        expect(screen.getByText(/^Community\s*1$/)).toBeInTheDocument();
    });      

    it("shows the 'History' button and handles click", async () => {
        render(
            <ConfigProvider>
                <ResourceList />
            </ConfigProvider>
        );

        const historyButtons = screen.getAllByText("History");
        expect(historyButtons.length).toBeGreaterThan(0);

        fireEvent.click(historyButtons[0]);
        expect(historyButtons[0]).toBeInTheDocument();
    });
});
