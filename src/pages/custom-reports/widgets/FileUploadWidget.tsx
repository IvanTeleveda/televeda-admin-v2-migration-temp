import React, { useState } from 'react'; // Removed useState if handleImageUpload is passed
import { Upload, Button, Typography, Space, Image, Tooltip, Card } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined, DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { FileUploadWidgetConfig } from '../types';
import { DefaultFirebaseUploaderAdapter } from '../../../adapters/DefaultFirebaseUploadAdapter';

const { Text, Link } = Typography;

interface FileUploadWidgetProps {
  widgetConfig: FileUploadWidgetConfig;
  isPreviewMode: boolean;
  isLoading: boolean;
  onCustomUploadRequest: (widgetId: string, req: any) => void;
  onFileRemove: (widgetId: string) => void;
}

const FileUploadWidget: React.FC<FileUploadWidgetProps> = ({
  widgetConfig,
  isPreviewMode,
  isLoading,
  onCustomUploadRequest,
  onFileRemove,
}) => {
  const { i: widgetId, fileName, fileUrl } = widgetConfig;

  const isImage = fileName && /\.(jpeg|jpg|gif|png|svg)$/i.test(fileName);

  if (isPreviewMode) {
    return (
      <Card size="small" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
        {fileUrl ? (
          <Space direction="vertical" align="center">
            {isImage ? (
              <Image src={fileUrl} alt={fileName || 'Uploaded image'} style={{ objectFit: 'contain' }} preview />
            ) : (
              <FileTextOutlined style={{ fontSize: '48px', margin: '10px' }} />
            )}
            <Link href={fileUrl} target="_blank" rel="noopener noreferrer">
              {fileName || 'View File'}
            </Link>
          </Space>
        ) : (
          <Text type="secondary">No file uploaded.</Text>
        )}
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card size="small" title="File Upload" style={{ padding: '5px', margin: 5 }} styles={{ body: { width: '100%' } }}>
      <Upload.Dragger
        customRequest={(req) => onCustomUploadRequest(widgetId, req)}
        listType="picture"
        maxCount={1}
        showUploadList={false}
      >
        <p className="ant-upload-text">
          <UploadOutlined /> Drag & drop an image in this area
        </p>

      </Upload.Dragger>
      <div style={{
        display: fileUrl ? "block" : isLoading ? "block" : "none",
        position: 'relative',
        textAlign: 'center',
        border: '1px solid #f0f0f0',
        borderRadius: '6px',
        marginTop: '6px',
        width: 'inherit'
      }}>
        {fileUrl ?
          !isLoading ?
            <>
              {isImage ?
                <img src={fileUrl} style={{ maxHeight: "200px", marginTop: "10px", marginBottom: "10px", width: 'inherit' }} alt="community-logo" /> : 'logo'
              }
              <span style={{ float: "right", fontSize: "1rem", marginTop: "10px", marginRight: "10px", marginBottom: -10, cursor: 'pointer' }}>
                <DeleteOutlined onClick={() => onFileRemove(widgetId)} />
              </span>
            </> :
            <LoadingOutlined style={{ fontSize: "3rem", marginTop: "10px", marginBottom: "10px" }} /> :
          isLoading ?
            <LoadingOutlined style={{ fontSize: "3rem", marginTop: "10px", marginBottom: "10px" }} /> :
            <></>}

      </div>
    </Card>
  );
};

export default FileUploadWidget;