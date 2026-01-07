import { CreateResponse, HttpError, IResourceComponentsProps, useApiUrl, useCustomMutation, useLink, useNavigation, useOne, useParsed, usePermissions, useResource } from "@refinedev/core";
import React, { useState, useCallback, useMemo, useEffect, useRef, createRef } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    DragStartEvent,
    DragEndEvent,
    Active, useDraggable
} from '@dnd-kit/core';
import {
    Responsive as ResponsiveGridLayout,
    WidthProvider,
    Layouts as RGL_Layouts_Type, // Type for all layouts
    Layout as RGL_Layout_Item,
} from 'react-grid-layout';
import { v4 as uuidv4 } from 'uuid';
import { Layout, Typography, Card, Tooltip, Button, theme, Divider, Modal, Input, Space, Switch, Col, Form, Row, Select, DatePicker, notification } from 'antd';
import { BarChartOutlined, CalendarOutlined, CloseOutlined, DashOutlined, DownloadOutlined, EditOutlined, EyeOutlined, FileAddOutlined, FolderOpenOutlined, FontSizeOutlined, PicCenterOutlined, PlusOutlined, ReadOutlined, SaveOutlined, StopOutlined, TableOutlined, UserOutlined } from '@ant-design/icons';
import DraggableMenuItem from "./DraggableMenuItem";
import '../layout.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import GridCellComponent from "./GridCellComponent";
import { AnalyticsDisplayFormat, AnalyticsType, AnalyticsWidgetConfig, AppLayouts, AppWidgetConfig, CancelationTypes, DashboardConfig, DraggableMenuItemData, EventCancelationsWidgetConfig, FeedbackTableAggregationType, FeedbackTableWidgetConfig, FileUploadWidgetConfig, GridCellData, HostReportTableWidgetConfig, MemberReportTableWidgetConfig, ReportFilters, RichTextWidgetConfig, TextWidgetConfig, WidgetType } from "../types";
import { ICommunity, ICustomReportTemplate, UserPermissions } from "../../../interfaces";
import Constants from "../../../typings/constants";
import { useSelect } from "@refinedev/antd";
import dayjs from "dayjs";
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import * as moment from 'moment-timezone';
import { ResourceFirebaseUploaderAdapter } from "../../../adapters/ResourceFirebaseUploaderAdapter";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { analyticsTypeDetails } from "../widgets/AnalyticsWidget";

const { Sider, Content } = Layout;
const { Title } = Typography;

dayjs.extend(quarterOfYear);

const ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);

