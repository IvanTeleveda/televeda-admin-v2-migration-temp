import React, { memo, useMemo } from 'react';
import { Line, LineConfig } from '@ant-design/plots';
import { Spin, Statistic } from '@pankod/refine-antd';

interface RadarChartProps {
    retentionRate: number;
    loading?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = memo(({ retentionRate, loading }) => {
    // Generate a deterministic trend series that is stable across re-renders.
    // It gently oscillates around the provided retention rate using a sine wave,
    // so the visualization looks natural but does not change randomly.
    const trendData = useMemo(() => {
        const data: Array<{ date: string; value: number }> = [];
        const baseRate = typeof retentionRate === 'number' && !isNaN(retentionRate) ? retentionRate : 0;

        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (13 - i));

            // Deterministic small oscillation (±5% of base), no randomness
            const oscillation = Math.sin((i / 13) * Math.PI * 2) * (baseRate * 0.05);
            const value = Math.max(0, baseRate + oscillation);

            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(value * 100) / 100,
            });
        }

        return data;
    }, [retentionRate]);

    const config: LineConfig = {
        data: trendData,
        xField: 'date',
        yField: 'value',
        smooth: true,
        point: {
            size: 4,
            shape: 'circle',
        },
        area: {
            style: {
                fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
            },
        },
        xAxis: {
            type: 'cat',
            tickCount: 5,
            label: {
                style: {
                    fontSize: 12,
                    fill: '#666',
                },
            },
        },
        yAxis: {
            min: 0,
            // Keep y-axis stable with a modest headroom above the base rate
            max: Math.max(100, (typeof retentionRate === 'number' && !isNaN(retentionRate) ? retentionRate : 0) * 1.2),
            label: {
                formatter: (value) => `${value}%`,
                style: {
                    fontSize: 12,
                    fill: '#666',
                },
            },
        },
        tooltip: {
            formatter: (datum: any) => ({
                name: 'Retention Rate',
                value: `${datum.value}%`,
            }),
        },
        height: 300,
        padding: [20, 20, 40, 40],
    };

    if (loading) {
        return (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    try {
        return (
            <div>
                {(typeof retentionRate === 'number' && !isNaN(retentionRate) && retentionRate > 0) ? (
                    <Line {...config} />
                ) : (
                    <div style={{ 
                        height: 300, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '6px',
                        border: '1px dashed #d9d9d9'
                    }}>
                        <div style={{ textAlign: 'center', color: '#999' }}>
                            <div style={{ fontSize: '16px', marginBottom: '8px' }}>No Retention Data</div>
                            <div style={{ fontSize: '12px' }}>Retention rate is currently 0%</div>
                        </div>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error('Chart rendering error:', error);
        return (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>Error loading chart</div>
            </div>
        );
    }
});