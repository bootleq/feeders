"use client"

import * as R from 'ramda';
import { useState, forwardRef, useCallback } from 'react';
import type { ZonedDateTime } from '@internationalized/date';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
  HeadingContext,
  useContextProps,
} from 'react-aria-components';
import type { DatePickerProps, HeadingProps } from 'react-aria-components';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { errorsAtom } from '@/components/form/store';
import { CalendarIcon } from '@heroicons/react/24/solid';
import { XCircleIcon } from '@heroicons/react/24/outline';

import { wordWord } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { labelCls, inputCls, tooltipTrigger, useFieldError, LabelProps } from './Inputs';
import styles from '@/components/form.module.scss'

interface MyDatePickerProps extends DatePickerProps<ZonedDateTime> {
  label?: string,
  name: string,
  tooltip?: React.ReactNode,
  dateInputClass?: string,
}

const fieldName = R.partial(t, ['spotFields']);

const focusInput = (e: React.MouseEvent<HTMLLabelElement>) => {
  const picker = e.currentTarget.nextElementSibling?.querySelector('.react-aria-DateSegment') as HTMLElement;
  if (picker) {
    picker.focus();
  }
}

const HeadingWithWordsForForward = (props: HeadingProps, ref: React.ForwardedRef<HTMLHeadingElement>) => {
  [props, ref] = useContextProps(props, ref, HeadingContext);
  const { children, ...rest } = props;
  let content = children;
  if (typeof children === 'string') {
    content = wordWord(children);
  }
  return <h2 {...rest} ref={ref}>{content}</h2>;
};
const HeadingWithWords = forwardRef(HeadingWithWordsForForward);

export function DateTimeField(
  { label, name, tooltip, dateInputClass, ...props }: MyDatePickerProps
) {
  const [key, setKey] = useState(0);
  const errors = useFieldError(name);
  const invalid = errors?.length > 0;
  const labelProps: LabelProps = {
    className: labelCls,
    children: label || fieldName(name),
    onClick: focusInput,
    ...(invalid ? { 'aria-invalid': true } : {})
  };

  const reset = useCallback((e: React.MouseEvent<HTMLOrSVGElement>) => {
    setKey(R.inc);
  }, []);

  if (key > 0) {
    props['defaultValue'] = null;
  }

  const picker = (
    <DatePicker
      name={name}
      key={key}
      granularity="minute"
      hourCycle={24}
      hideTimeZone
      className={`form-input font-mono ${styles.datepicker} ${inputCls}`}
      {...props}
    >
      <Group>
        <DateInput className={`react-aria-DateInput ${dateInputClass || ''}`}>
          {(segment) => <DateSegment segment={segment} />}
        </DateInput>
        <Button><CalendarIcon className='fill-slate-700/75 hover:fill-black' height={20} /></Button>
        <XCircleIcon className='stroke-slate-700/75 cursor-pointer hover:stroke-red-700' height={20} onClick={reset} />
      </Group>
      <Popover className={`w-max px-2 py-1 rounded-lg drop-shadow-lg ring-1 ring-black/10 bg-white`}>
        <Dialog>
          <Calendar className={`font-mono text-slate-700 text-sm ${styles.calender}`}>
            <header>
              <Button slot="previous">◀</Button>
              <HeadingWithWords />
              <Button slot="next">▶</Button>
            </header>
            <CalendarGrid>
              {(date) => <CalendarCell date={date} />}
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  );

  if (tooltip) {
    return (
      <>
        <label {...labelProps} />
        <div className='flex items-center'>
          {picker}
          <Tooltip>
            {tooltipTrigger}
            <TooltipContent className="z-[1002] max-w-[80vw]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
      </>
    );
  }

  return (
    <>
      <label {...labelProps} />
      {picker}
    </>
  );
}
