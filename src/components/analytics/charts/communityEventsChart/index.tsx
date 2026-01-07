
import { Dayjs } from "dayjs";
import * as moment from 'moment-timezone';
import { useEffect, useMemo, useContext } from "react";
import { ICommunitySponsors } from "../../../../interfaces";
import { CollectionItemsEventColumn } from "./collectionItemsEventColumn";
import { CustomResponse, useCustom } from "@refinedev/core";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import { ColorModeContext } from "../../../../contexts/color-mode";
export interface CollectionItemEvent {
  event_date: string;
  event_count: number;
  eventType: string;
}

export const CommunityEventsCharts: React.FC<{
  sponsorData: CustomResponse<ICommunitySponsors> | undefined;
  communityIds: string | string[] | undefined | null | number | { value: string; label: string };
  dateRange: [Dayjs, Dayjs];
  apiUrl?: string;
  initialData?: any;
  hideZero?: boolean;
  showResourceInteractions?: boolean;
  showPageViews?: boolean;
}> = ({
  sponsorData,
  communityIds,
  dateRange,
  apiUrl,
  initialData,

  showResourceInteractions = true,
  showPageViews = true
}) => {

  const groupByFilter = AnalyticsGroupType.DAY;
  const { mode } = useContext(ColorModeContext);

  const tz = useMemo(() => {
    return moment.tz.guess()
  }, []);
    const query = {
      start: dateRange[0].toISOString(),
      end: dateRange[1].toISOString(),
      timezone: tz,
      communityIds,
      groupBy: groupByFilter
    };

    const url = `${apiUrl}/analytics/collectionItemsEvents`;
    const { data, isLoading: graphIsLoading, refetch: refetchData } = useCustom<{
      collectionItemsEvents: CollectionItemEvent[];
      sponsorEventsPeriod: number;
      sponsorEventsToDate: number;
      pageVisits: CollectionItemEvent[];
      pageVisitsPeriod: number;
      pageVisitsToDate: number;
    }>({
      url,
      method: "get",
      config: {
        query: {...query, start: dateRange[0].startOf('day').toISOString(), end: dateRange[1].endOf('day').toISOString()}
      },
      queryOptions: initialData ? { initialData } : {}
    });

    useEffect(() => {
      refetchData();
    }, [refetchData]);

    if (!sponsorData?.data) {
      return <></>;
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          {/*<Space direction="vertical" style={{ gap: '0' }}>*/}
          {/*  <Text*/}
          {/*    style={{ fontSize: 18 }}*/}
          {/*    strong*/}
          {/*  >*/}
          {/*    Community Analytics*/}
          {/*  </Text>*/}
          {/*</Space>*/}
        </div>
        {!graphIsLoading && data?.data && 
         (!data.data.collectionItemsEvents?.some(event => event.event_count > 0) && 
          !data.data.pageVisits?.some(visit => visit.event_count > 0)) ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: mode === 'dark' ? '#1f1f1f' : '#fafafa',
            borderRadius: '8px',
            border: mode === 'dark' ? '1px solid #303030' : '1px solid #d9d9d9',
            margin: '20px 0'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: mode === 'dark' ? '#ffffff' : '#595959' }}>
              No data found
            </div>
            <div style={{ fontSize: '14px', color: mode === 'dark' ? '#8c8c8c' : '#8c8c8c' }}>
              Please adjust your search and try again.
            </div>
          </div>
        ) : (
          <>
            {showResourceInteractions && (
              <CollectionItemsEventColumn 
                  isLoading={graphIsLoading} 
                  dateRange={dateRange}
                  events={data?.data.collectionItemsEvents} 
                  periodEvents={data?.data.sponsorEventsPeriod} 
                  toDateEvents={data?.data.sponsorEventsToDate}
                  isGroup={true} 
                  eventDescription="Shows the total events triggered by the members for chosen period"
                  title={"Viewed or Downloaded Community Resource"} 
                  showLegend
                  onGroupByChange={() => {}} // No longer needed since controlled by tab
              />
            )}
            {showPageViews && (
              <CollectionItemsEventColumn 
                  isLoading={graphIsLoading} 
                  dateRange={dateRange}
                  events={data?.data.pageVisits} 
                  periodEvents={data?.data.pageVisitsPeriod} 
                  toDateEvents={data?.data.pageVisitsToDate}
                  isGroup={false} 
                  title={"Viewed Community Page"} 
                  eventDescription="Shows the total views of the Community screen by the members for chosen period"
                  hideTooltip
              />
            )}
          </>
        )}
      </div>
    );
  }