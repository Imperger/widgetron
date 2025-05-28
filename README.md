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

### Session state

Currently, user code can only be placed and executed within functions. Declaring variables or writing code outside of functions is not allowed.

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
  counter: number; // Declare a counter state variable
}

async function onUISetup(api: API): Promise<UIInput> {
  api.state.counter = 0; // Set the initial value

  return {};
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  api.state.counter++; // Increase the counter

  return api.state.counter.toString();
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

### Button

`UIButton` is a UI element designed to trigger an action when clicked. When declared inside the `UIInput` interface, a corresponding function handler **must** be defined using the naming convention `[buttonName]OnClick`. For example, a button named `increment` should have a handler function named `incrementOnClick`.

```ts
/**
 * UIInput interface defines the UI layout.
 * It includes two buttons: 'increment' and 'decrement'.
 */
interface UIInput extends OnlyUIInputProperties {
  increment: UIButton;
  decrement: UIButton;
}

/**
 * SessionState defines the shape of the persistent state.
 * It stores the current value of the counter.
 */
interface SessionState {
  counter: number;
}

/**
 * Called when the 'increment' button is clicked.
 * Increments the counter in the session state.
 */
async function incrementOnClick(input: UIInput, api: API): Promise<void> {
  api.state.counter++;
}

/**
 * Called when the 'decrement' button is clicked.
 * Decrements the counter in the session state.
 */
async function decrementOnClick(input: UIInput, api: API): Promise<void> {
  api.state.counter--;
}

/**
 * Initializes the UI and session state.
 * Sets the counter to 0 and defines the appearance of the buttons.
 */
async function onUISetup(api: API): Promise<UIInput> {
  api.state.counter = 0;

  return {
    decrement: { caption: '-', fontSize: '32px', padding: '5px' },
    increment: { caption: '+', fontSize: '32px', padding: '5px' },
  };
}

/**
 * Updates the widget's display.
 * Returns the current value of the counter.
 */
async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  return `Counter: ${api.state.counter}`;
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

## OnUpdate

`OnUpdate` is the heart of a widget. This function is called each time the widget's view needs to be updated. Usually, it is called once per second, but it can also be triggered when the UI input changes — for example, when the user moves a slider, types in a text input, press a button, etc.

`OnUpdate` may perform heavy calculations or network requests. To avoid executing such operations every time the user drags a slider or types in a text box, you can use `api.caller` to distinguish the source of the call. It can have two values:

- `system` – when called by the timer
- `event` – when triggered by user interaction

```ts
async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  // If triggered by a user, skip the heavy computations.
  if (api.caller === 'event') {
    // If it returns 'undefined', the view reuses the previous view model.
    return;
  }

  // Some heavy operations...

  return 'A view generated from heavy calculations';
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

### Capturing stream screenshot

The `api.captureScreenshot()` method enables capturing a screenshot of the current stream. The method accepts a single parameter that determines the output format.

- `rgba`: returns a screenshot as a RGBA `Uint8Array`
- `png`: returns a screenshot as a PNG `Uint8Array`

This example captures periodic screenshots of a Heroes of the Storm match, extracts the game duration and team levels using OCR, and updates the UI with the parsed information. It uses predefined screen regions and Tesseract.js for text recognition.

```ts
interface UIInput extends OnlyUIInputProperties {}

interface Tesseract {
  recognize(image: Uint8Array, options: { rectangle: Rect }): Promise<{ data: { text: string } }>;
}

interface GameRegion {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LevelRegions {
  team1: Rect;
  team2: Rect;
}

interface OCRRegions {
  gameRect: GameRegion; // Defines the area of the screen containing the game
  duration: Rect; // Region to extract game duration
  level: LevelRegions; // Regions to extract team levels
}

interface SessionState {
  ocr: Tesseract; // OCR worker instance
  gameInfo: string; // Output string with parsed game info
  regions: OCRRegions; // All predefined regions for OCR
  recognizerTimer: number;
}

// Converts a relative Rect to absolute pixel coordinates within a screenshot
function rectAbs(rect: Rect, screenshot: Screenshot, gameRegion: GameRegion): Rect {
  const left = gameRegion.left * screenshot.width;
  const top = gameRegion.top * screenshot.height;
  const gameWidth = (gameRegion.right - gameRegion.left) * screenshot.width;
  const gameHeight = (gameRegion.bottom - gameRegion.top) * screenshot.height;

  return {
    left: left + rect.left * gameWidth,
    top: top + rect.top * gameHeight,
    width: rect.width * gameWidth,
    height: rect.height * gameHeight,
  };
}

// Performs OCR recognition within a specific region of a screenshot
async function recognize(screenshot: Screenshot, region: Rect, state: SessionState) {
  const result = await state.ocr.recognize(screenshot.image, {
    rectangle: rectAbs(region, screenshot, state.regions.gameRect),
  });

  return result.data.text;
}

// Extracts game-related values (duration and team levels) from screenshot via OCR
async function getRunningGameInfo(screenshot: Screenshot, state: SessionState) {
  const duration = (await recognize(screenshot, state.regions.duration, state)).trim();
  const blueTeamLevel = (await recognize(screenshot, state.regions.level.team1, state)).trim();
  const redTeamLevel = (await recognize(screenshot, state.regions.level.team2, state)).trim();

  return { duration, blueTeamLevel, redTeamLevel };
}

// Formats a 4-digit string (e.g., "0930") into a "09:30" time format
function formatDuration(str: string) {
  if (str.length === 4) {
    return `${str.slice(0, 2)}:${str.slice(2, 4)}`;
  } else {
    return str;
  }
}

// Main loop to continuously capture screenshots and update game info
async function gameInfoReader(api: API) {
  // Capture a screenshot in PNG format using the API
  const screenshot = await api.captureScreenshot('png');

  // If the screenshot is empty, retry later
  if (screenshot.image.length === 0) {
    setTimeout(gameInfoReader, 10000);
    return;
  }

  // Run OCR recognition on relevant regions
  const { duration, blueTeamLevel, redTeamLevel } = await getRunningGameInfo(screenshot, api.state);

  // Update state with formatted info
  api.state.gameInfo = `Duration: ${formatDuration(duration)}\n`;
  api.state.gameInfo += `Levels: ${blueTeamLevel} x ${redTeamLevel}\n`;

  // Schedule the next update in 5 seconds
  api.state.recognizerTimer = setTimeout(() => gameInfoReader(api), 5000);
}

// Initializes OCR engine, region data, and starts info reader loop
async function onUISetup(api: API): Promise<UIInput> {
  // Load Tesseract.js from CDN
  importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

  // Initialize state
  api.state.ocr = null;
  api.state.gameInfo = '';
  api.state.recognizerTimer = -1;

  // Define OCR regions using normalized coordinates
  api.state.regions = {
    gameRect: { left: 0, top: 0, right: 1, bottom: 1 },
    duration: { left: 0.48646, top: 0, width: 0.0265625, height: 0.01574 },
    level: {
      team1: { left: 0.449479, top: 0.0212, width: 0.0458, height: 0.04167 },
      team2: { left: 0.503646, top: 0.0212, width: 0.0458, height: 0.04167 },
    },
  };

  // Initialize Tesseract OCR worker
  (self as any).Tesseract.createWorker('eng').then(async (worker) => {
    api.state.ocr = worker;

    await worker.setParameters({
      tessedit_char_whitelist: '0123456789', // Restrict to digits
    });

    // Start reading game info
    gameInfoReader(api);
  });

  return {};
}

// Provides current game info as widget output
async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
  return api.state.gameInfo;
}

async function onDestroy(input: UIInput, api: API): Promise<void> {
  clearTimeout(api.state.recognizerTimer);
}
```
