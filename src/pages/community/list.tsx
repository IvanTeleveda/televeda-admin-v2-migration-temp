import {
  CreateButton,
  DeleteButton,
  EditButton,
  ExportButton,
  useSelect,
  useTable,
} from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps, usePermissions, useApiUrl, useCustom, useList } from "@refinedev/core";
import { Card, Col, notification, Row, Space, Table, Tag, Typography, Image, Form, TextField, Select, getDefaultSortOrder, Input } from "@pankod/refine-antd";
import { ICommunity, ICommunityCodes, ICommunityFilterVariables, UserPermissions } from "../../interfaces";
import { useRef } from "react";
import Constants from "../../typings/constants";
import paginationFormatter from "../../components/pagination";
import { TelevedaList } from "../../components/page-containers/list";
import { FilterButton } from "../../components/buttons/filter";
import FilterFormWrapper from "../../components/filter";

export const CommunityList: React.FC<IResourceComponentsProps> = () => {

  const filterButtonRef = useRef<{ hide: () => void }>();
  const filterWrapperRef = useRef<{ handleValidation: () => void }>();

  const { data: permissionsData } = usePermissions<UserPermissions>();
  const apiUrl = useApiUrl();

  const { Text } = Typography;

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
    filters: {
        permanent: [{
            field: "extended",
            operator: "eq",
            value: "true"
        }]
    },
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

  const communityCodes = useList<ICommunityCodes>({
    resource: `community-codes/${tableProps.dataSource?.at(0)?.id || ""}`
  })

  const communityList = tableProps.dataSource;
  const loading = tableProps.loading;
  const singleCommunity = communityList?.at(0);
  console.log('tableProps:', tableProps);

  if (tableProps.pagination) {
      tableProps.pagination.showTotal = paginationFormatter;
  }

  const exportMembers = (record: ICommunity | undefined) => {
    if (record) {
        window.open(`${apiUrl}/community/download_report/${record.id}`);

        notification.open({
            description: "If you don't see it please check your browser downloads.",
            type: "success",
            message: "Download has started."
        });
    }
}

  return (
    <>
            {permissionsData != "TelevedaAdmin" && viewTypeIsLoading ? <></> :
                !viewType?.data.singleView ?
                    <TelevedaList
                        title="Community Info"
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
                                                    </Col>

                                                    <Col span={24}>
                                                        <Form.Item
                                                            label="Managed By"
                                                            name="managerEmail"
                                                        >
                                                            <Input onChange={() => filterWrapperRef.current?.handleValidation()} placeholder="Filter by manager email" />
                                                        </Form.Item>
                                                    </Col></>}
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
                                defaultSortOrder={getDefaultSortOrder("name", sorters)}
                                sorter
                            />

                            <Table.Column
                                dataIndex={"communityManagers"}
                                title={"Managers"}
                                render={(value) => {
                                    return (
                                        <>
                                            {
                                                value ?
                                                    value.map((item: any) => {
                                                        const email = item.email;
                                                        return (
                                                            <Tag color='geekblue' key={email}>
                                                                {email}
                                                            </Tag>
                                                        );
                                                    })
                                                    : null


                                            }
                                        </>
                                    );
                                }}
                            />

                            <Table.Column
                                dataIndex={"communityHosts"}
                                title={"Instructors"}
                                render={(value) => {
                                    return (
                                        <>
                                            {
                                                value ?
                                                    value.map((item: any) => {
                                                        const email = item.email;
                                                        return (
                                                            <Tag color='geekblue' key={email}>
                                                                {email}
                                                            </Tag>
                                                        );
                                                    })
                                                    : null


                                            }
                                        </>
                                    );
                                }}
                            />

                            <Table.Column
                                dataIndex={"communityMembersCount"}
                                title={"Members count"}
                                render={(value) => <TextField value={value} />}
                            />

                            <Table.Column<ICommunity>
                                title={"Actions"}
                                dataIndex="actions"
                                render={(_, record) => (
                                    <Space>
                                        <EditButton hideText size="small" recordItemId={record.id} />
                                        <ExportButton onClick={() => exportMembers(record)} hideText size="small" />
                                        <DeleteButton resourceNameOrRouteName="community-associations/community/transferAndDelete" onSuccess={() => refetchCommunities()} hideText size="small" recordItemId={record.id} />
                                    </Space>
                                )}
                            />

                        </Table>
                    </TelevedaList>
                    :
                    <Card title={<div className="ant-page-header-heading-title">Managed community</div>}
                        extra={
                            <Space>
                                <CreateButton title="Create" type="primary" />
                                <EditButton recordItemId={singleCommunity?.id} />
                                <ExportButton onClick={() => exportMembers(singleCommunity)} />
                                <DeleteButton recordItemId={singleCommunity?.id} />
                            </Space>}>

                        <Row gutter={[{ xs: 8, sm: 16, md: 24, lg: 32 }, 16]}>
                            <Col className="gutter-row" xs={24} sm={24} md={12} lg={12} xl={12}>
                                <p className="ant-page-header-heading-title">Details:</p>
                                <div style={{ marginLeft: "3.4em", marginTop: "1.7em" }}>
                                    <Text strong={true}>Communiy name:</Text>
                                    <span className="ant-rate-text">{singleCommunity?.name}</span>
                                    <br /><br />

                                    <Text strong={true}>Community display name:</Text>
                                    <span className="ant-rate-text">{singleCommunity?.displayName}</span>
                                    <br /><br />

                                    <Text strong={true}>Community managers:</Text>
                                    <br></br>
                                    <Space direction="vertical" style={{ marginLeft: "50px", marginTop: "10px" }}>
                                        {singleCommunity?.communityManagers.map((manager) => {
                                            return (
                                                <Tag color='geekblue' key={manager.email}>
                                                    {manager.email}
                                                </Tag>
                                            )
                                        })}
                                    </Space>

                                    <br></br>
                                    <br></br>
                                    <Text strong={true}>Invite codes:</Text>
                                    <br></br>
                                    <Space direction="vertical" style={{ marginLeft: "50px", marginTop: "10px" }}>
                                        {communityCodes?.data?.data?.map((code) => {
                                            return (
                                                <Tag color='green' key={code.id}>
                                                    {code.code}
                                                </Tag>
                                            )
                                        })}
                                    </Space>
                                </div>
                            </Col>


                            {singleCommunity?.logo ?
                                <Col className="gutter-row" xs={24} sm={24} md={12} lg={12} xl={12}>
                                    <p className="ant-page-header-heading-title">Logo:</p>
                                    <Image src={singleCommunity?.logo} alt="no-logo" />
                                </Col>
                                : <></>}
                        </Row>
                    </Card>
            }
        </>
  );
};
