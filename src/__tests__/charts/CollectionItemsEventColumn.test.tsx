import { render, screen } from '@testing-library/react';
import { CollectionItemsEventColumn } from '../../components/analytics/charts/communityEventsChart/collectionItemsEventColumn';
import dayjs from 'dayjs';

jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  return {
    __esModule: true,
    default: originalDayjs,
    extend: jest.fn().mockReturnValue(originalDayjs),
    tz: originalDayjs.tz,
  };
});

jest.mock('@ant-design/plots', () => ({
  Area: () => <div>Area Chart</div>,
}));

describe('CollectionItemsEventColumn', () => {
  const mockEvents = [
    { event_date: '2023-03-01', event_count: 10, eventType: 'Type1' },
    { event_date: '2023-03-02', event_count: 15, eventType: 'Type2' },
  ];

  const defaultProps = {
    events: mockEvents,
    dateRange: [dayjs('2023-03-01'), dayjs('2023-03-07')] as [dayjs.Dayjs, dayjs.Dayjs],
    periodEvents: 25,
    toDateEvents: 40,
    isLoading: false,
    title: 'Test Event Title',
    eventDescription: 'Test event description',
    isGroup: true,
    hideTooltip: false,
    showLegend: true,
  };

  it('should render the component without crashing', () => {
    render(<CollectionItemsEventColumn {...defaultProps} />);
    expect(screen.getByText('Test Event Title')).toBeInTheDocument();
  });

  it('should display "No events for this period" when periodEvents or toDateEvents is 0', () => {
    render(<CollectionItemsEventColumn {...{ ...defaultProps, periodEvents: 0, toDateEvents: 0 }} />);
    expect(screen.getByText('No events recorded for this period')).toBeInTheDocument();
  });

  it('should render the correct event counts', () => {
    render(<CollectionItemsEventColumn {...defaultProps} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('should render the area chart with correct data', () => {
    render(<CollectionItemsEventColumn {...defaultProps} />);
    expect(screen.getByText('Area Chart')).toBeInTheDocument();
  });
});