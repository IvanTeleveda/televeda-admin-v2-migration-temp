import { Switch, Card, Button, Input } from "@pankod/refine-antd"
import { useEffect, useState } from "react";
import { ICommunityCollection, NotificationType } from "../../../interfaces";
import { List } from 'antd';
import { useApiUrl, useCustomMutation, useNotification } from "@refinedev/core";

export const PublicCommunityCollections: React.FC<{
    communityId: string | undefined;
}> = ({ communityId }) => {
    const apiUrl = useApiUrl();
    const { open } = useNotification();
    const { mutate } = useCustomMutation<ICommunityCollection>();
    const [collections, setCollections] = useState<ICommunityCollection[]>([]);
    const [orderValues, setOrderValues] = useState<{ [key: string]: number }>({});

    const openNotificationWithIcon = (type: NotificationType, message: string, description: string) => {
        open?.({
            type,
            message,
            description
        });
    };

    const getCollectionItems = () => {
        mutate({
            url: `${apiUrl}/community-collections/foreign-collections/fetch-list`,
            method: "post",
            values: {
                communityId,
            },
        }, {
            onError: (error, variables, context) => {
                console.log(error);
                openNotificationWithIcon('error', 'Failed to load collections!', "");
            },
            onSuccess: (data, variables, context) => {
                console.log(data);
                //@ts-ignore
                setCollections(data.data)
            },
        },);
    }

    useEffect(() => {
        getCollectionItems();
    }, [])

    const handleException = (collectionName: string, collectionId: string, reason: string, order?: number) => {
        if (!communityId) {
            openNotificationWithIcon("error", "Community ID Missing", "Community ID is required to proceed.");
            return;
        }

        mutate(
            {
                url: `${apiUrl}/community-collections/community-collection-associations`,
                method: "post",
                values: {
                    communityId,
                    communityCollectionId: collectionId,
                    reason,
                    order
                },
            },
            {
                onError: (error) => {
                    console.error("Error adding exception:", error);
                    openNotificationWithIcon("error", `Failed to change ${order ? 'order' : 'visibility'}!`, "Please try again later.");
                },
                onSuccess: () => {
                    getCollectionItems();
                    openNotificationWithIcon("success", `Public Collection ${collectionName} ${order? 'order' : 'visibility'} changed.`, "");
                },
            }
        );
    };

    const handleOrderChange = (collectionId: string, value: string) => {
        setOrderValues((prev: any) => ({
            ...prev,
            [collectionId]: value === '' ? null : Number(value),
        }));
    };

    const handleOrderSubmit = (collectionName: string, collectionId: string) => {
        const newOrder = orderValues[collectionId];
        handleException(collectionName, collectionId, 'ORDER', newOrder);
    };

    return (
        <Card title="Public Collections">
            <List
                itemLayout="vertical"
                size="large"
                dataSource={[...collections].sort((a, b) => a.order - b.order)}
                renderItem={(item: ICommunityCollection) => (
                    <List.Item
                        actions={[
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Switch
                                    checkedChildren="Shown"
                                    unCheckedChildren="Hidden"
                                    checked={!item.exceptions.hidden}
                                    onChange={() => handleException(item.title, item.id || '', 'VISIBILITY_HIDDEN')}
                                    style={{ float: 'right' }}
                                />
                                <div style={{ marginLeft: '92px', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '8px' }}>Order:</span>
                                    <Input
                                        value={orderValues[item.id || 0] === null ? 0 : orderValues[item.id || 0] || item.exceptions.order || ''}
                                        onChange={(e) => handleOrderChange(item.id || '', e.target.value)} 
                                        style={{ width: '80px', marginRight: '8px' }}
                                    />
                                    <Button disabled={!orderValues[item.id || ''] || item.exceptions.order === orderValues[item.id || 0]} onClick={() => handleOrderSubmit(item.title, item.id || '')}>Change</Button>
                                </div>
                            </div>
                        ]}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <div style={{ flex: 1 }}>
                            <Card.Meta style={{ fontSize: 20 }} description={item.title} />
                            <Card.Meta style={{ fontSize: 12 }} description={item.community.name} />
                        </div>
                    </List.Item>
                )}
            />
        </Card>
    );
};
