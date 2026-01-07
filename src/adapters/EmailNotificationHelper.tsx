import { Button, Icons, Space } from "@pankod/refine-antd";
import { useApiUrl, useCreate, useDelete } from "@refinedev/core";

export enum EmitterTypes {
    SURVEY_EMAIL = 'survey_email',
    GENERIC_MANUAL_EMAIL = 'manual_email',
    NOTIFICATIONS = 'notifications', //regarding the msg when sending notification to public dashboard
    EXPORTS = 'exports',
    HEARTHBEAT = 'hearthbeat'
}

interface BaseMessage {
    type: EmitterTypes
}
interface EmailMessage extends BaseMessage {
    type: EmitterTypes.SURVEY_EMAIL | EmitterTypes.GENERIC_MANUAL_EMAIL | EmitterTypes.NOTIFICATIONS
    templateId: string;
    emailHistoryId: string;
    usersLength: number;
}
interface ExportMessage extends BaseMessage {
    type: EmitterTypes.EXPORTS
    exportHistoryId: string;
}
interface HearthbeatMessage extends BaseMessage {
    type: EmitterTypes.HEARTHBEAT
}

type Message = EmailMessage | ExportMessage | HearthbeatMessage;

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const useEmailNotification = () => {
    const { mutate: createMutation } = useCreate();
    const { mutate: deleteMutation } = useDelete();

    const handleConfirm = (notification: any, templateId: string, historyId: string, resource: string, refetch?: () => void) => {
        createMutation({
            resource: `${resource}/${templateId}/${historyId}`,
            values: {},
            successNotification: false
        }, {
            onSuccess: () => {
                if(notification) {
                    notification.destroy();
                }
                refetch && refetch();
            }
        })
    };

    const handleDelete = (notification: any, id: string) => {
        deleteMutation({
            resource: "emails/history",
            id,
            successNotification: false,
        }, {
            onSuccess: () => {
                if(notification) {
                    notification.destroy();
                }
            }
        });
    };

    return {
        handleDelete,
        handleConfirm,
    };
};

const getUrl = (type: EmailMessage['type']) => {
    switch(type) {
        case 'survey_email': 
            return 'surveys/send-email';
        case 'manual_email':
            return 'emails/send-manual-email';
        case 'notifications': 
            return 'notifications/send';
        default: 
            console.log('Connection type not found', type);
            return '';
    }
}

