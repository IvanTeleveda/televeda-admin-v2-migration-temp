import React from 'react';
import { Typography } from 'antd';

const { Paragraph } = Typography;

interface TextWidgetProps {
  id: string;
  content: string;
  isPreviewMode: boolean;
  onContentChange: (widgetId: string, newContent: string) => void;
}

const TextWidget: React.FC<TextWidgetProps> = ({ id, content, isPreviewMode, onContentChange }) => {
  const handleTextChange = (newText: string) => {
    if (!isPreviewMode) { // Only allow change if not in preview
      onContentChange(id, newText);
    }
  };

  return (
    <div style={{ padding: '5px', height: '100%', boxSizing: 'border-box', cursor: isPreviewMode ? 'default' : 'text' }}>
      <Paragraph
        editable={isPreviewMode ? false : { // Conditionally enable editable
          onChange: handleTextChange,
          tooltip: 'Click to edit text',
        }}
        onClick={(e) => { if (!isPreviewMode) e.stopPropagation(); }} // Prevent drag only in edit mode
      >
        {content || (isPreviewMode ? "No content." : "Edit me...")}
      </Paragraph>
    </div>
  );
};

export default TextWidget;