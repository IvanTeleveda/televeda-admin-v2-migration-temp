import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Table,
    TextField,
    Typography,
} from "@pankod/refine-antd";
import { PlusOutlined, UserAddOutlined, DeleteOutlined, UserDeleteOutlined, LinkOutlined, QrcodeOutlined, StarOutlined } from '@ant-design/icons';
import QRCode from "react-qr-code";
import { useContext, useRef, useState } from "react";
import { TelevedaEdit } from "../../components/page-containers/edit";
import { ICommunity, ICommunityCodes, ICommunitySponsors, IUser, UserPermissions } from "../../interfaces";
import { CreateModalFormForCommunityButton } from "../../components/buttons/createModalFormForCommunity";
import { RemovesFromCommunityButton } from "../../components/buttons/removeFromCommunity";
import { useTable, useSelect, useModal, useForm } from "@refinedev/antd";
import CopyLinkButton from "../../components/buttons/copyLinks";
import Constants from "../../typings/constants";
import { CrudFilters, IResourceComponentsProps, useLink, useNavigation, useParsed, usePermissions } from "@refinedev/core";
import { UploadDragger } from "../../components/buttons/uploadDragger";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import editorConfig from "../../utils/editorConfig";
import { CkEditorFirebaseUploadAdapter } from "../../adapters/CkEditorFirebaseUploadAdapter";
import { FilterButton } from "../../components/buttons/filter";
import FilterFormWrapper from "../../components/filter";
import dayjs from "dayjs";
import { ColorModeContext } from "../../contexts/color-mode";

