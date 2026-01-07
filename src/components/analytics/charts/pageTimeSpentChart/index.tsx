import { useMemo } from "react";
import { Empty } from "antd";
import dayjs from "dayjs";
import * as moment from "moment-timezone";
import { Line, LineConfig } from "@ant-design/plots";
import { useCustom } from "@refinedev/core";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import { useDebouncedValue } from "../../../buttons/sendEmail/useDebounce";

export const PageTimeSpentChart: React.FC<{
  communityIds: string[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs],
  apiUrl: string;
  globalGroupBy?: AnalyticsGroupType;
  userEmail?: string;
  enableFetching?: boolean;
  isLoading?: boolean;
  passedData?: any;
}> = ({
  communityIds,
  dateRange,
  apiUrl,
  globalGroupBy = AnalyticsGroupType.DAY,
  userEmail = "",
  enableFetching = true,
  isLoading: passedIsLoading,
  passedData
}) => {
    const groupByFilter = globalGroupBy;
    const appliedUserEmail = userEmail;

    const timezone = useMemo(() => moment.tz.guess(), []);

    const query = {
      start: dateRange[0].startOf("day").toISOString(),
      end: dateRange[1].endOf("day").toISOString(),
      timezone,
      communityIds,
      groupBy: groupByFilter,
      ...(appliedUserEmail
        ? { userEmail: appliedUserEmail }
        : {}),
    };

    const url = `${apiUrl}/analytics/memberPageTimeMetrics`;
    const { data: queryData, isLoading: graphIsLoading } = useCustom<{
      data: any;
      total: any;
      trend: number;
    }>({
      url,
      method: "get",
      config: {
        query,
      },
      queryOptions: { enabled: enableFetching /* refine black magic allows getting the data from the parent query */ }
    });

    // Use passed loading state when fetching is disabled, otherwise use query loading state
    const isLoading = enableFetching ? graphIsLoading : (passedIsLoading ?? false);
    const data = passedData || queryData; 

    const config: LineConfig = useMemo(
      () => ({
        data: data?.data.data || [],
        loading: isLoading,
        padding: "auto",
        xField: "event_date",
        yField: "total_time_spent",
        seriesField: "page",
        point: { size: 4, shape: "circle" },
        smooth: true,
        height: 400,
        autoFit: true,
        yAxis: {
          label: {
            formatter: (value: any) => {
              const minutes = parseFloat(value);
              if (minutes < 1) {
                return `${Math.round(minutes * 60)}s`;
              } else if (minutes < 60) {
                return `${Math.round(minutes)}m`;
              } else {
                const hours = Math.floor(minutes / 60);
                const mins = Math.round(minutes % 60);
                return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
              }
            },
          },
        },
        tooltip: {
          formatter: (datum: any) => {
            const minutes = parseFloat(datum.total_time_spent);
            let formattedValue;

            if (minutes < 1) {
              formattedValue = `${(minutes * 60).toFixed(2)}s`;
            } else if (minutes < 60) {
              formattedValue = `${minutes.toFixed(2)}m`;
            } else {
              const hours = Math.floor(minutes / 60);
              const remainingMins = minutes % 60;
              formattedValue = `${hours}h ${remainingMins.toFixed(2)}m`;
            }

            return {
              name: datum.page,
              value: formattedValue,
            };
          },
        },
        scrollbar: {
          categorySize: 10,
          style: {
            thumbColor: "#d9d9d9",
            thumbHighlightColor: "#b3b3b3",
          },
        },
      }),
      [data, isLoading]
    );

    return (
      <div
        style={{
          display: "flex",
          minHeight: 500,
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {!isLoading && (!data?.data.data || data.data.data.length === 0) ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Empty
              description="No data found. Please adjust your search and try again."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <Line
            padding={0}
            appendPadding={10}
            {...config}
          />
        )}
      </div>
    );
  };
