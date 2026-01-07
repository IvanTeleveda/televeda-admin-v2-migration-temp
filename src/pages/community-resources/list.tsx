import {
    Table,
    TextField,
    getDefaultSortOrder,
    Space,
    Select, Col, Form, Button,
    Drawer,
    Grid
} from "@pankod/refine-antd";
import { useRef, useState } from "react";
import { ICommunity, UserPermissions } from "../../interfaces";
import Constants from "../../typings/constants";
import paginationFormatter from "../../components/pagination";
import FilterFormWrapper from "../../components/filter";
import { FilterButton } from "../../components/buttons/filter";
import { TelevedaList } from "../../components/page-containers/list";
import { EditButton, DeleteButton, useSelect, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps, useApiUrl, useCustom, useCustomMutation, useNavigation, usePermissions } from "@refinedev/core";
import { PlusSquareOutlined } from "@ant-design/icons";

interface ICommunityFilterVariables {
    communityIds?: Array<string>;
    managerEmail: string;
}

export const CommunityResourcesList: React.FC<IResourceComponentsProps> = () => {
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { edit } = useNavigation();

    const { data: permissionsData } = usePermissions<UserPermissions>();
    const apiUrl = useApiUrl();

    const breakpoint = Grid.useBreakpoint();

    const [open, setOpen] = useState(false);
    const [createId, setId] = useState("");
    const { mutate } = useCustomMutation<ICommunity>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { data: viewType, isLoading: viewTypeIsLoading } = useCustom<{ singleView: boolean }>({
        url: `${apiUrl}/community/view_type`,
        method: "get",
    });

    const { tableProps, sorters, searchFormProps, filters, tableQuery: { refetch: refetchCommunities } } = useTable<ICommunity, HttpError, ICommunityFilterVariables>({
        syncWithLocation: true,
        initialSorter: [
            {
                field: "name",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { communityIds, managerEmail } = params;

            console.log("Filter params:", params);

            filters.push({
                field: "id",
                operator: "in",
                value: communityIds,
            });

            filters.push({
                field: "managerEmail",
                operator: "contains",
                value: managerEmail,
            });

            return filters;
        },
    });

    const { selectProps: CreateResourceTableProps, query: { refetch: refetchResourceTableProps }  } = useSelect<ICommunity, HttpError>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        filters: [
            {
                field: "hasResources",
                operator: "eq",
                value: "false",
            },
        ],
        sort: [
            {
                field: "name",
                order: "desc",
            },
        ],
    });

    console.log('tableProps:', tableProps);
    const singleCommunity = tableProps.dataSource?.at(0);
    // console.log(singleCommunity);

    if (tableProps.pagination) {
        tableProps.pagination.showTotal = paginationFormatter;
    }

    const showDrawer = () => {
        // Yeah no Idea what I was doing here, but the code looks like shit :)
        // if we have a single community just set the id and create it
        // Yeah it also need a check to see if the community already has a resource attached, but I'll leave it for later
        if (/*permissionsData !== "TelevedaAdmin" && */ singleCommunity && viewType?.data.singleView) {
            // @ts-ignore
            setId(singleCommunity?.id)
            createResource();
            return;
        }
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const createResource = () => {
        console.log(createId);
        if (!createId) {
            return false;
        }

        mutate({
            url: `${apiUrl}/community-resources/create`,
            method: "post",
            values: {
                communityId: createId
            }
        },
            {
                onError: (error, variables, context) => {
                    console.log(error);
                },
                onSuccess: (data, variables, context) => {
                    edit('community-resources', createId);
                },
            },)
    }

    const refetchAll = () => {
        refetchCommunities();
        refetchResourceTableProps();
    }

    return (
        <>
            {viewTypeIsLoading ? <></> :
                <TelevedaList
                    title="Community Resources"
                    listProps={{
                        headerProps: {
                            extra:
                                <>
                                    {permissionsData === "TelevedaAdmin" &&
                                        <FilterButton
                                            ref={filterButtonRef}
                                            filters={filters}
                                        >
                                            <FilterFormWrapper
                                                ref={filterWrapperRef}
                                                filterButtonRef={filterButtonRef}
                                                formProps={searchFormProps}
                                                filters={filters || []}
                                                fieldValuesNameRef={['communityIds', 'managerEmail']}
                                                filterValuesNameRef={['id', 'managerEmail']}
                                                formElement={<>
                                                    <Col span={24}>
                                                        <Form.Item
                                                            label="Community"
                                                            name="communityIds"
                                                        >
                                                            <Select onChange={() => filterWrapperRef.current?.handleValidation()} {...communitySelectProps} placeholder="Filter by community" allowClear mode="multiple" />
                                                        </Form.Item>
                                                    </Col></>}
                                                syncWithLocation={true}
                                            />
                                        </FilterButton>
                                    }
                                    <Button icon={<PlusSquareOutlined />} type="primary" onClick={showDrawer} >Create</Button>
                                    <Drawer 
                                        title="Create Community Resources" 
                                        width={breakpoint.sm ? "500px" : "100%"}
                                        placement="right" 
                                        onClose={onClose}
                                        open={open}
                                    >
                                        <Form.Item>
                                            <Select {...CreateResourceTableProps} placeholder="Filter by community" onChange={(item) => {
                                                console.log(item);
                                                setId(item.toString())
                                            }} />

                                        </Form.Item>
                                        <Form.Item>
                                            <Button type="primary" onClick={createResource}>Create</Button>
                                        </Form.Item>
                                    </Drawer>
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
                            defaultSortOrder={getDefaultSortOrder("name", sorters)}
                            sorter
                        />

                        <Table.Column<ICommunity>
                            title={"Actions"}
                            dataIndex="actions"
                            render={(_, record) => (
                                <Space>
                                    <EditButton hideText size="small" recordItemId={record.id} />
                                    <DeleteButton 
                                        color="default"
                                        resourceNameOrRouteName="community-resources/soft" 
                                        recordItemId={record.id}                                  
                                        size="small"
                                        //@ts-ignore it works as Element tho, hello?
                                        confirmTitle={<div style={{width: 300}}>
                                            This action will archive all of the resources. 
                                            If you want to permanently delete them you have to select every resource individually
                                        </div>}
                                        confirmOkText="Archive"
                                        onSuccess={(() => {
                                            refetchAll();
                                        })}
                                    >Remove</DeleteButton>
                                </Space>
                            )}
                        />

                    </Table>
                </TelevedaList>
            }
        </>
    );
};