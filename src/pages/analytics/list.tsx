import {
    CrudFilters,
    IResourceComponentsProps,
    useApiUrl,
    useCustom,
    usePermissions
} from "@refinedev/core";
import { FilterButton } from "../../components/buttons/filter";
import FilterFormWrapper from "../../components/filter";
import dayjs from "dayjs";
import UnifiedAnalytics from "./tabs/unifiedAnalytics";
import ResourceAnalyticsTab from "./tabs/resourceAnalytics";
import SponsorAnalyticsTab from "./tabs/sponsorAnalytics";
import Constants from "../../typings/constants";
import { SummaryContainer } from "./tabs/summaryResults";
import { ICommunity, ICommunitySponsors, UserPermissions } from "../../interfaces";
import { Button, Col, DatePicker, Form, notification, Row, Select, Spin, Tabs, Typography } from "@pankod/refine-antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelect } from "@refinedev/antd";
import { useAnalyticsData } from "../../hooks/useAnalyticsData";
import { ReloadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export enum AnalyticsGroupType {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    QUARTER = 'quarter'
}

const AnalyticsList: React.FC<IResourceComponentsProps> = () => {
    const apiUrl = useApiUrl();
    const { data: permissionsData } = usePermissions<UserPermissions>();

    const [form] = Form.useForm();
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();
    const { RangePicker } = DatePicker;
    const [filters, setFilters] = useState<CrudFilters>([]);
    const [managedCommunityId, setManagedCommunityId] = useState<string | null>(null);

    const communityIdsFilter = filters?.find((f: any) => f.field === "communityIds");
    const communityIds: any = communityIdsFilter?.value;

    const dateRangeFilter = filters?.find((f: any) => f.field === "timestamp");
    const dateRange = dateRangeFilter?.value;

    // Use analytics data hook at the list level to manage loading state
    const {
        data: analyticsData,
        calculatedMetrics,
        resourceEngagementMetrics,
        hasErrors: hasErrorsRaw,
        loadingStates,
        errors
    } = useAnalyticsData({
        communityIds,
        dateRange,
        apiUrl
    });

    // Convert hasErrors to boolean
    const hasErrors = !!hasErrorsRaw;

    const searchFormProps = {
        form,
        onFinish: (values: any) => {
            const newFilters: CrudFilters = [];

            if (values.communityIds && values.communityIds.length > 0) {
                newFilters.push({
                    field: "communityIds",
                    operator: "in",
                    value: values.communityIds
                });
            }

            if (values.timestamp) {
                newFilters.push({
                    field: "timestamp",
                    operator: "between",
                    value: [
                        values.timestamp[0].startOf('day'),
                        values.timestamp[1].endOf('day')
                    ]
                });
            }

            setFilters(newFilters);
            filterButtonRef.current?.hide();
        },
    };

    const { data: communityData } = useCustom<ICommunity>({
        url: `${apiUrl}/community/current`,
        method: "get",
    });

    const {
        selectProps: communitySelectProps,
    } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [{ field: "name", order: "asc" }]
    });

    // Add "All" option for Televeda Admins
    useMemo(() => {
        if (permissionsData === "TelevedaAdmin" && communitySelectProps.options?.at(0)?.value !== 'all' && managedCommunityId) {
            communitySelectProps.options?.unshift({
                label: 'Select All Communities ( ADMIN ONLY! )',
                value: 'all'
            });
        }
    }, [managedCommunityId]);

    useEffect(() => {
        if (communitySelectProps.loading || !communitySelectProps.options || !communityData || !communityData.data) return;
        if (!permissionsData) return;
        else if (permissionsData === 'TelevedaAdmin') {
            setManagedCommunityId(communityData.data.id);
        }
        let isDefaultCommunityExistingForManager = false;

        communitySelectProps.options?.forEach((option) => {
            if (option.value === communityData?.data.id) isDefaultCommunityExistingForManager = true
        });

        if (!isDefaultCommunityExistingForManager) {
            setManagedCommunityId(communitySelectProps.options?.at(0)?.value as string | null);
        }
        else {
            isDefaultCommunityExistingForManager = false;
            setManagedCommunityId(communityData.data.id);
        }
    }, [communityData, communitySelectProps.options, permissionsData]);

    const handleViewTotalsToDate = () => {
        const startDate = dayjs('2020-01-01').startOf('day');
        const endDate = dayjs().endOf('day');

        // Update form values
        form.setFieldsValue({
            timestamp: [startDate, endDate]
        });

        // Update filters
        const newFilters: CrudFilters = [];
        if (communityIds && communityIds.length > 0) {
            newFilters.push({
                field: "communityIds",
                operator: "in",
                value: communityIds
            });
        }
        newFilters.push({
            field: "timestamp",
            operator: "between",
            value: [startDate, endDate]
        });
        setFilters(newFilters);

        notification.success({
            message: 'Date Range Updated',
            description: `Showing totals from ${startDate.format('MMMM DD, YYYY')} to today.`,
        });
    };

    // Handle "Select All" functionality
    const handleCommunityChange = (value: any) => {
        if (value.includes('all') && permissionsData === "TelevedaAdmin") {
            // If "all" is selected, replace with all actual community IDs
            // Should probably just leave this to be "all" in the request
            // const allCommunityIds = communitySelectProps.options
            //     ?.filter(option => option.value !== 'all')
            //     .map(option => option.value as string) || [];
            //
            // form.setFieldsValue({
            //     communityIds: allCommunityIds
            // });

            form.setFieldsValue({ communityIds: "all" })
        }
    };

    const { data: sponsorData } = useCustom<ICommunitySponsors>({
        url: `${apiUrl}/community-sponsors/get-user-sponsors`,
        method: "get"
    });

    const hasInitialized = useRef(false);

    useEffect(() => {
        if (managedCommunityId && !hasInitialized.current) {

            const initialFilters: CrudFilters = [
                {
                    field: "timestamp",
                    operator: "between",
                    value: [dayjs().subtract(7, "days"), dayjs()]
                },
                {
                    field: "communityIds",
                    operator: "in",
                    value: [managedCommunityId]
                }
            ];

            setFilters(initialFilters);

            // Set initial form values
            form.setFieldsValue({
                communityIds: [managedCommunityId],
                timestamp: [dayjs().subtract(7, "days"), dayjs()]
            });

            hasInitialized.current = true;
        }
    }, [managedCommunityId, form]);

    // Tab configuration
    const tabItems = [
        {
            key: 'unified',
            label: 'Community Analytics',
            children: (
                <UnifiedAnalytics
                    communityIds={communityIds}
                    dateRange={dateRange}
                    apiUrl={apiUrl}
                />
            )
        },
        {
            key: 'resources',
            label: 'Resource Analytics',
            children: (
                <ResourceAnalyticsTab
                    communityIds={communityIds}
                    dateRange={dateRange}
                    apiUrl={apiUrl}
                    sponsorData={sponsorData}
                />
            )
        },
        {
            key: 'sponsor',
            label: 'Sponsor Analytics',
            children: (
                <SponsorAnalyticsTab
                    communityIds={communityIds}
                    dateRange={dateRange}
                    apiUrl={apiUrl}
                    sponsorData={sponsorData}
                />
            )
        }
    ];

    return (
        <div>
            {/* Filter Section */}
            <Row gutter={[16, 16]} justify="end" style={{ marginBottom: 16 }}>
                <Col>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={handleViewTotalsToDate}
                    >
                        View Totals to Date
                    </Button>
                </Col>
                <Col>
                    <FilterButton ref={filterButtonRef} filters={filters}>
                        <FilterFormWrapper
                            ref={filterWrapperRef}
                            filterButtonRef={filterButtonRef}
                            formProps={searchFormProps}
                            filters={filters || []}
                            fieldValuesNameRef={["timestamp", "communityIds"]}
                            filterValuesNameRef={["timestamp", "communityIds"]}
                            formElement={
                                <Row gutter={[16, 16]}>
                                    <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                                        <Form.Item
                                            label="Search by community"
                                            name="communityIds"
                                            extra="Select one or multiple communities"
                                        >
                                            <Select
                                                {...communitySelectProps}
                                                labelInValue={false}
                                                optionLabelProp="label"
                                                placeholder="Select a community"
                                                style={{ width: "100%" }}
                                                mode="multiple"
                                                allowClear={true}
                                                onSelect={handleCommunityChange}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                                        <Form.Item label="Timestamp range" name="timestamp">
                                            <RangePicker
                                                style={{
                                                    width: '100%',
                                                    height: 35,
                                                    background: 'rgba(255, 255, 255, 0.3)'
                                                }}
                                                size="small"
                                                ranges={{
                                                    "This Week": [
                                                        dayjs().startOf("week"),
                                                        dayjs().endOf("week"),
                                                    ],
                                                    "Last Month": [
                                                        dayjs().startOf("month").subtract(1, "month"),
                                                        dayjs().endOf("month").subtract(1, "month"),
                                                    ],
                                                    "This Month": [
                                                        dayjs().startOf("month"),
                                                        dayjs().endOf("month"),
                                                    ],
                                                    "This Year": [
                                                        dayjs().startOf("year"),
                                                        dayjs().endOf("year"),
                                                    ],
                                                }}
                                                format="YYYY/MM/DD"
                                                allowClear={false}
                                            />
                                        </Form.Item>
                                    </Col>


                                </Row>
                            }
                            syncWithLocation={true}
                        />
                    </FilterButton>
                </Col>
            </Row>

            {/* Header Section */}
            <Row style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Title level={3}>Community Analytics Dashboard</Title>
                    <Text type="secondary">
                        Comprehensive view of all community analytics. On this page you can look at and explore all the relevant information about your selected community.
                        Switch between community, resource, and sponsor analytics using the tabs below.
                    </Text>
                </Col>
            </Row>

            {/* Summary Section */}
            <Row style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <SummaryContainer
                        dateRange={dateRange}
                        communityIds={communityIds}
                        apiUrl={apiUrl}
                        analyticsData={analyticsData}
                        calculatedMetrics={calculatedMetrics}
                        resourceEngagementMetrics={resourceEngagementMetrics}
                        loadingStates={loadingStates}
                        hasErrors={hasErrors}
                        errors={errors}
                    />
                </Col>
            </Row>

            {/* Tabs Section */}
            <Tabs
                defaultActiveKey="unified"
                items={tabItems}
                size="large"
                style={{ width: '100%' }}
            />
        </div>
    );
};

export default AnalyticsList;