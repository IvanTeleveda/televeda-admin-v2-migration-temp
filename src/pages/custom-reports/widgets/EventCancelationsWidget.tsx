import React from 'react';
import { Table, Typography, Card } from 'antd';
import { CancelationTypes, EventCancelationsWidgetConfig, ReportFilters } from '../types';
import { HttpError, CrudFilters, useParsed, useResource } from '@refinedev/core';
import dayjs from 'dayjs';
import { IClassReportData } from '../../../interfaces';
import { DateField, TextField, useTable } from '@refinedev/antd';
import { IMemberReportFilterVariables } from '../../report-classes/MembersReport';
import { TelevedaShow } from '../../../components/page-containers/show';
import paginationFormatter from '../../../components/pagination';

interface EventCancelationsWidgetProps {
    widgetConfig: EventCancelationsWidgetConfig;
    reportFilters: ReportFilters;
    isPreviewMode: boolean;
    isExporting?: boolean;
}

const EventCancelationsTableWidget: React.FC<EventCancelationsWidgetProps> = ({
    widgetConfig,
    reportFilters,
    isPreviewMode,
    isExporting
}) => {
    const { params } = useParsed();

    const { action } = useResource();

    const { cancelationType } = widgetConfig;

    const buildPermanentFilters = (): CrudFilters => {
        const permanentFilters: CrudFilters = [];
        const globalStartDate = reportFilters.startDate ? dayjs(reportFilters.startDate).startOf('day').toISOString() : null;
        const globalEndDate = reportFilters.endDate ? dayjs(reportFilters.endDate).endOf('day').toISOString() : null;
        const globalCommunityIds = reportFilters.communityIds;

        if (globalStartDate && globalEndDate) {
            permanentFilters.push({
                field: "date", operator: "between",
                value: [globalStartDate, globalEndDate]
            });
        };

        if (globalCommunityIds && globalCommunityIds.length > 0) {
            permanentFilters.push({ field: "communityIds", operator: "in", value: globalCommunityIds });
        }

        if (cancelationType) {
            permanentFilters.push({ field: 'reason', operator: 'eq', value: cancelationType });
        }

        return permanentFilters;
    }

    const { tableProps: eventTableProps } = useTable<IClassReportData, HttpError, IMemberReportFilterVariables>({
        syncWithLocation: false,
        resource: "scheduled-class/by-exception",
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
        filters: {
            permanent: buildPermanentFilters()
        },
        sorters: undefined,
        pagination: {
            pageSize: isExporting ? undefined : 10
        },
    });

    if (eventTableProps.pagination) {
        eventTableProps.pagination.showTotal = paginationFormatter;
    }


    if (!isPreviewMode) {
        return (
            <Card
                title={cancelationType === CancelationTypes.HOST_NOT_STARTED ? "Host not Shown" : "Manual Cancelations"}
                size="small"
            >
                {(params?.type === 'temp' || action === 'create') &&
                    <>
                        <Typography.Text type="danger" style={{ marginTop: 8 }}>Showing data for last month while creating or editing the base template for demo purpose!</Typography.Text>
                        <br />
                    </>
                }
                <Typography.Text>Data Source:</Typography.Text>
                <Typography.Text code>{cancelationType === CancelationTypes.HOST_NOT_STARTED ? "host_not_started" : "manual_cancelation"}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontStyle: 'italic', marginTop: 8 }}>(Data loads in Preview Mode)</Typography.Text>
            </Card>
        );
    }

    return (
        <TelevedaShow
            title={cancelationType === CancelationTypes.HOST_NOT_STARTED ? "Host not Shown" : "Manual Cancelations"}
        >
            <Table
                {...eventTableProps}
                rowKey="id"
            >
                <Table.Column
                    dataIndex={["scheduledClass", "title"]}
                    key="scheduledClass.title"
                    title="Event Title"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="date"
                    key="date"
                    title="Event Start Date"
                    render={(value) => <DateField value={value} format="LLL" />}
                    sorter
                />
            </Table>
        </TelevedaShow>
    )
};

export default EventCancelationsTableWidget;