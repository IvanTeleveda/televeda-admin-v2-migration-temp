import React, { useState, useEffect } from 'react';
import { Card, Button, List, Space, Typography, Spin, Alert, Select, Tag } from '@pankod/refine-antd';
import { useCustom, useApiUrl, useNotification } from '@refinedev/core';
import { usePermissions } from '@refinedev/core';
import { useSelect } from '@refinedev/antd';
import { ICommunity, NotificationType } from '../../../interfaces';
import Constants from '../../../typings/constants';

const { Title, Text } = Typography;

interface CommunitySettingsProps {
    onSettingsChange?: () => void;
}

export const CommunitySettings: React.FC<CommunitySettingsProps> = ({ onSettingsChange }) => {
    const apiUrl = useApiUrl();
    const { data: permissionsData } = usePermissions();
    const { open } = useNotification();
    
    const isAdmin = permissionsData === 'TelevedaAdmin';
    const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const openNotificationWithIcon = (type: NotificationType, message: string, description: string) => {
        open?.({
            type,
            message,
            description
        });
    };

    // Fetch communities using the same pattern as MOU modal
    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [{ field: "name", order: "asc" }]
    });

    // Fetch current R.A.D.A.R. settings
    const { data: radarSettingsData, isLoading, refetch } = useCustom<any>({
        url: `${apiUrl}/analytics/radar/communities`,
        method: 'get',
        queryOptions: {
            enabled: isAdmin,
            refetchOnWindowFocus: false
        }
    });

    useEffect(() => {
        const payload = radarSettingsData?.data;
        if (!payload) return;

        console.log('RADAR Settings payload:', payload);

        // Handle the actual API response format: array with communityIds
        if (Array.isArray(payload) && payload.length > 0) {
            // Get the first item (assuming there's only one settings record)
            const settings = payload[0];
            if (settings.communityIds && Array.isArray(settings.communityIds)) {
                setSelectedCommunities(settings.communityIds);
                return;
            }
        }

        // Fallback: Handle other possible formats
        if (payload.selectedCommunityIds || payload.communityIds) {
            setSelectedCommunities(payload.selectedCommunityIds || payload.communityIds || []);
            return;
        }

        // Fallback: Array of communities with isIncludedInRadar flag
        if (Array.isArray(payload)) {
            const preselected = payload
                .filter((c: any) => Boolean(c.isIncludedInRadar))
                .map((c: any) => c.id);
            setSelectedCommunities(preselected);
        }
    }, [radarSettingsData]);

    const handleCommunityChange = (value: string[]) => {
        setSelectedCommunities(value);
    };

    const handleRemoveCommunity = (communityId: string) => {
        setSelectedCommunities(prev => prev.filter(id => id !== communityId));
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/analytics/radar/communities`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    communityIds: selectedCommunities
                })
            });

            if (response.ok) {
                openNotificationWithIcon('success', 'Community settings saved successfully', '');
                refetch();
                onSettingsChange?.();
            } else {
                const errorData = await response.json().catch(() => ({}));
                openNotificationWithIcon('error', errorData.message || 'Failed to save community settings', '');
                console.error('Community Settings Error:', errorData);
            }
        } catch (error) {
            openNotificationWithIcon('error', 'Error updating community settings', '');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <Alert
                message="Access Denied"
                description="Community settings can only be managed by Televeda Administrators."
                type="error"
                showIcon
            />
        );
    }

    return (
        <Card 
            extra={
                <Button 
                    type="primary" 
                    onClick={handleSaveSettings}
                    loading={loading}
                >
                    Save Settings
                </Button>
            }
        >
            <div style={{ marginBottom: '16px' }}>
                <Text type="secondary">
                    Select which communities should be included in R.A.D.A.R. analytics. 
                    Only data from selected communities will be aggregated in the dashboard.
                </Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ marginBottom: '8px', display: 'block' }}>Add Communities:</Text>
                <Select
                    placeholder="Select communities to include in R.A.D.A.R."
                    mode="multiple"
                    value={selectedCommunities}
                    onChange={handleCommunityChange}
                    showSearch
                    filterOption={(input, option) =>
                        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ width: '100%' }}
                    loading={communitySelectProps.loading}
                    options={communitySelectProps.options}
                />
            </div>

            {/* {selectedCommunities.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                        Selected Communities ({selectedCommunities.length}):
                    </Text>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '6px', padding: '8px' }}>
                        {selectedCommunities.map(communityId => {
                            const community = communitySelectProps.options?.find(opt => opt.value === communityId);
                            return (
                                <Tag
                                    key={communityId}
                                    closable
                                    onClose={() => handleRemoveCommunity(communityId)}
                                    style={{ margin: '4px' }}
                                >
                                    {community?.label || communityId}
                                </Tag>
                            );
                        })}
                    </div>
                </div>
            )} */}
        </Card>
    );
};
