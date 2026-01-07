import { Button, DateField, Space, Table, TextField } from "@pankod/refine-antd"
import { EmailHistory } from "../../../interfaces";
import { EmailDetailsButton } from "../../buttons/emailDetails";
import { DeleteButton } from "@refinedev/antd";
import { useCreate } from "@refinedev/core";

export const EmailHistoryTable: React.FC<{
    resource: string;
    templateId: string;
    record: EmailHistory[];
    refetch: () => void;
}> = ({ resource, templateId, record, refetch }) => {

    const { mutate: createMutation } = useCreate();

    const handleConfirm = (historyId: string) => {
        createMutation({
            resource: `${resource}/${templateId}/${historyId}`,
            values: {}
        }, {
            onSuccess: () => {
                refetch();
            }
        })
    };

    return (
        <Table
            rowKey={"id"}
            dataSource={record}
        >
            <Table.Column
                key="sender"
                dataIndex="sender"
                title="Send by"
                render={(value) => <TextField value={value.email} />}
            />
            <Table.Column
                key="totalUsers"
                dataIndex="totalUsers"
                title="Number of Recipients"
            />
            <Table.Column
                key="status"
                dataIndex="status"
                title="Status"
            />
            <Table.Column
                key="createdAt"
                dataIndex="createdAt"
                title="Send at"
                render={(value) => <DateField value={value} format="LLL" />}
            />
            <Table.Column<EmailHistory>
                key="actions"
                dataIndex="actions"
                title="Actions"
                render={(_, record) => {
                    return (
                        <Space>
                            {record.status === 'awaiting_confirm' &&
                                <>
                                    <Button size="small" type="primary" onClick={() => handleConfirm(record.id)}>
                                        Confirm
                                    </Button>
                                    <DeleteButton 
                                        size="small" 
                                        icon={false} 
                                        resourceNameOrRouteName="emails/history"
                                        recordItemId={record.id}
                                        confirmCancelText="No"
                                        confirmOkText="Yes"
                                        confirmTitle="Undo email?"
                                        onSuccess={() => refetch()}
                                    >
                                        Undo
                                    </DeleteButton>
                                </>
                            }
                            <EmailDetailsButton id={record.id} btnSize={"small"}  />
                        </Space>
                    )
                }}
            />
        </Table>
    )
}