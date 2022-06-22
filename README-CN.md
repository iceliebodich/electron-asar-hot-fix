# electron-asar-hot-fix

中文文档 | [English](README.md)

## What it is

> 一个用于`electron`的 NodeJs 模块，用于支持 app.asar 的更新，改版于`electron-asar-hot-updater`(感谢 yansenlei)，对功能进行了删改，`electron-asar-hot-updater`基于`electron-asar-updater`重构。

electron-asar-hot-fix: https://github.com/iceliebodich/electron-asar-hot-fix electron-asar-hot-updater: https://github.com/yansenlei/electron-asar-hot-updater

## 如何工作 (Read this first)

-   用于处理更新 Electron 应用程序内 app.asar 文件的过程;它只是用名为“update.asar”的新文件替换 app.asar 文件（在/ resources /）！
-   检查“更新”必须由应用程序触发。 `EAU`不会自行进行任何形式的定期检查。
-   `EAU`接收三个参数，参数一为对象包含下载 url 和 sha1 值，参数二为成功的回调，参数三为失败的回调（新版本的检查需要手动实施）
    -   如果有可用更新，则 API 应使用此更新 update.asar 文件的源进行响应。
    -   EAU 然后下载.asar 文件，删除旧的 app.asar 并将 update.asar 重命名为 app.asar。(为了绕开 Windows 下替换 asar 存在程序占用的问题，会在关闭 Electron 应用后启动`updater.exe`，5 秒后替换 asar)

## 为何要使用它 ? (用例)

-   如果你认为这些太复杂而无法实施: https://www.npmjs.com/package/electron-updater http://electron.atom.io/docs/v0.33.0/api/auto-updater/
-   如果你认为在更换一个文件（通常为 40MB），.app 或.exe 文件（最多 100MB）是不合理的。
-   可以使用 zip 压缩文件，压缩你的 ASAR 使其更小。

---

## 安装

```bash
$ npm install --save electron-asar-hot-fix
```

现在，在 main.js 文件中，调用它如下：

```js
const { app, dialog } = require('electron');
const EAU = require('electron-asar-hot-fix');

// 版本的检查需要手动实施，sha1非必传
app.on('ready', function () {
  const params = {
    url : "",
    sha1: ""
  }
  EAU.download(params, (success)=> {

  }, (error) => {

  })
})
```

## 如果使用 vue-cli-plugin-electron-builder 插件打包

你可能需要在 vue.config.js 中配置：

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

## 让更新包更小

当你使用压缩文件时，sha1值的对比是传入的sha1和下载的zip压缩包的对比。
如果你使用 zip 文件，插件将在下载后解压缩文件，这将使你的更新文件更小，但你必须确保`update.asar`位于 zip 包的根目录：
目前这个asar文件名称只能是`update`，暂不考虑支持自定义。

```
── update.zip
   └── update.asar
```

## Windows 更新

updater.exe 是一个非常简单的 C＃控制台应用程序，使用[Mono](http://www.mono-project.com) 编译 [源码](./updater.cs)。来自 [electron-asar-updater pull #2](https://github.com/whitesmith/electron-asar-updater/pull/2)。如果客户机系统版本是 win7，可能需要先手动安装[.Net framework](https://dotnet.microsoft.com/download/dotnet-framework)。

## License

欢迎提交 Issues、PR

MIT - [iceliebodich](https://github.com/iceliebodich)
