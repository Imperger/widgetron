<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue';

import { onClickOutside, type OnListOutsideDeactivator } from '@/lib/on-click-outside';
import ArrowDownIcon from '@/ui/icons/arrow-down.vue';
import ArrowLefttIcon from '@/ui/icons/arrow-left.vue';
import ArrowRightIcon from '@/ui/icons/arrow-right.vue';
import ArrowUpIcon from '@/ui/icons/arrow-up.vue';
import CalendarIcon from '@/ui/icons/calendar-icon.vue';
import ClockIcon from '@/ui/icons/clock-icon.vue';
import CloseIcon from '@/ui/icons/close-icon.vue';

const model = defineModel<Date | null>('value', { required: true });

const dropdownPickerShown = ref(false);
const prepickDatetime = ref<Date>(new Date());
const selectedDatetime = ref<Date>(new Date());
const mode = ref<'date' | 'time' | 'time_hours' | 'time_minutes' | 'month' | 'year'>('date');
const dateTimePickerEl = useTemplateRef('dateTimePicker');
const yearSelectorEl = useTemplateRef('yearSelector');

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const hours = Array.from({ length: 24 }, (_, n) => n);
const minutes = Array.from({ length: 12 }, (_, n) => n * 5);

let onClickOutsideDeactivator: OnListOutsideDeactivator | null = null;

const zeroPad = (x: number) => x.toString().padStart(2, '0');

const formatDatetime = (d: Date) => {
  const date = zeroPad(d.getDate());
  const month = zeroPad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = zeroPad(d.getHours());
  const minutes = zeroPad(d.getMinutes());

  return `${date}/${month}/${year}, ${hours}:${minutes}`;
};

const datetimeFormatted = computed(() => (model.value ? formatDatetime(model.value) : ''));

const prepickMonthStart = computed(
  () => new Date(prepickDatetime.value.getFullYear(), prepickDatetime.value.getMonth(), 1),
);
const prepickMonthEnd = computed(
  () => new Date(prepickDatetime.value.getFullYear(), prepickDatetime.value.getMonth() + 1, 0),
);

const startDatetime = computed(() => {
  const startDayOfWeek = (prepickMonthStart.value.getDay() + 6) % 7;

  return new Date(
    prepickMonthStart.value.getFullYear(),
    prepickMonthStart.value.getMonth(),
    prepickMonthStart.value.getDate() - startDayOfWeek,
  );
});

function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff =
    Math.abs(date2.getTime() - date1.getTime()) +
    (date1.getTimezoneOffset() - date2.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / msPerDay);
}

const prepickDates = computed(() =>
  Array.from(
    { length: Math.ceil((daysBetween(startDatetime.value, prepickMonthEnd.value) + 1) / 7) * 7 },
    (x, n) => {
      const date = new Date(startDatetime.value);
      date.setDate(startDatetime.value.getDate() + n);

      return date;
    },
  ),
);

const prepickYearRange = computed(() => {
  const yearRange = 10;
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 2 * yearRange }, (_, n) => currentYear - yearRange + n);
});

const notPrepickedMonth = (date: Date) => date.getMonth() !== prepickDatetime.value.getMonth();

const isPrepickedDate = (date: Date) =>
  date.getFullYear() === selectedDatetime.value.getFullYear() &&
  date.getMonth() === selectedDatetime.value.getMonth() &&
  date.getDate() === selectedDatetime.value.getDate();

const isPrepickedMonth = (month: number) => prepickDatetime.value.getMonth() === month;

const isPrepickedYear = (year: number) => prepickDatetime.value.getFullYear() === year;

const toggleDropdownPicker = () => {
  dropdownPickerShown.value = !dropdownPickerShown.value;

  if (dropdownPickerShown.value) {
    prepickDatetime.value = model.value ?? new Date();

    nextTick(
      () => (onClickOutsideDeactivator = onClickOutside(dateTimePickerEl.value!, closeDropdown)),
    );
  }
};

const closeDropdown = () => {
  dropdownPickerShown.value = false;
  mode.value = 'date';
  selectedDatetime.value = model.value ?? new Date();

  onClickOutsideDeactivator?.();
};

const onClear = () => {
  model.value = null;
  selectedDatetime.value = new Date();
};

const onPrevMonth = () => {
  const month = prepickDatetime.value.getMonth();

  if (month === 0) {
    prepickDatetime.value.setMonth(11);
    prepickDatetime.value.setFullYear(prepickDatetime.value.getFullYear() - 1);
  } else {
    prepickDatetime.value.setMonth(month - 1);
  }

  prepickDatetime.value = new Date(prepickDatetime.value);
};

const onNextMonth = () => {
  const month = prepickDatetime.value.getMonth();

  if (month === 11) {
    prepickDatetime.value.setMonth(0);
    prepickDatetime.value.setFullYear(prepickDatetime.value.getFullYear() + 1);
  } else {
    prepickDatetime.value.setMonth(month + 1);
  }

  prepickDatetime.value = new Date(prepickDatetime.value);
};

