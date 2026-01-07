import React, { JSX } from "react";
import { Card, ListProps } from "@pankod/refine-antd";
import { List } from "@refinedev/antd";

export interface ITelevedaListProps {
    listProps?: ListProps;
    title?: string | JSX.Element;
    children: React.ReactNode;
}

export const TelevedaList: React.FC<ITelevedaListProps> = ({
    listProps,
    title,
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
            <List
                {...listProps}
                title={title}
                breadcrumb={<></>}
            >
                {children}
            </List>
        </Card>
    )
}