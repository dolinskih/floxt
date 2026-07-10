# Floxt
Fast and capable note-taking app.

![Floxt logo](https://github.com/dolinskih/floxt/blob/main/floxt/src-tauri/icons/128x128%402x.png)

**Current release version**: 0.3 (Pre-release)

**Current development version**: 0.4 (Pre-release)

## Installation
### Desktop app
Go to the [Releases page](https://github.com/dolinskih/floxt/releases/latest) of the repository and choose Floxt either for Windows or Linux!
### Development environment
1. On your system, install Node.js, npm and Rust.
2. Download Floxt repository and open floxt folder in the terminal.
3. Run `npm install` in the terminal.

**All needed files are now installed!**

## Running development environment
- To run in web browser use `npm run dev`.
- To run in desktop application use `npx tauri dev`.

## Running public environment (build)
### Web app
1. Create app build using `npm run build` in the terminal.
2. Run the app using `npm run start` in the terminal.
### Desktop app
1. Create app build using `npx tauri build` in the terminal.
2. Install the app using the generated installer.

## Floxt usage tips
- **Use Floxt without server running:** To use app offline install Floxt as a web app using Install option in the menu panel or in your browser's options.
- All available code commands are available in Commands option in the menu panel.
- You can auto-save your open notes after turning on Auto-save option in Settings option in the menu panel.
- You can interact with the notes in the Read View by checking the checkboxes or by Ctrl+Click on any element, to quickly find it in the Code View.
- Table command usage example:
  ```
  /table;
  Name | Price | Amount
  Apple | 1.99 | 10
  Orange | 2.49 | 8
  ;/
  ```
- Image command usage example: `/img;https://some-image-url.com/image.jpg;Image caption;/`
- Link command usage example: `/link;https://some-url.com;Link caption;/`