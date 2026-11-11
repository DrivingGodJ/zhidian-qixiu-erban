[简体中文](GUIDE.zh-CN.md) | **English**

# Usage, Configuration and Development

[Back to the project](../README.en.md)

## Quick start

Requires **Node.js 18+**. The backend uses built-in modules only; no `npm install` is needed. From the repository root:

```bash
node server.js
```

The default port is 80. Open `http://localhost/` for students or `http://localhost/teacher.html` for teachers. Set `PORT` to change it, for example in PowerShell:

```powershell
$env:PORT = '8080'
node server.js
```

Then open `http://localhost:8080/`. Startup works without keys; AI and teacher-review functionality remain unavailable.

## Usage

Students open lessons, quizzes and simulations from the course catalog and can explore vehicles and components in the 3D studio. Approved teachers can create classes and review progress. Course progress is stored by account on the current device.

Use `keys.example.json` as the configuration reference. Prefer placing the real `keys.json` one directory above the website root, or use server environment variables. The service supports DashScope vision and DeepSeek text responses. Never commit real keys, `ADMIN_TOKEN` or `data/db.json`; administrator tokens must not be public frontend configuration.

AI answers and virtual practice are learning aids. Actual vehicle work must follow the relevant vehicle's repair procedures and on-site safety requirements. The demo URL uses HTTP; do not enter production secrets there.

## Development and checks

The frontend uses static pages and Three.js; `server.js` is the backend entry. `data.js` and `lessons.js` hold core learning/case data; `models/` and `videos/` contain models and games.

```bash
node --check server.js
```

A syntax check does not validate live accounts, model calls or instructional effectiveness. Verify login, teacher review, progress sync, uploads and model configuration before deployment. `videos/` is a historical compatibility path that also contains engine, game and PWA assets; do not rename it based only on its name.

## Documentation and support

- [Detailed courses, layout, APIs and Windows deployment (Chinese)](../docs/readme-reference.zh-CN.md)
- [Report an issue](https://github.com/DrivingGodJ/zhidian-qixiu-erban/issues)

## License and credits

Three.js is MIT-licensed; the original project describes teaching videos/images as team-created. No repository-wide software license is provided. Dependency terms do not automatically license the project code, courses or media; confirm applicable permissions before reuse.
