import dayjs from "dayjs";
import { AnalyticsGroupType } from "../../pages/analytics";

export const formatTime = (minutes?: number, includeSeconds: boolean = false): string => {
    if (!minutes || isNaN(minutes)) return `0m`;

    if (minutes < 1 && includeSeconds) return `${Math.round(minutes * 60)}s`;
    else if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const getDateFormat = (value: any, groupBy: AnalyticsGroupType, isTooltip = false) => {
    switch (groupBy) {
        case AnalyticsGroupType.WEEK:
            return isTooltip
                ? `${dayjs(value).format('MMM Do')} - ${dayjs(value).add(6, 'days').format('Do, YYYY')}`
                : dayjs(value).format('MMM Do');
        case AnalyticsGroupType.MONTH:
            return isTooltip
                ? dayjs(value).format('MMMM YYYY')
                : dayjs(value).format('MMM YYYY');
        case AnalyticsGroupType.QUARTER:
            return isTooltip
                ? dayjs(value).format('YYYY [Q]Q')
                : dayjs(value).format('[Q]Q YYYY');
        default:
            return isTooltip
                ? dayjs(value).format('MMM-DD-YYYY')
                : dayjs(value).format('MM/DD');
    }
};