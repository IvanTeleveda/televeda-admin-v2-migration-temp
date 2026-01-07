import { useMemo } from "react";
import { Empty } from "antd";
import dayjs from "dayjs";
import * as moment from "moment-timezone";
import { Line, LineConfig } from "@ant-design/plots";
import { useCustom } from "@refinedev/core";
import { AnalyticsGroupType } from "../../../../pages/analytics";

export interface VTCData {
  event_date: string;
  page: string;
  total_time_spent: number;
}

export interface StreamingData {
  event_date: string;
  page: string;
  total_time_spent: number;
}

export const StreamingChart: React.FC<{
  communityIds: string[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs],
  apiUrl: string;
  globalGroupBy?: AnalyticsGroupType;
  userEmail?: string;
  enableFetching?: boolean;
  isLoading?: boolean;
  passedStreamingData?: any;
  passedVtcData?: any;
}> = ({
  communityIds,
  dateRange,
  apiUrl,
  globalGroupBy = AnalyticsGroupType.DAY,
  userEmail = "",
  enableFetching = true,
  isLoading: passedIsLoading,
  passedStreamingData,
  passedVtcData
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

    // Fetch streaming data
    const { data: streamingQueryData, isLoading: streamingQueryLoading } = useCustom<{
      data: StreamingData[];
    }>({
      url: `${apiUrl}/analytics/memberOnDemandClassScheduleTimeMetrics`,
      method: "get",
      config: { query },
      queryOptions: { enabled: enableFetching /* refine black magic allows getting the data from the parent query */ }
    });

    // Fetch VTC data
    const { data: vtcQueryData, isLoading: vtcQueryLoading } = useCustom<{
      data: VTCData[];
    }>({
      url: `${apiUrl}/analytics/memberVTCTimeMetrics`,
      method: "get",
      config: { query },
      queryOptions: { enabled: enableFetching /* refine black magic allows getting the data from the parent query */ }
    });

    // Use passed loading state when fetching is disabled, otherwise use query loading state
    const isLoading = enableFetching ? (streamingQueryLoading || vtcQueryLoading) : (passedIsLoading ?? false);
    const streamingData = streamingQueryData || passedStreamingData;
    const vtcData = vtcQueryData || passedVtcData;

    // Combine the data for the chart
    const combinedData = useMemo(() => {
      const combined: any[] = [];

      // Add streaming data
      if (streamingData?.data?.data) {
        streamingData.data.data.forEach((item: StreamingData) => {
          combined.push({
            event_date: item.event_date,
            page: item.page,
            total_time_spent: item.total_time_spent
          });
        });
      }

      // Add VTC data with a consistent page name
      if (vtcData?.data?.data) {
        vtcData.data.data.forEach((item: VTCData) => {
          combined.push({
            event_date: item.event_date,
            page: "vtc",
            total_time_spent: item.total_time_spent
          });
        });
      }

      // Sort by date to ensure consistent ordering (ascending)
      return combined.sort((a, b) => {
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      });
    }, [streamingData, vtcData]);

    const config: LineConfig = useMemo(
      () => ({
        data: combinedData,
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

            // Map page names to more readable labels
            let pageName = datum.page;
            switch (datum.page) {
              case 'class-schedule':
                pageName = 'Scheduled Classes';
                break;
              case 'on-demand':
                pageName = 'On Demand';
                break;
              case 'external-event':
                pageName = 'External Event';
                break;
              case 'vtc':
                pageName = 'VTC';
                break;
            }

            return {
              name: pageName,
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
      [combinedData, isLoading]
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
        {!isLoading && (!combinedData || combinedData.length === 0) ? (
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