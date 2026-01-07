import { IResourceComponentsProps } from "@refinedev/core";
import React from 'react';
import { CustomReportTemplateForm } from "./components/CustomReportTemplateForm";

export const ReportView: React.FC<IResourceComponentsProps> = () => {
    return (
        <CustomReportTemplateForm forcePreview={true} />
    )
};