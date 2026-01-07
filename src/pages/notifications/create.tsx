
import { NotificationTemplatesForm } from "./form";
import { INotificationTemplates } from "../../interfaces";
import { useForm } from "@refinedev/antd";
import { IResourceComponentsProps } from "@refinedev/core";

export const NotificationsCreate: React.FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<INotificationTemplates>({
        redirect: "list"
    });

    return (
        <NotificationTemplatesForm action="create" saveButtonProps={saveButtonProps} formProps={formProps} />
    )
 }