const onSelectDate = (date: Date) => {
  prepickDatetime.value = new Date(date);

  selectedDatetime.value = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    selectedDatetime.value.getHours(),
    selectedDatetime.value.getMinutes(),
  );
};

const onSwitchMode = () => {
  if (mode.value === 'date') {
    mode.value = 'time';
  } else if (mode.value === 'time_hours' || mode.value === 'time_minutes') {
    mode.value = 'time';
  } else {
    mode.value = 'date';
  }
};

const onPrepickMonth = (month: number) => {
  prepickDatetime.value = new Date(
    prepickDatetime.value.getFullYear(),
    month,
    prepickDatetime.value.getDate(),
  );

  mode.value = 'date';
};

const onPrepickYear = (year: number) => {
  prepickDatetime.value = new Date(
    year,
    prepickDatetime.value.getMonth(),
    prepickDatetime.value.getDate(),
  );

  mode.value = 'date';
};

const onSelectHour = (hours: number) => {
  selectedDatetime.value = new Date(
    selectedDatetime.value.getFullYear(),
    selectedDatetime.value.getMonth(),
    selectedDatetime.value.getDate(),
    hours,
    selectedDatetime.value.getMinutes(),
  );

  mode.value = 'time';
};

const onSelectMinute = (minutes: number) => {
  selectedDatetime.value = new Date(
    selectedDatetime.value.getFullYear(),
    selectedDatetime.value.getMonth(),
    selectedDatetime.value.getDate(),
    selectedDatetime.value.getHours(),
    minutes,
  );

  mode.value = 'time';
};

const onIncreaseHours = (offset: number) => {
  selectedDatetime.value = new Date(
    selectedDatetime.value.getFullYear(),
    selectedDatetime.value.getMonth(),
    selectedDatetime.value.getDate(),
    (((selectedDatetime.value.getHours() + offset) % 24) + 24) % 24,
    selectedDatetime.value.getMinutes(),
  );
};

const onIncreaseMinutes = (offset: number) => {
  selectedDatetime.value = new Date(
    selectedDatetime.value.getFullYear(),
    selectedDatetime.value.getMonth(),
    selectedDatetime.value.getDate(),
    selectedDatetime.value.getHours(),
    (((selectedDatetime.value.getMinutes() + offset) % 60) + 60) % 60,
  );
};

const onOpenMonthSelector = () => (mode.value = 'month');

const onOpenYearsSelector = () => {
  mode.value = 'year';

  nextTick(() =>
    yearSelectorEl.value?.querySelector('.year-prepicked')?.scrollIntoView({ block: 'center' }),
  );
};

const onOpenHourSelector = () => (mode.value = 'time_hours');

const onOpenMinuteSelector = () => (mode.value = 'time_minutes');

const onSelect = () => {
  model.value = selectedDatetime.value;

  closeDropdown();
};
</script>

