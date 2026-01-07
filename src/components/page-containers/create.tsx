import { Card } from "@pankod/refine-antd";
import { Create, CreateButtonProps } from "@refinedev/antd";
import React from "react";

type ActionButtonRenderer =
    | ((context: { defaultButtons: React.ReactNode }) => React.ReactNode)
    | React.ReactNode;

export interface ITelevedaCreateProps {
    saveButtonProps?: CreateButtonProps;
    footerButtons?: ActionButtonRenderer;
    title?: string;
    children: React.ReactNode
}

export const TelevedaCreate: React.FC<ITelevedaCreateProps> = ({
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
            <Create
                goBack={<></>}
                saveButtonProps={saveButtonProps}
                headerButtons={<></>} 
                breadcrumb={<></>}
                contentProps={{ bodyStyle: { padding: 10 }, style: { boxShadow: 'none' } }}
                title={title}
                footerButtons={footerButtons}
            >
                {children}
            </Create>
        </Card>
    )
}