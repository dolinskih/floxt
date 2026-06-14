# Floxt
Fast and capable note-taking app for Windows and Linux.

![Floxt logo](https://github.com/dolinskih/floxt/blob/main/floxt/public/icon-192x192.png)

## Installation
### Desktop app
Go to the [Releases page](https://github.com/dolinskih/floxt/releases/latest) of the repository and choose Floxt either for Windows or Linux!
### Development environment
1. On your system, install Node.js and npm.
2. Download Floxt repository and open floxt folder in the terminal.
3. Run `npm install` in the terminal.

**All needed files are now installed!**

## Running development environment
To run the development environment of the app run `npm run dev` in the terminal.

## Running public environment
1. Create app build using `npm run build` in the terminal.
2. Run the app using `npm run start` in the terminal.

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
