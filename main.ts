import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
} from "obsidian";
import { createHash } from "crypto";
import {
  Manifest,
  requestUpdateRequestBody,
  requestUpdateResponseBody,
  Update,
  updateBatchRequestBody,
  updateSession,
} from "types";
import { inspect } from "util";
import { join } from 'path';
import { readFileSync } from 'fs';

interface MyPluginSettings {
  backendUrl: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  backendUrl: "",
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

    // This creates an icon in the left ribbon.
    const ribbonIconEl = this.addRibbonIcon(
      "folder-sync",
      "Quartz Sync",
      (evt: MouseEvent) => {
        // Called when the user clicks the icon.
        new SyncModal(this.app, this.settings).open();
      }
    );

    // TODO: Use for styling?
    // Perform additional things with the ribbon
    //ribbonIconEl.addClass("my-plugin-ribbon-class");

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: "open-quartz-sync-modal",
      name: "Open quartz sync modal",
      callback: () => {
        new SyncModal(this.app, this.settings).open();
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    if (this.settings.backendUrl.endsWith("/")) {
      this.settings.backendUrl = this.settings.backendUrl.slice(0, -1);
    }
    await this.saveData(this.settings);
  }
}

type SyncState =
  | "not-started"
  | "started"
  | "manifest-built"
  | "manifest-sent"
  | "update-sessions-received"
  | "results-received"
  | "error";

let state: SyncState = "not-started";
let error: string = "";
let results: string = "";

class SyncModal extends Modal {
  settings: MyPluginSettings;

  constructor(app: App, settings: MyPluginSettings) {
    super(app);
    this.settings = settings;
  }

  onOpen() {
    const { contentEl } = this;
    // create main div with class for styling
    const div = contentEl.createDiv("quartz-sync-modal");
    div.createEl("h2", { text: "Quartz Sync" });
    div.createEl("p", {
      text: "This will attempt to sync all files marked with the quartz-sync=true frontmatter to the configured quartz_updater backend.",
    });
    const button = div.createEl("button", { text: "Start sync"});
    div.createEl("h3", { text: "Sync status:" });
    const statusEl = div.createEl("p", { text: state });
    div.createEl("h3", { text: "Client manifest generated:" });
    const generatedClientManifestEl = div.createEl("p", { text: "..." });
    div.createEl("h3", { text: "Server response:" });
    const serverResponseEl = div.createEl("p", { text: "..." });
    
    button.addEventListener("click", () => this.handleSync(statusEl, button, serverResponseEl, generatedClientManifestEl));
  }

  async handleSync(statusEl: HTMLElement, button: HTMLElement, serverResponseEl: HTMLElement, generatedClientManifestEl: HTMLElement) {
    // Start updater
    this.startStatusUpdate(statusEl, button);

    // Start sync
    error = "";
    results = "";
    state = "started";

    try {
      // Validate settings
      if (!this.settings.backendUrl || this.settings.backendUrl === "") {
        throw new Error("Backend URL is not set");
      }

      // Get all markdown files with frontmatter quartz-sync=true
      const files = this.app.vault.getFiles().filter((file) => {
        const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
        return frontmatter && frontmatter["quartz-sync"] === "true";
      });
      generatedClientManifestEl.innerText = `Files to sync: \n ${files.map((file) => file.path).join("\n")}`;

      // Build manifest
      const manifest: Manifest = files.map((file) => {
          const fullPath = join(__dirname, file.path);
          generatedClientManifestEl.innerText += `\n Building manifest for ${fullPath}`;
          // const fileReadable = this.app.vault.getAbstractFileByPath(join(__dirname, file.path));
          // generatedClientManifestEl.innerText += `\n FileReadable: \n ${inspect(fileReadable, { depth: 2 , colors: true})}`;
          // if (!fileReadable || fileReadable instanceof TFile === false) {
          //   throw new Error(`File ${file.path} could not be read`);
          // }
          // generatedClientManifestEl.innerText += `\n File content: \n ${await this.app.vault.read(fileReadable as TFile)}`;
          const content = readFileSync(fullPath, 'utf-8').toString();
          generatedClientManifestEl.innerText += `\n File content: \n ${content}`;
          const hash = this.hashContent(content);
          return {
            path: file.path,
            hash: hash,
            // hash: this.hashContent(
              // await this.app.vault.read(fileReadable as TFile)
            // ),
          };
        }
      );
      state = "manifest-built";
      generatedClientManifestEl.innerText += `\n Generated Manifest: \n ${JSON.stringify(manifest)}`;

      // Send manifest
      const response = await fetch(
        this.settings.backendUrl + "/request-update",
        {
          method: "POST",
          mode: "cors",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ manifest }),
        }
      );
      state = "manifest-sent";

