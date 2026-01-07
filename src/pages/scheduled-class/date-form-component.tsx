import { DatePicker } from '@pankod/refine-antd';
import dayjs, { Dayjs } from 'dayjs';

interface DateTimeInputProps {
  formId: string;
  showTime?: boolean;
}

const DateTimeInput: React.FC<DateTimeInputProps> = ({ formId, showTime, ...rest }) => {
    
  const range = (start: number, end: number) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };

  const disabledDate = (current: Dayjs) => {
    return current && current < dayjs().startOf('day');
  };

  const disabledTime = (date: any) => ({
    disabledHours: () => {
      if (date?.isAfter(dayjs())) { return range(0, 0) }
      else { return range(0, 24).splice(0, new Date().getHours()) }
    },
    disabledMinutes: () => {
      if (date?.isAfter(dayjs())) { return range(0, 0) }
      else { return range(0, 60).slice(0, new Date().getMinutes()) }
    }
  })

  return (
    <DatePicker
      getPopupContainer={() => document.getElementById(formId) || document.body}
      format="YYYY-MM-DD HH:mm"
      showTime={showTime ? {
        format: "HH:mm"
      } : showTime}
      style={{ width: "100%" }}
      disabledDate={disabledDate}
      disabledTime={disabledTime}
      {...rest}
    />
  );
}

export default DateTimeInput;