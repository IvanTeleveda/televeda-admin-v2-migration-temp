import { Col, Form, Input, Select, Space, Table, TextField } from '@pankod/refine-antd';
import React, { useRef } from 'react';
import Constants from '../../typings/constants';
import { ICommunitySponsors } from '../../interfaces';
import paginationFormatter from '../../components/pagination';
import { TelevedaList } from '../../components/page-containers/list';
import FilterFormWrapper from '../../components/filter';
import { FilterButton } from '../../components/buttons/filter';
import { CreateButton, DeleteButton, EditButton, useSelect, useTable } from '@refinedev/antd';
import { CrudFilters, HttpError, IResourceComponentsProps } from '@refinedev/core';

interface ICommunitySponsorFilterVariables {
    communitySponsorIds?: Array<string>;
    email: string
}

const CommunitySponsorList: React.FC<IResourceComponentsProps> = () => {
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { selectProps: communitySelectProps } = useSelect<ICommunitySponsors>({
        resource: "community-sponsors",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { tableProps, searchFormProps, filters, tableQuery: { refetch: refetchCommunities } } = useTable<ICommunitySponsors, HttpError, ICommunitySponsorFilterVariables>({
        syncWithLocation: true,
        initialSorter: [
            {
                field: "name",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { communitySponsorIds, email } = params;

            filters.push({
                field: "id",
                operator: "in",
                value: communitySponsorIds,
            });

            filters.push({
                field: "email",
                operator: "contains",
                value: email,
            });

            return filters;
        },
    });

    if (tableProps.pagination) {
        tableProps.pagination.showTotal = paginationFormatter;
    }

    return (
        <TelevedaList
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
                                    fieldValuesNameRef={['communitySponsorIds', 'email']}
                                    filterValuesNameRef={['id', 'email']}
                                    formElement={
                                        <>
                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Sponsor name"
                                                    name="communitySponsorIds"
                                                >
                                                    <Select
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        {...communitySelectProps}
                                                        placeholder="Filter by sponsor name" allowClear mode="multiple" />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Email"
                                                    name="email"
                                                >
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder='Filter by sponsor email' />
                                                </Form.Item>
                                            </Col>
                                        </>}
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
                    dataIndex="name"
                    key="name"
                    title={/*t("posts.fields.title")*/"Name"}
                    render={(value) => <TextField value={value} />}
                    sorter
                />
                <Table.Column
                    dataIndex="email"
                    key="email"
                    title={/*t("posts.fields.title")*/"Email"}
                    render={(value) => <TextField value={value} />}
                    sorter
                />
                <Table.Column<ICommunitySponsors>
                    title={"Actions"}
                    dataIndex="actions"
                    width={"10%"}
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton onSuccess={() => refetchCommunities()} hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </TelevedaList>
    )
}

export default CommunitySponsorList