      // Wait for update sessions
      const responseJson = await response.json();
      serverResponseEl.innerText = JSON.stringify(responseJson);

      // Validate response
      if (response.status !== 200) {
        throw new Error("An Error occurred while sending the manifest");
      }
      if (!responseJson.body || !responseJson.body.updateSessions) {
        throw new Error("Response body is invalid");
      }
      const updateSessions: updateSession[] = responseJson.body.updateSessions;
      if (!Array.isArray(updateSessions)) {
        throw new Error("Update sessions not found in response body");
      }
      state = "update-sessions-received";

      // Send updates
      serverResponseEl.innerText = "";
      await Promise.all(
        updateSessions.map(async (session) => {
          // Generate updates
          const updates: Update[] = await Promise.all(
            session.permittedChanges.map(async (change) => {
              const fileReadable = this.app.vault.getAbstractFileByPath(
                change.path
              )!;
              if (fileReadable instanceof TFile === false) {
                throw new Error(`File ${change.path} could not be read`);
              }
              return {
                type: change.type,
                path: change.path,
                content: await this.app.vault.read(fileReadable as TFile),
              };
            })
          );

          // Send updates
          const response = await fetch(
            this.settings.backendUrl + "/update-batch",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: session.id,
                updates,
              }),
            }
          );
          serverResponseEl.innerText = serverResponseEl.innerText + "\n" + session.id + ": \n" + JSON.stringify(await response.json());

          // Validate response
          if (response.status !== 200) {
            throw new Error("An Error occurred while sending updates");
          }
          const responseJson = await response.json();
          const sessionResult = responseJson.body;
          if (!Array.isArray(sessionResult)) {
            throw new Error("Invalid response body");
          }

          // Update results
          sessionResult.forEach((result) => {
            results += `${result.path}: ${result.status}\n`;
          });
        })
      );
      state = "results-received";
    } catch (e) {
      error = `Message: ${e.message} \nStack: ${e.stack} \nError: ${e}`; 
      state = "error";
    }
  }

  // Helper function to calculate the hash of file content
  hashContent = (content: string): string =>
    createHash("sha256").update(content).digest("hex");

  async startStatusUpdate(statusEl: HTMLElement, button: HTMLElement) {
    const interval = setInterval(() => {
      statusEl.innerText = state;
      switch (state) {
        case "started":
          statusEl.innerText = "Sending manifest";
          button.setAttribute("disabled", "true");
          button.innerText = "Syncing...";
          break;
        case "manifest-sent":
          statusEl.innerText = "Waiting for update sessions";
          break;
        case "update-sessions-received":
          statusEl.innerText = results;
          break;
        case "results-received":
          statusEl.innerText = results;
          statusEl.style.color = "green";
          clearInterval(interval);
          button.removeAttribute("disabled");
          button.innerText = "Restart sync";
          break;
        case "error":
          statusEl.innerText = error;
          statusEl.style.color = "red";
          clearInterval(interval);
          button.removeAttribute("disabled");
          button.innerText = "Restart sync";
          break;
      }
    }, 1000);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    state = "not-started";
    error = "";
    results = "";
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Backend URL")
      .setDesc("URL of the quartz_updater backend")
      .addText((text) =>
        text
          .setPlaceholder("Required!")
          .setValue(this.plugin.settings.backendUrl)
          .onChange(async (value) => {
            this.plugin.settings.backendUrl = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
