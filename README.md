# Twitch Extension

## Features

- Displays the date a user started following a channel
- Keeps deleted messages visible in the chat (chat setting)
- Scriptable widgets written in TypeScript

## Build

```
npm run build:all
```

## Scriptable widgets

To create a widget, click on the `Tools` menu (the four-square icon) located above the chat, to the left of the `Participants` button. From the dropdown menu, select `New Widget`.
After doing this widget code editor should appears. There are two buttons on the title bar: a ✅ checkmark to save the widget and a ▶️ play button to preview.

### Hello world

Minimal script that just displays the `Hello world` message

```ts
interface UIInput extends OnlyUIInputProperties {}

interface SessionState {}

async function onUISetup(api: API): Promise<UIInput> {
  return {};
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  return 'Hello world';
}
```

### Text input

A widget can have several inputs. Here's an example of using one `UITextInput`. This widget simply shows two inputs, `a` and `b`, and prints their sum.

```ts
// This interface is used to declare all widget inputs.
interface UIInput extends OnlyUIInputProperties {
  a: UITextInput;
  b: UITextInput;
}

interface SessionState {}

// This function is called once when the widget spawns
async function onUISetup(api: API): Promise<UIInput> {
  // Definition of the inputs declared above
  return {
    a: { label: 'a', text: '0' },
    b: { label: 'b', text: '0' },
  };
}

// This function is called multiple times at intervals to update the widget's view (currently just a string)
async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  const a = Number.parseFloat(input.a.text); // convert a input text value to number
  const b = Number.parseFloat(input.b.text); // convert b input text value to number

  // the returned value of the function is displayed on the widget, right under the inputs
  return `${input.a.text} + ${input.b.text} = ${a + b}`;
}
```

### Slider & date time picker

Here are two other types of inputs: `UISliderInput` and `UIDateTimePicker`. This widget shows the difference between two dates in days, and by dragging the slider, the result's font size can be adjusted.

```ts
interface UIInput extends OnlyUIInputProperties {
  start: UIDateTimePicker;
  end: UIDateTimePicker;
  fontSize: UISliderInput;
}

interface SessionState {}

async function onUISetup(api: API): Promise<UIInput> {
  return {
    start: { date: new Date() }, // set initial value to the current date
    end: { date: new Date() },
    fontSize: { label: 'Font size', min: 4, max: 72, value: 16 },
  };
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  // The date value can be reset by clicking the cross button
  if (input.start.date === null || input.end.date === null) {
    return 'One of the dates is not set.';
  }

  // Calculate the difference in milliseconds between the start and end dates
  const elapsed = Math.abs(input.end.date.getTime() - input.start.date.getTime());

  // Convert milliseconds to days
  const days = `${Math.floor(elapsed / (1000 * 60 * 60 * 24))} days`;

  // Get the font size from the slider input
  const fontSize = input.fontSize.value + 'px';

  /**
   * This is an advanced way to print text. The `type` indicates it's still text,
   * the content is now passed through the `text` property, and the next two properties
   * control the visual appearance: font size and color
   */
  return { type: 'text', text: days, fontSize, color: 'red' };
}
```

### Session state

Currently, the only two places where user code can be placed and executed are `onUISetup` and `onUpdate`. Defining variables outside of these functions is forbidden:

```ts
// ❌ Bad: variable defined outside of allowed functions
let a = 'abc';

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  return a; // ReferenceError: a is not defined
}
```

The way to store data between function calls is by using `SessionState`.

This example simply prints a counter that increased by 1 on each `onUpdate` call

```ts
interface UIInput extends OnlyUIInputProperties {}

interface SessionState {
  counter: number; // declare a counter state variable
}

async function onUISetup(api: API): Promise<UIInput> {
  api.state.counter = 0; // set the initial value

  return {};
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  api.state.counter++; //increase the counter

  return api.state.counter.toString();
}
```

### Reading messages

- Use `api.channelMessagesAfterLastTick` or `api.allMessagesAfterLastTick` to read messages in real time

- Alternatively, you can read from the message log using `api.db.messages`. All messages that appear in the chat are stored in `api.db.messages`.

```ts
interface UIInput extends OnlyUIInputProperties {}

interface MyMessage {
  displayName: string;
  text: string;
  badges: string[];
}

interface SessionState {
  messages: FixedQueue<MyMessage>;
}

async function onUISetup(api: API): Promise<UIInput> {
  const messageLog = await api.db.messages
    .where('[roomId+timestamp]')
    .between([api.env.channel.id, 0], [api.env.channel.id, Date.now()])
    .reverse()
    .limit(10)
    .toArray();

  api.state.messages = FixedQueue.fromArray(messageLog.reverse(), 10);

  api.channelMessagesAfterLastTick();

  return {};
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  const messages = await api.channelMessagesAfterLastTick();

  messages.forEach((x) => api.state.messages.enqueue(x));

  return {
    type: 'table',
    rows: api.state.messages
      .toArray()
      .reverse()
      .map((x) => ({
        cells: [{ text: x.displayName }, { text: x.text }],
      })),
  };
}
```
