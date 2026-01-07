import React from "react";
import {
    Table,
    TextField,
    Space,
} from "@pankod/refine-antd";
import {
    HttpError,
    IResourceComponentsProps,
} from "@refinedev/core";
import { CreateButton, DeleteButton, EditButton, useDrawerForm, useTable } from "@refinedev/antd";
import { ClassCategoryDrawer } from "./ClassCategoryDrawer";
import { IClassCategory, ICommunitySponsors } from "../../interfaces";
import paginationFormatter from "../../components/pagination";
import { TelevedaList } from "../../components/page-containers/list";

export const ClassCategoryList: React.FC<IResourceComponentsProps> = () => {

    const { tableProps, searchFormProps, filters, tableQuery: { refetch: refetchContent } } = useTable<IClassCategory, HttpError>({
        syncWithLocation: true,
        initialSorter: [
            {
                field: "title",
                order: "desc",
            },
        ]
    });

    if (tableProps.pagination) {
        tableProps.pagination.showTotal = paginationFormatter;
    }

    const {
        drawerProps: createDrawerProps,
        formProps: createFormProps,
        saveButtonProps: createSaveButtonProps,
        show: createShow,
        formLoading: createFormLoading
    } = useDrawerForm<IClassCategory, HttpError>({
        action: "create",
        redirect: false,
    });

    const {
        drawerProps: editDrawerProps,
        formProps: editFormProps,
        saveButtonProps: editSaveButtonProps,
        show: editShow,
        formLoading: editFormLoading
    } = useDrawerForm<IClassCategory, HttpError>({
        action: "edit",
        redirect: false,
    });

    console.log("tableProps", tableProps)
    return (
        <TelevedaList
            listProps={{

                headerProps: {
                    extra:
                        <>
                            <CreateButton title="Create" type="primary" onClick={() => createShow()} />
                        </>
                }
            }}
        >
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="title"
                    key="title"
                    title={/*t("posts.fields.title")*/"Title"}
                    render={(value) => <TextField value={value} />}
                    sorter
                />
                <Table.Column
                    dataIndex="parentId"
                    key="parentId"
                    title={/*t("posts.fields.title")*/"Parent Category"}
                    render={(_, record) => <TextField value={record.parent?.title} />}
                    sorter
                />
                {/* <Table.Column
                    dataIndex="order"
                    key="order"
                    title="Order"
                    render={(value) => <TextField value={value} />}
                    sorter
                /> */}
                <Table.Column<ICommunitySponsors>
                    title={"Actions"}
                    dataIndex="actions"
                    width={"10%"}
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size="small" onClick={() => editShow(record.id)} />
                            <DeleteButton onSuccess={() => refetchContent()} hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>

            <ClassCategoryDrawer
                action="create"
                drawerProps={createDrawerProps}
                formProps={createFormProps}
                formLoading={createFormLoading}
                saveButtonProps={createSaveButtonProps}

            />

            <ClassCategoryDrawer
                action="edit"
                drawerProps={editDrawerProps}
                formProps={editFormProps}
                formLoading={editFormLoading}
                saveButtonProps={editSaveButtonProps}

            />
        </TelevedaList>
    );
};