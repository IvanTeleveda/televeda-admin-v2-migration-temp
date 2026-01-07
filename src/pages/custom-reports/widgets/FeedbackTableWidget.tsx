import React, { useEffect, useMemo, useState } from 'react';
import { Table, Spin, Alert, Typography, Card, Space, Tabs, Input, Form, Button, Modal, Tooltip, Badge } from 'antd';
import { ColumnGroupType, ColumnsType, ColumnType } from 'antd/es/table';
import { FeedbackTableAggregationType, FeedbackTableWidgetConfig, FetchedFeedbackWidgetPayload, ReportFilters, WidgetFeedbackData } from '../types';
import { useApiUrl, useCustom, useParsed, useResource } from '@refinedev/core';
import { DateField } from '@refinedev/antd';
import { Model } from 'survey-core';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat'; // For LLL, LL etc.

dayjs.extend(localizedFormat);
interface FeedbackTableWidgetProps {
    widgetConfig: FeedbackTableWidgetConfig;
    isPreviewMode: boolean;
    reportFilters: ReportFilters;
    isExporting: boolean;
}

const FeedbackTableWidget: React.FC<FeedbackTableWidgetProps> = ({ widgetConfig, isPreviewMode, reportFilters, isExporting }) => {
    const [feedbackData, setFeedbackData] = useState<FetchedFeedbackWidgetPayload | null>(null);

    const [activeTabKey, setActiveTabKey] = useState<string | undefined>(undefined);

    const [columnFilters, setColumnFilters] = useState<Record<string, Record<string, string>>>({});
    const [isColumnFilterModalVisible, setIsColumnFilterModalVisible] = useState<boolean>(false);

    const [modalFilterableColumns, setModalFilterableColumns] = useState<ColumnsType<WidgetFeedbackData>>([]);
    const [columnFilterForm] = Form.useForm();

    const apiUrl = useApiUrl();
    const { id: idFromRoute, params } = useParsed();

    const { action } = useResource();

    const { data, isLoading, refetch: fetchData, error } = useCustom<FetchedFeedbackWidgetPayload>({
        url: `${apiUrl}/custom_reports/custom_widgets/feedback`,
        method: 'get',
        queryOptions: {
            enabled: false,
        },
        config: {
            query: { ...reportFilters, type: widgetConfig.aggregationType || 'member' }
        }
    });

    const exportUrl = useMemo(() => {
        if (!reportFilters) return '#';

        const params = new URLSearchParams();
        if (reportFilters.startDate) params.append('startDate', reportFilters.startDate);
        if (reportFilters.endDate) params.append('endDate', reportFilters.endDate);
        if (reportFilters.communityIds) {
            reportFilters.communityIds.forEach(id => params.append('communityIds', id));
        }

        params.append('type', widgetConfig.aggregationType || 'member');

        return `${apiUrl}/custom_reports/download_report/feedback?${params.toString()}`;
    }, [reportFilters, apiUrl]);

    useEffect(() => {
        if (isPreviewMode && widgetConfig) {
            fetchData();
        }
    }, [isPreviewMode, widgetConfig, reportFilters]);

    useEffect(() => {
        if (data?.data) {
            const payload = data.data;
            setFeedbackData(payload);
        }
    }, [data?.data]);

    function isDataColumn<T>(col: ColumnType<T> | ColumnGroupType<T>): col is ColumnType<T> {
        return !('children' in col);
    }

    const filterRawDataBySpecificColumns = (
        rawData: WidgetFeedbackData[],
        activeColFilters: Record<string, string>
    ): WidgetFeedbackData[] => {
        if (Object.keys(activeColFilters).length === 0) return rawData;

        return rawData.filter(item => {
            for (const filterColKey in activeColFilters) {
                const searchTerm = activeColFilters[filterColKey].toLowerCase();
                if (!searchTerm) continue;

                let valueToTest: any;
                let stringifiedValueToTest = '';

                if (filterColKey.startsWith('data.')) {
                    const actualDataKey = filterColKey.substring(5);
                    valueToTest = item.data ? item.data[actualDataKey] : undefined;
                } else {
                    valueToTest = (item as any)[filterColKey];
                }

                if (valueToTest !== null && valueToTest !== undefined) {
                    try {
                        if (filterColKey === 'eventScheduledFor') {
                            stringifiedValueToTest = dayjs(valueToTest).format('MMMM D, YYYY h:mm A').toLowerCase();
                        } else if (typeof valueToTest === 'object') {
                            stringifiedValueToTest = JSON.stringify(valueToTest).toLowerCase();
                        } else {
                            stringifiedValueToTest = String(valueToTest).toLowerCase();
                        }
                    } catch (e) {
                        console.warn(`Could not process value for ${filterColKey} for search:`, valueToTest, e);
                        stringifiedValueToTest = String(valueToTest).toLowerCase(); // Fallback
                    }
                }

                if (!stringifiedValueToTest.includes(searchTerm)) {
                    return false;
                }
            }
            return true;
        });
    };

    const iterateSurveyData = (data: any) => {

        if (data === null || typeof data === 'undefined') {
            return <Typography.Text type="secondary" italic>[Not answered]</Typography.Text>;
        }

        if (typeof data === 'object') {
            if (Array.isArray(data)) {
                // If it's an array, recursively process each element
                return <ul style={{ paddingLeft: 10 }}>
                    {data.map((item: any, index: number) => (
                        <li key={index}>{iterateSurveyData(item)}</li>
                    ))}
                </ul>;
            } else {
                // If it's an object, recursively process each property
                return <ul style={{ paddingLeft: 10 }}>{
                    Object.entries(data).map(([innerKey, innerValue]: [string, any], index: number) =>
                        <li>
                            <Typography.Text strong>{innerKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: </Typography.Text>
                            {iterateSurveyData(innerValue)}
                        </li>)}
                </ul>;
            }
        } else {
            if (data.toString().startsWith('data:image/')) {
                return <img width={'auto'} height={150} src={data} alt="image" />;
            }
            if (data.toString().startsWith('http')) {
                return <a href={data}>Link</a>;
            }
            return <span>{data.toString() + " "}</span>;
        }
    }

    const generateColumnsForFeedbackData = (
        _sampleDataItems: WidgetFeedbackData[],
        categoryKey: string,
        survey?: Model
    ): ColumnsType<WidgetFeedbackData> => {

        const baseColumns: ColumnsType<WidgetFeedbackData> = [
            { title: 'User Name', dataIndex: 'userName', key: 'userName', fixed: 'left', width: 150, ellipsis: true, sorter: (a, b) => a.userName.localeCompare(b.userName) },
            { title: 'User Email', dataIndex: 'userEmail', key: 'userEmail', width: 180, ellipsis: true },
            { title: 'Event', dataIndex: 'eventTitle', key: 'eventTitle', width: 200, ellipsis: true, sorter: (a, b) => (a.eventTitle || "").localeCompare(b.eventTitle || "") },
            { title: 'Event Timestamp', dataIndex: 'eventScheduledFor', key: 'eventScheduledFor', render: (ts) => ts ? <DateField value={ts} format='LLL' /> : 'N/A', width: 230 },
        ];

        let specificColumns: ColumnsType<WidgetFeedbackData> = [];

        if (categoryKey.startsWith('sql_survey_')) {
            if (survey) {
                const surveyQuestions = survey.getAllQuestions(true); // survey-core method
                specificColumns = surveyQuestions
                    .filter(question => question.name && question.title)
                    .map((question, index) => ({
                        title: question.title || question.name,
                        dataIndex: ['data', question.name],
                        key: `data.${question.name}_${index}`,
                        width: 200,
                        ellipsis: false,
                        render: (valueFromRecord: any, record: WidgetFeedbackData) => {
                            return iterateSurveyData(valueFromRecord);
                        },
                    }));
            }
        } else if (categoryKey === 'sql_participant_default') {
            specificColumns = [
                { title: 'Feedback Note', dataIndex: ['data', 'feedback'], key: 'data.feedback', width: 150 },
                { title: 'Instructor Rating', dataIndex: ['data', 'ratingInstructor'], key: 'data.ratingInstructor', align: 'center', width: 200 },
                { title: 'Content Rating', dataIndex: ['data', 'ratingClassContent'], key: 'data.ratingClassContent', align: 'center', width: 150 },
                { title: 'Tech Issues', dataIndex: ['data', 'technicalIssues'], key: 'data.technicalIssues', ellipsis: true, width: 150 },
                { title: 'Supported/Connected', dataIndex: ['data', 'supportedConnected'], key: 'data.supportedConnected', ellipsis: true, width: 150 },
            ];
        } else if (categoryKey === 'sql_host_default') {
            specificColumns = [{ title: 'Host Note', dataIndex: ['data', 'feedback'], key: 'data.feedback', width: 200 }];
        } else if (categoryKey === 'vtc_participant' || categoryKey === 'vtc_host') {
            const allVtcKeys = new Set<string>();
            _sampleDataItems.forEach(item => Object.keys(item.data || {}).forEach(key => allVtcKeys.add(key)));
            specificColumns = Array.from(allVtcKeys).map(key => ({
                title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                dataIndex: ['data', key],
                key: `data.${key}`,
                width: 150, ellipsis: false,
                render: (value: any) => iterateSurveyData(value),
            }));
        }

        return [...baseColumns, ...specificColumns];
    };

    const openColumnFilterModal = (tabKey: string, columnsForTab: ColumnsType<WidgetFeedbackData>) => {
        setActiveTabKey(tabKey);
        const suitableColumns = columnsForTab.filter(
            (col): col is ColumnType<WidgetFeedbackData> => {
                if (!isDataColumn(col)) return false;

                // Further check if this data column is suitable for filtering
                // (e.g., has a key or a usable dataIndex for the form item name)
                const key = col.key || (Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex);
                return typeof key === 'string' && key.trim() !== '';
            }
        );
        setModalFilterableColumns(suitableColumns);
        columnFilterForm.setFieldsValue(columnFilters[tabKey] || {});
        setIsColumnFilterModalVisible(true);
    };

    const handleApplyColumnFilters = () => {
        if (!activeTabKey) return;
        const currentTabFormValues = columnFilterForm.getFieldsValue();
        const activeFiltersForTab: Record<string, string> = {};
        for (const key in currentTabFormValues) {
            if (currentTabFormValues[key] && String(currentTabFormValues[key]).trim() !== '') {
                activeFiltersForTab[key] = String(currentTabFormValues[key]).trim();
            }
        }
        setColumnFilters(prev => ({
            ...prev,
            [activeTabKey]: activeFiltersForTab,
        }));
        setIsColumnFilterModalVisible(false);
    };

    const handleClearColumnFiltersForTab = (tabKey: string) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[tabKey];
            return newFilters;
        });
        if (tabKey === activeTabKey) {
            columnFilterForm.resetFields();
        }
    };

    const tabItemsAndData = useMemo(() => {
        if (!feedbackData) {
            setActiveTabKey(undefined);
            return [];
        }

        const itemsOutput: any[] = [];
        const { metadata, data: sqlDataArray, vtcData: vtcDataArray } = feedbackData;

        if (!metadata) {
            setActiveTabKey(undefined);
            return [];
        }

        const constructTabPane = (
            tabKey: string,
            rawDataForCategory: WidgetFeedbackData[],
            label: string,
            rawLabel?: string,
        ) => {
            if (!rawDataForCategory || rawDataForCategory.length === 0) return null;

            // Define columns for display (uses iterateSurveyData in render functions)
            // Note: For surveys, ensure the correct surveyModel is passed if generateColumns needs it
            let surveyModelForColumns: Model | undefined;
            if (tabKey.startsWith('sql_survey_') && rawDataForCategory[0]?.surveyJSON) {
                try { surveyModelForColumns = new Model(rawDataForCategory[0].surveyJSON); } catch (e) { }
            }
            const displayColumns = generateColumnsForFeedbackData(rawDataForCategory, tabKey, surveyModelForColumns);

            const activeColFiltersForThisTab = columnFilters[tabKey] || {};

            const filteredRawData = filterRawDataBySpecificColumns(rawDataForCategory, activeColFiltersForThisTab);

            const hasActiveFilters = Object.keys(activeColFiltersForThisTab).length > 0;

            return {
                key: tabKey,
                label: `(${filteredRawData.length}) ${label}`,
                rawData: rawDataForCategory,
                rawDataLength: filteredRawData.length,
                columns: displayColumns,
                children: (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <Space>
                                <Typography.Text>{rawLabel || label}</Typography.Text>
                            </Space>
                            <Space>
                                {hasActiveFilters && (
                                    <Button size="middle" onClick={() => handleClearColumnFiltersForTab(tabKey)}>
                                        Clear Tab Filters ({Object.keys(activeColFiltersForThisTab).length})
                                    </Button>
                                )}
                                <Badge count={Object.keys(activeColFiltersForThisTab).length}>
                                    <Button
                                        icon={<FilterOutlined />}
                                        size="middle"
                                        onClick={() => openColumnFilterModal(tabKey, displayColumns)}
                                        type="primary"
                                    >
                                        Filter
                                    </Button>
                                </Badge>
                                <Tooltip title="Export all feedback data as Excel (.xlsx)">
                                    <Button
                                        icon={<DownloadOutlined />}
                                        size="middle"
                                        href={exportUrl}
                                        target="_blank"
                                    >
                                        Export
                                    </Button>
                                </Tooltip>
                            </Space>
                        </Space>
                        <Table
                            dataSource={filteredRawData}
                            columns={displayColumns}
                            size="small"
                            scroll={{ x: 'max-content' }}
                            pagination={{ hideOnSinglePage: true, defaultPageSize: 20 }}
                            rowKey="id"
                            style={{ height: '100%' }}
                        />
                    </Space>
                ),
            };
        };

        // SQL - Participant Default
        if (metadata.sql.hasDefaultEntries) {
            const categoryData = sqlDataArray.filter(item => item.feedbackType === 'default' && !item.isFromHost);
            const tabPane = constructTabPane('sql_participant_default', categoryData, 'Standard (Participant)');
            if (tabPane) itemsOutput.push(tabPane);
        }
        // SQL - Host Default
        if (metadata.sql.hasHostEntries) {
            const categoryData = sqlDataArray.filter(item => item.feedbackType === 'default' && item.isFromHost);
            const tabPane = constructTabPane('sql_host_default', categoryData, 'Standard (Host)',);
            if (tabPane) itemsOutput.push(tabPane);
        }
        // SQL - Surveys
        metadata.sql.uniqueSurveyIds.forEach((surveyId, index) => {
            const categoryData = sqlDataArray.filter(item => item.feedbackType === 'survey' && item.surveyId === surveyId);
            if (categoryData.length > 0) {
                const surveyJsonSchema = categoryData[0]?.surveyJSON;
                const surveyVersion = categoryData[0]?.version;
                let surveyFullTitle = surveyId;
                let surveyShortTitle = surveyId.substring(0, 12) + (surveyId.length > 12 ? '...' : '');

                if (surveyJsonSchema) {
                    try {
                        const surveyModel = new Model(surveyJsonSchema);
                        surveyFullTitle = surveyModel.title + (surveyVersion && surveyVersion > 1 ? ` (ver. ${surveyVersion})` : '') || surveyId;
                        surveyShortTitle = surveyFullTitle.length > 12 ? surveyFullTitle.substring(0, 12) + '...' : surveyFullTitle;
                    } catch (e) { }
                }
                const tabKey = `sql_survey_${surveyId}_${index}`;
                const tabPane = constructTabPane(tabKey, categoryData, `Survey: ${surveyShortTitle}`, surveyFullTitle);
                if (tabPane) {
                    itemsOutput.push({
                        ...tabPane,
                        label: <Tooltip title={surveyFullTitle}>{tabPane.label}</Tooltip>,
                        rawLabel: `(${tabPane.rawDataLength}) Survey: ${surveyFullTitle}`
                    });
                }
            }
        });
        // VTC - Participant
        if (metadata.noSql.hasDefaultEntries) {
            const categoryData = vtcDataArray.filter(item => !item.isFromHost);
            const tabPane = constructTabPane('vtc_participant', categoryData, 'VTC (Participant)');
            if (tabPane) itemsOutput.push(tabPane);
        }
        // VTC - Host
        if (metadata.noSql.hasHostEntries) {
            const categoryData = vtcDataArray.filter(item => item.isFromHost);
            const tabPane = constructTabPane('vtc_host', categoryData, 'VTC (Host)');
            if (tabPane) itemsOutput.push(tabPane);
        }

        if (itemsOutput.length > 0 && !itemsOutput.find(item => item.key === activeTabKey)) {
            requestAnimationFrame(() => setActiveTabKey(itemsOutput[0].key));
        } else if (itemsOutput.length === 0) {
            requestAnimationFrame(() => setActiveTabKey(undefined));
        }

        return itemsOutput;
    }, [feedbackData, activeTabKey, columnFilters]);

    if (!isPreviewMode && !isExporting) {
        return (
            <Card
                title="Feedback Table Widget"
                size="small"
            >
                {(params?.type === 'temp' || action === 'create') &&
                    <>
                        <Typography.Text type="danger" style={{ marginTop: 8 }}>Showing data for last month while creating or editing the base template for demo purpose!</Typography.Text>
                        <br />
                    </>
                }
                <Typography.Text>Data Source:</Typography.Text>
                <Typography.Text code>{widgetConfig.dataSourceKey || "Not set"}</Typography.Text>
                <br />
                <Typography.Text style={{ marginTop: 8 }}>Aggregation:</Typography.Text>
                <Typography.Text code>
                    {widgetConfig.aggregationType === FeedbackTableAggregationType.EVENT_COMMUNITY ? 'Event Community' : 'Member Community'}
                </Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontStyle: 'italic', marginTop: 8 }}>(Data loads in Preview Mode)</Typography.Text>
            </Card>
        );
    }

    if (isLoading && !isExporting) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin tip="Loading table data..." /></div>;
    }

    if (error && !isExporting) {
        return <Alert message="Error" description={error.message} type="error" showIcon style={{ margin: '10px' }} />;
    }

    if ((!feedbackData || !feedbackData.data || (feedbackData.data.length === 0 && feedbackData.vtcData.length === 0)) && !isExporting) {
        return <Alert message="No Data" description={`No data available for source: ${widgetConfig.dataSourceKey}`} type="info" showIcon style={{ margin: '10px' }} />;
    }

    if (isExporting) {
        const detailSections: JSX.Element[] = [];

        tabItemsAndData.forEach(tab => {
            if (!tab || !tab.rawData || !tab.columns) return;

            const sectionId = `feedback_tab_export_${widgetConfig.i}_${tab.key}`; // Unique ID for this tab section
            const sectionTitle = `${tab.rawLabel || tab.label}`;

            detailSections.push(
                <div
                    key={tab.key}
                    className="print-section print-feedback-tab-section-export" // Common class for styling/querying
                    id={sectionId} // Crucial ID for TOC
                    style={{ marginBottom: '10mm' }} // Spacing between feedback categories
                >
                    <Typography.Title level={5} className="feedback-tab-title-export" style={{ borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '8px' }}>
                        {sectionTitle}
                    </Typography.Title>
                    <div style={{ width: '100%', overflowX: 'auto' }}> {/* For wide tables */}
                        <Table
                            dataSource={tab.rawData}
                            columns={tab.columns}
                            size="small"
                            pagination={false}
                            rowKey="id"
                            bordered
                        />
                    </div>
                </div>
            );
        });
        return <>{detailSections}</>;
    }

    return (
        <>
            {isPreviewMode && !isLoading && !error && feedbackData && tabItemsAndData.length > 0 && (
                <Tabs
                    activeKey={activeTabKey}
                    tabPosition={tabItemsAndData.length > 2 ? 'left' : 'top'}
                    onChange={setActiveTabKey}
                    type="card"
                    size="small"
                    items={tabItemsAndData}
                />
            )}
            {isPreviewMode && !isLoading && !error && feedbackData && tabItemsAndData.length === 0 && (
                <Alert message="No feedback categories to display." type="info" showIcon style={{ margin: '10px' }} />
            )}
            <Modal
                title={`Filter: ${activeTabKey ? (tabItemsAndData.find(ti => ti.key === activeTabKey)?.label || activeTabKey) : 'Columns'}`}
                open={isColumnFilterModalVisible}
                onOk={handleApplyColumnFilters}
                onCancel={() => setIsColumnFilterModalVisible(false)}
                width={600}
                destroyOnClose
                maskClosable={false}
            >
                <Form form={columnFilterForm} layout="vertical">
                    {modalFilterableColumns.map(col => {
                        let formItemName: string;
                        if (!isDataColumn(col)) {
                            return null;
                        }
                        if (Array.isArray(col.dataIndex)) {
                            formItemName = col.dataIndex.join('.');
                        } else if (typeof col.dataIndex === 'string') {
                            formItemName = col.dataIndex;
                        } else if (typeof col.key === 'string') {
                            formItemName = col.key;
                        } else {
                            // This should be rare if `suitableColumns` filter is effective
                            console.warn("Cannot determine form item name for column:", col);
                            return null;
                        }

                        return (
                            <Form.Item
                                key={formItemName}
                                name={formItemName}
                                label={(col.title as React.ReactNode) || formItemName.replace("data.", "")}
                            >
                                <Input
                                    placeholder={`Filter by ${typeof col.title === 'string' ? col.title : formItemName.replace("data.", "")}`}
                                    allowClear
                                />
                            </Form.Item>
                        );
                    })}
                    {modalFilterableColumns.length === 0 && <Typography.Text>No filterable columns for this tab.</Typography.Text>}
                </Form>
            </Modal>
        </>
    );
};

export default FeedbackTableWidget;