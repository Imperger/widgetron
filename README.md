# Widgetron

![Logo](./resources/icon.svg)

## Features

- Displays the date a user started following a channel
- Keeps deleted messages visible in chat (configurable via chat settings)
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

  // The returned value of the function is displayed on the widget, right under the inputs
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
  api.state.counter++; // increase the counter

  return api.state.counter.toString();
}
```

### Environment

A widget can access information about the current stream through `api.env.channel`.

```ts
interface UIInput extends OnlyUIInputProperties {}

interface SessionState {}

async function onUISetup(api: API): Promise<UIInput> {
  return {};
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  if (!api.env.channel) {
    return 'Open some stream...';
  }

  const isLive = api.env.channel.online ? '🟢' : '🔴';

  let view = `Stream ${api.env.channel.name} is ${isLive}.\n`;

  // If the stream is live, include game and viewer count
  if (api.env.channel.online) {
    view += `Playing in ${api.env.channel.game} with ${api.env.channel.viewers} viewers`;
  }

  return view;
}
```

### Line graph

The `LineGraph` view displays time-series data, making it ideal for visualizing changes over time. In this example, it tracks live viewer counts over a 10-minute window, sampling at regular intervals.

```ts
interface UIInput extends OnlyUIInputProperties {}

interface SessionState {
  currentChannelId: string;
  lastCheckoutTime: number;
  samplesPerWindow: number; // Total number of samples to keep in the graph
  viewersOverTime: FixedQueue<number>;
  samplingStartTime: number;
}

// Initialization logic run once when the UI is set up
async function onUISetup(api: API): Promise<UIInput> {
  api.state.currentChannelId = api.env.channel.id;
  api.state.lastCheckoutTime = 0;
  api.state.samplesPerWindow = 20;
  api.state.viewersOverTime = FixedQueue.create(api.state.samplesPerWindow, 0);
  api.state.samplingStartTime = Date.now();

  return {};
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  const timeWindowSeconds = 10 * 60; // Define the total time window in seconds (10 minutes)
  const samplesPerWindow = api.state.samplesPerWindow;
  const samplePeriod = (timeWindowSeconds * 1000) / samplesPerWindow; // Calculate how often to take samples (in ms)
  const now = Date.now();

  // If the channel has changed, reset tracking state
  if (api.state.currentChannelId !== api.env.channel.id) {
    api.state.viewersOverTime = FixedQueue.create(api.state.samplesPerWindow, 0);
    api.state.currentChannelId = api.env.channel.id;
    api.state.lastCheckoutTime = 0;
    api.state.samplingStartTime = Date.now();
  }

  // Check if it's time to sample again
  if (now - api.state.lastCheckoutTime > samplePeriod) {
    if (api.env.channel.online) {
      // If the channel is online, add current viewer count to the queue
      api.state.viewersOverTime.enqueue(api.env.channel.viewers);
    } else {
      // If offline, record 0 viewers
      api.state.viewersOverTime.enqueue(0);
    }

    api.state.lastCheckoutTime = now;
  }

  // If not enough samples yet, show a message instead of the graph
  if (api.state.viewersOverTime.size < 2) {
    const d = Math.floor((samplePeriod - (now - api.state.samplingStartTime)) / 1000);
    return `Collecting data... Showing in ${d} seconds`;
  }

  const msToMinutes = (ms: number): number => Math.floor(ms / 1000 / 60);

  // Generate X-axis labels: only label start (-Xm) and end (0), others remain blank
  const xAxisLabels = (n: number): string => {
    if (n === 0) {
      return `-${msToMinutes(api.state.viewersOverTime.size * samplePeriod)}m`;
    }

    if (n == api.state.viewersOverTime.size - 1) {
      return '0';
    }

    return '';
  };

  return {
    type: 'linegraph',
    curve: 'smooth',
    xAxis: Array.from({ length: samplesPerWindow }, (_, n) => xAxisLabels(n)), // X-axis labels
    series: [{ label: 'viewers', values: [...api.state.viewersOverTime] }], // Viewer counts over time
  };
}
```

### Reading messages

- Use `api.channelMessagesAfterLastTick()` or `api.allMessagesAfterLastTick()` to read messages in real time.

- Alternatively, the message log can be read using `api.db.messages`. All messages that appear in the chat are stored in `api.db.messages`.

Below is an example that demonstrates both approaches.
The `messages` variable is defined inside `SessionState` and holds chat messages to be displayed in the widget.
In `onUISetup`, `api.db.messages` is used to fetch the latest 10 messages from the persistent log.
In `onUpdate`, `api.channelMessagesAfterLastTick` is used to read new messages in real time, which are then stored in `messages`.
Finally, the messages are rendered as a table.

```ts
interface UIInput extends OnlyUIInputProperties {}

