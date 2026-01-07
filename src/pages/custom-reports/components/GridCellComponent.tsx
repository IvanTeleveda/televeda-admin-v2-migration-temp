import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Button, Empty, theme, Tooltip, Typography } from 'antd';
import { AnalyticsWidgetConfig, AppWidgetConfig, EventCancelationsWidgetConfig, FeedbackTableWidgetConfig, FileUploadWidgetConfig, HostReportTableWidgetConfig, MemberReportTableWidgetConfig, ReportFilters, RichTextWidgetConfig, TextWidgetConfig, WidgetType } from '../types'; // Ensure TextWidgetConfig is imported
import TextWidget from '../widgets/TextWidget';
import FeedbackTableWidget from '../widgets/FeedbackTableWidget';
import { SettingOutlined } from '@ant-design/icons';
import RichTextWidget from '../widgets/RichTextWidget';
import FileUploadWidget from '../widgets/FileUploadWidget';
import { useDebouncedValue } from '../../../components/buttons/sendEmail/useDebounce';
import MemberReportTableWidget from '../widgets/MemberReportTableWidget';
import AnalyticsWidget from '../widgets/AnalyticsWidget';
import EventCancelationsTableWidget from '../widgets/EventCancelationsWidget';
import HostReportTableWidget from '../widgets/HostReportTableWidget';

const { Text } = Typography;

interface GridCellComponentProps {
  cellId: string;
  widget?: AppWidgetConfig | null;
  isOver?: boolean;
  isPreviewMode: boolean;
  reportFilters: ReportFilters;
  isFileUploading: boolean;
  onWidgetContentChange: (widgetId: string, newContent: string) => void;
  onOpenWidgetSettings: (widgetId: string) => void;
  onFileUploadRequest: (widgetId: string, req: any) => void;
  onFileRemoveRequest: (widgetId: string) => void;
  onRichTextIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

const GridCellComponent: React.FC<GridCellComponentProps> = ({
  cellId,
  widget,
  isOver: isParentOver,
  isPreviewMode,
  reportFilters,
  isFileUploading,
  onWidgetContentChange,
  onOpenWidgetSettings,
  onFileUploadRequest,
  onFileRemoveRequest,
  onRichTextIsUploading
}) => {

  const { useToken } = theme;
  const { token } = useToken();

  const [observedCellHeight, setObservedCellHeight] = useState<number>(0);

  const cellDivRef = useRef<HTMLDivElement | null>(null);

  const { setNodeRef, isOver: isDndKitOver } = useDroppable({
    id: cellId,
    data: {
      isGridCell: true,
      cellId: cellId,
    },
  });

  const cellHeight = useDebouncedValue(observedCellHeight, 150);

  const effectiveIsOver = isParentOver || isDndKitOver;

  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      cellDivRef.current = node;
    },
    [setNodeRef]
  );

  useEffect(() => {
    const targetElement = cellDivRef.current;
    if (!targetElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const newHeight = entry.contentRect?.height || entry.target.clientHeight;
        setObservedCellHeight(newHeight);
        // setObservedCellWidth(newWidth);
      }
    });

    resizeObserver.observe(targetElement);

    return () => {
      if (targetElement && resizeObserver) {
        resizeObserver.unobserve(targetElement);
      }
      resizeObserver.disconnect();
    };
  }, []);

  const renderContent = () => {
    if (widget) {
      switch (widget.componentType) {
        case WidgetType.TEXT:
          return (
            <TextWidget
              id={widget.i}
              content={(widget as TextWidgetConfig).content || ''}
              isPreviewMode={isPreviewMode}
              onContentChange={onWidgetContentChange}
            />
          );
        case WidgetType.RICH_TEXT:
          return (
            <RichTextWidget
              id={widget.i}
              content={(widget as RichTextWidgetConfig).content || ''}
              isPreviewMode={isPreviewMode}
              containerHeight={cellHeight}
              onContentChange={onWidgetContentChange}
              setIsUploading={onRichTextIsUploading}
            />
          );
        case WidgetType.FILE_UPLOAD:
          return (
            <FileUploadWidget
              widgetConfig={widget as FileUploadWidgetConfig}
              isPreviewMode={isPreviewMode}
              isLoading={isFileUploading}
              onCustomUploadRequest={onFileUploadRequest}
              onFileRemove={onFileRemoveRequest}
            />
          );
        case WidgetType.FEEDBACK_TABLE:
          return (
            <FeedbackTableWidget
              widgetConfig={widget as FeedbackTableWidgetConfig}
              isPreviewMode={isPreviewMode}
              isExporting={false}
              reportFilters={reportFilters}
            />
          );
        case WidgetType.MEMBER_REPORT_TABLE:
          return (
            <MemberReportTableWidget
              widgetConfig={widget as MemberReportTableWidgetConfig}
              reportFilters={reportFilters}
              isPreviewMode={isPreviewMode}
              isExporting={false}
            />
          );
        case WidgetType.HOST_REPORT_TABLE:
          return (
            <HostReportTableWidget
              widgetConfig={widget as HostReportTableWidgetConfig}
              reportFilters={reportFilters}
              isPreviewMode={isPreviewMode}
              isExporting={false}
            />
          );
        case WidgetType.ANALYTICS_WIDGET:
          return (
            <AnalyticsWidget
              widgetConfig={widget as AnalyticsWidgetConfig}
              isPreviewMode={isPreviewMode}
              reportFilters={reportFilters} 
              isExporting={false}
            />
          );
        case WidgetType.EVENT_CANCELATIONS_WIDGET:
          return (
            <EventCancelationsTableWidget
              widgetConfig={widget as EventCancelationsWidgetConfig}
              isPreviewMode={isPreviewMode}
              reportFilters={reportFilters} 
              isExporting={false}
            />
          );
        default:
          return <Text type="danger">Unknown widget type</Text>;
      }
    }
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={isPreviewMode ? "Empty Cell" : "Drop Widget Here"} />;
  };

  return (
    <div
      ref={combinedRef}
      style={{
        width: '100%',
        height: '100%',
        border: effectiveIsOver ? '2px dashed #1890ff' : `${effectiveIsOver ? '2px' : '1px'} solid ${token.colorBorder}`,
        background: token.colorBgContainer,
        paddingTop: '15px',
        paddingBottom: '5px',
        paddingInline: '8px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {!isPreviewMode && widget && (
        <Tooltip title="Widget Settings">
          <Button
            type="text"
            icon={<SettingOutlined />}
            size="small"
            onClick={() => onOpenWidgetSettings(widget.i)}
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              zIndex: 15,
            }}
          />
        </Tooltip>
      )}
      <div style={{ flexGrow: 1, overflow: 'auto', paddingTop: !isPreviewMode && widget ? '24px' : '0px' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default GridCellComponent;