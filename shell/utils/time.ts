import day from 'dayjs';
import { escapeHtml } from '@shell/utils/string';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { type Store } from 'vuex';

const FACTORS = [60, 60, 24];
const LABELS = ['sec', 'min', 'hour', 'day'];

// Diff two dates and return an object with values for presentation
// If 't' is also passed, 'string' property is set on the return object with the diff formatted as a string
// e.g. formats a date difference to return '1 day', '20 hours' etc
export function diffFrom(value: any, from: any, t: any) {
  const now = day();

  from = from || now;
  const diff = value.diff(from, 'seconds');

  let absDiff = Math.abs(diff);

  let next = 1;
  let label: any = '?';

  let i = 0;

  while ( absDiff >= FACTORS[i] && i < FACTORS.length ) {
    absDiff /= FACTORS[i];
    next *= Math.floor(FACTORS[i] / 10);
    i++;
  }

  if ( absDiff < 5 ) {
    label = Math.floor(absDiff * 10) / 10;
  } else {
    label = Math.floor(absDiff);
  }
  const ret: any = {
    diff,
    absDiff,
    label,
    // i18n-uses unit.day, unit.hour, unit.min, unit.sec
    unitsKey: `unit.${ LABELS[i] }`,
    units:    LABELS[i],
    next,
  };

  if (!!t) {
    ret.string = `${ ret.label } ${ t(ret.unitsKey, { count: ret.label }) }`;
  }

  return ret;
}

export function safeSetTimeout(timeout: any, callback: any, that: any) {
  if (timeout <= 2147483647) {
    // Max value setTimeout can take is max 32 bit int (about 24.9 days)
    return setTimeout(() => {
      callback.apply(that);
    }, timeout);
  }
}

export function getSecondsDiff(startDate: any, endDate: any) {
  return Math.round(
    Math.abs(Date.parse(endDate) - Date.parse(startDate)) / 1000
  );
}

/**
 * return { diff: number; label: string }
 *
 * diff:  update frequency in seconds
 * label: content of the cell's column
 */
export function elapsedTime(seconds: any) {
  if (!seconds) {
    return {};
  }

  if (seconds < 120) {
    return {
      diff:  1,
      label: `${ seconds }s`
    };
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 10) {
    return {
      diff:  1,
      label: `${ minutes }m${ seconds - (minutes * 60) }s`
    };
  }

  const hours = Math.floor(seconds / 3600);

  if (hours < 3) {
    return {
      diff:  60,
      label: `${ minutes }m`,
    };
  }

  const days = Math.floor(seconds / (3600 * 24));

  if (days > 1) {
    return {
      diff:  60,
      label: `${ days }d${ hours - (days * 24) }h`,
    };
  }

  if (hours > 7) {
    return {
      diff:  60,
      label: `${ hours }h`,
    };
  }

  return {
    diff:  60,
    label: `${ hours }h${ minutes - (hours * 60) }m`,
  };
}

/**
   * Format date and time using user preferences
   * @param value Date string to format
   * @returns Formatted date string
   */
export const dateTimeFormat = (value: string | undefined, store: Store<any>): string => {
  if (!value) return '';

  const dateFormat = escapeHtml( store.getters['prefs/get'](DATE_FORMAT));
  const timeFormat = escapeHtml( store.getters['prefs/get'](TIME_FORMAT));

  const format = `${ dateFormat } ${ timeFormat }`;

  return day(value).format(format);
};
