import React, { useState } from 'react';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import editorConfig from '../../../utils/editorConfig';
import { CkEditorFirebaseUploadAdapter } from '../../../adapters/CkEditorFirebaseUploadAdapter';

interface RichTextWidgetProps {
    id: string;
    content: string;
    isPreviewMode: boolean;
    containerHeight: number;
    onContentChange: (widgetId: string, newContent: string) => void;
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
}

const RichTextWidget: React.FC<RichTextWidgetProps> = ({
    id,
    content,
    isPreviewMode,
    containerHeight,
    onContentChange,
    setIsUploading
}) => {

    if (isPreviewMode) {
        return (
            <div
                className="ck-content"
                style={{ padding: '10px', height: '100%', overflowY: 'auto' }}
                dangerouslySetInnerHTML={{ __html: content || "<p><i>No rich content.</i></p>" }}
            />
        );
    }

    return (
        <CKEditor
            key={containerHeight ? containerHeight : 1}
            editor={ClassicEditor}
            config={editorConfig}
            data={content || ""}
            onReady={(editor: any) => {
                editor.editing.view.change((writer: any) => {
                    writer.setStyle(
                        "height",
                        containerHeight ? `${(containerHeight - 70)}px` : "300px",
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
            onChange={(event: any, editor: any) => {
                const data = editor.getData();
                onContentChange(id, data);
            }}
            disabled={isPreviewMode}
        />
    );
};

export default RichTextWidget;