export const CustomReportTemplateForm: React.FC<{ forcePreview?: boolean }> = ({ forcePreview = false }) => {
    // State for the user-defined grid cells
    const [gridCells, setGridCells] = useState<GridCellData[]>([]);
    // State for actual widget configurations (data for widgets)
    const [widgets, setWidgets] = useState<Record<string, AppWidgetConfig>>({});
    // State for react-grid-layout managing the gridCells
    const [rglLayouts, setRglLayouts] = useState<AppLayouts>({});
    const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);

    const [isAdminInPreviewMode, setIsAdminInPreviewMode] = useState<boolean>(false);
    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { list } = useNavigation();

    const [groupByFilter, setGroupByFilter] = useState<string>('month');

    const [editingWidgetConfig, setEditingWidgetConfig] = useState<AppWidgetConfig | null>(null);
    const [isSettingsModalVisible, setIsSettingsModalVisible] = useState<boolean>(false);
    const [settingsForm] = Form.useForm();

    const [isRichTextEditorUploading, setIsRichTextEditorUploading] = useState(false);
    const [isFileUploading, setIsFileUploading] = useState(false);

    const Link = useLink();

    const { useToken } = theme;
    const { token } = useToken();

    const apiUrl = useApiUrl();
    const { id: idFromRoute, params } = useParsed();
    const { action } = useResource();

    const { mutate } = useCustomMutation<ICustomReportTemplate>();

    const [rglDroppingCellPlaceholder, setRglDroppingCellPlaceholder] = useState<{
        i: string; w: number; h: number;
    } | null>(null);

    const [formResource, setFormResource] = useState<string | undefined>();

    const [reportGlobalFilters, setReportGlobalFilters] = useState<ReportFilters>({});

    const [isGeneratingSnapshotPdf, setIsGeneratingSnapshotPdf] = useState<boolean>(false);
    // Ref for the main content area of the dashboard that you want to capture in preview mode
    const dashboardPreviewContentRef = useRef<HTMLDivElement>(null);

    const [form] = Form.useForm<any>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: 'name',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [
            { field: "name", order: 'asc' }
        ]
    });

    const { data: formData, isLoading: formDataLoading, refetch: fetchFormProps } = useOne<ICustomReportTemplate, HttpError>({
        resource: formResource,
        id: idFromRoute,
        queryOptions: {
            enabled: false
        }
    })

    const isPreviewMode = useMemo(() => {
        return forcePreview || permissionsData === 'CommunityManager' || (permissionsData === 'TelevedaAdmin' && isAdminInPreviewMode);
    }, [permissionsData, isAdminInPreviewMode])

    const generateDashboardConfig = (): DashboardConfig => {
        return {
            gridCells: gridCells,
            widgets: widgets,
            rglLayouts: rglLayouts,
            reportName: form.getFieldValue('name') || null
        };
    };

    const handleMainFormChange = (allValues: any) => {
        const startDate = dayjs().subtract(1, 'month').startOf('month');
        const newFilters: ReportFilters = {
            startDate: allValues.startDate ? dayjs(allValues.startDate).toISOString() : startDate.toISOString(),
            endDate: allValues.endDate ? dayjs(allValues.endDate).toISOString() : startDate.endOf('month').toISOString(),
            communityIds: allValues.communityIds,
        };
        setReportGlobalFilters(newFilters);
    };


    useEffect(() => {
        const startDateFormVal = form.getFieldValue('startDate');
        const endDateFormVal = form.getFieldValue('endDate');
        if (groupByFilter === 'week') {
            form.setFieldValue('startDate', dayjs(startDateFormVal).startOf('week'));
            form.setFieldValue('endDate', dayjs(endDateFormVal).endOf('week'));
        }
        else if (groupByFilter === 'month') {
            form.setFieldValue('startDate', dayjs(startDateFormVal).startOf('month'));
            form.setFieldValue('endDate', dayjs(endDateFormVal).endOf('month'));
        }
        else if (groupByFilter === 'quarter') {
            form.setFieldValue('startDate', dayjs(startDateFormVal).startOf('quarter'));
            form.setFieldValue('endDate', dayjs(endDateFormVal).endOf('quarter'));
        }
    }, [groupByFilter]);

    useEffect(() => {
        if (idFromRoute) {
            if (params?.type === 'temp') {
                setFormResource(`custom_reports/template`)
            }
            else {
                setFormResource(`custom_reports/occurrence`)
            }
        }
    }, [params, idFromRoute]);

    useEffect(() => {
        if (formResource) {
            fetchFormProps();
        }
    }, [formResource]);

    useEffect(() => {
        if (formDataLoading) return;

        if (formData?.data) {
            const data = formData.data;
            form.setFieldsValue({
                name: data.name,
                occurrence: data.occurrence,
                startDate: dayjs(data.startDate),
                endDate: dayjs(data.endDate),
                communityIds: data.communityIds,
            });

            const startDate = dayjs().subtract(1, 'month').startOf('month');
            setReportGlobalFilters({
                startDate: data.startDate ? dayjs(data.startDate).toISOString() : startDate.toISOString(),
                endDate: data.startDate ? dayjs(data.endDate).toISOString() : startDate.endOf('month').toISOString(),
                communityIds: data.communityIds,
            })

            if (data.configJSON) {
                loadDashboardConfig(data.configJSON, false);
            }
        }
    }, [formData?.data]);

    const loadDashboardConfig = (config: DashboardConfig, showModal: boolean = true) => {
        if (!config || !config.gridCells || !config.widgets || !config.rglLayouts) {
            Modal.error({ title: 'Error', content: 'Invalid configuration format.' });
            return;
        }

        setWidgets(config.widgets);
        setGridCells(config.gridCells);

        // RGL needs the 'layouts' prop to be structured by breakpoint.
        // We'll derive this from the gridCells' layout property.
        // This assumes gridCells[].layout holds the primary layout info.
        const newRglLayouts: AppLayouts = {};
        // Assuming 'lg' is a default or primary breakpoint you care about for initial load.
        // RGL will adapt to other breakpoints based on its internal logic and these base layouts.
        // If you saved full AppLayouts, you'd use that directly.
        newRglLayouts['lg'] = config.gridCells.map(cell => cell.layout);
        // For simplicity, this sets the 'lg' breakpoint, and RGL will derive others.
        setRglLayouts(newRglLayouts);

        if (showModal) {
            Modal.success({ title: 'Success', content: 'Dashboard configuration loaded!' });
        }
    };

    const handleLoadDashboard = () => {
        const currentConfig = generateDashboardConfig();
        let configJson = JSON.stringify(currentConfig, null, 2); // Pretty print JSON

        Modal.confirm({
            title: 'Load Dashboard Configuration',
            width: 600,
            icon: <FolderOpenOutlined />,
            content: (
                <>
                    <p>Paste your saved dashboard JSON configuration below:</p>
                    <Input.TextArea
                        rows={10}
                        placeholder='Paste JSON here...'
                        defaultValue={configJson}
                        onChange={(e) => configJson = e.target.value}
                    />
                </>
            ),
            onOk: () => {
                try {
                    const parsedConfig = JSON.parse(configJson);
                    loadDashboardConfig(parsedConfig as DashboardConfig);
                } catch (error) {
                    console.error("Error parsing dashboard config:", error);
                    Modal.error({
                        title: 'Loading Error',
                        content: 'Failed to parse the JSON configuration. Please check the format.',
                    });
                }
            },
            onCancel: () => {
                console.log('Load cancelled');
            },
        });
    };

    const addNewWidgetToGrid = useCallback(
        (menuItemData: DraggableMenuItemData, targetCellId: string) => {
            const newWidgetId = `widget-${uuidv4()}`;
            let newWidgetConfig: AppWidgetConfig;
            switch (menuItemData.type) {
                case WidgetType.TEXT:
                    newWidgetConfig = {
                        i: newWidgetId, componentType: WidgetType.TEXT, content: `New Text`,
                    } as TextWidgetConfig;
                    break;
                case WidgetType.RICH_TEXT:
                    newWidgetConfig = { i: newWidgetId, componentType: WidgetType.RICH_TEXT, content: "<p>New Rich Text Content...</p>" } as RichTextWidgetConfig;
                    break;
                case WidgetType.FILE_UPLOAD:
                    newWidgetConfig = { i: newWidgetId, componentType: WidgetType.FILE_UPLOAD } as FileUploadWidgetConfig;
                    break;
                case WidgetType.FEEDBACK_TABLE:
                    newWidgetConfig = {
                        i: newWidgetId, componentType: WidgetType.FEEDBACK_TABLE, dataSourceKey: 'feedback_report', // Example default
                    } as FeedbackTableWidgetConfig;
                    break;
                case WidgetType.MEMBER_REPORT_TABLE:
                    newWidgetConfig = {
                        i: newWidgetId,
                        componentType: WidgetType.MEMBER_REPORT_TABLE,
                    } as MemberReportTableWidgetConfig;
                    break;
                case WidgetType.HOST_REPORT_TABLE:
                    newWidgetConfig = {
                        i: newWidgetId,
                        componentType: WidgetType.HOST_REPORT_TABLE,
                    } as HostReportTableWidgetConfig;
                    break;
                case WidgetType.ANALYTICS_WIDGET:
                    newWidgetConfig = {
                        i: newWidgetId,
                        componentType: WidgetType.ANALYTICS_WIDGET,
                        analyticsType: AnalyticsType.REGISTRATIONS, // Default type
                        displayFormat: AnalyticsDisplayFormat.CHART_ONLY, // Default format
                    } as AnalyticsWidgetConfig;
                    break;
                case WidgetType.EVENT_CANCELATIONS_WIDGET:
                    newWidgetConfig = {
                        i: newWidgetId,
                        componentType: WidgetType.EVENT_CANCELATIONS_WIDGET,
                        cancelationType: CancelationTypes.MANUAL
                    } as EventCancelationsWidgetConfig;
                    break;
                default: console.error("Unknown widget type:", menuItemData.type); return;
            }

            setWidgets(prev => ({ ...prev, [newWidgetId]: newWidgetConfig }));
            setGridCells(prevCells =>
                prevCells.map(cell =>
                    cell.id === targetCellId ? { ...cell, widgetId: newWidgetId } : cell
                )
            );
        },
        []
    );

    const addNewGridCell = useCallback(() => {
        if (isPreviewMode) return;
        const newCellId = `cell-${uuidv4()}`;
        const lgCols = rglLayouts.lg?.length || 12;
        const xPosition = (gridCells.length * 4) % lgCols;

        const newCellLayout: RGL_Layout_Item = {
            i: newCellId,
            x: xPosition,
            y: Infinity,
            w: 4, h: 3,
        };

        const newCellData: GridCellData = { id: newCellId, layout: newCellLayout };
        setGridCells((prev) => [...prev, newCellData]);
    }, [isPreviewMode, gridCells.length, rglLayouts.lg]);


    const handleDragStart = (event: DragStartEvent) => {
        if (isPreviewMode) return;
        setActiveDragItem(event.active);
        if (event.active.id === 'add-new-cell-drag-button') {
            setRglDroppingCellPlaceholder({ i: '__dropping-cell__', w: 4, h: 3 });
        }
    };

    const handleWidgetContentChange = useCallback((widgetId: string, newContent: string) => {
        if (isPreviewMode) return;
        setWidgets(prevWidgets => {
            const targetWidget = prevWidgets[widgetId];
            if (targetWidget && targetWidget.componentType === WidgetType.TEXT) {
                return {
                    ...prevWidgets,
                    [widgetId]: { ...targetWidget, content: newContent } as TextWidgetConfig,
                };
            }
            else if (targetWidget.componentType === WidgetType.RICH_TEXT) {
                return { ...prevWidgets, [widgetId]: { ...targetWidget, content: newContent } as RichTextWidgetConfig };
            }
            return prevWidgets;
        });
    }, [isPreviewMode]);

    const handleFileUploadForWidget = useCallback(async (widgetId: string, req: any) => {
        const fileAdapter = new ResourceFirebaseUploaderAdapter;
        const { file, onSuccess, onError } = req;
        const fileName = file.name
        const filePath = `widgets/${widgetId}`;
        setIsFileUploading(true);

        try {
            const uploaded: any = await fileAdapter.upload(req, filePath, fileName);

            setWidgets(prevWidgets => {
                const targetWidget = prevWidgets[widgetId];
                if (targetWidget && targetWidget.componentType === WidgetType.FILE_UPLOAD) {
                    return {
                        ...prevWidgets,
                        [widgetId]: {
                            ...targetWidget,
                            fileName: file.name,
                            fileUrl: uploaded.downloadURL,
                            filePath: filePath,
                        } as FileUploadWidgetConfig,
                    };
                }
                return prevWidgets;
            });
            onSuccess("ok");
        } catch (error) {
            console.error("File upload failed for widget:", widgetId, error);
            onError(error);
        } finally {
            setIsFileUploading(false);
        }
    }, []);

    const handleFileRemoveForWidget = useCallback(async (widgetId: string) => {
        const fileAdapter = new ResourceFirebaseUploaderAdapter;
        const widgetToRemoveFile = widgets[widgetId] as FileUploadWidgetConfig;
        if (!widgetToRemoveFile || !widgetToRemoveFile.fileName) return;
        const filePath = `widgets/${widgetId}`;

        console.log(`Removing file for widget ${widgetId}:`, widgetToRemoveFile.filePath);
        await fileAdapter.delete(filePath, widgetToRemoveFile.fileName);

        setWidgets(prevWidgets => {
            const targetWidget = prevWidgets[widgetId];
            if (targetWidget && targetWidget.componentType === WidgetType.FILE_UPLOAD) {
                const { fileName, fileUrl, filePath, ...rest } = targetWidget as FileUploadWidgetConfig;
                return { ...prevWidgets, [widgetId]: { ...rest, i: widgetId, componentType: WidgetType.FILE_UPLOAD } };
            }
            return prevWidgets;
        });
        Modal.success({ title: 'File Removed', content: `${widgetToRemoveFile.fileName} has been unlinked from the widget.` });
    }, [widgets]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (isPreviewMode) {
            setActiveDragItem(null);
            if (rglDroppingCellPlaceholder) setRglDroppingCellPlaceholder(null);
            return;
        }

        if (active.id === 'add-new-cell-drag-button' && over && over.id === 'main-grid-layout-droppable') {
            // The actual adding of the cell is now handled by onDrop for RGL
            // Or, if not using RGL's onDrop, we can manually create it here based on drop coords.
            // For simplicity, let's rely on a button click or RGL's onDrop if we were to implement it.
            // The `addNewGridCell` function via button click is simpler for now.
            // If you need drag-to-add for cells: this would trigger `addNewGridCell` using `over.rect` to approximate position.
            // For now, the `rglDroppingCellPlaceholder` is just for visual feedback if we enhance this.
        }

        else if (active.data.current?.isMenuItem && over && over.data.current?.isGridCell) {
            const menuItemData = active.data.current as DraggableMenuItemData;
            const targetCellId = over.data.current.cellId as string;
            addNewWidgetToGrid(menuItemData, targetCellId);
        }


        if (rglDroppingCellPlaceholder) {
            setRglDroppingCellPlaceholder(null);
        }
    };

    // Called when react-grid-layout changes (cells are moved or resized)
    const onRglLayoutChange = (currentLayout: RGL_Layout_Item[], allLayouts: RGL_Layouts_Type) => {
        if (isPreviewMode) return;
        setRglLayouts(allLayouts as AppLayouts);
        setGridCells(prevCells =>
            prevCells.map(cell => {
                const rglItem = currentLayout.find(l => l.i === cell.id);
                return rglItem ? { ...cell, layout: rglItem } : cell;
            })
        );
    };

    // Handler for RGL's onDrop (when dragging the "Add New Cell" button onto the RGL canvas)
    // This is an alternative to the button click for adding cells.
    const onRglDrop = (layout: RGL_Layout_Item[], item: RGL_Layout_Item, event: DragEvent) => {
        if (isPreviewMode) return false;
        if (item.i === '__dropping-cell__') {
            const newCellId = `cell-${uuidv4()}`;
            const newCellData: GridCellData = { id: newCellId, layout: { ...item, i: newCellId } };
            setGridCells(prev => [...prev, newCellData]);
            setRglDroppingCellPlaceholder(null);
            return false;
        }
        return false;
    };

    const removeGridCell = (cellIdToRemove: string) => {
        if (isPreviewMode) return;
        const cellToRemove = gridCells.find(cell => cell.id === cellIdToRemove);
        if (cellToRemove?.widgetId) {
            setWidgets(prev => {
                const newWidgets = { ...prev };
                delete newWidgets[cellToRemove.widgetId!];
                return newWidgets;
            });
        }
        setGridCells(prev => prev.filter(cell => cell.id !== cellIdToRemove));
    };

    const menuWidgetItems = [
        {
            key: WidgetType.TEXT,
            labelContent: "Basic Text",
            icon: <ReadOutlined />,
            defaultW: 3, defaultH: 2
        },
        {
            key: WidgetType.RICH_TEXT,
            labelContent: "Rich Text Editor",
            icon: <FontSizeOutlined />,
            defaultW: 6, defaultH: 4
        },
        {
            key: WidgetType.FILE_UPLOAD,
            labelContent: "File Upload",
            icon: <FileAddOutlined />,
            defaultW: 3, defaultH: 3
        },
        {
            key: WidgetType.FEEDBACK_TABLE,
            labelContent: "Feedback Table"
            , icon: <TableOutlined />,
            defaultW: 6, defaultH: 4
        },
        {
            key: WidgetType.MEMBER_REPORT_TABLE,
            labelContent: "Member Report Table",
            icon: <UserOutlined />,
            defaultW: 8, defaultH: 6
        },
        {
            key: WidgetType.HOST_REPORT_TABLE,
            labelContent: "Host Report Table",
            icon: <CalendarOutlined />,
            defaultW: 8, defaultH: 6
        },
        {
            key: WidgetType.ANALYTICS_WIDGET,
            labelContent: "Analytics Block",
            icon: <BarChartOutlined />,
            defaultW: 6, defaultH: 5,
        },
        {
            key: WidgetType.EVENT_CANCELATIONS_WIDGET,
            labelContent: "Event Cancelations",
            icon: <StopOutlined />,
            defaultW: 6, defaultH: 5,
        }
    ];

    // Draggable button for adding new cells
    // We use useDraggable for this button to interact with RGL's onDrop
    const { attributes: cellDragAttributes, listeners: cellDragListeners, setNodeRef: setNewCellButtonRef } = useDraggable({
        id: 'add-new-cell-drag-button',
    });

    async function onFinish(values: any) {
        const currentConfig = generateDashboardConfig();

        if (currentConfig.gridCells?.length === 0) {
            console.error('builder empty');
            return;
        }

        saveMutation(values, currentConfig);
    }

    const saveMutation = (values: ICustomReportTemplate, configJSON: Object) => {

        const timezone = encodeURIComponent(moment.tz.guess());

        let constructedUrl = null;

        if (idFromRoute) {
            if (params?.type === 'temp') {
                constructedUrl = `${apiUrl}/custom_reports/template/${idFromRoute}/${timezone}`;
            }
            else {
                constructedUrl = `${apiUrl}/custom_reports/occurrence/${idFromRoute}`;
            }
        } else {
            constructedUrl = `${apiUrl}/custom_reports/template/${timezone}`;
        }

        if (constructedUrl) {
            mutate({
                url: constructedUrl,
                method: idFromRoute ? "patch" : "post",
                values: {
                    communityIds: values.communityIds,
                    name: values.name,
                    occurrence: values.occurrence,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    configJSON
                }
            }, {
                onSuccess: (response: CreateResponse<any>) => {
                    notification.open({
                        type: 'success',
                        message: idFromRoute ? 'Template Updated' : 'Template Created',
                    });

                    list('custom_reports/templates');
                }
            });
        }
        else {
            notification.open({
                type: 'error',
                message: `Error, broken link, ${constructedUrl}`
            })
        }
    }

    const handleSaveWidgetSettings = (values: any) => {
        if (!editingWidgetConfig) return;

        const updatedConfig: AppWidgetConfig = {
            ...editingWidgetConfig,
            ...values,
        };

        setWidgets(prevWidgets => ({
            ...prevWidgets,
            [updatedConfig.i]: updatedConfig,
        }));
        setIsSettingsModalVisible(false);
        setEditingWidgetConfig(null);
        settingsForm.resetFields();
    };

    const handleOpenWidgetSettings = useCallback((widgetId: string) => {
        const widgetToEdit = widgets[widgetId];
        if (widgetToEdit) {
            setEditingWidgetConfig(widgetToEdit);

            settingsForm.setFieldsValue({
                ...widgetToEdit,
                aggregationType: (widgetToEdit as FeedbackTableWidgetConfig).aggregationType || FeedbackTableAggregationType.MEMBER_COMMUNITY,
            });
            setIsSettingsModalVisible(true);
        } else {
            console.error("Widget not found for settings:", widgetId);
        }
    }, [widgets, settingsForm]);

    const handleExportPreviewSnapshotPDF = async () => {
        if (!dashboardPreviewContentRef.current || !isPreviewMode) {
            Modal.info({ title: "Export Note", content: "Please switch to Preview Mode to export the current view." });
            if (!dashboardPreviewContentRef.current) console.error("Dashboard preview content ref not found.");
            return;
        }
        setIsGeneratingSnapshotPdf(true);

        const A4_PAPER_WIDTH_MM = 210;
        const A4_PAPER_HEIGHT_MM = 297;
        const MARGIN_MM = 15;
        const CONTENT_WIDTH_MM = A4_PAPER_WIDTH_MM - 2 * MARGIN_MM;

        const doc = new jsPDF('p', 'mm', 'a4');
        let currentPdfY_mm = MARGIN_MM;
        let currentPdfPageNum = 1;

        doc.setFontSize(16);
        doc.text("Report Preview Snapshot", A4_PAPER_WIDTH_MM / 2, currentPdfY_mm, { align: 'center' });
        doc.setLineWidth(0.3);
        currentPdfY_mm += 5;
        doc.line(MARGIN_MM, currentPdfY_mm, A4_PAPER_WIDTH_MM - MARGIN_MM, currentPdfY_mm);
        currentPdfY_mm += 10;

        try {
            // Ensure the dashboard is fully rendered and scroll position is at the top for consistent capture
            const targetElement = dashboardPreviewContentRef.current;
            const rect = targetElement.getBoundingClientRect();

            // No need to scroll targetElement to top if we correctly specify x,y,scrollX,scrollY
            // targetElement.scrollTop = 0;
            // targetElement.scrollLeft = 0;
            // await new Promise(resolve => setTimeout(resolve, 50));

            console.log("Starting html2canvas snapshot capture...");
            const canvas = await html2canvas(targetElement, {
                scale: 2, // Higher scale for better quality
                useCORS: true, // Needed for images from other origins (e.g., Firebase storage)
                scrollY: -window.scrollY, // Corrects scroll position
                windowWidth: document.documentElement.offsetWidth, // Capture current width
                windowHeight: document.documentElement.offsetHeight,
            });
            console.log("html2canvas snapshot capture complete.");

            const imgData = canvas.toDataURL('image/png', 1.0);
            const imgProps = doc.getImageProperties(imgData);
            const FULL_CANVAS_PDF_HEIGHT_MM = (imgProps.height * CONTENT_WIDTH_MM) / imgProps.width;

            let heightLeftOnCanvasImage_mm = FULL_CANVAS_PDF_HEIGHT_MM;
            let sourceCanvasYRenderOffset_px = 0;

            while (heightLeftOnCanvasImage_mm > 0.1) {
                doc.setPage(currentPdfPageNum); // Ensure we're on the correct page
                const availablePageHeight_mm = A4_PAPER_HEIGHT_MM - currentPdfY_mm - MARGIN_MM;
                const heightToDrawOnPdf_mm = Math.min(availablePageHeight_mm, heightLeftOnCanvasImage_mm);
                const sliceHeightOnSourceCanvas_px = (heightToDrawOnPdf_mm / FULL_CANVAS_PDF_HEIGHT_MM) * imgProps.height;

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgProps.width;
                tempCanvas.height = sliceHeightOnSourceCanvas_px;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                    tempCtx.drawImage(canvas, 0, sourceCanvasYRenderOffset_px, imgProps.width, sliceHeightOnSourceCanvas_px, 0, 0, imgProps.width, sliceHeightOnSourceCanvas_px);
                }
                const chunkImgData = tempCanvas.toDataURL('image/png', 1.0);
                doc.addImage(chunkImgData, 'PNG', MARGIN_MM, currentPdfY_mm, CONTENT_WIDTH_MM, heightToDrawOnPdf_mm);

                heightLeftOnCanvasImage_mm -= heightToDrawOnPdf_mm;
                currentPdfY_mm += heightToDrawOnPdf_mm;
                sourceCanvasYRenderOffset_px += sliceHeightOnSourceCanvas_px;

                if (heightLeftOnCanvasImage_mm > 0.1) {
                    doc.addPage();
                    currentPdfPageNum++;
                    currentPdfY_mm = MARGIN_MM;
                }
            }

            doc.save('dashboard-snapshot.pdf');

        } catch (e) {
            console.error("Error generating PDF snapshot:", e);
            Modal.error({ title: "PDF Snapshot Error", content: (e as Error).message || "Could not generate PDF." });
        } finally {
            setIsGeneratingSnapshotPdf(false);
        }
    };

    const renderWidgetSettingsForm = () => {
        if (!editingWidgetConfig) return null;

        switch (editingWidgetConfig.componentType) {
            case WidgetType.TEXT:
                return <Typography.Text>Text content is edited directly on the widget.</Typography.Text>;

            case WidgetType.FEEDBACK_TABLE:
                // Initial values are set by handleOpenWidgetSettings using settingsForm.setFieldsValue
                return (
                    <Form
                        form={settingsForm}
                        layout="vertical"
                        onFinish={handleSaveWidgetSettings}
                    >
                        <Form.Item
                            name="aggregationType"
                            label="Aggregate Feedback By"
                            rules={[{ required: true, message: 'Please select an aggregation type' }]}
                        >
                            <Select placeholder="Select aggregation type">
                                <Select.Option value={FeedbackTableAggregationType.MEMBER_COMMUNITY}>Member Community</Select.Option>
                                <Select.Option value={FeedbackTableAggregationType.EVENT_COMMUNITY}>Event Community</Select.Option>
                            </Select>
                        </Form.Item>
                        {/* Example: make dataSourceKey configurable */}
                        {/* <Form.Item
                            name="dataSourceKey"
                            label="Data Source Key"
                            rules={[{ required: true }]}
                        >
                            <Input />
                        </Form.Item> */}
                        <Form.Item style={{ textAlign: 'right' }}>
                            <Button onClick={() => {
                                setIsSettingsModalVisible(false);
                                setEditingWidgetConfig(null);
                                settingsForm.resetFields();
                            }} style={{ marginRight: 8 }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Save Settings
                            </Button>
                        </Form.Item>
                    </Form>
                );
            case WidgetType.ANALYTICS_WIDGET:
                const currentAnalyticsConfig = editingWidgetConfig as AnalyticsWidgetConfig;
                return (
                    <Form
                        form={settingsForm}
                        layout="vertical"
                        onFinish={handleSaveWidgetSettings}
                        initialValues={{ // Ensure initialValues are correctly set
                            analyticsType: currentAnalyticsConfig.analyticsType || AnalyticsType.REGISTRATIONS,
                            displayFormat: currentAnalyticsConfig.displayFormat || AnalyticsDisplayFormat.CHART_ONLY,
                        }}
                    >
                        <Form.Item
                            name="analyticsType"
                            label="Select Analytics Type"
                            rules={[{ required: true }]}
                        >
                            <Select placeholder="Choose an analytic">
                                {Object.values(AnalyticsType).map(type => (
                                    <Select.Option key={type} value={type}>
                                        {analyticsTypeDetails[type]?.icon} {analyticsTypeDetails[type]?.title || type}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="displayFormat"
                            label="Display Format"
                            rules={[{ required: true }]}
                        >
                            <Select placeholder="Choose display format">
                                <Select.Option value={AnalyticsDisplayFormat.CHART_ONLY}>Chart Only</Select.Option>
                                <Select.Option value={AnalyticsDisplayFormat.TABLE_ONLY}>Table Only</Select.Option>
                                <Select.Option value={AnalyticsDisplayFormat.BOTH}>Both (Chart & Table)</Select.Option>
                            </Select>
                        </Form.Item>
                        {/* Add other settings specific to analytics if any */}
                        <Form.Item style={{ textAlign: 'right', marginTop: '20px' }}>
                            <Button onClick={() => {
                                setIsSettingsModalVisible(false);
                                setEditingWidgetConfig(null);
                                settingsForm.resetFields();
                            }} style={{ marginRight: 8 }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Save Settings
                            </Button>
                        </Form.Item>
                    </Form>
                );
            case WidgetType.EVENT_CANCELATIONS_WIDGET:
                return (
                    <Form
                        form={settingsForm}
                        layout="vertical"
                        onFinish={handleSaveWidgetSettings}
                    >
                        <Form.Item
                            name="cancelationType"
                            label="Cancelation Type"
                            rules={[{ required: true, message: 'Please select a cancelation type' }]}
                        >
                            <Select placeholder="Select cancelation type">
                                <Select.Option value={CancelationTypes.MANUAL}>Manual Cancel</Select.Option>
                                <Select.Option value={CancelationTypes.HOST_NOT_STARTED}>Host not Shown</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item style={{ textAlign: 'right' }}>
                            <Button onClick={() => {
                                setIsSettingsModalVisible(false);
                                setEditingWidgetConfig(null);
                                settingsForm.resetFields();
                            }} style={{ marginRight: 8 }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Save Settings
                            </Button>
                        </Form.Item>
                    </Form>
                );
            default:
                return <Typography.Text>No configurable settings for this widget type.</Typography.Text>;
        }
    };

    const SiderContent = !isPreviewMode ? (
        <Sider width={250} style={{
            padding: '16px',
            background: token.colorBgContainer,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            borderStartStartRadius: 8,
            borderEndStartRadius: 8
        }}>
            <div>
                <Title level={5} style={{ marginBottom: '10px' }}>Dashboard Controls</Title>
                <Space direction="vertical" style={{ width: '100%', marginBottom: '15px' }}>
                    <Button icon={<FolderOpenOutlined />} onClick={handleLoadDashboard} style={{ width: '100%' }}>Load from JSON</Button>
                </Space>

                <Title level={5} style={{ marginBottom: '10px' }}>Grid Layout</Title>
                <Tooltip title="Drag to position new cell, or click to add.">
                    <Button
                        id="add-new-cell-drag-button" // ID for dnd-kit if dragging this button
                        ref={setNewCellButtonRef}
                        icon={<PlusOutlined />}
                        onClick={addNewGridCell}
                        style={{ width: '100%', marginBottom: '15px' }}
                    >
                        Add Grid Cell
                    </Button>
                </Tooltip>

                <Title level={5} style={{ marginBottom: '10px' }}>Widgets</Title>
                {menuWidgetItems.map(item => (
                    <DraggableMenuItem
                        key={item.key}
                        id={`menu-${item.key}`}
                        widgetType={item.key}
                        defaultWidth={item.defaultW!}
                        defaultHeight={item.defaultH!}
                        icon={item.icon}
                    >
                        {item.labelContent}
                    </DraggableMenuItem>
                ))}
            </div>
        </Sider>
    ) : null;

    return (
        <Card title={forcePreview ? "View Report" : idFromRoute ? "Edit Report" : "Create Report"} extra={
            <Space>
                {isPreviewMode && (
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExportPreviewSnapshotPDF}
                        loading={isGeneratingSnapshotPdf}
                    >
                        {isGeneratingSnapshotPdf ? "Generating PDF..." : "Download Preview Snapshot"}
                    </Button>
                )}
                <Button disabled={!form?.getFieldValue('communityIds') ? true : false} type="primary" icon={<PicCenterOutlined />} >
                    <Link onClick={() => {
                        localStorage.setItem('reportConfig', JSON.stringify(generateDashboardConfig()));
                        localStorage.setItem('reportFilters', JSON.stringify(reportGlobalFilters));
                    }} to={`../export/${idFromRoute}/${params?.type || 'occ'}`} target="_blank">
                        Go to Export Page
                    </Link>
                </Button>
            </Space>
        }>
            <Form
                form={form}
                onFinish={onFinish}
                layout="vertical"
                size="large"
                onValuesChange={handleMainFormChange}
            >
                {!forcePreview &&
                    <>
                        <Row gutter={{ xs: 0, lg: 24, xl: 36 }}>

                            <Col xl={12} xs={24}>
                                <Form.Item
                                    label={"Report Name"}
                                    name="name"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Report Name is required"
                                        },
                                    ]}
                                >
                                    <Input disabled={action === 'edit' && params?.type !== 'temp'} />
                                </Form.Item>
                            </Col>
                            <Col xl={12} xs={24}>
                                <Form.Item
                                    initialValue={'month'}
                                    label={"Report occurrence"}
                                    name="occurrence"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please select occurrence'
                                        }
                                    ]}
                                >
                                    <Select
                                        onChange={(value) => {
                                            setGroupByFilter(value);
                                        }}
                                        disabled={action === 'edit'}
                                        allowClear={true}
                                        options={[
                                            { label: 'Weekly', value: 'week' },
                                            { label: 'Monthly', value: 'month' },
                                            { label: 'Quarterly', value: 'quarter' },
                                        ]}
                                    >
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xl={12} xs={24}>
                                <Form.Item
                                    label={"Start Date"}
                                    name="startDate"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please select start date'
                                        }
                                    ]}
                                >
                                    <DatePicker
                                        disabled={action === 'edit' && params?.type !== 'temp'}
                                        style={{ width: '100%' }}
                                        picker={groupByFilter as "week" | "month" | "quarter"}
                                        format="YYYY/MM/DD"
                                        allowClear={false}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xl={12} xs={24}>
                                <Form.Item
                                    label={"End Date (Leave blank to auto-generate report for new period)"}
                                    name="endDate"
                                >
                                    <DatePicker
                                        disabled={action === 'edit' && params?.type !== 'temp'}
                                        style={{ width: '100%' }}
                                        picker={groupByFilter as "week" | "month" | "quarter"}
                                        format="YYYY/MM/DD"
                                        allowClear={true}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xl={12} xs={24}>
                                <Form.Item
                                    label={"Community"}
                                    name="communityIds"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please select a community'
                                        }
                                    ]}
                                >
                                    <Select
                                        disabled={action === 'edit' && params?.type !== 'temp'}
                                        allowClear={false}
                                        mode="multiple"
                                        {...communitySelectProps}
                                        placeholder="Please select community"
                                    >
                                    </Select>
                                </Form.Item>
                            </Col>

                        </Row>


                        <Divider />

                        <Col offset={22} style={{ minWidth: 100, marginBottom: 10 }}>
                            {permissionsData === 'TelevedaAdmin' && (
                                <Space>
                                    <Typography.Text>Mode:</Typography.Text>
                                    <Switch
                                        checkedChildren={<EyeOutlined />}
                                        unCheckedChildren={<EditOutlined />}
                                        checked={isAdminInPreviewMode}
                                        onChange={(value) => {
                                            form.validateFields(['communityIds']).then(() => {
                                                setIsAdminInPreviewMode(value);
                                            })
                                        }}
                                        title={isAdminInPreviewMode ? "Switch to Edit Mode" : "Switch to Preview Mode"}
                                    />
                                </Space>
                            )}
                        </Col>
                    </>
                }

                <DndContext
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    collisionDetection={closestCenter}
                >
                    <Layout style={{ minHeight: '100vh', borderRadius: 8 }}>
                        <Layout style={{
                            borderColor: token.colorBorder,
                            borderStyle: 'solid',
                            borderWidth: 1,
                            borderRadius: 8
                        }}>
                            {SiderContent}
                            <Content
                                ref={dashboardPreviewContentRef}
                                style={{
                                    padding: '20px',
                                    overflow: 'auto',
                                    borderRadius: 8,
                                    background: isPreviewMode ? token.colorBgLayout : token.colorBgContainer
                                }}>
                                <ResponsiveGridLayoutWithWidth
                                    className={`layout ${isPreviewMode ? 'preview-mode-grid' : ''}`}
                                    layouts={rglLayouts}
                                    onLayoutChange={onRglLayoutChange}
                                    onDrop={onRglDrop}
                                    droppingItem={isPreviewMode ? undefined : rglDroppingCellPlaceholder || undefined}
                                    isDroppable={!isPreviewMode}
                                    isDraggable={!isPreviewMode}
                                    isResizable={!isPreviewMode}
                                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                                    rowHeight={55}
                                    margin={[1, 1]}
                                    measureBeforeMount={false}
                                    draggableHandle={isPreviewMode ? undefined : ".grid-cell-drag-handle"} // No handle in preview
                                >
                                    {gridCells.map((cell, index) => {
                                        return (
                                            <div key={cell.id} style={{ background: 'transparent' }} data-grid={cell.layout} className="grid-cell-rgl-item">
                                                {!isPreviewMode && (
                                                    <div
                                                        className="grid-cell-drag-handle"
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: '37.5%',
                                                            width: '25%',
                                                            height: '20px',
                                                            cursor: 'move',
                                                            zIndex: 10,
                                                            background: token.colorBgLayout,
                                                            borderTop: 0,
                                                            borderWidth: 1,
                                                            borderStyle: 'solid',
                                                            borderColor: token.colorBorder,
                                                            borderEndEndRadius: 8,
                                                            borderEndStartRadius: 8,
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <DashOutlined />
                                                    </div>
                                                )}
                                                <GridCellComponent
                                                    cellId={cell.id}
                                                    widget={cell.widgetId ? widgets[cell.widgetId] : null}
                                                    isPreviewMode={isPreviewMode}
                                                    reportFilters={reportGlobalFilters}
                                                    isFileUploading={isFileUploading}
                                                    onWidgetContentChange={handleWidgetContentChange}
                                                    onOpenWidgetSettings={handleOpenWidgetSettings}
                                                    onFileUploadRequest={handleFileUploadForWidget}
                                                    onFileRemoveRequest={handleFileRemoveForWidget}
                                                    onRichTextIsUploading={setIsRichTextEditorUploading}
                                                />
                                                {!isPreviewMode && (
                                                    <button
                                                        onClick={() => removeGridCell(cell.id)}
                                                        title="Remove Cell"
                                                        className="remove-cell-button"
                                                        style={{
                                                            position: 'absolute',
                                                            top: '2px',
                                                            right: '2px',
                                                            zIndex: 20,
                                                            cursor: 'pointer',
                                                            background: 'rgba(150,0,0,0.6)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 3,
                                                            padding: '1px 4px',
                                                            fontSize: '10px',
                                                        }}
                                                    >
                                                        <CloseOutlined />
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </ResponsiveGridLayoutWithWidth>
                                {gridCells.length === 0 && !isPreviewMode && !rglDroppingCellPlaceholder && (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <Typography.Text type="secondary">Click "Add Grid Cell" to start building your layout.</Typography.Text>
                                    </div>
                                )}
                                {gridCells.length === 0 && isPreviewMode && (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <Typography.Text type="secondary">This report is currently empty.</Typography.Text>
                                    </div>
                                )}
                            </Content>
                        </Layout>
                    </Layout>
                    {!isPreviewMode && (
                        <DragOverlay dropAnimation={null}>
                            {activeDragItem && (activeDragItem.data.current as DraggableMenuItemData)?.isMenuItem ? (
                                <Card size="small" style={{ opacity: 0.8 }}>
                                    Adding {(activeDragItem.data.current as DraggableMenuItemData).type.toLowerCase().replace('_widget', '')}...
                                </Card>
                            ) : activeDragItem && activeDragItem.id === 'add-new-cell-drag-button' ? (
                                <Card size="small" style={{ opacity: 0.8, width: `${4 * 60}px`, height: `${3 * 30}px` }}> New Grid Cell </Card>
                            ) : null}
                        </DragOverlay>
                    )}
                </DndContext>
                {!forcePreview &&
                    <Col span={24} style={{ float: 'right', marginTop: 18 }}>
                        <Space>
                            <Form.Item>
                                <Button
                                    htmlType="submit"
                                    type="primary"
                                    icon={<SaveOutlined />}
                                >
                                    Save
                                </Button>
                            </Form.Item>
                        </Space>
                    </Col>}
            </Form>

            <Modal
                title={`Widget Settings: ${editingWidgetConfig?.componentType.replace('_WIDGET', '').replace('_', ' ') || ''}`}
                open={isSettingsModalVisible}
                onCancel={() => {
                    setIsSettingsModalVisible(false);
                    setEditingWidgetConfig(null);
                    settingsForm.resetFields();
                }}
                footer={null}
                destroyOnClose
                maskClosable={false}
            >
                {renderWidgetSettingsForm()}
            </Modal>
        </Card>
    );
};