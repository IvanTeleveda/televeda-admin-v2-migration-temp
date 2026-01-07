import React, { useEffect, useRef, useState } from 'react';
import { Table, Typography, Space, Form, Input, Col, Card } from 'antd';
import { MemberReportTableWidgetConfig, ReportFilters } from '../types';
import { useApiUrl, HttpError, CrudFilters, useCustom, LogicalFilter, useParsed, useResource } from '@refinedev/core';
import dayjs from 'dayjs';
import { LoadingOutlined } from '@ant-design/icons';
import { IClassReportData } from '../../../interfaces';
import { TextField, useTable } from '@refinedev/antd';
import { TelevedaList } from '../../../components/page-containers/list';
import { FilterButton } from '../../../components/buttons/filter';
import { Icons } from '@pankod/refine-antd';
import FilterFormWrapper from '../../../components/filter';
import { IMemberReportFilterVariables } from '../../report-classes/MembersReport';

interface MemberReportTableWidgetProps {
    widgetConfig: MemberReportTableWidgetConfig;
    isPreviewMode: boolean;
    reportFilters: ReportFilters;
    isExporting?: boolean;
}

const MemberReportTableWidget: React.FC<MemberReportTableWidgetProps> = ({
    widgetConfig,
    isPreviewMode,
    reportFilters,
    isExporting
}) => {
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void, filterClicks: number | undefined }>();

    const [effectiveFilters, setEffectiveFilters] = useState<CrudFilters>([]);

    const apiUrl = useApiUrl();

    const { params } = useParsed();

    const { action } = useResource();

    const buildPermanentFilters = (): CrudFilters => {
        const permanentFilters: CrudFilters = [];
        const globalStartDate = reportFilters.startDate ? dayjs(reportFilters.startDate).startOf('day').toISOString() : null;
        const globalEndDate = reportFilters.endDate ? dayjs(reportFilters.endDate).endOf('day').toISOString() : null;
        const globalCommunityIds = reportFilters.communityIds;

        if (globalStartDate && globalEndDate) {
            permanentFilters.push({
                field: "timestamp", operator: "between",
                value: [globalStartDate, globalEndDate]
            });
        } else if (widgetConfig.defaultDateRange) {
            permanentFilters.push({
                field: "timestamp", operator: "between",
                value: widgetConfig.defaultDateRange
            });
        } else {
            permanentFilters.push({
                field: "timestamp", operator: "between",
                value: [dayjs().subtract(8, 'days').startOf('day').toISOString(), dayjs().subtract(1, 'day').endOf('day').toISOString()]
            });
        }

        if (globalCommunityIds && globalCommunityIds.length > 0) {
            permanentFilters.push({ field: "communityIds", operator: "in", value: globalCommunityIds });
        } else if (widgetConfig.defaultCommunityIds && widgetConfig.defaultCommunityIds.length > 0) {
            permanentFilters.push({ field: "communityIds", operator: "in", value: widgetConfig.defaultCommunityIds });
        }

        return permanentFilters;
    };

    useEffect(() => {
        const filterClicks = filterWrapperRef.current?.filterClicks;
        if (filterClicks && filterClicks > 0) {
            setEffectiveFilters(memberFilters.filter((filter): filter is LogicalFilter => 'field' in filter && (filter.field === 'participantName' || filter.field === 'participantEmail')));
        }
    }, [filterWrapperRef.current?.filterClicks]);

    const { tableProps: memberTableProps, searchFormProps: memberSearchFormProps, filters: memberFilters } = useTable<IClassReportData, HttpError, IMemberReportFilterVariables>({
        syncWithLocation: false,
        resource: "report_classes/members",
        queryOptions: {
            retry: 2,
            enabled: isPreviewMode
        },
        errorNotification: ((error: any) => {
            if (error.statusCode === 503) {
                return ({
                    description: "Error",
                    message: `Request took too long. Try shorter timeframe or specific email`,
                    type: "error"
                })
            }
            else {
                return ({
                    description: error?.response?.statusText,
                    message: error?.message || '',
                    type: "error"
                })
            }
        }),
        initialSorter: [
            {
                field: "hybridAttendanceCount",
                order: "desc",
            },
        ],
        pagination: {
            pageSize: isExporting ? undefined : 10
        },
        permanentFilter: buildPermanentFilters(),
        onSearch: (params) => {
            const crudFilters: CrudFilters = [];

            crudFilters.push({
                field: "participantName",
                operator: "contains",
                value: params.participantName
            });

            crudFilters.push({
                field: "participantEmail",
                operator: "contains",
                value: params.participantEmail
            });

            return crudFilters;
        },
    });

    const { data: totalMembers, isLoading: totalMembersLoading } = useCustom({
        url: `${apiUrl}/report_classes/members/total`,
        method: "get",
        config: {
            filters: memberFilters
        },
        queryOptions: {
            enabled: isPreviewMode,
            keepPreviousData: false
        }
    });

    const CustomFooterNode: React.FC<{ total: number; range: Array<number> }> = ({ total, range }) => {

        return (
            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text style={{ position: 'absolute', left: 20, bottom: window.innerWidth > 575 ? 5 : -20 }}>
                    <b>Attendance sum: </b>
                    {
                        totalMembersLoading || memberTableProps.loading ?
                            <LoadingOutlined /> :
                            totalMembers?.data[0].total || 0
                    }
                </Typography.Text>
                <Typography.Text>
                    {range[0]}-{range[1]} of {total}
                </Typography.Text>
            </Space>)
    }

    if (memberTableProps.pagination) {
        memberTableProps.pagination.showTotal = (total, range) => <CustomFooterNode total={total} range={range} />
    }

    if (!isPreviewMode) {
        return (
            <Card
                title="Members Table Widget"
                size="small"
            >
                {(params?.type === 'temp' || action === 'create') &&
                    <>
                        <Typography.Text type="danger" style={{ marginTop: 8 }}>Showing data for last month while creating or editing the base template for demo purpose!</Typography.Text>
                        <br />
                    </>
                }
                <Typography.Text>Data Source:</Typography.Text>
                <Typography.Text code>{"member_report"}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontStyle: 'italic', marginTop: 8 }}>(Data loads in Preview Mode)</Typography.Text>
            </Card>
        );
    }

    return (
        <TelevedaList
            listProps={{
                headerProps: {
                    extra:
                        <>
                            <FilterButton
                                ref={filterButtonRef}
                                filters={effectiveFilters}
                                size='middle'
                            >
                                <FilterFormWrapper
                                    ref={filterWrapperRef}
                                    filterButtonRef={filterButtonRef}
                                    formProps={memberSearchFormProps}
                                    filters={effectiveFilters || []}
                                    fieldValuesNameRef={['participantName', 'participantEmail']}
                                    filterValuesNameRef={['participantName', 'participantEmail']}
                                    formElement={
                                        <>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Participant Email" name="participantEmail">
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by Participant Email"
                                                        prefix={<Icons.SearchOutlined />}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    noStyle
                                                    shouldUpdate={(prevValues, currentValues) =>
                                                        prevValues.participantEmail !== currentValues.participantEmail ||
                                                        prevValues.communityIds !== currentValues.communityIds
                                                    }
                                                    preserve={true}
                                                >
                                                    {({ getFieldValue }) =>
                                                        (getFieldValue('participantEmail') || getFieldValue('communityIds')?.length > 0) ? (
                                                            <Form.Item label="Participant Name" name="participantName">
                                                                <Input
                                                                    onChange={() => filterWrapperRef.current?.handleValidation()}
                                                                    placeholder="Filter by Participant Name"
                                                                    prefix={<Icons.SearchOutlined />}
                                                                />
                                                            </Form.Item>
                                                        ) : null
                                                    }
                                                </Form.Item>
                                            </Col>
                                        </>}
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                        </>
                }
            }}
        >
            <Table
                {...memberTableProps}
                rowKey={(record) => { return record.id + '|' + record.participantId }}
            >
                <Table.Column
                    dataIndex="participantName"
                    key="participantName"
                    title="Participant Name"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="participantEmail"
                    key="participantEmail"
                    title="Participant Email"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="communityName"
                    key="communityName"
                    title="Participant Community"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="hybridAttendanceCount"
                    key="hybridAttendanceCount"
                    title="Total Attendance"
                    render={(value) => <TextField value={value} />}
                    sorter
                />
            </Table>
        </TelevedaList>
    )
};

export default MemberReportTableWidget;