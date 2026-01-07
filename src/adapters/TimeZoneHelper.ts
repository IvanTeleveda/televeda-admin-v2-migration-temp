import * as moment from 'moment-timezone';

export class TimezoneData {
    tzName!: string;
    tzPresentationName!: string;
    tzOffsetStrGMT!: string;
}

export class TimeZoneHelper {

    public static getTimezonesNames(): TimezoneData[] {
        const arr: TimezoneData[] = [];
        const names = moment.tz.names();
        for (const name of names) {
            if ((name.indexOf('/') < 0 && name !== 'UTC') || name.startsWith('Etc/')) {
                continue;
            }
            const data = new TimezoneData();
            data.tzName = name;
            data.tzPresentationName = moment.tz(name).format('Z');

            arr.push(data);
        }
        arr.sort((a, b) => {
            if (a.tzPresentationName === b.tzPresentationName) {
                if (a.tzName === 'UTC') {
                    return -1;
                }
                return a.tzName === b.tzName ? 0 : (a.tzName > b.tzName ? 1 : -1);
            }
            const afc = a.tzPresentationName.charAt(0);
            const bfc = b.tzPresentationName.charAt(0);
            if (afc === '-') {
                if (bfc === '+') {
                    return -1;
                }
                return a.tzPresentationName > b.tzPresentationName ? -1 : 1;
            }
            if (bfc === '-') {
                return 1;
            }
            return a.tzPresentationName > b.tzPresentationName ? 1 : -1;
        });
        arr.forEach(a => {
            a.tzOffsetStrGMT = `${a.tzPresentationName}`;
            a.tzPresentationName = `(GMT ${a.tzPresentationName}) ${a.tzName}`;
        });
        return arr;
    }
}