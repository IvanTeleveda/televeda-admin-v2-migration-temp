import { Table, Typography, Space, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTable } from "@refinedev/antd";
import type { ColumnsType } from 'antd/es/table';
import { CrudFilter, LogicalFilter, HttpError } from "@refinedev/core";
import { SurveySubmissionsTableProps, SubmissionData } from "../../interfaces";

export const SurveySubmissionsTable: React.FC<SurveySubmissionsTableProps> = ({ 
    surveyId,
    startDate,
    endDate 
}) => {
    const [tableState, setTableState] = useState<{
        dataSource: Array<Object>;
        columns: ColumnsType<any>;
    }>();

    const permanentFilter = useMemo(() => {
        const filters: CrudFilter[] = [
            {
                field: "version",
                value: 0,
                operator: "eq",
            }
        ];
        
        if (startDate && endDate) {
            filters.push({
                field: "timestamp",
                operator: "between",
                value: [startDate, endDate]
            } as LogicalFilter);
        }
        
        return filters;
    }, [startDate, endDate]);

    const { tableProps, tableQuery } = useTable<SubmissionData, HttpError>({
        resource: `surveys/submissions/${surveyId}`,
        filters: {
            permanent: permanentFilter,
        },
        syncWithLocation: false,
        pagination: {
            pageSize: 10,
        },
    });

    const queryData = useMemo(() => {
        return (tableQuery.data?.data as unknown as SubmissionData);
    }, [tableQuery.data]);

    useEffect(() => {
        if (!tableQuery.isLoading && queryData) {
            const dataSource = queryData.resultData.map(
                (data, index) => {
                    const returnData: Record<string, any> = {};

                    if (data.json && typeof data.json === 'object') {
                        Object.entries(data.json).forEach(([key, value]) => {
                            returnData[key] = renderData(value);
                        });
                    }

                    const isSelfSubmission = data.sendBy.email === data.onBehalfOf.email;
                    
                    return {
                        key: index,
                        firstName: isSelfSubmission ? data.sendBy.firstName : data.onBehalfOf.firstName,
                        lastName: isSelfSubmission ? data.sendBy.lastName : data.onBehalfOf.lastName,
                        email: isSelfSubmission ? data.sendBy.email : (
                            <Space direction="vertical">
                                <span><b>Sender:</b> {data.sendBy.email}</span>
                                <span><b>On behalf of:</b> {data.onBehalfOf.email || 'Unregistered user'}</span>
                            </Space>
                        ),
                        community: data.recipientCommunityId || 'N/A',
                        timestamp: dayjs(data.timestamp).format('MMMM D YYYY, h:mm A'),
                        ...returnData
                    }
                }
            );

            const columns: ColumnsType<any> = [
                {
                    title: 'First Name',
                    dataIndex: 'firstName',
                    key: 'firstName',
                    width: 150,
                    render: (value: string) => value || 'N/A'
                },
                {
                    title: 'Last Name',
                    dataIndex: 'lastName',
                    key: 'lastName',
                    width: 150,
                    render: (value: string) => value || 'N/A'
                },
                {
                    title: 'Email',
                    dataIndex: 'email',
                    key: 'email',
                    width: 200
                },
                {
                    title: 'Community',
                    dataIndex: 'community',
                    key: 'community',
                    width: 150,
                    render: (value: string) => value || 'N/A'
                },
                {
                    title: 'Timestamp',
                    dataIndex: 'timestamp',
                    key: 'timestamp',
                    width: 200
                }
            ];

            const surveyQuestions = queryData.metadata?.[0]?.questions || [];
            surveyQuestions.forEach((question: string) => {
                columns.push({
                    title: question,
                    dataIndex: question,
                    key: question,
                    width: 200,
                    render: (value: any) => (
                        <div style={{ minWidth: 150 }}>
                            {value || 'N/A'}
                        </div>
                    )
                });
            });

            setTableState({ dataSource: dataSource, columns: columns });
        }
    }, [tableQuery.isLoading, queryData]);

    // Helper function to render different data types
    const renderData = (data: any): React.ReactNode => {
        if (data === null || data === undefined) {
            return 'N/A';
        }
        
        if (Array.isArray(data)) {
            return (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {data.map((item, idx) => (
                        <li key={idx}>{renderData(item)}</li>
                    ))}
                </ul>
            );
        }
        
        if (typeof data === 'object') {
            return (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {Object.entries(data).map(([key, value]) => (
                        <li key={key}>
                            <b>{key}:</b> {renderData(value)}
                        </li>
                    ))}
                </ul>
            );
        }
        
        if (typeof data === 'string' && data.startsWith('data:image/')) {
            return <img src={data} alt="Uploaded" style={{ maxWidth: 100, maxHeight: 100 }} />;
        }
        
        if (typeof data === 'string' && data.startsWith('http')) {
            return <a href={data} target="_blank" rel="noopener noreferrer">Link</a>;
        }
        
        if (typeof data === 'boolean') {
            return data ? 'Yes' : 'No';
        }
        
        return String(data);
    };

    if (tableQuery.isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                    Loading survey submissions...
                </Typography.Text>
            </div>
        );
    }

    if (!tableState?.dataSource?.length) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Typography.Text type="secondary">
                    No survey submissions found{startDate && endDate ? ' for the selected date range' : ''}.
                </Typography.Text>
            </div>
        );
    }

    return (
        <div>
            <Table
                {...tableProps}
                dataSource={tableState?.dataSource as any}
                columns={tableState?.columns}
                scroll={{ x: 'max-content' }}
            />
        </div>
    );
};