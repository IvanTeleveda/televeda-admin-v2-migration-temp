import {
    Table,
    TextField,
    DateField,
    Form,
    Row,
    Col,
    Input,
    Button,
    Card,
    InputNumber,
    Upload,
    notification,
} from "@pankod/refine-antd";
import { LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import paginationFormatter from "../../components/pagination";
import { useTable } from "@refinedev/antd";
import { IResourceComponentsProps, useApiUrl, useCustom, useCustomMutation } from "@refinedev/core";
import { DefaultFirebaseUploaderAdapter } from "../../adapters/DefaultFirebaseUploadAdapter";

const { TextArea } = Input;

export const CardGenerator: React.FC<IResourceComponentsProps> = () => {

    const { mutate } = useCustomMutation<any>();
    const apiUrl = useApiUrl();

    const { tableProps: generatedBingoCardsTableProps, tableQuery: { refetch: refetchGeneratedBingoCards } } = useTable<any>({

        resource: `bingo-card-history`,
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>();

    const { data, isLoading } = useCustom({
        url: `${apiUrl}/select_general_options`,
        method: 'get',
    })
    
    useEffect(() => {
        if(isLoading) return;
        
        setImageUrl(data?.data?.bingo_card_logo)
    }, [data]);
    
    const onFinish = (values: any) => {
        console.log('bingo card values', values);

        if(((values.end_id - values.start_id + 1) * values.games_count) > 50) {
            notification.open({
                message: 'Error',
                description: 'Due server restrictions the max card limit is 50. Please export the cards in batches!',
                type: 'error'
            });

            return;
        }

        window.open(`/bingo-card?start_id=${values.start_id}&end_id=${values.end_id}&leading_zeroes=${values.leading_zeroes}&games_count=${values.games_count}&comments=${encodeURIComponent(values.comments)}`);

        setTimeout(() => {
            refetchGeneratedBingoCards()
        }, 2000);
    };

    const handleImageUpload = async (req: any) => {
        setLoading(true)

        const url: any = await new DefaultFirebaseUploaderAdapter(req).upload()
        const downloadUrl = url?.downloadURL

        mutate({
            url: `${apiUrl}/general_options`,
            method: "post",
            values: { bingo_card_logo: downloadUrl }
        },
            {
                onSuccess: (() => {
                    setLoading(false); 
                    setImageUrl(downloadUrl)
                })
            });
    }

    if (generatedBingoCardsTableProps.pagination) {
        generatedBingoCardsTableProps.pagination.showTotal = paginationFormatter;
    }

    return (
        <Row gutter={[16, 16]}>
            <Col xl={24} lg={24} xs={24}>
                <Card bordered={false} title="Bingo card generator">
                    <Form
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{
                            games_count: 1,
                            start_id: 1,
                            end_id: 2,
                            leading_zeroes: 0
                        }}
                        size="large"
                    >
                        <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>
                            <Col xl={12} lg={24} xs={24}>
                                <Form.Item label="How many rounds will be played" name="games_count">
                                    <InputNumber min={1} max={9} style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>

                            <Col xl={12} lg={24} xs={24}>
                                <Form.Item label="Card start number" name="start_id">
                                    <InputNumber min={1} style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>

                            <Col xl={12} lg={24} xs={24}>
                                <Form.Item label="Card end number" name="end_id">
                                    <InputNumber min={1} style={{ width: "100%" }} />
                                </Form.Item>
                            </Col>

                            {/* <Col xl={12} lg={24} xs={24} > */}
                                <Form.Item label="Card number digits count" name="leading_zeroes" hidden>
                                    <InputNumber min={0} style={{ width: "100%" }} />
                                </Form.Item>
                            {/* </Col> */}

                            <Col xl={12} lg={24} xs={24}>
                                <Form.Item label="Card logo" name="upload">
                                    <Upload
                                        name="avatar"
                                        customRequest={(req) => handleImageUpload(req)}
                                        className="avatar-uploader"
                                        showUploadList={false}
                                    >
                                        <Button icon={<UploadOutlined />} >Upload logo</Button>
                                    </Upload>
                                </Form.Item>
                                <ul style={{margin:"1rem",color:"orangered"}}>
                                    <li>Supported files are PNG, JPG, PDF, and SVG.</li>
                                    <li>Recommended size is 250 x 250 px.</li>
                                </ul>
                                <div style={{ textAlign: 'center', width: "150px", height: "150px", marginBottom: '20px' }}>
                                    {imageUrl ? !loading ? <img src={imageUrl} alt="avatar" style={{ width: '100%', height: '100%' }} /> : <LoadingOutlined /> : <></>}
                                </div>
                            </Col>

                            <Col xl={24} lg={24} xs={24}>
                                <Form.Item label="Comments" name="comments">
                                    <TextArea rows={3} />
                                </Form.Item>
                            </Col>


                            <Col xl={24} lg={24} xs={24}>
                                <Form.Item>
                                    <Button
                                        htmlType="submit"
                                        type="primary"
                                        block
                                    >
                                        Download Bingo Cards
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>
            </Col>

            <Col xl={24} lg={24} xs={24}>
                <Card
                    title="Cards generation history"
                >
                    <Table {...generatedBingoCardsTableProps} rowKey="id">
                        <Table.Column
                            dataIndex="createdAt"
                            key="createdAt"
                            title={"Generated at"}
                            render={(value) => <DateField value={value} format="LLL" />}
                        />

                        <Table.Column
                            dataIndex="generatedBy"
                            key="generatedBy"
                            title={"Generated by"}
                            render={(value) => <TextField value={value} />}
                        />

                        <Table.Column
                            dataIndex="comments"
                            key="comments"
                            title={"Comments"}
                            render={(value) => <TextField value={value} />}
                        />

                        <Table.Column<any>
                            title={"Params"}
                            dataIndex="params"
                            render={(_, record) => {
                                return (
                                    <TextField value={`Start #: ${record.startId}, End #: ${record.endId}, Leading zeroes: ${record.leadingZeroes}, Rounds: ${record.roundsCount}`} />
                                );
                            }}
                        />

                        <Table.Column
                            dataIndex="bingo_card_logo"
                            key="bingo_card_logo"
                            title={"Logo Image"}
                            render={(value) => value ? <img src={value} alt="avatar" style={{ width: '100px', height: '100px' }} /> : "No image"}
                        />

                        <Table.Column<any>
                            title={"Actions"}
                            dataIndex="actions"
                            render={(_, record) => {
                                return (
                                    <Button href={`/bingo-card?regenerate=1&start_id=${record.startId}&end_id=${record.endId}&leading_zeroes=${record.leadingZeroes}&games_count=${record.roundsCount}&logo=${btoa(record.bingo_card_logo)}`}>
                                        Download
                                    </Button>
                                );
                            }}
                        />
                    </Table>
                </Card>
            </Col>
        </Row>
    );
}