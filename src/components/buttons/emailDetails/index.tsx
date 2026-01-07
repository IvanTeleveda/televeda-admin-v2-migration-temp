import { Button, Col, Modal, Table, Typography } from "@pankod/refine-antd";
import { TextField, useModal, useTable } from "@refinedev/antd";
import { useEffect, useState } from "react";

export const EmailDetailsButton: React.FC<{
    id: string
    btnSize: "small" | "middle" | "large"
}> = (props) => {

    const { show, close, modalProps } = useModal();

    const [usersTableData, setUsersTableData] = useState<any>([]);
    const [configJson, setConfigJson] = useState<any>(null);

    const { tableProps: communityTableProps, filters, tableQueryResult: { refetch }, setFilters, setSorter } = useTable({
        resource: "community",
        permanentFilter: [
            {
                field: 'id',
                operator: 'in',
                value: configJson?.communityIds
            }
        ],
        hasPagination: false,
        syncWithLocation: false,
        defaultSetFilterBehavior: "replace",
        queryOptions: { 
            enabled: false
        }
    });

    const { tableQueryResult: usersTableQueryResult, filters: historyFilters, sorter: historySoter, setFilters: setHistoryFilters, setSorter: setHistorySorter } = useTable({
        resource: `emails/history-user-list/${props.id}`,
        hasPagination: false,
        syncWithLocation: false,
        defaultSetFilterBehavior: "replace",
        queryOptions: {
            enabled: modalProps.open
        }
    });

    useEffect(() => {
        setFilters(filters || [], "replace");
        setHistoryFilters(historyFilters || [], 'replace')
        setSorter([]);
        setHistorySorter([]);
      }, []);

    useEffect(() => {
        if(!usersTableQueryResult.isLoading) {
            const dataSource: any = usersTableQueryResult.data?.data 
            setUsersTableData(dataSource?.requestJson);
            setConfigJson(dataSource?.configJson);
        }
    }, [usersTableQueryResult.data]);

    useEffect(() => {
        if(!usersTableQueryResult.isLoading) {
            refetch();
        }
    }, [configJson])

    return (
        <>
            <Button onClick={() => show()} size={props.btnSize}>
                Details...
            </Button>
            <Modal
                okText="Ok"
                width="70%"
                destroyOnClose
                onOk={() => close()}
                okButtonProps={{ size: "large" }}
                cancelButtonProps={{ style: { display: 'none' } }}
                title="Email Details"
                {...modalProps}
            >
                    {/* <Typography.Text strong italic style={{fontSize: 16, color: 'red'}}>
                        Some data for unassociated communities may be hidden
                    </Typography.Text> */}
                    <br />
                    {configJson?.sendToMembers && (
                        <Typography.Text style={{ fontSize: 16 }}>
                            Sent to {configJson?.membersList?.length > 0 ? "specific" : "all"} members of the listed communities
                        </Typography.Text>
                    )}
                    <br />
                    {configJson?.sendToInstructors && (
                        <Typography.Text style={{ fontSize: 16 }}>
                            Sent to {configJson?.instructorsList?.length > 0 ? "specific" : "all"} instructors of the listed communities
                        </Typography.Text>
                    )}
                    <br />
                    <Col xl={8} lg={12} md={24}>
                        <Table rowKey="id" size="small" {...communityTableProps} aria-labelledby="community-table">
                            <Table.Column 
                                key="name"
                                dataIndex="name"
                                title="Communities"
                            />
                        </Table>
                    </Col>
                    <br />

                    <Col xl={16} lg={24}>
                        <Table rowKey="id" size="small" loading={usersTableQueryResult.isLoading} pagination={{pageSize: 50}} dataSource={usersTableData}>
                            <Table.Column
                                key="firstName"
                                dataIndex="firstName"
                                title="Name"   
                                render={(_, record: any) => <TextField value={`${record.firstName} ${record.lastName}`} />} 
                            />
                            <Table.Column
                                key="email"
                                dataIndex="email"
                                title="User Email"
                                render={(value) => <TextField value={value} />}
                            />
                            <Table.Column
                                key="community.name"
                                dataIndex="community"
                                title="Community"
                                render={(value) => <TextField value={value.name} />}
                            />
                        </Table>
                    </Col>
            </Modal>
        </>
    )
}