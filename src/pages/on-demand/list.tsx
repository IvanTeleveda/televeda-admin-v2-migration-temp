import { Button, Col, Form, Icons, Input, notification, Select, Space, Table, TextField } from '@pankod/refine-antd'
import React, { useRef } from 'react'
import { LinkOutlined } from '@ant-design/icons';
import { IClassCategory, ICommunity, IOnDemandClass, IRefineUser, UserPermissions } from '../../interfaces';
import Constants from '../../typings/constants';
import { TelevedaList } from '../../components/page-containers/list';
import { FilterButton } from '../../components/buttons/filter';
import paginationFormatter from '../../components/pagination';
import FilterFormWrapper from '../../components/filter';
import { CreateButton, DeleteButton, EditButton, useSelect, useTable } from '@refinedev/antd';
import { CrudFilters, HttpError, IResourceComponentsProps, useGetIdentity, usePermissions } from '@refinedev/core';

interface IOnDemandFilterVariables {
    title: string;
    communityId: string;
    privacyType: string;
    visibilityType: string;
    categoryId: string;
}

const { Option } = Select;

const OnDemandList: React.FC<IResourceComponentsProps> = () => {

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        filters: [{
            field: "includeHosted",
            operator: "eq",
            value: "true"
        }]
    });

    const { tableProps, sorters, searchFormProps, filters, tableQuery: { refetch: refetchOnDemand } } = useTable<IOnDemandClass, HttpError, IOnDemandFilterVariables>({
        syncWithLocation: true,
        initialSorter: [
            {
                field: "title",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { title, communityId, categoryId, visibilityType } = params;

            filters.push({
                field: "title",
                operator: "contains",
                value: title,
            });
            filters.push({
                field: "communityId",
                operator: "in",
                value: communityId,
            });
            filters.push({
                field: "categoryId",
                operator: "in",
                value: categoryId,
            });
            // filters.push({
            //     field: "privacyType",
            //     operator: "contains",
            //     value: privacyType,
            // });

            return filters;
        }
    });

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const handleCopyLink = (classId: string | undefined) => {
        if (!classId) {
            return;
        }
        let baseUrl = window.location.protocol + "//" + window.location.host + "/on-demand/" + classId;

        navigator.clipboard.writeText(baseUrl);

        notification.open({
            message: 'Copied class link',
            icon: <LinkOutlined style={{ color: '#108ee9' }} />,
        });

    }

    if (tableProps.pagination) {
        tableProps.pagination.showTotal = paginationFormatter;
    }

    const { selectProps: categorySelectProps } = useSelect<IClassCategory>({
        resource: "class-categories",
        optionLabel: 'title',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        filters: [{
            field: "includeHosted",
            operator: "eq",
            value: "true"
        }]
    });

    const { data: user } = useGetIdentity<IRefineUser>();

    return (
        <TelevedaList

            title="On-demand"

            listProps={{

                headerProps: {
                    extra:
                        <>
                            <FilterButton
                                ref={filterButtonRef}
                                filters={filters}
                            >
                                <FilterFormWrapper
                                    ref={filterWrapperRef}
                                    filterButtonRef={filterButtonRef}
                                    formProps={searchFormProps}
                                    filters={filters || []}
                                    fieldValuesNameRef={['title', 'communityId', 'categoryId']}
                                    filterValuesNameRef={['title', 'communityId', 'categoryId']}
                                    formElement={
                                        <>
                                            <Col span={24}>
                                                <Form.Item label="Class title" name="title">
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by class title"
                                                        prefix={<Icons.SearchOutlined />}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col span={24}>
                                                <Form.Item
                                                    label="Community"
                                                    name="communityId"
                                                >
                                                    <Select
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        {...communitySelectProps}
                                                        placeholder="Filter by community"
                                                        allowClear mode="multiple" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item
                                                    label="Category"
                                                    name="categoryId"
                                                >
                                                    <Select
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by category"
                                                        allowClear
                                                        {...categorySelectProps}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>
                                    }
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                            <CreateButton title="Create" type="primary" />
                        </>
                }
            }}
        >
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="title"
                    key="title"
                    title="Event Title"
                    render={(value) => <TextField value={value} />}
                    sorter
                />
                <Table.Column
                    dataIndex="community"
                    key="community.name"
                    title="Community"
                    render={(value) =>
                        <TextField value={value?.name} />
                    }
                    sorter
                />
                <Table.Column
                    dataIndex="visibilityType"
                    key="visibilityType"
                    title="Visibility"
                    render={(value) => <TextField value={value} />}
                    sorter
                />
                <Table.Column
                    dataIndex="categoryDetails"
                    key="categoryDetails"
                    title="Category"
                    render={(categoryDetails) => <TextField value={categoryDetails?.title || ""} />}
                    sorter
                />
                <Table.Column<IOnDemandClass>
                    title={"Actions"}
                    dataIndex="actions"
                    render={(_, record) => (
                        <Space>
                            <Button icon={<LinkOutlined />} size="small" onClick={() => handleCopyLink(record.id)} title='Copy class Link' />
                            <EditButton hideText size="small" recordItemId={record.id} />
                            {(!user?.hostOnlyCommunityIds.includes(record.communityId) || permissionsData === "TelevedaAdmin" ) &&
                                <DeleteButton onSuccess={() => refetchOnDemand()} hideText size="small" recordItemId={record.id} />
                            }
                        </Space>
                    )}
                />
            </Table>
        </TelevedaList>
    )
}

export default OnDemandList;