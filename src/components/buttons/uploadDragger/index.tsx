import { FormProps, Upload } from '@pankod/refine-antd';
import React, { useEffect, useState } from 'react';
import { DeleteOutlined, LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { DefaultFirebaseUploaderAdapter } from '../../../adapters/DefaultFirebaseUploadAdapter';


export const UploadDragger: React.FC<{
    formProps: FormProps<{}>;
    resultLogo: string | undefined
}> = ({ formProps, resultLogo }) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>();

    useEffect(() => {
        const logo = resultLogo;

        formProps.form?.setFieldsValue({
            logo: logo
        });

        setImageUrl(logo);
    }, [resultLogo]);

    const handleImageUpload = async (req: any) => {

        setLoading(true);

        const url: any = await new DefaultFirebaseUploaderAdapter(req).upload();
        const downloadUrl = url?.downloadURL;

        setImageUrl(downloadUrl);
        setLoading(false);

        formProps.form?.setFieldsValue({
            logo: downloadUrl
        });
    }

    const deleteLogo = () => {
        setImageUrl("");
        formProps.form?.setFieldsValue({
            logo: ""
        });
    }

    return (
        <>
            <Upload.Dragger
                customRequest={(req) => handleImageUpload(req)}
                listType="picture"
                maxCount={1}
                showUploadList={false}
            >
                <p className="ant-upload-text">
                    <UploadOutlined /> Drag & drop an image in this area
                </p>

            </Upload.Dragger><div style={{
                display: imageUrl ? "block" : loading ? "block" : "none",
                position: 'relative',
                width: '100%',
                height: '100%',
                textAlign: 'center',
                border: '1px solid #f0f0f0',
                borderRadius: '6px',
                marginTop: '6px'
            }}>
                {imageUrl ?
                    !loading ?
                        <>
                            <img src={imageUrl} style={{ maxHeight: "200px", marginTop: "10px", marginBottom: "10px" }} alt="community-logo" />
                            <span style={{ float: "right", fontSize: "1rem", marginTop: "10px", marginRight: "10px", cursor: 'pointer' }}>
                                <DeleteOutlined onClick={deleteLogo} />
                            </span>
                        </> :
                        <LoadingOutlined style={{ fontSize: "3rem", marginTop: "10px", marginBottom: "10px" }} /> :
                    loading ?
                        <LoadingOutlined style={{ fontSize: "3rem", marginTop: "10px", marginBottom: "10px" }} /> :
                        <></>}

            </div>
        </>
    )
}