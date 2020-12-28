{
    "title": "How to animate native Electron window",
    "image": "/images/posts/2020-12-27-15-00-00-how-to-animate-native-electron-window/rotate-native-window-demo.gif",
    "imagePreview": "/images/posts/2020-12-27-15-00-00-how-to-animate-native-electron-window/rotate-native-window-logo-500.png",
    "metaDescription": "electron,nodejs,n-api,js,nswindow,macos,objective-c++",
    "tags": "electron,nodejs,n-api,js,nswindow,macos,objective-c++",
    "date": "2020-12-27"
}

<!-- preview -->

This post demonstrates how to animate Electron's native application window using native macOS API.

<!-- /preview -->

## TL;DR

Call native system animation API on the native window handle provided by Electron.
The complete source code can be found on [GitHub](https://github.com/antonfisher/electron-window-rotator),
it is also published as [NPM package](https://www.npmjs.com/package/electron-window-rotator):

```shell
npm install electron-window-rotator
```

## Idea

Electron provides sufficient but minimal API to the native window where it renders content.
For more sophisticated UI, there is `win.getNativeWindowHandle()`
[API](https://github.com/electron/electron/blob/11-x-y/docs/api/browser-window.md#wingetnativewindowhandle)
that returns a [Buffer](https://nodejs.org/api/buffer.html).
That Buffer is a platform-specific handle of the window: `NSView*` for macOS,
`Window `(unsigned long) on Linux, and `HWND` for Windows.

The idea is to use this native handle conveniently provided by Electron to manipulate the native window.

## Code

All animation code in the post was written for macOS.
Linux and Windows require their own system-specific animation implementations.

High level implementation steps:
- take a webview screenshot using Electron API (captures window content)
- take a native window screenshot using macOS API (captures window frame)
- combine Electron's and native screenshots
- create a separate native window big enough to play rotation animation in it
- replace the original window with its screenshot and play animation
- show the original window back.

![high level implementation diagram](/images/posts/2020-12-27-15-00-00-how-to-animate-native-electron-window/rotate-native-window-logo.png)

### Taking a webview screenshot using Electron API

I haven't found a working solution to do this in the native code.
The API I used returns a native window screenshot including all native elements,
but Electron's renderer view was missed.

In Electron, `webContents` has capture
[API](https://github.com/electron/electron/blob/11-x-y/docs/api/web-contents.md#contentscapturepagerect)
for taking webview screenshots, and it can be accessed from `BrowserWindow` itself:

```js
const screenshot = await win.webContents.capturePage();
screenshot.toPNG() // to convert it to PNG
```

### Native Nodejs extension

All following steps require creating a native Nodejs module to access macOS native API.
That can be done using Nodejs [N-API](https://nodejs.org/docs/latest-v14.x/api/n-api.html).

A simple native extension consists of:
- [rotator.mm](https://github.com/antonfisher/electron-window-rotator/blob/main/rotator.mm)
    /[rotator.h](https://github.com/antonfisher/electron-window-rotator/blob/main/rotator.h)
    -- Objective-C++ files with all business logic
- [binding.gyp](https://github.com/antonfisher/electron-window-rotator/blob/main/binding.gyp)
    -- build config for node-gyp that specifies entry point and files to include into Objective-C++ build
- [NativeExtension.cc](https://github.com/antonfisher/electron-window-rotator/blob/main/NativeExtension.cc)
    -- extension entry point, defines the object that gets exported from the native to JS side
- [index.js](https://github.com/antonfisher/electron-window-rotator/blob/main/index.js) -- extension index file that exports native part and provides external API to JS.

There is `bindings` module to "glue" Objective-C++ and JS code together:

```javascript
const NativeExtension = require('bindings')('NativeExtension');
```

When all files are there, the extension can be built with:

```shell
node-gyp rebuild --debug
```

External NPM module API for `Rotator.rotate()` function will look like:

```typescript
enum Direction {
  Left = 0,
  Right,
}

declare function rotate(
    electronWindow: Electron$BrowserWindow,
    duration?: number,
    direction?: Direction
): Promise<void>
```

Internal native extension API for `NativeExtension.rotate()` function will be:

```typescript
declare function rotate(
    electronNativeWindowHandle: Buffer, // pointer to NSView on macOS
    screenshot: Buffer,                 // raw Electron screenshot data
    duration: number,                   // default: 1000ms
    direction: Direction                // default: 0 - left
): void;
```

To parse arguments on the Objective-C++ side, `napi_get_buffer_info` can be used for window handler
and raw Electron screenshot data, `napi_get_value_int32` to parse duration and direction argument values.
See full arguments parsing code
[here](https://github.com/antonfisher/electron-window-rotator/blob/8968f691d8a22e043ff77d3c1c3275f1c20a9d7c/rotator.mm#L13-L70).

### Taking a native window screenshot

After passing window handle from JS code to native code as a Buffer
(using `win.getNativeWindowHandle()`), that handle needs to be cast to
[*NSView](https://developer.apple.com/documentation/appkit/nsview?language=objc):

```objective-c
// `windowBuffer` - a Buffer that contains pointer to the window view,
// on macOS Electron returns it from `win.getNativeWindowHandle()` call:
NSView *mainWindowView = *static_cast<NSView **>(windowBuffer);
```

Now we have the main window view. The window itself can be found here:

```objective-c
NSWindow *window = mainWindowView.window;
```

NSWindow has an extensive
[API](https://developer.apple.com/documentation/appkit/nswindow?language=objc).
To take its screenshot, we need:
- get NSWindow's superview that includes a window frame
- create an NSBitmapImageRep representation for that superview
- create an NSImage and add the representation into it.

All these steps in code:

```objective-c
NSView *windowView = [window.contentView superview];
NSBitmapImageRep *windowScreenshotRep =
    [windowView bitmapImageRepForCachingDisplayInRect:windowView.bounds];
[windowView cacheDisplayInRect:windowView.bounds toBitmapImageRep:windowScreenshotRep];
NSSize windowScreenshotSize = NSMakeSize(CGImageGetWidth([windowScreenshotRep CGImage]),
                                         CGImageGetHeight([windowScreenshotRep CGImage]));
NSImage *windowScreenshot = [[NSImage alloc] initWithSize:windowScreenshotSize];
[windowScreenshot addRepresentation:windowScreenshotRep];
```

Now we have NSImage that can be put in an NSLayer of any other window.

### Combining Electron's and native screenshots

First, we need to convert raw Electron screenshot PNG data into NSImage,
that as well can be done using NSBitmapImageRep:

```objective-c
NSData *data = [NSData dataWithBytes:electronScreenshotBuffer
                              length:electronScreenshotBufferLength];
NSBitmapImageRep *electronScreenshotRep = [NSBitmapImageRep imageRepWithData:data];
NSSize electronScreenshotSize = NSMakeSize(CGImageGetWidth([electronScreenshotRep CGImage]),
                                           CGImageGetHeight([electronScreenshotRep CGImage]));
NSImage *electronScreenshot = [[NSImage alloc] initWithSize:electronScreenshotSize];
[electronScreenshot addRepresentation:electronScreenshotRep];
```

To combine two NSImages, we can render the Electron's screenshot into the native window screenshot.
The start point for render is the bottom-left corner, so there is no need for offset.

```objective-c
[windowScreenshot lockFocus];
CGRect electronScreenshotRect = CGRectMake(0, 0, electronScreenshotSize.width,
                                                 electronScreenshotSize.height);
[electronScreenshot drawInRect:electronScreenshotRect];
[windowScreenshot unlockFocus];
```

### Creating a new native window to play rotation animation

Once the full screenshot is ready, let's create an NSLayer to render the screenshot
and apply styles like rounded corners:

```objective-c
CALayer *imageLayer = [CALayer layer];
[imageLayer setContents:image];
[imageLayer setCornerRadius:10.0f];
[imageLayer setMasksToBounds:YES];
```

To play rotation animation, let's create a new transparent frameless native
window that is big enough to render rotated original window screenshot and its shadow:

```objective-c
NSRect animationWindowContentRect = NSMakeRect(/*...*/);
NSWindow *animationWindow =
    [[NSWindow alloc] initWithContentRect:animationWindowContentRect
                                styleMask:NSWindowStyleMaskBorderless
                                  backing:NSBackingStoreBuffered
                                    defer:NO];
[animationWindow setOpaque:NO];
[animationWindow setHasShadow:NO];
[animationWindow setBackgroundColor:[NSColor clearColor]];
[animationWindow.contentView setWantsLayer:YES];
```

Put the original window screenshot into the animation window and add shadows
which were cut by rounded corners:

```objective-c
CALayer *animationWindowLayer = [animationWindow.contentView layer];
[animationWindowLayer addSublayer:imageLayer];
[animationWindowLayer setShadowRadius:20.0f];
[animationWindowLayer setShadowOpacity:0.7f];
[animationWindowLayer setShadowOffset:CGSizeMake(0, -20)];
```

### Replacing the original window with its screenshot and playing animation

First, we need to hide the original window and show the animation window with the screenshot:

```shell
[window setAlphaValue:0.0];
[animationWindow setAlphaValue:1.0];
```

The macOS animation API provides a basic `transform.rotation` animation to rotate an NSLayer.

```objective-c
[CATransaction begin];
CABasicAnimation *animation = [CABasicAnimation animationWithKeyPath:@"transform.rotation"];
[animation setFromValue:[NSNumber numberWithDouble:0.0]];
CGFloat endAngle = (direction == DIRECTION_LEFT ? 1 : -1) * 2.0 * M_PI;
[animation setToValue:[NSNumber numberWithDouble:endAngle]];
[animation setDuration:duration / 1000.0];
[CATransaction setCompletionBlock:^{
    [window setAlphaValue:1.0];
    [animationWindow close];
}];
[imageLayer addAnimation:animation forKey:@"rotation"];
[CATransaction commit];
```

There is `setCompletionBlock` callback that gets called after the animation completes,
where we close the animation window and bring the original window back.

## Result and possible improvements

Some improvements can be made here, such as:
- return a `Promise` from `Rotator.rotate()` that resolves only after the animation completes
- replace `img.toPNG()` with `img.getNativeHandle()`
  [API](https://github.com/electron/electron/blob/11-x-y/docs/api/native-image.md#imagegetnativehandle-macos)
  to pass just an NSImage pointer to the native code instead of PNG data
- OR take the whole application screenshot from the native code and get rid of
  the need to pass Electron's screenshot around.

The complete source code can be found on [GitHub](https://github.com/antonfisher/electron-window-rotator),
it is also published as [NPM package](https://www.npmjs.com/package/electron-window-rotator).
