import { Select, Table, TextField } from "@pankod/refine-antd";
import dayjs from "dayjs";
import { useEffect, useState, useMemo, useContext } from "react";
import { ICommunitySponsors } from "../../../../interfaces";
import paginationFormatter from "../../../pagination";
import { TelevedaList } from "../../../page-containers/list";
import { GetListResponse, useCustom } from "@refinedev/core";
import { ColorModeContext } from "../../../../contexts/color-mode";

interface ISponsorMemberEventsVariables {
  dateRange?: Array<string>;
  sponsorId: string;
  communityIds: string;
  event_types: string;
}

export const SponsorMemberEvents: React.FC<{
  sponsorData: GetListResponse<ICommunitySponsors> | undefined;
  dateRange?: [any, any];
  communityIds?: any;
  sponsorId?: string;
  hideFilters?: boolean;
}> = ({
  sponsorData,
  dateRange: externalDateRange,
  communityIds: externalCommunityIds,
  sponsorId: externalSponsorId,
  hideFilters = false
}) => {
    // Use external props or fallback to defaults
    const [localSponsorId, setLocalSponsorId] = useState<string | undefined>(externalSponsorId);
    const [eventTypes, setEventTypes] = useState<string[]>([]);
    
    const dateRange = externalDateRange ? [dayjs(externalDateRange[0]), dayjs(externalDateRange[1])] : [
      dayjs().subtract(7, "days"),
      dayjs(),
    ];
    const communityIds = externalCommunityIds;

    // Use external props when available
    const activeSponsorId = externalSponsorId || localSponsorId;
    const activeEventTypes = eventTypes;
    const { mode } = useContext(ColorModeContext);


    // Build query parameters for the API call
    const query = useMemo(() => {
        if (!activeSponsorId) return null;
        
        return {
            start: dateRange[0].startOf('day').toISOString(),
            end: dateRange[1].endOf('day').toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            sponsorId: activeSponsorId,
            communityIds: communityIds,
            ...(activeEventTypes.length > 0 && { eventTypes: activeEventTypes })
        };
    }, [activeSponsorId, dateRange, communityIds, activeEventTypes]);

    // Use useCustom to fetch data directly from the same endpoint as charts
    const { data, isLoading, error } = useCustom<{
        sponsorEvents: Array<{
            event_date: string;
            event_count: number;
            eventType: string;
            community?: string;
        }>;
        sponsorEventsPeriod: number;
        sponsorEventsToDate: number;
        pageVisits: any[];
        pageVisitsPeriod: number;
        pageVisitsToDate: number;
    }>({
        url: `/analytics/sponsorEvents`,
        method: "get",
        config: { query },
        queryOptions: {
            enabled: !!query && !!activeSponsorId,
            onError: (error: any) => {
                console.error("SponsorMemberEvents - API Error:", error);
            },
            onSuccess: (data: any) => {
                console.log("SponsorMemberEvents - API Success:", data);
            }
        }
    });

    // Transform the data for the table - filter out zero count events and add row keys
    const tableData = useMemo(() => {
        if (!data?.data?.sponsorEvents) return [];
        
        return data.data.sponsorEvents
            .filter(event => event.event_count > 0) // Only show events with actual counts
            .map((event, index) => ({
                id: `${event.event_date}-${event.eventType}-${index}`, // Create unique ID for rowKey
                event_date: event.event_date,
                event_count: event.event_count,
                eventType: event.eventType,
                community: event.community || 'N/A',
                // Transform to match expected table structure
                'community.name': event.community || 'N/A'
            }));
    }, [data]);

    // Create table props manually
    const tableProps = {
        dataSource: tableData,
        loading: isLoading,
        pagination: {
            showTotal: paginationFormatter,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
        }
    };

    // No need for manual refetch - useCustom handles this automatically when query changes

    // Debug: Log table props to see what data we're getting
    useEffect(() => {
      if (activeSponsorId) {
        console.log("SponsorMemberEvents - Table props dataSource:", tableProps.dataSource);
        console.log("SponsorMemberEvents - Table props loading:", tableProps.loading);
        console.log("SponsorMemberEvents - Active sponsor ID:", activeSponsorId);
        
        // Log if there's an error
        if (!tableProps.loading && !tableProps.dataSource) {
          console.warn("SponsorMemberEvents - No data returned from API. Check if /analytics/sponsorMemberEvents endpoint exists and returns data.");
        }
      }
    }, [tableProps.dataSource, tableProps.loading, activeSponsorId]);


    if (!sponsorData?.data) {
      return <></>;
    }

    // Show message when no sponsor is selected
    if (!activeSponsorId) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: mode === 'dark' ? '#1f1f1f' : '#fafafa',
          borderRadius: '8px',
          border: mode === 'dark' ? '2px dashed #303030' : '2px dashed #d9d9d9'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: mode === 'dark' ? '#ffffff' : '#595959' }}>
            Select a Sponsor to View Member Actions
          </div>
          <div style={{ fontSize: '14px', color: mode === 'dark' ? '#8c8c8c' : '#8c8c8c', marginBottom: '20px' }}>
            Choose a sponsor from the filter above to see detailed member interaction data
          </div>
          {!hideFilters && (
            <div style={{ display: 'inline-block' }}>
              <Select
                placeholder="Select a sponsor to get started"
                style={{ width: '300px', height: '40px' }}
                size="large"
                options={
                  sponsorData?.data.map((sponsor) => ({
                    label: sponsor.name,
                    value: sponsor.id
                  }))
                }
                onChange={(value: string) => {
                  setLocalSponsorId(value);
                }}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <TelevedaList
        title={'Sponsor Events Summary'}
        listProps={{
          headerProps: {
            extra: !hideFilters ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Select
                  placeholder="Filter by event type"
                  style={{ width: '200px' }}
                  mode="multiple"
                  allowClear
                  value={activeEventTypes}
                  onChange={(values: string[]) => setEventTypes(values || [])}
                  options={[
                    { label: "Clicked email", value: "clicked_sponsor_email" },
                    { label: "Clicked phone", value: "clicked_sponsor_phone" },
                    { label: "Clicked site", value: "clicked_sponsor_site" },
                    { label: "Clicked form", value: "clicked_sponsor_form" },
                    { label: "Viewed page with sponsor", value: "sponsor_page_view" }
                  ]}
                />
              </div>
            ) : undefined
          }
        }}
      >
        {!tableProps.loading && (!tableProps.dataSource || tableProps.dataSource.length === 0) ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: mode === 'dark' ? '#1f1f1f' : '#fafafa',
            borderRadius: '8px',
            border: mode === 'dark' ? '1px solid #303030' : '1px solid #d9d9d9',
            margin: '20px 0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: mode === 'dark' ? '#595959' : '#bfbfbf' }}>
              📋
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: mode === 'dark' ? '#ffffff' : '#595959' }}>
              No data found
            </div>
            <div style={{ fontSize: '14px', color: mode === 'dark' ? '#8c8c8c' : '#8c8c8c' }}>
              Please adjust your search and try again.
            </div>
          </div>
        ) : (
          <Table {...tableProps} rowKey="id">
            <Table.Column
              dataIndex="event_date"
              key="event_date"
              title="Date"
              render={(value) => <TextField value={dayjs(value).format('MMM DD, YYYY')} />}
              sorter
            />
            <Table.Column
              dataIndex="eventType"
              key="eventType"
              title="Event Type"
              render={(value) => <TextField value={value?.replace(/clicked sponsor |sponsor_/g, '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} />}
              sorter
            />
            <Table.Column
              dataIndex="community"
              key="community"
              title="Community"
              render={(value) => <TextField value={value || 'N/A'} />}
              sorter
            />
            <Table.Column
              dataIndex="event_count"
              key="event_count"
              title="Count"
              render={(value) => (
                <TextField 
                  value={value} 
                  style={{ 
                    fontWeight: 'bold', 
                    color: value > 0 ? '#52c41a' : '#8c8c8c' 
                  }} 
                />
              )}
              sorter
            />
          </Table>
        )}
      </TelevedaList>
    )
  }