export const initMessageFunc = (
    es: EventSource,
    notification: any,
    fn: {
        handleDelete: (ntf: any, id: string) => void;
        handleConfirm: (ntf: any, templateId: string, historyId: string, resource: string, refetch?: () => void) => void;
    },
    refetch?: () => void,
) => {
    const { ClockCircleFilled } = Icons;

    const tryExport = (historyId: string) => {
        try {
            notification.destroy('EXPORTS_NOTIFICATION');
        } catch(error) {
            console.log('Initial exports notification already destroyed');
        }

        const popup = window.open(`${SERVER_URL}/report_classes/send_download_report/${historyId}`, '_blank');

        if(!popup || popup.closed || typeof popup.closed=='undefined') 
        { 
            alert("It seems like your browser is blocking popups for Televeda! Please allow popups to prevent this message or try again!");
            const retryNotificaiton = notification.open({
                message: "Retry last download",
                duration: null,
                type: 'info',
                description: (
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Button 
                            style={{ width: 110, backgroundColor: "#febf00", color: "black" }} 
                            type="primary" 
                            onClick={() => {
                                tryExport(historyId);
                                retryNotificaiton.close();
                            }}
                        >
                            Retry
                        </Button>
                    </Space>
                )
            })
        }
    }

    const handleEmailComplete = (event: MessageEvent) => {
        console.log("Email campaign complete: ", event.data);
        const message: Message = JSON.parse(event.data.toString());
        
        if (message.type === EmitterTypes.SURVEY_EMAIL || message.type === EmitterTypes.GENERIC_MANUAL_EMAIL) {
            notification.open({
                icon: <ClockCircleFilled style={{ color: "#1890ff" }} />,
                duration: null,
                style: { width: 430 },
                message: "Email Confirmation",
                description: (
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <p>
                            Sending email to {message.usersLength} user{message.usersLength === 1 ? "" : "s"}
                        </p>
                        <Space>
                            <Button 
                                style={{ width: 110, backgroundColor: "#febf00", color: "black" }} 
                                type="primary" 
                                onClick={
                                    () => fn && 
                                        fn.handleConfirm(
                                            notification, 
                                            message.templateId, 
                                            message.emailHistoryId,
                                            getUrl(message.type),
                                            refetch, 
                                        )
                                    }
                            >
                                Confirm
                            </Button>
    
                            <Button 
                                style={{ width: 110, color: "red", borderColor: "red" }} 
                                onClick={() => fn && fn.handleDelete(notification, message.emailHistoryId)}
                            >
                                Undo
                            </Button>
                        </Space>
                    </Space>
                ),
            });
        }
    };

    const handleNotificationComplete = (event: MessageEvent) => {
        console.log("Bulk notification complete: ", event.data);
        const message: Message = JSON.parse(event.data.toString());
        
        if (message.type === EmitterTypes.NOTIFICATIONS) {
            notification.open({
                icon: <ClockCircleFilled style={{ color: "#1890ff" }} />,
                duration: null,
                style: { width: 430 },
                message: "Notifications Confirmation",
                description: (
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <p>
                            Sending notification to {message.usersLength} user{message.usersLength === 1 ? "" : "s"}
                        </p>
                        <Space>
                            <Button 
                                style={{ width: 110, backgroundColor: "#febf00", color: "black" }} 
                                type="primary" 
                                onClick={
                                    () => fn && 
                                        fn.handleConfirm(
                                            notification, 
                                            message.templateId, 
                                            message.emailHistoryId,
                                            getUrl(message.type),
                                            refetch, 
                                        )
                                    }
                            >
                                Confirm
                            </Button>
    
                            <Button 
                                style={{ width: 110, color: "red", borderColor: "red" }} 
                                onClick={() => fn && fn.handleDelete(notification, message.emailHistoryId)}
                            >
                                Undo
                            </Button>
                        </Space>
                    </Space>
                ),
            });
        }
    };

    const handleExportComplete = (event: MessageEvent) => {
        console.log("Export complete: ", event.data);
        const message: Message = JSON.parse(event.data.toString());
        
        if (message.type === EmitterTypes.EXPORTS) {
            tryExport(message.exportHistoryId);
        }
    };

    const handleProgress = (event: MessageEvent) => {
        console.log("Progress update: ", event.data);
        // Optional: Handle real-time progress updates
    };

    es.onopen = () => console.log("SSE connection opened!");
    es.onerror = (e) => console.log("SSE ERROR!", e);

    // Add new event listeners for Redis-based events
    es.addEventListener('survey-email-complete', handleEmailComplete);
    es.addEventListener('manual-email-complete', handleEmailComplete);
    es.addEventListener('bulk-notification-complete', handleNotificationComplete);
    es.addEventListener('export-complete', handleExportComplete);
    es.addEventListener('progress-update', handleProgress);

    // Keep legacy onmessage for backward compatibility during transition
    es.onmessage = (e: MessageEvent<Message>) => {
        console.log("Legacy message received: ", e.data);

        const message: Message = JSON.parse(e.data.toString());

        if (message.type === EmitterTypes.HEARTHBEAT) {
            return;
        }
        else if(message.type === EmitterTypes.EXPORTS) {
            tryExport(message.exportHistoryId);
        }
        else {
            notification.open({
                icon: <ClockCircleFilled style={{ color: "#1890ff" }} />,
                duration: null,
                style: { width: 430 },
                message: message.type === 'notifications' ? "Notifications Confirmation" : "Email Confirmation",
                description: (
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <p>
                            Sending {message.type === 'notifications' ? 'notification' : 'email'} to {message.usersLength} user{message.usersLength === 1 ? "" : "s"}
                        </p>
                        <Space>
                            <Button 
                                style={{ width: 110, backgroundColor: "#febf00", color: "black" }} 
                                type="primary" 
                                onClick={
                                    () => fn && 
                                        fn.handleConfirm(
                                            notification, 
                                            message.templateId, 
                                            message.emailHistoryId,
                                            getUrl(message.type),
                                            refetch, 
                                        )
                                    }
                            >
                                Confirm
                            </Button>
    
                            <Button 
                                style={{ width: 110, color: "red", borderColor: "red" }} 
                                onClick={() => fn && fn.handleDelete(notification, message.emailHistoryId)}
                            >
                                Undo
                            </Button>
                            {/* THE USE TABLE HOOK BREAKS FOR NO REASON IM FUCKING DONE WITH THIS SHIT WTF */}
                            {/* <EmailDetailsButton id={record.id} btnSize={"small"}  /> */}
                        </Space>
                    </Space>
                ),
            });
        }
    };
};
