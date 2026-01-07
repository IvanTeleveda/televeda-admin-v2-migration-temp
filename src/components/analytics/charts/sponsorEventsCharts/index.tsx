
import { Col, Form, Select, Space } from "@pankod/refine-antd";
import dayjs from "dayjs";
import * as moment from 'moment-timezone';
import { useState, useEffect, useMemo, useRef, useContext } from "react";
import Constants from "../../../../typings/constants";
import { ICommunity, ICommunitySponsors } from "../../../../interfaces";
import { SponsorEventColumn } from "./sponsorEventColumn";
import { ExportButton, useSelect } from "@refinedev/antd";
import { CrudFilters, GetListResponse, useCustom } from "@refinedev/core";
import { FilterButton } from "../../../buttons/filter";
import FilterFormWrapper from "../../../filter";
import { ColorModeContext } from "../../../../contexts/color-mode";

export interface SponsorEvent {
  event_date: string;
  event_count: number;
  eventType: string;
}

export const SponsorEventsCharts: React.FC<{
  sponsorData: GetListResponse<ICommunitySponsors> | undefined;
  apiUrl?: string;
  dateRange?: [any, any];
  communityIds?: any;
  sponsorId?: string;
  hideZeroValues?: boolean;
  hideFilters?: boolean;
}> = ({
  sponsorData,
  apiUrl,
  dateRange: externalDateRange,
  communityIds: externalCommunityIds,
  sponsorId: externalSponsorId,

  hideFilters = false
}) => {
  
    // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
    const [form] = Form.useForm();
    const [sponsorId, setSponsorId] = useState<string | undefined>(externalSponsorId);
    const [filters] = useState<CrudFilters>([]);
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();
    const { mode } = useContext(ColorModeContext);

    const tz = useMemo(() => {
      return moment.tz.guess();
  }, []);

    // Use external props or fallback to defaults
    const dateRange: [dayjs.Dayjs, dayjs.Dayjs] = externalDateRange ? [dayjs(externalDateRange[0]), dayjs(externalDateRange[1])] : [
      dayjs().subtract(7, "days"),
      dayjs()
    ];
    const communityIds = externalCommunityIds;
    const timezone = tz;

    // Use external sponsor ID if provided, otherwise use local state
    const activeSponsorId = externalSponsorId || sponsorId;

    const query = {
      start: dateRange[0].toISOString(),
      end: dateRange[1].toISOString(),
      timezone,
      sponsorId: activeSponsorId,
      communityIds
    };

    const url = `${apiUrl}/analytics/sponsorEvents`;
    const { data, isLoading: graphIsLoading } = useCustom<{
      sponsorEvents: SponsorEvent[];
      sponsorEventsPeriod: number;
      sponsorEventsToDate: number;
      pageVisits: SponsorEvent[];
      pageVisitsPeriod: number;
      pageVisitsToDate: number;
    }>({
      url,
      method: "get",
      config: {
        query: {...query, start: dateRange[0].startOf('day').toISOString(), end: dateRange[1].endOf('day').toISOString()}
      },
      queryOptions: {
        enabled: !!activeSponsorId, // Only fetch data when sponsor is selected
      }
    });

    const { query: { refetch: refetchCommunities } } = useSelect<ICommunity>({
      resource: "Community",
      optionLabel: 'name',
      optionValue: 'id',
      fetchSize: Constants.DROPDOWN_FETCH_SIZE,
      sort: [
        { field: "name", order: 'asc' }
      ],
      filters: [
        {
          field: "sponsor_id",
          operator: "eq",
          value: sponsorId
        }
      ]
    });

    const exportSponsorReport = () => {

      if (!communityIds || !activeSponsorId) {
        return;
      }

      const url = new URL(`${apiUrl}/analytics/download_sponsor_report`);
      url.searchParams.set('start', query.start);
      url.searchParams.set('end', query.end);
      url.searchParams.set('communityIds', JSON.stringify(communityIds));
      url.searchParams.set('sponsorId', activeSponsorId);
      
      window.open(url.href);
    }

    useEffect(() => {
      if (activeSponsorId) {
        refetchCommunities();
      }
    }, [activeSponsorId])

    useEffect(() => {
      if (!hideFilters) {
        form.setFieldsValue({
          sponsorId: sponsorId
        })
      }
    }, [sponsorId, hideFilters])

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
            Select a Sponsor to View Analytics Charts
          </div>
          <div style={{ fontSize: '14px', color: mode === 'dark' ? '#8c8c8c' : '#8c8c8c', marginBottom: '20px' }}>
            Choose a sponsor from the filter above to see sponsor events and page views data
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
                  setSponsorId(value);
                }}
              />
            </div>
          )}
        </div>
      );
    }

    const searchFormProps = {
      form,
      onFinish: (values: any) => {
          if (values.sponsorId) {
              setSponsorId(values.sponsorId);
          }
          filterButtonRef.current?.hide();
      },
  };
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {!hideFilters && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <Space direction="vertical" style={{ gap: '0' }}>
              {communityIds && communityIds.length > 0 && <ExportButton onClick={exportSponsorReport}></ExportButton>}
            </Space>
            <FilterButton ref={filterButtonRef} filters={filters}>
                <FilterFormWrapper
                    ref={filterWrapperRef}
                    filterButtonRef={filterButtonRef}
                    formProps={searchFormProps}
                    filters={filters || []}
                    fieldValuesNameRef={["sponsorId"]}
                    filterValuesNameRef={["sponsorId"]}
                    formElement={
                        <>
                            <Col xl={24} md={12} sm={12} xs={24}>
                              <Form.Item name="sponsorId" label="Sponsor">
                                <Select
                                  options={
                                    sponsorData?.data.map((sponsor) => {
                                      return {
                                        label: sponsor.name,
                                        value: sponsor.id
                                      }
                                    })
                                  }
                                  onChange={(values: any) => {
                                    if (values) {
                                      setSponsorId(values);
                                    }
                                  }}
                                  placeholder="Select a sponsor"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                        </>
                    }
                />
            </FilterButton>
          </div>
        )}
        {hideFilters && communityIds && communityIds.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
            <ExportButton onClick={exportSponsorReport}></ExportButton>
          </div>
        )}
        {communityIds && communityIds.length > 0 && (
          <>
            {!graphIsLoading && data?.data && 
             (!data.data.sponsorEvents?.some(event => event.event_count > 0) && 
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
                <SponsorEventColumn 
                isLoading={graphIsLoading} 
                dateRange={dateRange as [dayjs.Dayjs, dayjs.Dayjs]}
                events={data?.data.sponsorEvents} 
                periodEvents={data?.data.sponsorEventsPeriod} 
                toDateEvents={data?.data.sponsorEventsToDate}
                isGroup={true} 
                title={"Sponsor Events"} 
              />
                <SponsorEventColumn 
                isLoading={graphIsLoading} 
                dateRange={dateRange as [dayjs.Dayjs, dayjs.Dayjs]}
                events={data?.data.pageVisits} 
                periodEvents={data?.data.pageVisitsPeriod} 
                toDateEvents={data?.data.pageVisitsToDate}
                isGroup={false} 
                title={"Sponsor page views"} 
              />
              </>
            )}
          </>
        )}
      </div>
    );
  }