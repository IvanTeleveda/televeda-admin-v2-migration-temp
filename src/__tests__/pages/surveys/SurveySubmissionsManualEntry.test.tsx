import { render, screen } from "@testing-library/react";
import { useCreate, useDelete, useOne, useNavigation, useParsed } from "@refinedev/core";
import { useSelect } from "@refinedev/antd";
import { SurveySubmissionsManualEntry } from "../../../pages/surveys/manual-entry";

jest.mock('@refinedev/core', () => ({
    useCreate: jest.fn(),
    useDelete: jest.fn(),
    useOne: jest.fn(),
    useNavigation: jest.fn(),
    useParsed: jest.fn(),
}));

jest.mock('@refinedev/antd', () => ({
    useSelect: jest.fn(),
}));

jest.mock('survey-react-ui', () => ({
    Survey: jest.fn().mockImplementation(() => <div>Survey Component Mock</div>),
}));

jest.mock("../../../components/page-containers/show", () => ({
    TelevedaShow: ({ children }: any) => <div>{children}</div>
}));

describe('SurveySubmissionsManualEntry', () => {
    const mockCreate = jest.fn();
    const mockDelete = jest.fn();
    const mockNavigation = { goBack: jest.fn() };
    const mockParsed = { id: '1' };
    const mockSelectProps = {
        selectProps: {
            options: [{ value: '1', label: 'Community 1' }],
        },
    };

    beforeEach(() => {
        (useCreate as jest.Mock).mockReturnValue({ mutate: mockCreate });
        (useDelete as jest.Mock).mockReturnValue({ mutate: mockDelete });
        (useOne as jest.Mock).mockResolvedValue({
            data: {
                survey: { json: { title: 'Test Survey' } },
                communityAssociations: [{ communityId: '1' }],
            },
        });
        (useNavigation as jest.Mock).mockReturnValue(mockNavigation);
        (useParsed as jest.Mock).mockReturnValue(mockParsed);
        (useSelect as jest.Mock).mockReturnValue(mockSelectProps);
    });

    it('should render the survey form', async () => {
        render(<SurveySubmissionsManualEntry />);

        expect(screen.getByText('Complete survey on behalf of')).toBeInTheDocument();
        expect(screen.getByLabelText('Existing member')).toBeInTheDocument();
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Choose Community')).toBeInTheDocument();
        expect(screen.getByText('Survey Component Mock')).toBeInTheDocument();
    });
});
