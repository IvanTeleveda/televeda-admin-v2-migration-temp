import React from 'react';
import { Table, Typography, Card } from 'antd';
import { HostReportTableWidgetConfig, ReportFilters } from '../types';
import { HttpError, CrudFilters, useParsed, useResource } from '@refinedev/core';
import dayjs from 'dayjs';
import { IClassReportData } from '../../../interfaces';
import { DateField, TextField, useTable } from '@refinedev/antd';
import { IMemberReportFilterVariables } from '../../report-classes/MembersReport';
import paginationFormatter from '../../../components/pagination';
import { TelevedaShow } from '../../../components/page-containers/show';

interface HostReportTableWidgetProps {
    widgetConfig: HostReportTableWidgetConfig;
    isPreviewMode: boolean;
    reportFilters: ReportFilters;
    isExporting?: boolean;
}

const HostReportTableWidget: React.FC<HostReportTableWidgetProps> = ({
    widgetConfig,
    isPreviewMode,
    reportFilters,
    isExporting
}) => {
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


    const { tableProps: memberTableProps, searchFormProps: memberSearchFormProps, filters: memberFilters } = useTable<IClassReportData, HttpError, IMemberReportFilterVariables>({
        syncWithLocation: false,
        resource: "report_classes/hosts",
        queryOptions: {
            retry: 2,
            enabled: isPreviewMode
        },
        errorNotification: ((error: any) => {
            return ({
                description: error?.response?.statusText,
                message: error?.message || '',
                type: "error"
            })

        }),
        pagination: {
            pageSize: isExporting ? undefined : 10
        },
        permanentFilter: buildPermanentFilters(),
    });


    if (memberTableProps.pagination) {
        memberTableProps.pagination.showTotal = paginationFormatter;
    }

    if (!isPreviewMode) {
        return (
            <Card
                title="Hosts Table Widget"
                size="small"
            >
                {(params?.type === 'temp' || action === 'create') &&
                    <>
                        <Typography.Text type="danger" style={{ marginTop: 8 }}>Showing data for last month while creating or editing the base template for demo purpose!</Typography.Text>
                        <br />
                    </>
                }
                <Typography.Text>Data Source:</Typography.Text>
                <Typography.Text code>{"host_report"}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontStyle: 'italic', marginTop: 8 }}>(Data loads in Preview Mode)</Typography.Text>
            </Card>
        );
    }

    return (
        <TelevedaShow
            title="Hosts Table Widget"
        >
            <Table
                {...memberTableProps}
                rowKey="id"
            >
                <Table.Column
                    dataIndex="className"
                    key="className"
                    title="Event Title"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="classScheduledFor"
                    key="classScheduledFor"
                    title="Event Scheduled For"
                    render={(value) => <DateField value={value} format='LLL' />}
                    sorter
                />

                <Table.Column
                    dataIndex="communityName"
                    key="communityName"
                    title="Event Community"
                    render={(value) => <TextField value={value} />}
                    sorter
                />
            </Table>
        </TelevedaShow>
    )
};

export default HostReportTableWidget;