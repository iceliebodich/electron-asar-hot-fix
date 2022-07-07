# electron-asar-hot-fix

[中文文档](https://github.com/iceliebodich/electron-asar-hot-fix/blob/main/README-CN.md) | English

## What it is

> A NodeJs module for `electron`, used to support app.asar update, revised in `electron-asar-hot-updater` (thanks to yansenlei),`electron-asar-hot-updater `Based on `electron-asar-updater` refactoring.

electron-asar-hot-fix: https://github.com/iceliebodich/electron-asar-hot-fix
electron-asar-hot-updater: https://github.com/yansenlei/electron-asar-hot-updater

## How it works (Read this first)

- EAU (Electron Asar Updater) was built upon _Electron Application Updater_ to handle the process of updating the app.asar file inside an Electron app ; **it simply replaces the app.asar file (at /resources/) with the new one called "update.asar"!**
- The check for "updates" must by triggered by the application. **EAU doesn't make any kind of periodic checks on its own**.
- EAU talks to an API (let's call it so) to tell it if there is a new update.
  - `EAU` takes three parameters:
    - The first parameter is a object, it has the download url `url`, the file's sha1 value `sha1`, `method`request method(post or get),and a custom parameter.
    - The second parameter is a successful callback.
    - The third parameter is a failed callback, it will tell us where we fail to update.
  - If there's an update available the API should respond with the _source_ for this update **update.asar** file.
  - EAU then downloads the **.asar** file, deletes the old **app.asar** and renames the **update.asar** to **app.asar**.

## But why ? (use cases)

- If you think these are too complicated to implement: https://www.npmjs.com/package/electron-updater http://electron.atom.io/docs/v0.33.0/api/auto-updater/
- If you don't think it's reasonable to update the hole **.app** or **.exe** file (up to 100MB) when you're only changing one file (usually 40MB).
- If you want to use **zip** to compress files, make your **asar** file smaller.

---

## Installation

```bash
$ npm install --save electron-asar-hot-fix
```

Now, inside the _main.js_ file, call it like this:

```js
const { app } = require("electron");
const EAU = require("electron-asar-hot-fix");

// Version checking needs to be implemented manually，sha1 is not necessary
app.on("ready", function () {
  const params = {
    url: "",
    sha1: "",
    method: "get", // or post
    args: {},
  };
  EAU.download(
    params,
    (success) => {},
    (error) => {}
  );
});
```

## if you use vue-cli-plugin-electron-builder plugin

You may need to configure in vue.config.js:

```js
module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        asar: true,
        extraResources: [
          {
            from: "node_modules/electron-asar-hot-fix/updater.exe",
            to: "../updater.exe",
          },
        ],
      },
    },
  },
};
```

## let file smaller

When you use compressed files, the comparison of the **sha1** value is the comparison of the incoming **sha1** and the downloaded **zip** archive.
If you use a **zip** file, the plug-in will unzip the file after downloading it, which will make your update file smaller, but you must make sure that `update.asar` is at the root of the **zip** package:
At present, the name of this **asar** file can only be `update`, and it is not considered to support customization for the time being.

> **If you use compressed files, you need configure the `Content-Disposition` in the `Response Headers`, and it has the `zip` key words.**

```
── update.zip
   └── update.asar
```

## Windows update

This is to get around the fact that the prompt text from the timeout command was always being shown, even when redirecting to NUL

The updater.exe is a really simple C# console app, compiled with [Mono](http://www.mono-project.com). [Source code](./updater.cs). from [electron-asar-updater pull #2](https://github.com/whitesmith/electron-asar-updater/pull/2). If the user system version is win7, you may need to manually install [.Net framework](https://dotnet.microsoft.com/download/dotnet-framework) first.

## License

:smiley: if you have any comments or wish to contribute to this project, you are welcome to submit Issues or PR.

MIT - [iceliebodich](https://github.com/iceliebodich)
