import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useList } from '@refinedev/core';
import { IEmailTemplate } from '../../../interfaces';
import { LoadTemplate } from '../../../pages/outreact/LoadTemplate';

jest.mock('@refinedev/core', () => ({
  useList: jest.fn(),
}));

jest.mock('@pankod/refine-antd', () => ({
  ...jest.requireActual('@pankod/refine-antd'),
  Popconfirm: jest.fn(({ onConfirm, children }) => (
    <div onClick={onConfirm}>{children}</div>
  )),
}));

jest.mock('react-email-editor', () => ({
  EditorRef: jest.fn(),
}));

describe('LoadTemplate', () => {
  const mockEditorRef: any = {
    current: {
      editor: {
        loadDesign: jest.fn(),
        saveDesign: jest.fn(),
        exportHtml: jest.fn(),
      },
    },
  };

  const mockCloseModal = jest.fn();
  
  const mockSavedTemplate = '{"json": "mocked-json"}';

  const setup = (data: IEmailTemplate[]) => {
    (useList as jest.Mock).mockReturnValue({
      data: { data },
      refetch: jest.fn(),
    });

    const renderResult = render(
      <LoadTemplate
        savedTemplate={mockSavedTemplate}
        closeModal={mockCloseModal}
        editorRef={mockEditorRef}
      />
    );

    return renderResult;
  };

  it('loads the editor design on template apply', async () => {
    const mockTemplates: IEmailTemplate[] = [
      {
        id: '1',
        name: 'Template 1',
        communityId: 'community1',
        communitySpecific: true,
        sender: 'sender1@example.com',
        subject: 'Template 1 Subject',
        json: '{"mock": "json1"}',
        html: '<div>Template 1 HTML</div>',
        type: 'newsletter',
      },
    ];

    setup(mockTemplates);

    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(mockEditorRef.current?.editor.loadDesign).toHaveBeenCalledWith(
        JSON.parse('{"mock": "json1"}')
      );
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('calls refetch on savedTemplate change', () => {
    const mockTemplates: IEmailTemplate[] = [
      {
        id: '1',
        name: 'Template 1',
        communityId: 'community1',
        communitySpecific: true,
        sender: 'sender1@example.com',
        subject: 'Template 1 Subject',
        json: '{"mock": "json1"}',
        html: '<div>Template 1 HTML</div>',
        type: 'newsletter',
      },
    ];

    const { rerender } = setup(mockTemplates);

    expect(useList().refetch).toHaveBeenCalled();

    rerender(
      <LoadTemplate
        savedTemplate='{"json": "mocked-new-json"}'
        closeModal={mockCloseModal}
        editorRef={mockEditorRef}
      />
    );

    expect(useList().refetch).toHaveBeenCalledTimes(2);
  });

  it('does not render templates when there is no data', () => {
    setup([]);

    expect(screen.queryByText('Template 1')).not.toBeInTheDocument();
  });
});
