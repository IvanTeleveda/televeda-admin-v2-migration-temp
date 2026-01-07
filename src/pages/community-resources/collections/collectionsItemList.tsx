import React, { useEffect } from 'react';
import { Space } from 'antd';
import { Button, FormInstance, Popconfirm, Table } from '@pankod/refine-antd';
import { ICommunityCollectionItem } from '../../../interfaces';
import { useTable } from "@refinedev/antd";
import { HttpError } from '@refinedev/core';

export const CollectionsItemList: React.FC<{
    collectionId: string;
    onDelete: (item: ICommunityCollectionItem) => void;
    itemForm: FormInstance<ICommunityCollectionItem>,
    openItemDrawer: () => void;
}> = ({ collectionId, onDelete, itemForm, openItemDrawer }) => {
    const { tableProps, tableQuery } = useTable<ICommunityCollectionItem, HttpError>({
        resource: `community-collection-items/collection/` + collectionId,
        permanentFilter: [
            {
                field: "collectionId",
                operator: "eq",
                value: collectionId,
            },
        ],
        sorters: {
            mode: 'off'
        }
    });

    // Handle event data and update table
    useEffect(() => {
        const listener = (event: any) => {
            if (event.type === 'itemUpdated') {
                tableQuery.refetch();
            }
        };

        document.addEventListener('itemUpdated', listener);

        return () => {
            document.removeEventListener('itemUpdated', listener);
        };
    }, [tableQuery]);


    if (tableQuery.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Table {...tableProps} rowKey="id">
            <Table.Column 
            title="Title" 
            dataIndex="title" 
            render={(value) => <div style={{ width: '200px'}}>{value}</div>}
            
            />
            <Table.Column 
                title="Description" 
                dataIndex="description" 
                render={(value) => <div style={{ width: '200px'}}>{value}</div>}
            />
            <Table.Column
                title="Resource Type"
                dataIndex="resourceType"
                render={(text) => <span>{text || "N/A"}</span>}
            />
            <Table.Column
                title="File Name"
                dataIndex="fileName"
                render={(text) => <span  style={{ width: '200px'}} >{text || "N/A"}</span>}
            />
            <Table.Column
                title="File Size"
                dataIndex="fileSize"
                render={(size) => (size ? `${(size / 1024).toFixed(2)}KB` : "N/A")}
            />
           <Table.Column<ICommunityCollectionItem>
                title="Download URL"
                dataIndex="downloadUrl"
                render={(text, record) => <span>{text? <a href={text} target="_blank" rel="noopener noreferrer">{record.resourceType === 'file' ? 'Download URL' : 'Link URL'}</a> : "N/A"}</span>}        
            />
            <Table.Column
                title="Link Image URL"
                dataIndex="linkImageDownloadUrl"
                render={(text) => <span>{text ? <a href={text}>Link Image URL</a> : "N/A"}</span>}
            />
              <Table.Column
                title="Thumbnail image URL"
                dataIndex="linkImageCropDownloadUrl"
                render={(text) => <span>{text ? <a href={text}>Thumbnail image URL</a> : "N/A"}</span>}
            />
            <Table.Column<ICommunityCollectionItem>
                title={"Actions"}
                dataIndex="actions"
                render={(_, record) => (
                    <Space>
                        <Button
                            size='small'
                            onClick={() => {
                                openItemDrawer();
                                itemForm.setFieldsValue({
                                    id: record.id,
                                    collectionId: record.collectionId,
                                    title: record.title,
                                    description: record.description,
                                    downloadUrl: record.downloadUrl,
                                    resourceType: record.resourceType
                                });
                            }}
                        >Edit</Button>
                        <Popconfirm
                            title={"Delete " + record.title}
                            description="Are you sure to delete this Item?"
                            onConfirm={() => { onDelete(record) }}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                size='small'
                                danger
                            >Delete</Button>
                        </Popconfirm>
                    </Space>
                )}
            />
        </Table>
    );
};