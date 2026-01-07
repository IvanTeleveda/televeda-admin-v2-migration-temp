import React from "react";
import { Card } from "@pankod/refine-antd";
import { Show } from "@refinedev/antd";

export interface ITelevedaListProps {
    title?: string;
    headerButtons?: React.ReactElement;
    children: React.ReactNode
}

export const TelevedaShow: React.FC<ITelevedaListProps> = ({
    title,
    headerButtons,
    children
}) => {
    return (
        <Card
            bordered={false}
            styles={{
                body: {
                  padding: 15,
                }
            }}
        >
            <Show

                goBack={<></>}
                breadcrumb={<></>}
                headerButtons={headerButtons || <></>}
                contentProps={{ bodyStyle: { padding: 10 }, style: { boxShadow: 'none' } }}
                title={title}
            >
                {children}
            </Show>
        </Card>

    )
}