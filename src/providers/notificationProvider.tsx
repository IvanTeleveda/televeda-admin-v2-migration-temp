import { notification } from "antd";
import React from "react";
import {
    Button,
    Progress,
    Icons,
} from "@pankod/refine-antd";
import { NotificationProvider } from "@refinedev/core";
const { UndoOutlined } = Icons;

export interface OpenNotificationParams {
    key?: string;
    message: string;
    type: "success" | "error" | "progress";
    description?: string;
    cancelMutation?: () => void;
    undoableTimeout?: number;
}

export type UndoableNotificationProps = {
    notificationKey: OpenNotificationParams["key"];
    message: OpenNotificationParams["message"];
    cancelMutation: OpenNotificationParams["cancelMutation"];
    undoableTimeout: OpenNotificationParams["undoableTimeout"];
};

export const UndoableNotification: React.FC<UndoableNotificationProps> = ({
    notificationKey,
    message,
    cancelMutation,
    undoableTimeout,
}) => {
    if (undoableTimeout === 0) {
        notification.destroy(notificationKey ?? "");
    } return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "-7px",
            }}
        >
            <Progress
                type="circle"
                percent={(undoableTimeout ?? 0) * 20}
                format={(time) => time && time / 20}
                width={50}
                strokeColor="#1890ff"
                status="normal"
            />
            <span style={{ marginLeft: 8, width: "100%" }}>{message}</span>
            <Button
                style={{ flexShrink: 0 }}
                onClick={() => {
                    cancelMutation?.();
                    notification.destroy(notificationKey ?? "");
                }}
                disabled={undoableTimeout === 0}
                icon={<UndoOutlined />}
            ></Button>
        </div>
    )
};

export const notificationProvider: NotificationProvider = {

    open: ({
        key,
        message,
        description,
        type,
        cancelMutation,
        undoableTimeout,
    }) => {

        console.log("NOTIFICATION: ", "key:", key, ", message:", message, ", description:", description, ", type:", type)

        const splitMessages = message.split('/')
        let cutMessage = splitMessages[0]
        cutMessage = cutMessage.replace('-', ' ')

        //Remove the plural form if necessary
        const lastTwoLetters = cutMessage.slice(-2)
        if (lastTwoLetters != 'ss') {
            if (lastTwoLetters[1] == 's') {
                cutMessage = cutMessage.slice(0, -1)
            }
        }

        if (type === "progress") {

            notification.open({
                key,
                description: (
                    <UndoableNotification
                        notificationKey={key}
                        message={cutMessage}
                        cancelMutation={cancelMutation}
                        undoableTimeout={undoableTimeout}
                    />
                ),
                message: null,
                duration: 0,
                closeIcon: <></>,
            });
        } else {

            notification.open({
                key,
                description: cutMessage,
                message: description ?? null,
                type,
            });
        }
    },
    close: (key) => {/*notification.close(key)*/ },
};
