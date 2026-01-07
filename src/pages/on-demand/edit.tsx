import React from "react";
import { OnDemandClassForm } from "./form";
import { IOnDemandClass } from "../../interfaces";
import { useForm } from "@refinedev/antd";
import { IResourceComponentsProps } from "@refinedev/core";

export const OnDemandClassEdit: React.FC<IResourceComponentsProps> = () => {

    const { formProps, saveButtonProps } = useForm<IOnDemandClass>({
        redirect: "list"
    });

    return (
        <OnDemandClassForm action="edit" saveButtonProps={saveButtonProps} formProps={formProps} />
    )
}