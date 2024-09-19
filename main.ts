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
  Platform,
} from "obsidian";
import {
  Manifest,
  requestUpdateRequestBody,
  requestUpdateResponseBody,
  Update,
  updateBatchRequestBody,
  updateSession,
} from "./types";
import { createHash } from "crypto";
import { createHash as uintCreateHash } from "sha1-uint8array";

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
    const button = div.createEl("button", { text: "Start sync" });
    div.createEl("h3", { text: "Output:" });
    const outputLogEl = div.createEl("p", {
      text: "Waiting for sync to start",
    });

    button.addEventListener("click", () =>
      this.handleSync(button, outputLogEl)
    );
  }

  async handleSync(
    button: HTMLElement,
    outputLogEl: HTMLElement
  ) {
    // Start sync
    outputLogEl.innerText = "";
    outputLogEl.style.color = "black";
    button.setAttribute("disabled", "true");
    button.innerText = "Syncing...";

    try {
      // Validate settings
      if (!this.settings.backendUrl || this.settings.backendUrl === "") {
        throw new Error("Backend URL is not set");
      }
      outputLogEl.innerText += `\nBackend URL: ${this.settings.backendUrl}`;

      // Get all markdown files with frontmatter quartz-sync=true
      const files: TFile[] = this.app.vault.getFiles().filter((file) => {
        const frontmatter =
          this.app.metadataCache.getFileCache(file)?.frontmatter;
        return frontmatter && frontmatter["quartz-sync"] === "true";
      });

      // Build manifest
      outputLogEl.innerText += `\nBuilding manifest for ${files.length} files`;
      const manifest: Manifest = await Promise.all(
        files.map(async (file: TFile) => {
          const content = await this.app.vault.read(file);
          const hash = this.hashContent(content);
          outputLogEl.innerText += `\n Manifest built for ${file.path}`;
          return {
            path: file.path,
            hash: hash,
          };
        })
      );
      outputLogEl.innerText += `\n Generated Manifest: \n ${JSON.stringify(
        manifest
      )}`;

      // Send manifest
      outputLogEl.innerText += "\nSending manifest";
      const response = await fetch(
        this.settings.backendUrl + "/request-update",
        {
          method: "POST",
          mode: "cors",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ manifest }),
        }
      );
      outputLogEl.innerText += `\nManifest sent`;

      // Wait for update sessions
      outputLogEl.innerText += "\nWaiting for update sessions";
      const responseJson = await response.json();
      outputLogEl.innerText += `\nReceived response${JSON.stringify(
        responseJson
      )}`;

      // Validate response
      if (response.status !== 200) {
        throw new Error("An Error occurred while sending the manifest");
      }
      if (!response.body || !responseJson.updateSessions) {
        throw new Error("Response body is invalid");
      }
      const updateSessions: updateSession[] = responseJson.updateSessions;
      if (!Array.isArray(updateSessions)) {
        throw new Error("Update sessions not found in response body");
      }
      outputLogEl.innerText += `\nResponse validated`;

      // Send updates
      outputLogEl.innerText += "\nSending updates";
      await Promise.all(
        updateSessions.map(async (session) => {
          outputLogEl.innerText += `\nBuilding updates for ${session.id}`;
          // Generate updates
          const updates: Update[] = await Promise.all(
            session.permittedChanges.map(async (change) => {
              outputLogEl.innerText += `\nBuilding update for ${change.path} (${change.type})`;
              if (change.type === "delete") {
                return {
                  type: change.type,
                  path: change.path,
                  content: "",
                };
              }
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
          outputLogEl.innerText += `\nUpdates generated for session ${
            session.id
          }: \n
            ${JSON.stringify(
              updates.map((update) => ({
                path: update.path,
                content: update.content.slice(0, 10) + "...",
              }))
            )}`;

          // Send updates
          outputLogEl.innerText += `\nSending updates for session ${session.id}`;
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

          // Validate response
          const responseJson = await response.json();
          outputLogEl.innerText += `Response received for session ${
            session.id
          }: \n 
            ${JSON.stringify(responseJson)}`;
          if (response.status !== 200) {
            throw new Error(
              "An Error occurred while sending updates: " + response.status
            );
          }
          const sessionResult = responseJson;
          if (!Array.isArray(sessionResult)) {
            throw new Error("Invalid response body");
          }

          // Update results
          sessionResult.forEach((result) => {
            outputLogEl.innerText += `\n${result.path}: ${result.status}`;
          });
        })
      );
      outputLogEl.innerText += "Sync complete";
      outputLogEl.style.color = "green";
      button.removeAttribute("disabled");
      button.innerText = "Restart sync";
    } catch (e: any) {
      outputLogEl.innerText += `Message: ${e.message} \nStack: ${e.stack} \nError: ${e}`;
      outputLogEl.style.color = "red";
      button.removeAttribute("disabled");
      button.innerText = "Restart sync";
    }
  }

  // Helper function to calculate the hash of file content
  hashContent(content: string): string {
    if (Platform.isMobileApp) {
      return uintCreateHash().update(content).digest("hex");
    } else {
      return createHash("sha1").update(content).digest("hex");
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
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
