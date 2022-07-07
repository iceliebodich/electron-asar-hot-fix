const { app } = require("electron");
const FileSystem = require("original-fs");
const request = require("request");
const crypto = require("crypto");
const admZip = require("adm-zip");
const log = require("electron-log");

const AppPath = app.getAppPath() + "/";
const AppPathFolder = AppPath.slice(0, AppPath.indexOf("app.asar"));
const AppAsar = AppPath.slice(0, -1);
const WindowsUpdater = AppPath.slice(0, AppPath.indexOf("resources")) + "updater.exe";
const UPDATE_FILE = "update.asar";
const DOWNLOAD_FILE = "update";
const errors = [
  "download_file_error",
  "sha1_code_not_match",
  "sha1_error",
  "unzip_error",
  "fs_write_file_error",
  "apply_delete_error",
  "apply_rename_error",
  "shell_move_error",
  "shell_move_not_find_asar_file",
];
/**
 * */
var Updater = {
  /**
   * The new update information
   * */
  update: {
    file: null,
  },

  /**
   * Sha1
   * */
  sha1: function (buffer) {
    var fsHash = crypto.createHash("sha1");
    fsHash.update(buffer);
    var sha1 = fsHash.digest("hex");
    return sha1;
  },

  /**
   * Logging
   * */
  log: function (line) {
    // Put it into a file
    log.info("[ electron-asar-hot-fix ]", line);
  },

  /**
   * error callback exception log
   * */
  error: function (code, error) {
    if (typeof error !== "function") {
      return false;
    } else {
      error(errors[code]);
    }
  },

  /**
   * Download the update file
   * */
  download: function (params, success, error) {
    let reqData = null;
    if (params.method == "GET" || params.method == "get") {
      reqData = {
        uri: params.url,
        encoding: null,
        method: "GET",
        qs: params.args,
      };
    } else {
      reqData = {
        uri: params.url,
        encoding: null,
        method: "POST",
        form: params.args,
      };
    }

    request(reqData, function (e, response, body) {
      if (e) {
        Updater.log("download_file_error: " + error);
        Updater.error(0, error);
        return;
      }

      var downloadSubfix = ".asar";
      var contentDisposition = response.headers["content-disposition"];
      if (contentDisposition && contentDisposition.indexOf("zip") > -1) {
        downloadSubfix = ".zip";
      }
      var updateFile = AppPathFolder + DOWNLOAD_FILE + downloadSubfix;

      // Create the file
      FileSystem.writeFile(updateFile, body, null, function (e) {
        if (e) {
          Updater.log(e + "\n Failed to download the update to a local file.");
          Updater.error(4, error);
          return false;
        }

        if (!Updater.compareSha1(params.sha1, updateFile, error)) {
          Updater.log("unzip_error");
          Updater.error(3, error);
          return;
        }

        Updater.update.file = AppPathFolder + UPDATE_FILE;
        Updater.log("Updater.update.file: " + updateFile);
        if (contentDisposition && contentDisposition.indexOf("zip") > -1) {
          const zip = new admZip(body);
          zip.extractAllTo(AppPathFolder, true);
          // Success
          Updater.log("Update Zip downloaded: " + AppPathFolder);
        } else {
          // Success
          Updater.log("Update downloaded: " + updateFile);
        }
        Updater.useUpdate(success, error);
      });
    });
  },

  /**
   * different platform update function
   * */
  useUpdate: function (success, error) {
    // Apply the upda
    if (process.platform === "darwin") {
      Updater.apply(error);
    } else {
      Updater.mvOrMove(success, error);
    }
  },

  /**
   * Compare the sha1
   * */
  compareSha1: function (sha1, updateFile, error) {
    if (sha1) {
      try {
        var buffer = FileSystem.readFileSync(updateFile);
        var updateFileSha1 = Updater.sha1(buffer);
        if (updateFileSha1 !== sha1) {
          Updater.log("Upload failed! Sha1 code mismatch.");
          Updater.error(1, error);
          return false;
        }
      } catch (e) {
        Updater.log("sha1_error");
        Updater.error(2, error);
        return false;
      }
    }
    return true;
  },

  /**
   * Apply the update, remove app.asar and rename UPDATE_FILE to app.asar
   * */
  apply: function (error) {
    try {
      this.log("Going to unlink: " + AppPath.slice(0, -1));
      FileSystem.unlinkSync(AppPath.slice(0, -1));
      this.log("Asar deleted successfully.");
    } catch (e) {
      // Failure
      this.log("Delete error: " + e);
      this.error(5, error);

      return false;
    }

    try {
      this.log("Going to rename: " + Updater.update.file + " to: " + AppPath.slice(0, -1));
      FileSystem.renameSync(Updater.update.file, AppPath.slice(0, -1));

      this.log("Update applied.");
      this.log("End of update.");
    } catch (e) {
      // Failure
      this.log("Renmae error: " + e);
      this.error(6, error);
      return false;
    }
  },

  // app.asar is always EBUSY on Windows, so we need to try another
  // way of replacing it. This should get called after the main Electron
  // process has quit. Win32 calls 'move' and other platforms call 'mv'
  mvOrMove: function (success, error) {
    var updateAsar = AppPathFolder + UPDATE_FILE;
    var appAsar = AppPathFolder + "app.asar";
    var winArgs = "";

    Updater.log("Checking for " + updateAsar);

    try {
      FileSystem.accessSync(updateAsar);
      try {
        Updater.log("Going to shell out to move: " + updateAsar + " to: " + AppAsar);

        let executable = process.execPath;
        const { spawn } = require("child_process");
        if (process.platform === "win32") {
          Updater.log("Going to start the windows updater:" + WindowsUpdater + " " + updateAsar + " " + appAsar + " " + executable);
          winArgs = `${JSON.stringify(WindowsUpdater)} ${JSON.stringify(updateAsar)} ${JSON.stringify(appAsar)} ${JSON.stringify(executable)}`;
          Updater.log(winArgs);

          spawn("cmd", ["/s", "/c", '"' + winArgs + '"'], {
            detached: true,
            windowsVerbatimArguments: true,
            stdio: "ignore",
          });
        } else {
          // for Mac/Linux
          spawn("bash", ["-c", ["cd " + JSON.stringify(AppPathFolder), `mv -f ${UPDATE_FILE} app.asar`, executable].join(" && ")], {
            detached: true,
          });
        }
        if (success) {
          success();
        }
      } catch (e) {
        Updater.log("Shelling out to move failed: " + e);
        Updater.error(7, error);
      }
    } catch (e) {
      Updater.log("Couldn't see an " + updateAsar + " error was: " + e);
      Updater.error(8, error);
    }
  },
};

module.exports = Updater;
