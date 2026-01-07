import {
    Col,
    Form,
    Row
} from "@pankod/refine-antd";
import { ICommunity } from "../../interfaces";
import { TelevedaShow } from "../../components/page-containers/show";
import { SponsoredClassesSelect } from "./sponsoredClassesSelect";
import { CommunityCollections } from "./collections/communityCollections";
import { IResourceComponentsProps, useOne, useParsed } from "@refinedev/core";
import { ResourcesDragger } from "../../components/buttons/uploadDragger/resourcesDragger";
import { PublicCommunityCollections } from "./publicCommunityCollections/publicCommunityCollections";


export const CommunityResourcesEdit: React.FC<IResourceComponentsProps> = (props) => {


    const { id: idFromRoute } = useParsed();

    const { data, isLoading } = useOne<ICommunity>({
        resource: "community",
        id: idFromRoute as string
    });
    return (
        <>
            <TelevedaShow title={`Edit ${data?.data.name} Resources`}>
                <Form name="community-resource-form" autoComplete="off" layout="vertical">
                    <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>

                        <Col xl={12} lg={24} xs={24}>
                            <Form.Item
                                label={"Monthly Calendar Download link"}
                                name="monthlyCalendarUrl"
                            >
                                <ResourcesDragger communityId={idFromRoute?.toString()} resourceType={"calendar"} limit={1} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </TelevedaShow>
            <br />
            <SponsoredClassesSelect title={`Promoted Events for ${data?.data.name}`} communityId={idFromRoute?.toString()} resourceType={"sponsoredClass"} />
            <br />
            <PublicCommunityCollections communityId={idFromRoute?.toString()} />
            <br />
            <CommunityCollections communityId={idFromRoute?.toString()} />
        </>

    );
};
