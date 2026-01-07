import React, { useEffect, useState, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Button, Layout, Typography, Space, Modal, theme, Descriptions } from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { AnalyticsWidgetConfig, AppWidgetConfig, DashboardConfig, EventCancelationsWidgetConfig, HostReportTableWidgetConfig, MemberReportTableWidgetConfig, ReportFilters, WidgetType } from './types'; // Adjust path
// Import your individual widget components
import RichTextWidget from './widgets/RichTextWidget';
import FileUploadWidget from './widgets/FileUploadWidget';
import { FeedbackTableWidgetConfig, FileUploadWidgetConfig, RichTextWidgetConfig, TextWidgetConfig } from './types';
import TextWidget from './widgets/TextWidget';
import { IResourceComponentsProps, useApiUrl } from '@refinedev/core';
import FeedbackTableWidget from './widgets/FeedbackTableWidget';
import Paragraph from 'antd/es/typography/Paragraph';
import AnalyticsWidget from './widgets/AnalyticsWidget';
import MemberReportTableWidget from './widgets/MemberReportTableWidget';
import EventCancelationsTableWidget from './widgets/EventCancelationsWidget';
import HostReportTableWidget from './widgets/HostReportTableWidget';

const { Content } = Layout;
const { Title } = Typography;


export const ReportExportPreview: React.FC<IResourceComponentsProps> = () => {
    const [reportConfig, setReportConfig] = useState<DashboardConfig | null>(null);
    const [reportFilters, setReportFilters] = useState<ReportFilters | null>(null);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printableContentRef = useRef<HTMLDivElement>(null);

    const apiUrl = useApiUrl();

    useEffect(() => {
        const reportConfigFromStorage = localStorage.getItem('reportConfig');
        const reportFiltersFromStorage = localStorage.getItem('reportFilters');

        if (reportConfigFromStorage) {
            setReportConfig(JSON.parse(reportConfigFromStorage));
        }
        if (reportFiltersFromStorage) {

            setReportFilters(JSON.parse(reportFiltersFromStorage));
        }
    }, [])

    const { useToken } = theme;
    const { token } = useToken();

    const hasFeedbackWidget = useMemo(() => {
        if (!reportConfig?.widgets) return false;

        return Object.values(reportConfig.widgets).some(
            (widget: AppWidgetConfig) => widget.componentType === WidgetType.FEEDBACK_TABLE
        );
    }, [reportConfig]);

    const feedbackExportUrl = useMemo(() => {
        if (!reportFilters) return '#'; // Return a safe non-functional link if no filters

        const params = new URLSearchParams();
        if (reportFilters.startDate) params.append('startDate', reportFilters.startDate);
        if (reportFilters.endDate) params.append('endDate', reportFilters.endDate);
        if (reportFilters.communityIds) {
            reportFilters.communityIds.forEach(id => params.append('communityIds', id));
        }

        return `${apiUrl}/custom_reports/download_report/feedback?${params.toString()}`;
    }, [reportFilters, apiUrl]);

    const handleGeneratePdf = async () => {
        if (!printableContentRef.current || !reportConfig) return;
        setIsGeneratingPdf(true);

        const A4_PAPER_WIDTH_MM = 210;
        const A4_PAPER_HEIGHT_MM = 297;
        const MARGIN_MM = 10;
        const CONTENT_WIDTH_MM = A4_PAPER_WIDTH_MM - 2 * MARGIN_MM;

        const tocCollector: Array<{ title: string, element: HTMLElement }> = [];

        // --- Phase 0: Collect TOC items from rendered DOM structure ---
        // This runs *before* html2canvas, so the DOM elements are available.
        if (printableContentRef.current) {
            // Main Report Title
            const mainTitleEl = printableContentRef.current.querySelector<HTMLElement>('#report_main_title_export');
            if (mainTitleEl) {
                tocCollector.push({ title: mainTitleEl.innerText || "Report Overview", element: mainTitleEl });
            }

            // Iterate through rendered widget sections
            printableContentRef.current.querySelectorAll<HTMLElement>('.print-widget-cell-export').forEach(widgetEl => {
                const titleEl = widgetEl.querySelector<HTMLElement>('.widget-title-export'); // Assumes widget title has this class
                const widgetTitle = titleEl ? titleEl.innerText : `Widget ${widgetEl.id}`;
                tocCollector.push({ title: widgetTitle, element: widgetEl });

                // If it's a feedback table, query its internal sections (rendered by FeedbackTableWidget)
                if (widgetEl.querySelector('.print-feedback-tab-section-export')) { // Check if it's a feedback widget
                    widgetEl.querySelectorAll<HTMLElement>('.print-feedback-tab-section-export').forEach(tabEl => {
                        const tabTitleEl = tabEl.querySelector<HTMLElement>('.feedback-tab-title-export');
                        const tabTitle = tabTitleEl ? tabTitleEl.innerText : 'Feedback Category';
                        tocCollector.push({ title: `    ↳ ${tabTitle}`, element: tabEl }); // Indent sub-items
                    });
                }
            });
        }
        console.log("Collected TOC items from DOM:", tocCollector.length, tocCollector.map(it => it.title));


        try {
            const doc = new jsPDF('p', 'mm', 'a4');

            // --- Capture the entire printableContentRef ---
            console.log("Starting html2canvas capture...");
            const canvas = await html2canvas(printableContentRef.current, {
                scale: 1, useCORS: true, logging: true, allowTaint: true,
                width: printableContentRef.current.offsetWidth, // Use offsetWidth for visible width
                height: printableContentRef.current.scrollHeight,
                windowWidth: printableContentRef.current.offsetWidth, // Important for layout
                windowHeight: printableContentRef.current.scrollHeight,
                // x: printableContentRef.current.getBoundingClientRect().left, // Use getBoundingClientRect for more accuracy
                // y: printableContentRef.current.getBoundingClientRect().top,
            });
            console.log("html2canvas capture complete. Canvas:", canvas.width, "x", canvas.height);

            const imgData = canvas.toDataURL('image/png', 1.0);
            const imgProps = doc.getImageProperties(imgData);
            const FULL_CANVAS_PDF_HEIGHT_MM = (imgProps.height * CONTENT_WIDTH_MM) / imgProps.width;

            // --- Calculate PDF Y positions and page numbers for TOC items ---
            const finalTocItems: Array<{ title: string, pdfPageNum: number, pdfYPosOnPage: number }> = [];
            const htmlPageTopOffset = printableContentRef.current.getBoundingClientRect().top + window.scrollY;

            tocCollector.forEach(item => {
                const elementRect = item.element.getBoundingClientRect();
                // elementOffsetTopInHtml is the distance from the top of `printableContentRef` to the top of the element
                const elementOffsetTopInHtml = (elementRect.top + window.scrollY) - htmlPageTopOffset;

                // elementTopInMmOnFullImage is where this element starts on the *single, tall PDF image*
                const elementTopInMmOnFullImage = (elementOffsetTopInHtml / printableContentRef.current!.scrollHeight) * FULL_CANVAS_PDF_HEIGHT_MM;

                let accumulatedHeightBeforeThisItem_mm = 0;
                let pageNum = 1;
                const pageContentHeightMm = A4_PAPER_HEIGHT_MM - 2 * MARGIN_MM;

                while (accumulatedHeightBeforeThisItem_mm + pageContentHeightMm < elementTopInMmOnFullImage) {
                    accumulatedHeightBeforeThisItem_mm += pageContentHeightMm;
                    pageNum++;
                }
                const yPosOnPage = (elementTopInMmOnFullImage - accumulatedHeightBeforeThisItem_mm) + MARGIN_MM;

                finalTocItems.push({ title: item.title, pdfPageNum: pageNum, pdfYPosOnPage: yPosOnPage });
            });
            console.log("TOC items with PDF positions:", finalTocItems);


            // --- Add the captured canvas to PDF, paginating it ---
            let currentPdfY_mm = MARGIN_MM;
            let currentPdfPageNum = 1;
            let heightLeftOnCanvasImage_mm = FULL_CANVAS_PDF_HEIGHT_MM;
            let sourceCanvasYRenderOffset_px = 0;

            while (heightLeftOnCanvasImage_mm > 0.1) {
                doc.setPage(currentPdfPageNum);
                const availablePageHeight_mm = A4_PAPER_HEIGHT_MM - currentPdfY_mm - MARGIN_MM;
                const heightToDrawOnPdf_mm = Math.min(availablePageHeight_mm, heightLeftOnCanvasImage_mm);
                const sliceHeightOnSourceCanvas_px = (heightToDrawOnPdf_mm / FULL_CANVAS_PDF_HEIGHT_MM) * imgProps.height;

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgProps.width; tempCanvas.height = sliceHeightOnSourceCanvas_px;
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

            // --- Add Table of Contents at the Beginning ---
            if (finalTocItems.length > 0) {
                const tocPageEstimate = Math.ceil((15 + finalTocItems.length * 8) / (A4_PAPER_HEIGHT_MM - 2 * MARGIN_MM));
                for (let i = 0; i < tocPageEstimate; i++) { doc.insertPage(1 + i); }

                doc.setPage(1);
                let tocY_mm = MARGIN_MM;
                let tocCurrentPdfPageForTocItems = 1;

                const addTocHeaderToPage = () => { // Renamed to avoid conflict
                    doc.setFontSize(14); doc.setTextColor(40);
                    doc.text("Table of Contents", MARGIN_MM, tocY_mm + 5);
                    tocY_mm += 8;
                    doc.setLineWidth(0.3); doc.line(MARGIN_MM, tocY_mm, A4_PAPER_WIDTH_MM - MARGIN_MM, tocY_mm);
                    tocY_mm += 7;
                };
                addTocHeaderToPage(); // Initial TOC header

                finalTocItems.forEach(item => {
                    if (tocY_mm + 8 > A4_PAPER_HEIGHT_MM - MARGIN_MM) { // Check for overflow for next item
                        tocCurrentPdfPageForTocItems++;
                        if (tocCurrentPdfPageForTocItems > tocPageEstimate) {
                            console.warn("TOC content exceeded estimated pages.");
                            // Potentially stop adding items or add more pages if critical
                            // For now, we assume tocPageEstimate is good.
                        }
                        doc.setPage(tocCurrentPdfPageForTocItems);
                        tocY_mm = MARGIN_MM;
                        addTocHeaderToPage(); // Add header to new TOC page
                    }

                    const isSubItem = item.title.trim().startsWith('↳');
                    const displayTitle = item.title.replace(/^↳\s*/, '').trim(); // Remove prefix for display and metrics
                    const xOffset = isSubItem ? MARGIN_MM + 10 : MARGIN_MM + 5; // Indent sub-items
                    const fontSize = isSubItem ? 9 : 10; // Smaller font for sub-items
                    const lineHeight = isSubItem ? 6 : 7; // Smaller line height for sub-items

                    doc.setFontSize(fontSize);
                    doc.setTextColor(0, 0, 230); // Link color

                    const sanitizedDisplayTitle = displayTitle.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '').trim();
                    doc.text(sanitizedDisplayTitle, xOffset, tocY_mm); // Draw the text

                    const textMetrics = doc.getTextDimensions(sanitizedDisplayTitle); // jsPDF uses current font settings
                    const textWidth = textMetrics.w;
                    const textRenderHeight = textMetrics.h; // Actual height of rendered text

                    const targetPageForLink = item.pdfPageNum + tocPageEstimate;

                    doc.link(
                        xOffset, // x of link area
                        tocY_mm - textRenderHeight * 0.8, // y of link area (align with text baseline)
                        textWidth, // width of link area
                        textRenderHeight, // height of link area
                        {
                            pageNumber: targetPageForLink,
                            magFactor: 'XYZ',
                            zoom: null,
                            top: item.pdfYPosOnPage // Y position on the target page
                        }
                    );
                    tocY_mm += lineHeight; // Move to next line
                });
            }
            doc.save(`${reportConfig?.reportName || 'custom-report'}.pdf`);
        } catch (e) { console.error("Error generating PDF:", e); Modal.error({ title: "PDF Error", content: (e as Error).message || "Could not generate PDF." }); }
        finally { setIsGeneratingPdf(false); }
    };

    const handleBrowserPrint = () => {
        window.print();
    };

    if (!reportConfig) {
        return <div style={{ backgroundColor: token.colorBgBase, height: '100vh' }}>No Data</div>
    }

    return (
        <Layout style={{ padding: '20px' }}>
            <Content>
                <Space style={{ marginBottom: '20px', position: 'fixed', top: 10, right: 20, zIndex: 1000, background: 'lightgray', padding: '10px', borderRadius: '5px' }}>
                    <Button onClick={handleBrowserPrint} icon={<PrinterOutlined />}>Print (Browser)</Button>
                    <Button type="primary" onClick={handleGeneratePdf} loading={isGeneratingPdf} icon={<DownloadOutlined />}>
                        {isGeneratingPdf ? "Generating..." : "Download PDF"}
                    </Button>
                    {hasFeedbackWidget && (
                        <Button
                            icon={<DownloadOutlined />}
                            href={feedbackExportUrl}
                            target="_blank"
                        >
                            Export Feedback (Excel)
                        </Button>
                    )}
                </Space>

                <div ref={printableContentRef} className="export-preview-content" style={{ margin: '0 auto' }}>
                    <Title level={2} style={{ textAlign: 'center', marginBottom: '20px', pageBreakAfter: 'avoid' }} id="report_title">
                        {reportConfig?.reportName || "Custom Report Preview"}
                    </Title>
                    <Paragraph style={{ textAlign: 'center', color: 'red', fontSize: 16 }}>Warning: PDF generation captures the entire visible page, make sure all the elements are visible. (Ctrl -/+ to adjust zoom)</Paragraph>

                    {reportConfig?.gridCells.map((cell, cellIndex) => {
                        const widgetConfig = reportConfig.widgets[cell.widgetId || ''];
                        if (!widgetConfig) return null;

                        const widgetSectionId = `widget_export_${widgetConfig.i}`;
                        const widgetDisplayTitle = `Widget ${cellIndex + 1}: ${widgetConfig.componentType.replace('_WIDGET', '').replace('_', ' ')}`;

                        return (
                            <div key={cell.id} className="print-widget-cell-export print-section" id={widgetSectionId} style={{ marginBottom: '15mm', border: '1px solid #ddd', padding: '5mm' }}>
                                <Title level={4} className="widget-title-export" style={{ pageBreakAfter: 'avoid' }}>{widgetDisplayTitle}</Title>
                                {widgetConfig.componentType === WidgetType.TEXT &&
                                    <TextWidget
                                        id={widgetConfig.i}
                                        content={(widgetConfig as TextWidgetConfig).content}
                                        isPreviewMode={true}
                                        onContentChange={() => { }}
                                    />}

                                {widgetConfig.componentType === WidgetType.RICH_TEXT &&
                                    <RichTextWidget
                                        id={widgetConfig.i}
                                        content={(widgetConfig as RichTextWidgetConfig).content}
                                        isPreviewMode={true}
                                        onContentChange={() => { }}
                                        containerHeight={300}
                                        setIsUploading={function (value: React.SetStateAction<boolean>): void {
                                            throw new Error('Function not implemented.');
                                        }}
                                    />}

                                {widgetConfig.componentType === WidgetType.FILE_UPLOAD &&
                                    <FileUploadWidget
                                        widgetConfig={widgetConfig as FileUploadWidgetConfig}
                                        isPreviewMode={true}
                                        onCustomUploadRequest={() => { }}
                                        onFileRemove={() => { }}
                                        isLoading={false}
                                    />}

                                {widgetConfig.componentType === WidgetType.FEEDBACK_TABLE &&
                                    (
                                        reportFilters ?
                                            <FeedbackTableWidget
                                                widgetConfig={widgetConfig as FeedbackTableWidgetConfig}
                                                reportFilters={reportFilters}
                                                isPreviewMode={true}
                                                isExporting={true}
                                            />
                                            :
                                            <div style={{ backgroundColor: token.colorBgBase, height: '100vh' }}>No Filter Data</div>
                                    )
                                }

                                {widgetConfig.componentType === WidgetType.MEMBER_REPORT_TABLE &&
                                    (
                                        reportFilters ?
                                            <MemberReportTableWidget
                                                widgetConfig={widgetConfig as MemberReportTableWidgetConfig}
                                                reportFilters={reportFilters}
                                                isPreviewMode={true}
                                                isExporting={true}
                                            />
                                            :
                                            <div style={{ backgroundColor: token.colorBgBase, height: '100vh' }}>No Filter Data</div>
                                    )
                                }

                                {widgetConfig.componentType === WidgetType.HOST_REPORT_TABLE &&
                                    (
                                        reportFilters ?
                                            <HostReportTableWidget
                                                widgetConfig={widgetConfig as HostReportTableWidgetConfig}
                                                reportFilters={reportFilters}
                                                isPreviewMode={true}
                                                isExporting={true}
                                            />
                                            :
                                            <div style={{ backgroundColor: token.colorBgBase, height: '100vh' }}>No Filter Data</div>
                                    )
                                }

                                {widgetConfig.componentType === WidgetType.ANALYTICS_WIDGET &&
                                    (
                                        reportFilters ?
                                            <AnalyticsWidget
                                                widgetConfig={widgetConfig as AnalyticsWidgetConfig}
                                                reportFilters={reportFilters}
                                                isPreviewMode={true}
                                                isExporting={true}
                                            />
                                            :
                                            <div style={{ backgroundColor: token.colorBgBase, height: '100vh' }}>No Filter Data</div>
                                    )
                                }

                                {widgetConfig.componentType === WidgetType.EVENT_CANCELATIONS_WIDGET &&
                                    (
                                        reportFilters ?
                                            <EventCancelationsTableWidget
                                                widgetConfig={widgetConfig as EventCancelationsWidgetConfig}
                                                reportFilters={reportFilters}
                                                isPreviewMode={true}
                                                isExporting={true}
                                            />
                                            :
                                            <div style={{ backgroundColor: token.colorBgBase, height: '100vh' }}>No Filter Data</div>
                                    )
                                }
                            </div>
                        );
                    })}
                </div>
            </Content>
        </Layout>
    );
};