export const CommunityEdit: React.FC<IResourceComponentsProps> = (props) => {

    console.log("CommunityEdit props: ", props);

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { id: idFromRoute } = useParsed();

    const { modalProps, show, close } = useModal();
    const [isUploading, setIsUploading] = useState(false);

    const { mode } = useContext(ColorModeContext);

    const { show: showRedirect } = useNavigation();

    console.log("idFromParams: ", idFromRoute);

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { formProps, saveButtonProps, query } = useForm<ICommunity>({
        redirect: false,
    });

    const { selectProps } = useSelect<ICommunitySponsors>({
        resource: "community-sponsors",
        optionLabel: "name",
        queryOptions: {
            enabled: permissionsData === 'TelevedaAdmin'
        },
        fetchSize: Constants.DROPDOWN_FETCH_SIZE
    })

    console.log("CommunityEdit render.");

    console.log("queryResult: ", query);

    function getReferralLink(refCode: string) {
        var str = btoa(refCode);
        str = str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
        return window.location.origin + '/' + 'signup?ref=' + str;
    }

    function copyURL(refCode: string) {
        const el = document.createElement("input");
        el.value = getReferralLink(refCode)
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

    const { tableProps: inviteCodesTableProps, searchFormProps: inviteCodesSearchFormProps, filters: inviteCodeTableFilters, tableQuery: { refetch: refetchInviteCodes } } = useTable<ICommunityCodes>({
        resource: `community-associations/community/${idFromRoute}/inviteCodes`,
        filters: {
            initial: [{
                field: "createdAt",
                operator: "between",
                value: [dayjs('7/15/2024').toISOString(), dayjs().endOf('day').toISOString()]
            }]
        },
        syncWithLocation: false,
        onSearch: (params: any) => {
            const filters: CrudFilters = [];

            const { createdAt } = params;


            if (createdAt) {
                filters.push({
                    field: "createdAt",
                    operator: "between",
                    value: [createdAt[0].startOf("day").toISOString(), createdAt[1].endOf("day").toISOString()],
                });
            }
            else {
                filters.push({
                    field: "createdAt",
                    operator: "between",
                    value: [dayjs('7/15/2024').toISOString(), dayjs().endOf('day').toISOString()]
                });
            }

            return filters;
        }
    });

    const refetchInviteCodesFn = () => {
        refetchInviteCodes();
    }

    const { tableProps: managersTableProps, tableQuery: { refetch: refetchManagers } } = useTable<IUser>({
        resource: `community-associations/community/${idFromRoute}/managers`,
    });

    console.log("Managers: ", managersTableProps);

    const refetchManagersFn = () => {
        refetchManagers();
        refetchHosts();
    }

    const { tableProps: hostsTableProps, tableQuery: { refetch: refetchHosts } } = useTable<IUser>({
        resource: `community-associations/community/${idFromRoute}/hosts`,
    });

    const refetchHostsFn = () => {
        refetchHosts();
    }

    saveButtonProps.size = "large";

    const { RangePicker } = DatePicker;

    const dateRangeFilter = inviteCodeTableFilters?.filter((item: any) => item.field === 'createdAt')[0]?.value || null;

    return (
        <TelevedaEdit saveButtonProps={{ ...saveButtonProps, disabled: isUploading }}>
            <Form {...formProps} layout="vertical" size="large">

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Name"}
                            name="name"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Display Name"}
                            name="displayName"
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Address"}
                            name="address"
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Zip Code"}
                            name="zipCode"
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>


                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"City"}
                            name="city"
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Country"}
                            name="country"
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>
                    {permissionsData === "TelevedaAdmin" ?
                        <Col xl={12} lg={24} xs={24}>
                            <Form.Item label="Sponsor" name="sponsorId">
                                <Select {...selectProps} allowClear />
                            </Form.Item>
                        </Col>
                        : <></>
                    }

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Community Logo"}
                            name="logo"
                        >
                            <ul style={{ margin: "1rem", color: mode === "light" ? "#001B36" : "#ffffff" }}>
                                <li>Supported files are PNG, JPG, PDF, and SVG.</li>
                                <li>Recommended size is 250 x 100 px.</li>
                            </ul>
                            <UploadDragger resultLogo={query?.data?.data?.logo} formProps={formProps} />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Col span={18}>
                            <Typography.Text>
                                Make my Community Visible to the Public to Join
                            </Typography.Text>
                        </Col>
                        <Form.Item
                            style={{ height: 0 }}
                            name="isPublic"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="YES" unCheckedChildren=" NO" style={{ float: "right", marginRight: 20, marginTop: -42 }} />
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.isPublic !== currentValues.isPublic}
                            preserve={true}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('isPublic') === true &&
                                <>
                                    <Col span={18}>
                                        <Typography.Text>
                                            Allow Members to Join This Community Without Approval
                                        </Typography.Text>
                                    </Col>
                                    <Form.Item
                                        style={{ height: 0 }}
                                        name="autoJoin"
                                        valuePropName="checked"
                                    >
                                        <Switch checkedChildren="YES" unCheckedChildren=" NO" style={{ float: "right", marginRight: 20, marginTop: -42 }} />
                                    </Form.Item>
                                </>
                            }
                        </Form.Item>
                        <Col span={18}>
                            <Typography.Text>
                                Allow recommendations for this community
                            </Typography.Text>
                        </Col>
                        <Form.Item
                            style={{ height: 0 }}
                            name="allowRecommendations"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="YES" unCheckedChildren=" NO" style={{ float: "right", marginRight: 20, marginTop: -42 }} />
                        </Form.Item>
                    </Col>

                </Row>


                {/* -------------------------------------------------------------------- */}
                <Card
                    title="Community Invite codes"
                    extra={
                        <Space>
                            <TextField value={`Range - ${dateRangeFilter ?
                                'from ' + dayjs(dateRangeFilter[0]).format('MMMM DD YYYY') + ' to ' + dayjs(dateRangeFilter[1]).format('MMMM DD YYYY')
                                :
                                'from ' + dayjs('7/15/2024').format('MMMM DD YYYY') + ' to ' + dayjs().endOf('day').format('MMMM DD YYYY')}`}
                            />
                            <FilterButton
                                ref={filterButtonRef}
                                filters={inviteCodeTableFilters}
                                shape="round"
                            >
                                <FilterFormWrapper
                                    ref={filterWrapperRef}
                                    filterButtonRef={filterButtonRef}
                                    formProps={inviteCodesSearchFormProps}
                                    filters={inviteCodeTableFilters || []}
                                    fieldValuesNameRef={['createdAt']}
                                    filterValuesNameRef={['createdAt']}
                                    formElement={
                                        <>
                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Attendance Date Range"
                                                    name="createdAt"
                                                >
                                                    <RangePicker disabledDate={(currentDate) => {
                                                        return currentDate.toDate().getTime() > Date.now() || currentDate.toDate().getTime() < dayjs('7/15/2024').toDate().getTime() ? true : false;
                                                    }}
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        style={{ width: "100%" }}
                                                        allowClear={true}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>}
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                            <CreateModalFormForCommunityButton
                                communityId={idFromRoute as string || ""}
                                url={"community-codes"}
                                modalTitle={"Add invite code"}
                                modalField={"code"}
                                onSuccessFn={refetchInviteCodesFn}
                                associationType=''
                                modalBtnTxt="Add"
                                modalBtnIcon={<PlusOutlined />}
                            />
                        </Space>
                    }
                >
                    <Table {...inviteCodesTableProps} >
                        <Table.Column
                            width="50%"
                            dataIndex="code"
                            key="code"
                            title={"Code"}
                            render={(value, record) => (
                                <Space style={{ width: '100%', height: '100%', justifyContent: 'space-between' }}>
                                    {permissionsData === "TelevedaAdmin" && !record.isCommunity ? <TextField style={{ cursor: 'pointer', color: mode === 'light' ? 'blue' : '#5273e0', textDecoration: 'underline' }} onClick={() => showRedirect('_User', record.codesFrom?.id)} value={value} /> : <TextField value={value} />}
                                    {record.isCommunity && <StarOutlined size={30} style={{ fontSize: 20 }} />}
                                </Space>
                            )}
                        />
                        <Table.Column
                            align="center"
                            dataIndex="signupsCount"
                            key="signupsCount"
                            title={"Number of Signups"}
                            render={(value) => <TextField value={value} />}
                        />
                        <Table.Column<ICommunityCodes>
                            title={"Actions"}
                            dataIndex="actions"
                            render={(_, record) => {
                                if (record.isCommunity) {
                                    return (
                                        <>
                                            <Space>
                                                <RemovesFromCommunityButton
                                                    communityId={idFromRoute as string || ""}
                                                    associationId={record.id!}
                                                    url={"community-codes"}
                                                    onSuccessFn={refetchInviteCodesFn}
                                                    associationType=''
                                                    modalBtnIcon={<DeleteOutlined />}
                                                />

                                                <CopyLinkButton btnShape="round" code={record.code} icon={< LinkOutlined />} copyURL={copyURL} />

                                                <Button type="default" size="small" shape="round" icon={<QrcodeOutlined />}
                                                    onClick={show}>
                                                    QR Code
                                                </Button>
                                            </Space>
                                            <Modal onOk={close} {...modalProps}>
                                                <QRCode
                                                    size={256}
                                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                    value={getReferralLink(record.code)}
                                                    viewBox={`0 0 256 256`}
                                                    level='H' />

                                            </Modal>
                                        </>
                                    );
                                }
                            }}
                        />

                    </Table>

                </Card>

                <br /><br /><br />

                <Card
                    title="Community Managers"
                    extra={
                        <CreateModalFormForCommunityButton
                            communityId={idFromRoute as string || ""}
                            url={"community-associations/community"}
                            modalTitle={"Invite community manager"}
                            modalField={"email"}
                            onSuccessFn={refetchManagersFn}
                            associationType='manager'
                            modalBtnTxt="Invite"
                            modalBtnIcon={<UserAddOutlined />}
                        />
                    }
                >
                    <Table {...managersTableProps} rowKey="id">
                        <Table.Column
                            width="60%"
                            dataIndex="email"
                            key="email"
                            title={"Email"}
                            render={(value) => <TextField value={value} />}
                        />
                        <Table.Column<ICommunity>
                            title={"Actions"}
                            dataIndex="actions"
                            width={"1%"}
                            render={(_, record) => {
                                console.log('record: ', record);
                                return (
                                    <Space>
                                        <RemovesFromCommunityButton
                                            communityId={idFromRoute as string || ""}
                                            associationId={record.id}
                                            url={"community-associations/community"}
                                            onSuccessFn={refetchManagersFn}
                                            associationType='manager'
                                            modalBtnIcon={<UserDeleteOutlined />}
                                        />
                                    </Space>
                                );
                            }}
                        />
                    </Table>
                </Card>

                <br /><br /><br />

                <Card
                    title="Community Instructors"
                    extra={
                        <CreateModalFormForCommunityButton
                            communityId={idFromRoute as string || ""}
                            url={"community-associations/community"}
                            modalTitle={"Invite community host"}
                            modalField={"email"}
                            onSuccessFn={refetchHostsFn}
                            associationType='host'
                            modalBtnTxt="Invite"
                            modalBtnIcon={<UserAddOutlined />}
                        />
                    }
                >
                    <Table {...hostsTableProps} rowKey="id">
                        <Table.Column
                            width="60%"
                            dataIndex="email"
                            key="email"
                            title={"Email"}
                            render={(value) => <TextField value={value} />}
                        />
                        <Table.Column<ICommunity>
                            title={"Actions"}
                            dataIndex="actions"
                            width={"1%"}
                            render={(_, record) => {
                                console.log('record: ', record);
                                return (
                                    <Space>
                                        <RemovesFromCommunityButton
                                            communityId={idFromRoute as string || ""}
                                            associationId={record.id}
                                            url={"community-associations/community"}
                                            onSuccessFn={refetchHostsFn}
                                            associationType='host'
                                            modalBtnIcon={<UserDeleteOutlined />}
                                        />
                                    </Space>
                                );
                            }}
                        />
                    </Table>
                </Card>

                <br /><br /><br />

                <Card
                    title={"Terms and Conditions"}
                >
                    <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>
                        <Col xl={24} lg={24} xs={24}>
                            <Form.Item
                                name="termsAndConditions"
                                rules={[]}
                                valuePropName='data'
                                getValueFromEvent={(event, editor) => {
                                    const data = editor.getData();
                                    return data;
                                }}
                            >
                                <CKEditor
                                    editor={ClassicEditor}
                                    config={editorConfig}
                                    onReady={(editor: any) => {
                                        // You can store the "editor" and use when it is needed.
                                        editor.editing.view.change((writer: any) => {
                                            writer.setStyle('min-width', 'inherit', editor.editing.view.document.getRoot());
                                            writer.setStyle(
                                                "min-height",
                                                "250px",
                                                editor.editing.view.document.getRoot()
                                            );
                                        })
                                        if (editor && editor.plugins) {
                                            editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
                                                return new CkEditorFirebaseUploadAdapter(loader, setIsUploading);
                                            };

                                            console.log('Editor is ready to use!', editor);
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                    </Row>
                    <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>
                        <Col>
                            <Typography.Text>
                                Terms and conditions required
                            </Typography.Text>
                        </Col>
                        <Form.Item
                            style={{ height: 0 }}
                            name="termsAndConditionsRequired"
                            valuePropName="checked"
                            initialValue={true}
                        >
                            <Switch checkedChildren="YES" unCheckedChildren="NO" style={{ marginTop: -15 }} />
                        </Form.Item>
                    </Row>
                </Card>
            </Form>
        </TelevedaEdit>
    );
};
