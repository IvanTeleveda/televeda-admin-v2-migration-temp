import { TabsProps, Tabs, } from "@pankod/refine-antd";
import { ClassReportList } from "./ClassesReport";
import { useState } from "react";
import { MemberReportList } from "./MembersReport";
import { IResourceComponentsProps, usePermissions } from "@refinedev/core";
import { useSearchParams } from "react-router-dom";
import { UserPermissions } from "../../interfaces";

export const ReportList: React.FC<IResourceComponentsProps> = () => {

    let [paramKeys, setParamKeys] = useState({ tabOne: '?pageSize=10&current=1&sorter[0][field]=classScheduledFor&sorter[0][order]=desc', tabTwo: '?pageSize=10&current=1' });
    let [_, setSearchParams] = useSearchParams();

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const handleChangle = (tab: string) => {
        localStorage.setItem('attendance-tab', tab);
        setSearchParams(tab === "1" ? paramKeys.tabOne : paramKeys.tabTwo)
    }

    const tabItems: TabsProps['items'] = [
        {
            key: '1',
            label: 'My Events',
            children: <ClassReportList setParamKeys={setParamKeys} />
        },
        {
            key: '2',
            label: 'My Members',
            disabled: permissionsData === "CommunityHost",
            children: <MemberReportList setParamKeys={setParamKeys} />
        }
    ]

    return <Tabs defaultActiveKey={localStorage.getItem('attendance-tab') || "1"} type="card" onChange={(tab) => handleChangle(tab)} items={tabItems} />
};