<template>
  <div ref="dateTimePicker" tabindex="0" class="datetime-picker">
    <CalendarIcon @click="toggleDropdownPicker" class="calendar-icon" />
    <input
      @click="toggleDropdownPicker"
      :value="datetimeFormatted"
      tabindex="-1"
      readonly="true"
      inputmode="none"
      autocomplete="off"
      class="input"
    />
    <CloseIcon @click="onClear" class="clear-icon" />
    <div v-if="dropdownPickerShown" class="dropdown-picker">
      <div class="dropdown-content">
        <div class="month-year">
          <button @click="onPrevMonth" class="icon-button"><ArrowLefttIcon /></button>
          <button @click="onOpenMonthSelector">{{ monthNames[prepickDatetime.getMonth()] }}</button>
          <button @click="onOpenYearsSelector">{{ prepickDatetime.getFullYear() }}</button>
          <button @click="onNextMonth" class="icon-button"><ArrowRightIcon /></button>
        </div>
        <div class="dates">
          <div :key="d" v-for="d in daysOfWeek" class="day-name">{{ d }}</div>
          <div
            :key="d.getTime()"
            v-for="d in prepickDates"
            @click="onSelectDate(d)"
            :class="{
              'not-prepicked-month': notPrepickedMonth(d),
              'prepicked-date': isPrepickedDate(d),
            }"
            class="date"
          >
            {{ d.getDate() }}
          </div>
        </div>
        <div v-if="mode === 'month'" class="month-selector">
          <div
            :key="month"
            v-for="(month, n) in monthNames"
            @click="onPrepickMonth(n)"
            :class="{ 'month-prepicked': isPrepickedMonth(n) }"
            class="month-selector-item"
          >
            {{ month }}
          </div>
        </div>
        <div ref="yearSelector" v-else-if="mode === 'year'" class="year-selector">
          <div
            :key="year"
            v-for="year in prepickYearRange"
            @click="onPrepickYear(year)"
            :class="{ 'year-prepicked': isPrepickedYear(year) }"
            class="year-selector-item"
          >
            {{ year }}
          </div>
        </div>
        <div v-else-if="mode === 'time_hours'" class="hour-selector">
          <div
            :key="hour"
            v-for="hour in hours"
            @click="onSelectHour(hour)"
            class="hour-selector-item"
          >
            {{ hour }}
          </div>
        </div>
        <div v-else-if="mode === 'time_minutes'" class="minute-selector">
          <div
            :key="minute"
            v-for="minute in minutes"
            @click="onSelectMinute(minute)"
            class="minute-selector-item"
          >
            {{ minute }}
          </div>
        </div>
        <div v-else-if="mode === 'time'" class="time-selector">
          <div class="time-selector-editable">
            <button @click="onIncreaseHours(1)" class="icon-button"><ArrowUpIcon /></button>
            <div @click="onOpenHourSelector" class="time-selector-hours">
              {{ zeroPad(selectedDatetime.getHours()) }}
            </div>
            <button @click="onIncreaseHours(-1)" class="icon-button"><ArrowDownIcon /></button>
          </div>
          <div class="time-separator">:</div>
          <div class="time-selector-editable">
            <button @click="onIncreaseMinutes(1)" class="icon-button"><ArrowUpIcon /></button>
            <div @click="onOpenMinuteSelector" class="time-selector-minutes">
              {{ zeroPad(selectedDatetime.getMinutes()) }}
            </div>
            <button @click="onIncreaseMinutes(-1)" class="icon-button"><ArrowDownIcon /></button>
          </div>
        </div>
      </div>
      <div class="switch-mode">
        <button @click="onSwitchMode" class="switch-mode-btn">
          <ClockIcon v-if="mode === 'date'" />
          <CalendarIcon v-else />
        </button>
      </div>
      <div class="dropdown-footer">
        <div class="selected-preview">{{ formatDatetime(selectedDatetime) }}</div>
        <button @click="onSelect">Select</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.datetime-picker {
  position: relative;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
  border-radius: var(--input-border-radius-default);
  border: 3px solid transparent;
  box-shadow: inset 0 0 0 var(--input-border-width-small) var(--color-border-input);
  background-color: var(--color-background-input);
}

.datetime-picker:focus,
.datetime-picker:has(.input:focus) {
  border: 3px solid var(--color-border-input-focus);
}

.input {
  border: none;
  cursor: pointer;
  outline: none;
  margin: 1px 0;
  flex: 1 1 auto;
  height: var(--input-size-default);
  color: var(--color-text-input);
  font-size: var(--input-text-default);
  font-weight: var(--font-weight-normal);
  background-color: var(--color-background-input);
}

.calendar-icon {
  height: 100%;
  margin-left: 2px;
  cursor: pointer;
}

.clear-icon {
  height: 100%;
  margin-right: 2px;
  cursor: pointer;
}

.dropdown-picker {
  position: absolute;
  top: calc(100% + 5px);
  padding: 5px;
  box-shadow: var(--shadow-elevation-2);
}

.dropdown-content {
  position: relative;
}

.month-year {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  background-color: var(--color-background-input);
}

.dates {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto repeat(5, 1fr);
  background-color: var(--color-background-input);
}

.date {
  cursor: pointer;
  padding: 5px;
}

.day-name,
.date {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
}

.day-name {
  font-weight: bold;
  height: 40px;
}

.prepicked-date {
  background-color: #9147ff;
}

.not-prepicked-month {
  color: gray;
}

.switch-mode {
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.switch-mode-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.selected-preview {
  align-content: flex-end;
}

.month-selector {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  width: 100%;
  height: 100%;
  top: 0;
  background-color: var(--color-background-input);
}

.month-selector-item {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.month-prepicked {
  background-color: #9147ff;
}

.year-selector {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  overflow: auto;
  background-color: var(--color-background-input);
}

.year-prepicked {
  background-color: #9147ff;
}

.year-selector-item {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 1.5em;
}

.time-selector {
  position: absolute;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 100%;
  top: 0;
  overflow: auto;
  background-color: var(--color-background-input);
}

.time-selector-editable {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.time-selector-hours {
  font-size: 2em;
  cursor: pointer;
}

.time-separator {
  font-size: 4em;
}

.time-selector-minutes {
  font-size: 2em;
  cursor: pointer;
}

.hour-selector {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  overflow: auto;
  background-color: var(--color-background-input);
}

.hour-selector-item {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 1.5em;
}

.minute-selector {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  overflow: auto;
  background-color: var(--color-background-input);
}

.minute-selector-item {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 1.5em;
}

.dropdown-footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.icon-button {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
