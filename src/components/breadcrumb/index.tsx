import React from "react";
import { RefineBreadcrumbProps } from "@pankod/refine-ui-types";
import {
    Breadcrumb as AntdBreadcrumb,
    BreadcrumbProps as AntdBreadcrumbProps,
    Row,
    Button
} from "antd";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useBreadcrumb, useLink, useNavigation, useRefineContext } from "@refinedev/core";

export type BreadcrumbProps = RefineBreadcrumbProps<AntdBreadcrumbProps>;

export const TelevedaBreadcrumb: React.FC<BreadcrumbProps> = ({
    breadcrumbProps,
    showHome = true,
    hideIcons = false,
}) => {
    const { breadcrumbs } = useBreadcrumb();
    const Link = useLink();
    const { hasDashboard } = useRefineContext();
    const { goBack } = useNavigation();

    let lastHref: string | undefined = undefined; 

    if( breadcrumbs.length < 2 ) {
        return  <div></div>;
    }

    if (breadcrumbs.length > 1) {
        lastHref = breadcrumbs[breadcrumbs.length-2].href;
    }

    const handleClickBack = () => {
        goBack();
    }


    return (
        <Row align={"middle"}>
            {
                lastHref ?
                    <Button type="text" icon={<ArrowLeftOutlined/>} onClick={handleClickBack}/>
                    : null
            }
        
        <AntdBreadcrumb {...breadcrumbProps}>
            {showHome && hasDashboard && (
                <AntdBreadcrumb.Item>
                    <Link to="/">
                        <HomeOutlined />
                    </Link>
                </AntdBreadcrumb.Item>
            )}
            {breadcrumbs.map(({ label, icon, href }) => {
                return (
                    <AntdBreadcrumb.Item key={label}>
                        {!hideIcons && icon}
                        <span>{label}</span>
                    </AntdBreadcrumb.Item>
                );
            })}
        </AntdBreadcrumb>
        </Row>
    );
};
