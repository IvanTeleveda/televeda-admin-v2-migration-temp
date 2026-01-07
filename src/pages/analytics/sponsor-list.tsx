import { Card, Col, Row } from "@pankod/refine-antd";
import { SponsorMemberEvents } from "../../components/analytics/charts/sponsorEventsCharts/sponsorMemberEvents";
import { SponsorEventsCharts } from "../../components/analytics/charts/sponsorEventsCharts/index";
import { ICommunitySponsors } from "../../interfaces";
import { IResourceComponentsProps, useApiUrl, useCustom } from "@refinedev/core";

const SponsorAnalyticsList: React.FC<IResourceComponentsProps> = () => {

    const apiUrl = useApiUrl()

    const { data: sponsorData, isLoading: sponsorIsLoading } = useCustom<ICommunitySponsors>({
        url: `${apiUrl}/community-sponsors/get-user-sponsors`,
        method: "get"
    });

    return (
        <Row gutter={[16, 16]} data-testid="sponsor-row">
            <Col md={24} data-testid="sponsor-col">
                <Row gutter={[16, 16]}>
                    <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                        <Card
                            bodyStyle={{
                                padding: 10,
                                paddingBottom: 0,
                            }}
                            data-testid="sponsor-card"
                        >
                            {/*@ts-ignore*/}
                            {!sponsorIsLoading && <SponsorEventsCharts sponsorData={sponsorData} apiUrl={apiUrl} />}
                        </Card>
                    </Col>
                    <Col xl={24} lg={24} md={24} sm={24} xs={24} data-testid="sponsor-col">
                        <Card
                            bodyStyle={{
                                padding: 10,
                                paddingBottom: 0,
                            }}
                            data-testid="sponsor-card"
                        >
                            {/*@ts-ignore*/}
                            {!sponsorIsLoading && <SponsorMemberEvents sponsorData={sponsorData} />}
                        </Card>
                    </Col>
                </Row>
            </Col></Row>
    )
};

export default SponsorAnalyticsList
