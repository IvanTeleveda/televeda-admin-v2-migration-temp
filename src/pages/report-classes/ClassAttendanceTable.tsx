import { List, Table } from "@pankod/refine-antd";
import { IClassAttendee, IClassReportData } from "../../interfaces";
import { useTable } from "@refinedev/antd";

export const ClassAttendanceTable: React.FC<{ record: IClassReportData }> = ({ record }) => {
    
    const scheduledFor = record.scheduledFor || record.classScheduledFor;

    const { tableProps: postTableProps } = useTable<IClassAttendee>({
        resource: `report_classes/${btoa(JSON.stringify({ classScheduledFor: scheduledFor, scheduledClassId: record.scheduledClassId, classType: record.classType }))}/attendees`,
        permanentFilter: [
            {
                field: "scheduledClass.id",
                operator: "eq",
                value: record.id,
            },
        ],
        syncWithLocation: false,
    });

    return (
        <List
            title="Attendees"
            createButtonProps={undefined}
            headerProps={{
                breadcrumb: undefined
            }}
        >
            {/* we don't account for pagination in the server */}
            <Table {...postTableProps} pagination={false} rowKey="id">

                <Table.Column
                    key="participantName"
                    dataIndex="participantName"
                    title="Name"
                />
                <Table.Column
                    key="participantEmail"
                    dataIndex="participantEmail"
                    title="Email"
                />
                <Table.Column
                    key="communityName"
                    dataIndex="communityName"
                    title="Community"
                />
                <Table.Column
                    key="hybridAttendanceCount"
                    dataIndex="hybridAttendanceCount"
                    title="Attendee count as:"
                />
            </Table>
        </List>
    );
};