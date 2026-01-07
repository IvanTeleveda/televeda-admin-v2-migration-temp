import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Button } from 'antd';
import { DragOutlined } from '@ant-design/icons';
import { WidgetType, DraggableMenuItemData } from '../types';

interface DraggableMenuItemProps {
  id: string; // Unique ID for dnd-kit
  widgetType: WidgetType;
  defaultWidth: number;
  defaultHeight: number;
  icon?: JSX.Element;
  children: React.ReactNode;
}

const DraggableMenuItem: React.FC<DraggableMenuItemProps> = ({
  id,
  widgetType,
  defaultWidth,
  defaultHeight,
  icon,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id, // This ID is what DragOverlay will look for in active.id
    data: {
      type: widgetType,
      isMenuItem: true,
      defaultWidth,
      defaultHeight,
    } as DraggableMenuItemData,
  });

  const buttonStyle: React.CSSProperties = {
    cursor: 'grab',
    width: '100%',
    marginBottom: '8px',

  };

  return (
    <Button
      ref={setNodeRef} // dnd-kit needs this ref on the element that listens for drag
      style={buttonStyle}
      {...listeners}
      {...attributes}
      icon={icon || <DragOutlined />}
    >
      {children}
    </Button>
  );
};

export default DraggableMenuItem;