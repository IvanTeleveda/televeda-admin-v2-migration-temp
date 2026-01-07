import { Upload, UploadFile } from '@pankod/refine-antd';
import React, { useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { ICommunityResource, NotificationType } from '../../../interfaces';
import { ResourceFirebaseUploaderAdapter } from '../../../adapters/ResourceFirebaseUploaderAdapter';
import { useApiUrl, useNotification, useCustomMutation } from '@refinedev/core';

export const ResourcesDragger: React.FC<{
    communityId: string | undefined;
    resourceType: string;
    limit?: number
}> = ({ communityId, resourceType, limit }) => {

    console.log("Props:", communityId, resourceType, limit);


    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const { open } = useNotification();
    const apiUrl = useApiUrl();
    const { mutate } = useCustomMutation<ICommunityResource>();
    // firebase adapter stuff
    const fileAdapter = new ResourceFirebaseUploaderAdapter;
    const resourcePath = communityId + "/" + resourceType;

    useEffect(() => {
        mutate({
            url: `${apiUrl}/community-resources/fetch-list`,
            method: "post",
            values: {
                communityId,
                resourceType
            },
        }, {
            onError: (error, variables, context) => {
                console.log(error);
                openNotificationWithIcon('error', 'Failed to load resources!', "");
            },
            onSuccess: (data, variables, context) => {
                if (data && data.data && (
                    (Array.isArray(data.data)) || 
                    (typeof data.data === 'object' && !Array.isArray(data.data) && Object.keys(data.data).length > 0)
                )) {
                    //@ts-ignore
                    setFileList(data.data)
                }
            },
        },

        );

    }, [])

    const openNotificationWithIcon = (type: NotificationType, message: string, description: string) => {
        open?.({
            type,
            message,
            description
        });
    };

    const beforeUpload = (file: any) => {

        // Check if the file limit is reached
        if (limit && limit === fileList.length) {
            openNotificationWithIcon('error', 'You can only upload (' + limit + ') files', "");
            return false;
        }

        const validFileTypes = ['image/gif', 'image/jpeg', 'image/png', 'application/pdf'];

        // Check file type
        if (!validFileTypes.includes(file.type)) {
            openNotificationWithIcon('error', 'You can only upload images and PDFs!', "");
            return false;
        }

        // Check file size
        const fileSizeLimit = 5 * 1024 * 1024; // 5MB
        if (file.size > fileSizeLimit) {
            openNotificationWithIcon('error', 'File size must be within 5MB!', "");
            return false;
        }

        return true;
    };

    const updateDatabase = async (file: UploadFile) => {

        const communityResource: ICommunityResource = {
            // @ts-ignore
            communityId: communityId,
            // @ts-ignore
            downloadUrl: file.url,
            // @ts-ignore
            extension: file.type,
            fileName: file.name,
            order: 0,
            resourceType: resourceType,
        }

        mutate({
            url: `${apiUrl}/community-resources`,
            method: "post",
            values: communityResource,
        },
            {
                onError: (error, variables, context) => {
                    console.log(error);

                    openNotificationWithIcon('error', "File failed to upload!", "Please try again in a few seconds.");
                    //@ts-ignore
                    setFileList((prevFileList) => {
                        const newArr = [...prevFileList];
                        return newArr.filter(el => el.uid != file.uid);
                    });
                },
                onSuccess: (data, variables, context) => {
                    console.log(data);
                    //@ts-ignore
                    setFileList((prevFileList) => {
                        // find the previous el and update the state
                        const newArr = [...prevFileList];
                        const replaceIndex = newArr.findIndex(el => {
                            return el.uid == file.uid;
                        });
                        // @ts-ignore set file id
                        file.uid = data.data.id;
                        newArr[replaceIndex] = file
                        return newArr;
                    });
                    openNotificationWithIcon('success', "File uploaded", file.name);
                },
            },

        );
    }

    const handleFileUpload = async (req: any) => {
        // current file for uploading
        let uploadedFile: UploadFile = {
            uid: req.file.uid,
            name: req.file.name,
            status: 'uploading',
            url: "",
            type: req.file.type,
        };
        //@ts-ignore
        setFileList((prevFileList) => [...prevFileList, uploadedFile]);

        const url: any = await fileAdapter.upload(req, resourcePath);
        const downloadUrl = url?.downloadURL;

        // remove from list if the upload failed
        if (!downloadUrl) {
            openNotificationWithIcon('error', "File failed to upload!", "Please try again in a few seconds.");
            uploadedFile.status = 'error';
            //@ts-ignore
            setFileList((prevFileList) => {
                const newArr = [...prevFileList];
                return newArr.filter(el => el.uid != uploadedFile.uid);;
            });
            return false;
        }

        uploadedFile.url = downloadUrl;
        // @ts-ignore
        uploadedFile.status = "success";
        await updateDatabase(uploadedFile);
    }

    const onDelete = async (file: UploadFile) => {
        console.log(file);

        if (!window.confirm("Are you sure you want to delete " + file.name + " ?")) {
            return false
        }

        try {
            const deleteFile: any = await fileAdapter.delete(resourcePath, file.name);
            mutate({
                url: `${apiUrl}/community-resources/` + file.uid,
                method: "delete",
                values: {
                    communityId,
                    resourceType,
                    downloadUrl: file.url
                },
            }, {
                onError: (error, variables, context) => {
                    console.log(error);
                    openNotificationWithIcon('error', "File failed to delete!", "Please try again in a few seconds.");
                },
                onSuccess: (data, variables, context) => {
                    console.log(data);

                    setFileList((prevFileList) => {
                        const newArr = [...prevFileList];
                        return newArr.filter(el => el.uid != file.uid);
                    });
                },
            },);
        } catch (error) {
            console.log(error);
            openNotificationWithIcon('error', "File failed to delete!", "Please try again in a few seconds.");
        }

    }

    return (
        <Upload.Dragger
            customRequest={(req) => handleFileUpload(req)}
            showUploadList={true}
            multiple={limit && limit > 1 || true}
            listType={'picture'}
            fileList={fileList}
            onRemove={onDelete}
            beforeUpload={beforeUpload}
        // maxCount={limit}
        >
            <p className="ant-upload-text">
                <UploadOutlined /> Drag & drop files in this area.
                <p>
                    Supported files are PNG, JPG, PDF, and SVG.
                    Maximum size limit is 5MB!
                </p>
            </p>

        </Upload.Dragger>
    )
}