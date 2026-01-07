import React, { useState, useContext } from 'react';
import { Card, Button, Space, Tooltip, Typography, Row, Col, Statistic, Skeleton, Select, Switch, Input, Checkbox, InputNumber } from 'antd';
import { TableOutlined, BarChartOutlined, AppstoreOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { AnalyticsGroupType } from '../../../pages/analytics';
import { ColorModeContext } from '../../../contexts/color-mode';

const { Title } = Typography;

export enum ViewMode {
    TABLE = 'table',
    CHART = 'chart',
    COMBINED = 'combined'
}

interface SummaryStatistic {
    title: string;
    value: number | string;
    prefix?: React.ReactNode;
    suffix?: string;
    precision?: number;
    valueStyle?: React.CSSProperties;
    tooltip?: string;
    icon?: React.ReactNode;
}

interface TabFilter {
    key: string;
    label: string;
    type: 'select' | 'input' | 'toggle' | 'checkbox' | 'number';
    options?: { value: any; label: string }[];
    placeholder?: string;
    defaultValue?: any;
    onChange?: (value: any) => void;
}

interface UnifiedAnalyticsViewProps {
    title: string;
    tooltip: string;
    icon: React.ReactNode;
    tableComponent: React.ReactNode;
    chartComponent: React.ReactNode;
    summaryStats?: SummaryStatistic[];
    isLoading?: boolean;
    defaultViewMode?: ViewMode;
    tabFilters?: TabFilter[];
    hideViewSwitcher?: boolean;
}

export const UnifiedAnalyticsView: React.FC<UnifiedAnalyticsViewProps> = ({
    title,
    tooltip,
    icon,
    tableComponent,
    chartComponent,
    summaryStats = [],
    isLoading = false,
    defaultViewMode = ViewMode.COMBINED,
    tabFilters = [],
    hideViewSwitcher = false
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
    const { mode } = useContext(ColorModeContext);

    const ViewSwitcher = () => (
        <Space>
            <span style={{ fontSize: 12, color: '#666', marginRight: 8 }}>View:</span>
            <Button.Group size="small">
                <Button
                    type={viewMode === ViewMode.COMBINED ? 'primary' : 'default'}
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode(ViewMode.COMBINED)}
                >
                    Combined
                </Button>
                <Button
                    type={viewMode === ViewMode.CHART ? 'primary' : 'default'}
                    icon={<BarChartOutlined />}
                    onClick={() => setViewMode(ViewMode.CHART)}
                >
                    Chart
                </Button>
                <Button
                    type={viewMode === ViewMode.TABLE ? 'primary' : 'default'}
                    icon={<TableOutlined />}
                    onClick={() => setViewMode(ViewMode.TABLE)}
                >
                    Table
                </Button>
            </Button.Group>
        </Space>
    );

    const renderSummaryStats = () => {
        if (summaryStats.length === 0) return null;

        return (
            <Card style={{ marginTop: 16, marginBottom: 16 }}>
                <Row gutter={24}>
                    {summaryStats.map((stat, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={index}>
                            {isLoading ? (
                                <Skeleton active paragraph={{ rows: 1 }} />
                            ) : (
                                <Statistic
                                    title={
                                        stat.tooltip ? (
                                            <Tooltip title={stat.tooltip} placement="top">
                                                <Space>
                                                    {stat.icon}
                                                    {stat.title}
                                                    <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                                                </Space>
                                            </Tooltip>
                                        ) : (
                                            <Space>
                                                {stat.icon}
                                                {stat.title}
                                            </Space>
                                        )
                                    }
                                    value={stat.value}
                                    suffix={stat.suffix}
                                    precision={stat.precision}
                                    prefix={stat.prefix}
                                    valueStyle={stat.valueStyle}
                                />
                            )}
                        </Col>
                    ))}
                </Row>
            </Card>
        );
    };

    const renderContent = () => {
        switch (viewMode) {
            case ViewMode.TABLE:
                return (
                    <Card 
                        title={
                            <Space>
                                <TableOutlined />
                                Table View
                            </Space>
                        }
                        style={{ marginTop: 16 }}
                    >
                        {tableComponent}
                    </Card>
                );
            case ViewMode.CHART:
                return (
                    <Card 
                        title={
                            <Space>
                                <BarChartOutlined />
                                Chart View
                            </Space>
                        }
                        style={{ marginTop: 16 }}
                    >
                        {chartComponent}
                    </Card>
                );
            case ViewMode.COMBINED:
            default:
                return (
                    <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 16 }}>
                        <Card 
                            title={
                                <Space>
                                    <BarChartOutlined />
                                    Chart View
                                </Space>
                            }
                        >
                            {chartComponent}
                        </Card>
                        <Card 
                            title={
                                <Space>
                                    <TableOutlined />
                                    Table View
                                </Space>
                            }
                        >
                            {tableComponent}
                        </Card>
                    </Space>
                );
        }
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Sticky Header and Filters Container */}
            <div style={{ 
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: mode === 'dark' ? '#141414' : '#ffffff',
                borderRadius: '8px 8px 0 0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
                {/* Header with title, group by filter, and view switcher */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: mode === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
                    marginBottom: 0,
                    background: mode === 'dark' ? '#1f1f1f' : '#fafafa',
                    borderRadius: '8px 8px 0 0',
                    paddingLeft: 16,
                    paddingRight: 16
                }}>
                    <Space size="middle">
                        {icon}
                        <Title level={4} style={{ margin: 0, color: mode === 'dark' ? '#fff' : '#000' }}>
                            {title}
                        </Title>
                        <Tooltip title={tooltip} placement="bottom">
                            <InfoCircleOutlined 
                                style={{ 
                                    color: '#1890ff', 
                                    cursor: 'help',
                                    fontSize: 16
                                }} 
                            />
                        </Tooltip>
                    </Space>
                    
                    {!hideViewSwitcher && <ViewSwitcher />}
                </div>
                
                {/* Tab-specific Filters */}
                {tabFilters.length > 0 && (
                    <div style={{ 
                        background: mode === 'dark' ? '#1f1f1f' : '#fafafa',
                        padding: '16px 20px',
                        borderTop: mode === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
                        borderLeft: mode === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
                        borderRight: mode === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
                        borderBottom: mode === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0'
                    }}>
                        <Row gutter={[16, 16]} align="middle">
                            {tabFilters.map((filter) => (
                                <Col key={filter.key}>
                                    <Space>
                                        <span style={{ color: mode === 'dark' ? '#8c8c8c' : '#666', fontSize: 12 }}>
                                            {filter.label}:
                                        </span>
                                        {filter.type === 'select' && (
                                            <Select
                                                value={filter.defaultValue}
                                                onChange={filter.onChange}
                                                size="small"
                                                style={{ width: 200 }}
                                                options={filter.options}
                                            />
                                        )}
                                        {filter.type === 'input' && (
                                            <Input
                                                placeholder={filter.placeholder}
                                                onChange={(e) => filter.onChange?.(e.target.value)}
                                                size="small"
                                                style={{ width: 150 }}
                                            />
                                        )}
                                        {filter.type === 'toggle' && (
                                            <Switch 
                                                size="small" 
                                                defaultChecked={filter.defaultValue}
                                                onChange={filter.onChange}
                                            />
                                        )}
                                        {filter.type === 'number' && (
                                            <InputNumber
                                                size="small"
                                                min={0}
                                                defaultValue={filter.defaultValue}
                                                onChange={filter.onChange}
                                                style={{ width: 80 }}
                                            />
                                        )}
                                        {filter.type === 'checkbox' && (
                                            <Space>
                                                {filter.options?.map((option: any) => (
                                                    <Checkbox
                                                        key={option.value}
                                                        checked={option.checked}
                                                        onChange={(e) => filter.onChange?.(e.target.checked)}
                                                    >
                                                        {option.label}
                                                    </Checkbox>
                                                ))}
                                            </Space>
                                        )}
                                    </Space>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}
            </div>

            {/* Summary Statistics */}
            {renderSummaryStats()}
            
            {/* Content */}
            {renderContent()}
        </div>
    );
};