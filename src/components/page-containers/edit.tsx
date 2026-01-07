import React from "react";
import { Card } from "@pankod/refine-antd";
import { Edit, EditButtonProps } from "@refinedev/antd";

type ActionButtonRenderer =
    | ((context: { defaultButtons: React.ReactNode }) => React.ReactNode)
    | React.ReactNode;

export interface ITelevedaEditProps {
    saveButtonProps?: EditButtonProps;
    footerButtons?: ActionButtonRenderer;
    title?: string;
    children: React.ReactNode;
}

export const TelevedaEdit: React.FC<ITelevedaEditProps> = ({
    saveButtonProps,
    title,
    footerButtons,
    children
}) => {

    if( saveButtonProps ) {
        saveButtonProps.size = 'large';
    }

    return (

        <Card
            bordered={false}
            styles={{
                body: {
                  padding: 15,
                }
            }}
        >
            <Edit
                goBack={<></>}
                saveButtonProps={saveButtonProps}
                headerButtons={<></>} 
                breadcrumb={<></>}
                contentProps={{ bodyStyle: { padding: 10 }, style: { boxShadow: 'none' } }}
                title={title}
                footerButtons={footerButtons}
            >
                {children}
            </Edit>
        </Card>
    )
}