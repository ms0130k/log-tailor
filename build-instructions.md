# Building the Executable

Follow these steps to build the Windows executable for this project.

## 1. Install `pkg`

This command installs the `pkg` tool, which is used to package the Node.js application into an executable.

```bash
npm install pkg
```

## 2. Build the Executable

This command uses `pkg` to build the application.

-   `--targets node22-win-x64`: Specifies that the target is a 64-bit Windows executable using the Node.js 18 runtime.
-   `--output log-tailor.exe`: Sets the name of the output file.

```bash
npx pkg . --targets node22-win-x64 --output log-tailor.exe
```