interface SessionState {
  /**
   * FixedQueue is a structure that maintains a fixed size by
   * removing the oldest item when a new one is added
   */
  messages: FixedQueue<ChatMessage>;
}

async function onUISetup(api: API): Promise<UIInput> {
  const latestN = 10;

  // Query the latest 10 messages from the message log for the current channel
  const messageLog = await api.db.messages
    .where('[roomId+timestamp]')
    .between([api.env.channel.id, 0], [api.env.channel.id, Date.now()])
    .reverse() // newest messages first
    .limit(latestN)
    .toArray();

  // Initialize the message queue with the fetched messages, in correct chronological order
  api.state.messages = FixedQueue.fromArray(messageLog.reverse(), latestN);

  // Start tracking new real-time messages
  await api.channelMessagesAfterLastTick();

  return {};
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  // Get real-time messages received since the last update tick
  const messages = await api.channelMessagesAfterLastTick();

  // Add each new message to the queue, maintaining a fixed size
  messages.forEach((x) => api.state.messages.enqueue(x));

  // Render messages in a table with two columns: display name and message text
  return {
    type: 'table',
    rows: api.state.messages
      .toArray()
      .reverse() //  most recent message at the top
      .map((x) => ({
        cells: [{ text: x.displayName }, { text: x.text }],
      })),
  };
}
```

### Sending Messages

To send a message to the chat use `api.action.sendMessage(text: string)`.

The following example reacts to the `!hello` command and replies by mentioning the user who triggered it.

```ts
interface UIInput extends OnlyUIInputProperties {}

interface SessionState {}

async function onUISetup(api: API): Promise<UIInput> {
  api.channelMessagesAfterLastTick();

  return {};
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  const messages = await api.channelMessagesAfterLastTick();

  // Look for a message starting with the command "!hello"
  const trigger = messages.find((x) => x.text.startsWith('!hello'));

  if (trigger) {
    // Send a reply that mentions the user who triggered the command
    api.action.sendMessage(`Hello from a wdiget @${trigger.displayName}`);
  }

  return null;
}
```

### Deleting messages

To delete specific message use `api.action.deleteMessage(messageId: string)`.

The following example reacts to the `!vanish` command by deleting the command message itself, and—if found—also deletes the user's previous message sent within the last minute.

```ts
interface UIInput extends OnlyUIInputProperties {}

interface SessionState {}

async function onUISetup(api: API): Promise<UIInput> {
  // Start receiving live chat messages
  await api.channelMessagesAfterLastTick();

  return {};
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  const cmd = '!vanish';
  const captureTimeWindow = 60 * 1000; // 1 minute in milliseconds

  // Get new messages since the last update
  const messages = await api.channelMessagesAfterLastTick();

  const trigger = messages.find((x) => x.text.startsWith(cmd));

  if (!trigger) {
    return null;
  }

  // Delete the "!vanish" command message itself
  api.action.deleteMessage(trigger.id);

  const now = Date.now();

  // Get all recent messages from the log (within the last minute)
  const log = await api.db.messages
    .where('[roomId+timestamp]')
    .between([api.env.channel.id, now - deletionTimeWindow], [api.env.channel.id, now])
    .toArray();

  // Find the last message from the same user that isn't the "!vanish" command
  const messageToDelete = log.findLast((x) => x.text !== cmd && x.userId === trigger.userId);

  if (messageToDelete) {
    // Delete that message too
    api.action.deleteMessage(messageToDelete.id);
  }

  return null;
}
```
