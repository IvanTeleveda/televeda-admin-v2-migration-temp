import { Avatar, Button, Col, Divider, Drawer, Form, Grid, Icons, Input, Select, Space, Switch, Upload, Card, Popconfirm, Badge } from "@pankod/refine-antd"
import { UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { ICommunityCollection, ICommunityCollectionItem, NotificationType } from "../../../interfaces";
import { List } from 'antd';
import { CreateButton, EditButton } from "@refinedev/antd";
import { useApiUrl, useCustomMutation, useNotification } from "@refinedev/core";
import { ResourceFirebaseUploaderAdapter } from "../../../adapters/ResourceFirebaseUploaderAdapter";
import { BlobImagesFirebaseUploadAdapter } from "../../../adapters/BlobImagesFirebaseUploadAdapter";
import { ImageCrop } from "../../../components/image-crop";
import { CollectionsItemList } from "./collectionsItemList";

export const VisibilityRibbon = (visibility: number) => {
    switch (visibility) {
        case 1:
            return {
                text: "Public",
                color: "green"
            }
        case 2:
            return {
                text: "Private",
                color: "magenta"
            }
        default:
            return {
                text: "Hidden",
                color: "red"
            }
    }
}

export const CommunityCollections: React.FC<{
    communityId: string | undefined;
}> = ({ communityId }) => {
    const { DeleteOutlined, LoadingOutlined } = Icons;
    const apiUrl = useApiUrl();
    const { open } = useNotification();
    const { mutate } = useCustomMutation<ICommunityCollection>();

    const breakpoint = Grid.useBreakpoint(); 

    const [collectionForm] = Form.useForm<ICommunityCollection>();
    const [collectionItemForm] = Form.useForm<ICommunityCollectionItem>();
    const [visible, setVisible] = useState(false);
    const [visibleItemDrawer, setVisibleItemDrawer] = useState(false);
    const [drawerAction, setDrawerAction] = useState("create");
    const [drawerItemAction, setDrawerItemAction] = useState("create");
    const [collections, setCollections] = useState<ICommunityCollection[]>([]);

    const [resourceType, setResourceType] = useState("file");
    const [fileList, setFileList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [croppedImage, setCroppedImage] = useState<any>();
    const [imgSrc, setImgSrc] = useState('')
    const hideFullImageFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'application/pdf', 'text/plain'];
    // firebase adapter stuff

    const fileAdapter = new ResourceFirebaseUploaderAdapter;
    const imageFileAdapter = new BlobImagesFirebaseUploadAdapter;
    const resourcePath = communityId + "/community-collection/";

    const { Option } = Select;

    const handleFileChange = ({ fileList }: any) => {
        console.log(fileList);
        setFileList(fileList);
        setImgSrc('');
        setCroppedImage('');
    };

    const showDrawer = () => {
        setVisible(true);
        // reset values
        collectionForm.setFieldsValue({
            id: "",
            title: "",
            description: "",
            visibility: 1,
            order: 1
        });
    };

    const closeDrawer = () => {
        setVisible(false);
    };

    const closeItemDrawer = () => {
        setResourceType("file");
        setVisibleItemDrawer(false);
        setCroppedImage("");
        setImgSrc("");
    }

    useEffect(() => {
        if(visible || visibleItemDrawer) {
            setIsLoading(false);
        }
    }, [visible, visibleItemDrawer])

    const uploadBlob = async (blobUrl: any) => {
        try {
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            const file = new File([blob], `thumbnail-${uuidv4()}`, { type: blob.type });
            const downloadUrl = await imageFileAdapter.upload(file, resourcePath + collectionItemForm.getFieldValue("collectionId"));
            return {downloadUrl, fileName: file.name};
        } catch (error) {
            console.error('Error uploading blob:', error);
            return null;
        }
    };

    const onSubmit = async () => {
        setIsLoading(true);
        
        try {
            await collectionForm.validateFields();
            console.log(collectionForm.getFieldsValue());

            // TODO: add Notifications
            if (!collectionForm.getFieldValue("title") || ![0, 1, 2,].includes(collectionForm.getFieldValue("visibility")) || !communityId) {
                console.error("Missing fields");
                return;
            }
            const collectionId = collectionForm.getFieldValue("id");
            if (drawerAction === "edit" && !collectionId) {
                console.error("No CollectionId");
                return;
            }
            //
            const communityCollection: ICommunityCollection = {
                communityId,
                title: collectionForm.getFieldValue("title"),
                description: collectionForm.getFieldValue("description"),
                visibility: collectionForm.getFieldValue("visibility"),
                order: collectionForm.getFieldValue("order")
            }

            const url = drawerAction === "create" ? `${apiUrl}/community-collections` : `${apiUrl}/community-collections/${collectionId}`;
            mutate({
                url,
                method: drawerAction === "create" ? "post" : "patch",
                values: communityCollection,
            }, {
                onError: (error, variables, context) => {
                    console.log(error);
                    openNotificationWithIcon('error', 'Failed to load data!', "");
                    closeDrawer();
                },
                onSuccess: (data, variables, context) => {
                    console.log(data);

                    //@ts-ignore
                    setCollections((prevFileList) => {
                        // find the previous el and update the state
                        const newArr = [...prevFileList];
                        if (drawerAction === "create") {
                            newArr.push(data.data)
                        } else {

                            const index = newArr.findIndex(x => x.id == data.data.id);
                            newArr[index] = data.data;
                        }
                        return newArr;
                    });
                    openNotificationWithIcon('success', 'Information updated!', "");
                    closeDrawer();
                },
            },);
        } catch (error) {
            console.error('Error creating collection:', error);
            // Handle error message or notification
            setIsLoading(false);
        }
    };

    // I don't want to include a new library for only this event
    const updateItemEvent = new CustomEvent('itemUpdated');

    const onSubmitCollectionItem = async () => {
        setIsLoading(true);
        try {
            await collectionItemForm.validateFields();
            console.log(collectionItemForm.getFieldsValue());
            // TODO: add Notifications
            // if (!collectionItemForm.getFieldValue("title") || ![0, 1, 2,].includes(collectionItemForm.getFieldValue("visibility")) || !communityId) {
            if (!collectionItemForm.getFieldValue("title") || !communityId) {
                console.error("Missing fields");
                return;
            }

            const itemId = collectionItemForm.getFieldValue("id");
            const collectionId = collectionItemForm.getFieldValue("collectionId");
            const resourceType = collectionItemForm.getFieldValue("resourceType");
            console.log("resourceType", resourceType);
            // handle file upload to firebase
            let downloadUrl;
            let fileName = "";
            let fileSize = 0;
            let extension = "";
            let linkImageDownloadUrl: any = "";
            let linkImageFileName = "";
            let linkImageCropDownloadUrl: any = "";
            let linkImageCropFileName = "";
            if (drawerItemAction === "create") {
                if(resourceType === "file") {
                    const itemFile = collectionItemForm.getFieldValue("itemFile");

                    //@ts-ignore
                    fileName = itemFile.file.name + '-' + uuidv4();
                    //@ts-ignore
                    fileSize = itemFile.file.size;
                    //@ts-ignore
                    extension = itemFile.file.type;

                    const url: any = await fileAdapter.upload(itemFile, resourcePath + collectionId, fileName);
                    console.log(url);
                    downloadUrl = url?.downloadURL;

                    if (!downloadUrl) {
                        return;
                    }
                } else if(resourceType === 'link') {
                    downloadUrl = collectionItemForm.getFieldValue("downloadUrl");
                }
            } else {
                if(resourceType === 'link') {
                    downloadUrl = collectionItemForm.getFieldValue("downloadUrl");
                }
            }

            if (imgSrc) {
                const uploadResult = await uploadBlob(imgSrc);
                if (uploadResult!== null) {
                    const { downloadUrl, fileName } = uploadResult;
                    linkImageDownloadUrl = downloadUrl;
                    linkImageFileName = fileName;
                }
            }
            if(croppedImage) {
                const uploadResultCropped = await uploadBlob(croppedImage);
                if (uploadResultCropped!== null) {
                    const { downloadUrl: croppedDownloadUrl, fileName: croppedFileName } = uploadResultCropped;
                    linkImageCropDownloadUrl = croppedDownloadUrl;
                    linkImageCropFileName = croppedFileName; 
                } 
            }
            const communityCollectionItem: ICommunityCollectionItem = {
                collectionId,
                title: collectionItemForm.getFieldValue("title"),
                description: collectionItemForm.getFieldValue("description"),
                downloadUrl,
                linkImageCropDownloadUrl: linkImageCropDownloadUrl.downloadURL,
                linkImageCropFileName,
                linkImageDownloadUrl: linkImageDownloadUrl.downloadURL,
                linkImageFileName,
                dropdownImage: collectionItemForm.getFieldValue("dropdownImage")
            };
            if (drawerItemAction === "create") {
                communityCollectionItem.resourceType = resourceType;
                communityCollectionItem.fileName = fileName;
                communityCollectionItem.fileSize = fileSize;
                communityCollectionItem.extension = extension;

            } else {
                communityCollectionItem.id = itemId;
            }

            const url = drawerItemAction === "create" ? `${apiUrl}/community-collection-items` : `${apiUrl}/community-collection-items/${itemId}`;
            mutate({
                url,
                method: drawerItemAction === "create" ? "post" : "patch",
                values: communityCollectionItem,
            }, {
                onError: (error, variables, context) => {
                    console.log(error);
                    openNotificationWithIcon('error', 'Failed to load data!', "");
                    closeItemDrawer();
                },
                onSuccess: (data, variables, context) => {
                    // console.log(data);
                    openNotificationWithIcon('success', 'Information updated!', "");
                    closeItemDrawer();
                    // Emit an event for refetching the CollectionItem table
                    document.dispatchEvent(updateItemEvent);
                },
            },);
        } catch (error) {
            console.error('Error creating collection item:', error);
            // Handle error message or notification
            setIsLoading(false);
        }
    };

    const editCollection = (item: ICommunityCollection) => {
        setDrawerAction("edit");
        showDrawer();
        //@ts-ignore
        collectionForm.setFieldsValue({
            id: item.id,
            title: item.title,
            description: item.description,
            visibility: item.visibility,
            order: item.order
        })
    }

    const openNotificationWithIcon = (type: NotificationType, message: string, description: string) => {
        open?.({
            type,
            message,
            description
        });
    };

    const onItemDelete = async (item: ICommunityCollectionItem) => {
        try {
            if (item.resourceType === "file" && item.fileName) {
                await fileAdapter.delete(resourcePath + item.collectionId, item.fileName);
            }
            
            if(item.linkImageFileName) {
                await fileAdapter.delete(resourcePath + item.collectionId, item.linkImageFileName);
            }

            if(item.linkImageCropFileName) {
                await fileAdapter.delete(resourcePath + item.collectionId, item.linkImageCropFileName);
            }

            mutate({
                url: apiUrl + "/community-collection-items/" + item.id,
                method: "delete",
                values: {
                    collectionId: item.collectionId,
                    downloadUrl: item.downloadUrl
                },
            }, {
                onError: (error, variables, context) => {
                    console.log(error);
                    openNotificationWithIcon('error', "Item failed to delete!", "Please try again in a few seconds.");
                },
                onSuccess: (data, variables, context) => {
                    // console.log(data);
                    // Emit an event for refetching the CollectionItem table
                    openNotificationWithIcon('success', 'Item deleted successfully!', "");
                    document.dispatchEvent(updateItemEvent);
                },
            },);
        } catch (error: any) {
            console.log(error);
            if(error.code === 'storage/object-not-found') {
                mutate({
                    url: apiUrl + "/community-collection-items/" + item.id,
                    method: "delete",
                    values: {
                        collectionId: item.collectionId,
                        downloadUrl: item.downloadUrl
                    },
                }, {
                    onError: (error, variables, context) => {
                        console.log(error);
                        openNotificationWithIcon('error', "Item failed to delete!", "Please try again in a few seconds.");
                    },
                    onSuccess: (data, variables, context) => {
                        openNotificationWithIcon('success', 'Item deleted successfully!', "");
                        document.dispatchEvent(updateItemEvent);
                    },
                },);
            } else {
                openNotificationWithIcon('error', "Item failed to delete!", "Please try again in a few seconds.");
            }
        }
    }

    const deleteCollectionItems = async (collection: ICommunityCollection) => {
        try {
            mutate({
                url: apiUrl + "/community-collection-items/retrieve-and-delete/" + collection.id,
                method: "post",
                values: {},
            }, {
                onError: (error, variables, context) => {
                    console.log(error);
                },
                onSuccess: (data, variables, context) => {
                    const items = data.data as any;
                    items.forEach(async (item: ICommunityCollectionItem) => {
                        if(item.fileName) {
                            await fileAdapter.delete(resourcePath + item.collectionId, item.fileName);
                        }
                        if(item.linkImageFileName) {
                            await fileAdapter.delete(resourcePath + item.collectionId, item.linkImageFileName);
                        }
            
                        if(item.linkImageCropFileName) {
                            await fileAdapter.delete(resourcePath + item.collectionId, item.linkImageCropFileName);
                        }
                    });
                    
                    deleteCollection(collection.id || "");
                    setCollections((prevFileList) => {
                        // @ts-ignore
                        const newArr = [...prevFileList];
                        // @ts-ignore
                        return newArr.filter(el => el.id != collection.id);
                    });
                    document.dispatchEvent(updateItemEvent);
                },
            },);
        } catch (error) {
            console.log(error);
        }
    }

    const deleteCollection = async (collectionId: string) => {
        try {
            mutate({
                url: apiUrl + "/community-collections/" + collectionId,
                method: "delete",
                values: {},
            }, {
                onError: (error, variables, context) => {
                    openNotificationWithIcon('error', "Collection failed to delete!", "Please try again in a few seconds.");
                    console.log(error);
                },
                onSuccess: (data, variables, context) => {
                    // Emit an event for refetching the CollectionItem table
                    openNotificationWithIcon('success', "Collection deleted successfully!", "");
                    document.dispatchEvent(updateItemEvent);
                },
            },);
        } catch (error) {
            console.log(error);
        }

    }

    useEffect(() => {
        mutate({
            url: `${apiUrl}/community-collections/fetch-list`,
            method: "post",
            values: {
                communityId,
            },
        }, {
            onError: (error, variables, context) => {
                console.log(error);
                openNotificationWithIcon('error', 'Failed to load collections!', "");
            },
            onSuccess: (data, variables, context) => {
                console.log(data);
                //@ts-ignore
                setCollections(data.data)
            },
        },);

    }, [])

    const hideFullImage = () => {
        const file = collectionItemForm.getFieldValue("itemFile");
        if(file && file.fileList.length > 0) {
            const type = file.fileList[0].type;
            if(hideFullImageFileTypes.includes(type)) {
                return true;
            }
        }
        return false;
    }

    const isFilePdf = () => {
        const file = collectionItemForm.getFieldValue("itemFile");
        if(file && file.fileList.length > 0) {
            const type = file.fileList[0].type;
            if(type === 'application/pdf') {
                return true;
            }
        }
        return false;
    }

    const imageCropHandlers = {
        setThumbnailImageFormValue: (value: string) => {
            collectionItemForm.setFieldValue("thumbnailImage", value);
        },
        setCroppedImage,
    };

    return (
        <Card title="Collections" extra={<CreateButton type="primary" onClick={() => {
            setDrawerAction("create");
            showDrawer();
        }}>Create Collection</CreateButton>}>
            <List
                itemLayout="vertical"
                size="large"
                dataSource={[...collections].sort((a, b) => a.order - b.order)}
                renderItem={(item: ICommunityCollection) => (
                    <List.Item>
                        <Badge.Ribbon {...VisibilityRibbon(item.visibility)} placement="start">
                            <Card title={
                                <span style={{ textAlign: "center", marginLeft: "2rem" }}>{item.title}</span>
                            }
                                extra={
                                    <Space>
                                        <CreateButton type="default" onClick={() => {
                                            collectionItemForm.resetFields();
                                            collectionItemForm.setFieldValue("collectionId", item.id);
                                            collectionItemForm.setFieldValue("resourceType", "file");
                                            collectionItemForm.setFieldValue("visibility", item.visibility ? 1 : 2);
                                            collectionItemForm.setFieldValue("uploader", null);
                                            setFileList([]);
                                            setDrawerItemAction("create");
                                            setVisibleItemDrawer(true);
                                        }}>Add Item</CreateButton>
                                        <EditButton onClick={() => { editCollection(item) }} />
                                        <Popconfirm
                                            title={"Delete " + item.title}
                                            description="Are you sure to delete this collection?"
                                            onConfirm={() => {  deleteCollectionItems(item) }}
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                        <Button 
                                            style={{ 
                                                borderColor: 'red', 
                                                color: 'red',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            icon={<DeleteOutlined style={{ marginBottom: '2px' }}/>}
                                        >
                                            Delete
                                        </Button>
                                        </Popconfirm>
                                    </Space>
                                }
                            >
                                <Card.Meta description={item.description}></Card.Meta>
                                <br />
                                {item.id && <CollectionsItemList collectionId={item.id} onDelete={onItemDelete} itemForm={collectionItemForm} openItemDrawer={() => {
                                    setVisibleItemDrawer(true);
                                    setDrawerItemAction("edit");
                                }} />}
                            </Card>
                        </Badge.Ribbon>
                    </List.Item>
                )
                }
            />

            <Drawer
                title={drawerAction === "create" ? "Create Collection" : "Edit Collection"}
                open={visible}
                width={breakpoint.sm ? "500px" : "100%"}
                onClose={closeDrawer}
                styles={{
                    body: {
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column'
                    }
                }}
            >
                <Form form={collectionForm} layout="vertical" onFinish={(values) => onSubmit()}>
                    <Form.Item name="id" hidden={true}>
                        <Input type="text" />
                    </Form.Item>
                    <Form.Item 
                        label="Title" 
                        name="title" 
                        rules={[
                            { required: true, message: 'Please input the title!' },
                            { max: 80, message: 'Title cannot exceed 80 characters' }
                        ]}>
                        <Input showCount={true} maxLength={80} name="title" placeholder="Enter collection title" />
                    </Form.Item>
                    <Form.Item 
                        label="Description" 
                        name="description"
                        rules={[
                            { max: 200, message: 'Description cannot exceed 200 characters' }
                        ]}
                    >
                        <Input.TextArea showCount={true} maxLength={200} placeholder="Collection description (optional)" />
                    </Form.Item>
                    <Form.Item label="Visibility" name="visibility" rules={[{ required: true, message: 'Please chose visibility!' }]} >
                        <Select options={
                            [
                                { label: "Public", value: 1 },
                                { label: "Private", value: 2 },
                                { label: "Hidden", value: 0 },
                            ]
                        }>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label={"Collection order"}
                        name={"order"}
                        initialValue={1}
                        rules={[
                            { required: true },
                            {
                                validator: async () => {
                                    const value = Number(collectionForm.getFieldValue('order'));
                                    const id = collectionForm.getFieldValue('id');
                                
                                    if (isNaN(value)) {
                                        return Promise.reject(new Error("Value must be a number"));
                                    }
                                
                                    if (value < 1) {
                                        return Promise.reject(new Error("Order must be greater than 0"));
                                    }
                                
                                    const orderExists = collections.some(
                                        (collection) =>
                                            collection.order === value && collection.id !== id
                                    );
                                
                                    if (orderExists) {
                                        return Promise.reject(
                                            new Error("Order is already taken. Please select another order")
                                        );
                                    }
                                
                                    return Promise.resolve();
                                }
                                
                            }
                        ]}
                    >
                        <Input size="large" min={1} max={3} style={{ width: "100%" }} type="number"  onChange={(e) => collectionForm.setFieldValue('order', Number(e.target.value))}/>
                    </Form.Item>
                    <Space>
                    <Button 
                        type="primary" 
                        onClick={() => {
                            collectionForm.submit();
                        }} 
                        disabled={isLoading}
                    >
                            {drawerAction === "create" ? "Create" : "Edit"}
                        </Button>
                        <Button onClick={closeDrawer}>Cancel</Button>
                    </Space>
                </Form>
            </Drawer>

            <Drawer
                title={drawerItemAction === "create" ? "Create Item" : "Edit Item"}
                width={breakpoint.sm ? "500px" : "100%"}
                open={visibleItemDrawer}
                onClose={() => { closeItemDrawer() }}
                styles={{
                    body: {
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column'
                    }
                }}
            >
                {isLoading &&
                    <LoadingOutlined style={{fontSize: '140px', position: 'absolute', zIndex: 100, top: '40%', left: '30%', color:'lightgrey'}}/>
                }

                <Divider style={{color: '#736e6e'}}>General Information</Divider>

                <Form form={collectionItemForm} layout="vertical" onFinish={(values) => onSubmitCollectionItem()}>
                    <Form.Item name="id" hidden={true}>
                        <Input type="text" />
                    </Form.Item>
                    <Form.Item name="collectionId" hidden={true}>
                        <Input type="text" />
                    </Form.Item>
                    <Form.Item 
                        label="Title" 
                        name="title" 
                        rules={[
                            { required: true, message: 'Please input the title!' }, 
                            { max: 80, message: 'Title cannot exceed 80 characters' }
                        ]}>
                        <Input showCount={true} maxLength={80} name="title" placeholder="Enter collection title" />
                    </Form.Item>
                    <Form.Item 
                        label="Description" 
                        name="description"
                        rules={[
                            { max: 200, message: 'Description cannot exceed 200 characters' }
                        ]}
                    >
                        <Input.TextArea showCount={true} maxLength={200} placeholder="Collection description (optional)" />
                    </Form.Item>
                    <Form.Item label="Resource type" name="resourceType" rules={[{ required: true, message: 'Please chose a resource type!' }]} >
                        <Select defaultValue={"file"} disabled={drawerItemAction !== "create"} options={
                            [
                                { label: "File", value: "file" },
                                { label: "Link", value: "link" },
                            ]
                        } onChange={(value) => {
                            setResourceType(value);
                            setImgSrc('');
                            setCroppedImage('');
                            setFileList([]);

                            collectionItemForm.setFieldValue('itemFile', undefined);
                            collectionItemForm.setFieldValue('dropdownImage', undefined);
                        }}>
                        </Select>
                    </Form.Item>
                    
                    {resourceType === 'file' && drawerItemAction === "create" ? (
                        <>
                            <br />
                            <Divider style={{ color: '#736e6e' }}>{hideFullImage() ? 'Modal Content' : 'Content'}</Divider>
                            <Form.Item label="File upload" name={"itemFile"} rules={[{ required: true, message: 'Please upload a file!' }]}>
                                <Upload.Dragger
                                    name="uploader"
                                    showUploadList={true}
                                    multiple={false}
                                    listType={'picture'}
                                    fileList={fileList} //fileList
                                    onChange={handleFileChange}
                                    beforeUpload={() => false}
                                    maxCount={1}
                                >
                                    <p className="ant-upload-text">
                                        <UploadOutlined /> Drag & drop files in this area.
                                    </p>

                                </Upload.Dragger>
                            </Form.Item>
                            </> )
                        : (
                        collectionItemForm.getFieldValue("resourceType") === 'link' && (
                            <>
                                <Divider style={{ color: '#736e6e' }}>{hideFullImage() ? 'Modal Content' : 'Content'}</Divider>
                                <Form.Item
                                    label="File link"
                                    name="downloadUrl"
                                    rules={[
                                        {
                                            validator: (_, value) => {
                                                if (!value) {
                                                    return Promise.reject('Please paste a link!');
                                                }

                                                const isValidUrl = new RegExp(
                                                    '^(https?:\\/\\/)?' + // protocol
                                                    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,})' + // domain name
                                                    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                                                    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                                                    '(\\#[-a-z\\d_]*)?$', // fragment locator
                                                    'i'
                                                );
                                                
                                                return isValidUrl.test(value) ? Promise.resolve() : Promise.reject('Please enter a valid URL!');
                                            },
                                        },
                                    ]}
                                    >
                                    <Input disabled={collectionItemForm.getFieldValue("resourceType") === "file" && drawerItemAction === "edit"} />
                                </Form.Item>
                            </>
                        ))
                    }

                    {(fileList.length > 0 || collectionItemForm.getFieldValue("resourceType") === "link") && !collectionItemForm.getFieldValue("id") &&
                        <>  
                            {hideFullImage() && (
                                <>
                                    <br />
                                    <Divider style={{color: '#736e6e'}}>Thumbnail Content</Divider>
                                </>
                            )}

                            <Form.Item
                                name="isImageSelectDropDown"
                                rules={[]}
                                valuePropName="checked"
                                label="Choose from dropdown"
                            >
                                <Switch checkedChildren="YES" unCheckedChildren="NO" defaultChecked onChange={() => {
                                    setImgSrc('');
                                    setCroppedImage('');
                                    collectionItemForm.setFieldValue('dropdownImage', undefined);
                                }}/>
                            </Form.Item>
                            <Form.Item
                                noStyle                         
                                shouldUpdate={(prevValues, currentValues) => prevValues.isImageSelectDropDown !== currentValues.isImageSelectDropDown}
                            >
                                {({ getFieldValue }) => getFieldValue('isImageSelectDropDown') == false ? 
                                      <Form.Item
                                        name="thumbnailImage"
                                        rules={isFilePdf() ?
                                            [{ required: true, message: 'Please input thumbnail image' }] :
                                            []
                                        }
                                      >
                                            <ImageCrop
                                                imgSrc={imgSrc}
                                                imageCropHandlers={imageCropHandlers}
                                                setImgSrc={setImgSrc}
                                                isFilePdfOrTextPlain={hideFullImage()} />
                                                {croppedImage && (
                                                    <>
                                                        {!hideFullImage() && <Divider style={{color: '#736e6e'}}>Thumbnail Content</Divider>}
                                                        <div style={{textAlign: 'center', marginTop: 20}}>
                                                            <img src={croppedImage} style={{ width: '237px', height: '100px' }} />
                                                        </div>
                                                    </>
                                                )}
                                        </Form.Item>
                                    :
                                    <>
                                        <Col xl={22} md={22} sm={22} xs={22}>
                                            <Form.Item
                                                label="Resource images"
                                                name="dropdownImage"
                                                rules={isFilePdf() ?
                                                    [{ required: true, message: 'Please choose image from the dropdown' }] :
                                                    []
                                                }
                                            >
                                                <Select placeholder="Please select a class image" style={{height: 'fit-content' }}>
                                                    <Option value="arizona-digital-infrastructure"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/arizona-digital-infrastructure.svg" style={{ marginRight: '5px'}} />Arizona Digital Infrastructure</div></Option>
                                                    <Option value="arizona-veteran-employment-resources"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/arizona-veteran-employment-resources.svg" style={{ marginRight: '5px'}} />Arizona Veteran Employment Resources</div></Option>
                                                    <Option value="crisis-lines-mental-health"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/crisis-lines-mental-health.svg" style={{ marginRight: '5px'}} />{'Crisis Lines (Mental Health)'}</div></Option>
                                                    <Option value="cultural-resources-traditional-healing-resources"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/cultural-resources-traditional-healing-resources.svg" style={{ marginRight: '5px'}} />{'Cultural Resources (Traditional Healing Resources)'}</div></Option>
                                                    <Option value="digital-literacy-resources"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/digital-literacy-resources.svg" style={{ marginRight: '5px'}} />Digital Literacy Resources</div></Option>
                                                    <Option value="employment-assistance-in-az"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/employment-assistance-in-az.svg" style={{ marginRight: '5px'}}/>{'Employment Assistance In AZ (Job Training, Workforce)'}</div></Option>
                                                    <Option value="food-insecurity-for-arizona-residents"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/food-insecurity-for-arizona-residents.svg" style={{ marginRight: '5px'}} />Food Insecurity For Arizona Residents</div></Option>
                                                    <Option value="health-care-resources"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/health-care-resources.svg" style={{ marginRight: '5px'}} />{'Health care resources(AZ & Federal)'}</div></Option>
                                                    <Option value="housing-for-the-homeless"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/housing-for-the-homeless.svg" style={{ marginRight: '5px'}} />Housing For The Homeless</div></Option>
                                                    <Option value="suicide-prevention"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/suicide-prevention.svg" style={{ marginRight: '5px'}} />Suicide prevention</div></Option>
                                                    <Option value="televeda-community"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/televeda-community.svg" style={{ marginRight: '5px'}} />Televeda Community</div></Option>
                                                    <Option value="transportation-resources"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/transportation-resources.svg" style={{ marginRight: '5px'}} />Transportation Resources</div></Option>
                                                    <Option value="tribal-american-indian"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/tribal-american-indian.svg" style={{ marginRight: '5px'}}/>Tribal American Indian/Alaska Native Resources</div></Option>
                                                    <Option value="veteran-resources-general"><div style={{ whiteSpace: 'normal', wordBreak: 'break-word'}}><Avatar src="/televeda/img/resources/veteran-resources-general.svg" style={{ marginRight: '5px'}} />{'Veteran Resources (General)'}</div></Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </>
                                }
                            </Form.Item>
                        </>
                    }

                    <Divider />
                    
                    <Space>
                        <Button 
                            type="primary" 
                            onClick={()=> {
                                collectionItemForm.submit();
                            }} 
                            style={{ marginTop: '20px'}}
                            disabled={isLoading || (imgSrc && !croppedImage) ? true : false}
                        >
                            {drawerItemAction === "create" ? "Create" : "Edit"}
                        </Button>
                        <Button  style={{ marginTop: '20px'}} onClick={() => { closeItemDrawer() }}>Cancel</Button>
                    </Space>
                </Form>
            </Drawer>     
        </Card>
    )
}