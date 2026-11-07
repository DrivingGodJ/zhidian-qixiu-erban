[简体中文](README.md) | **English**

# Zhidian Qixiu Erban

A web learning platform for combustion-engine technicians transitioning to new-energy vehicles and for beginners, combining 3D disassembly, repair simulations and AI-assisted fault instruction.

[Live demo](http://47.101.135.218/) · [Detailed features, architecture and deployment](docs/readme-reference.zh-CN.md)

Created by the “智电汽修二班” teaching team for the university AI innovation/entrepreneurship and OPC AI Agent competition track.

## Features

- **Four powertrains**: BEV, PHEV, EREV and FCEV models, component lessons and quizzes.
- **Practice and assessment**: 3D repair games, beginner courses, an experienced-technician track and certification exercises.
- **AI fault instruction** accepts text, images and videos and combines visual/text models with fault-code and case knowledge.
- **Learning dashboard** tracks courses, game results, mistakes and exam preparation.
- **Teacher portal** provides application review, class codes and class progress management.

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

Students enter component lessons, quizzes and simulations through the vehicle models. Approved teachers can create classes and review progress. Authenticated users can synchronize learning records to the server.

Use `keys.example.json` as the configuration reference. Prefer placing the real `keys.json` one directory above the website root, or use server environment variables. The service supports DashScope vision and DeepSeek text responses. Never commit real keys, `ADMIN_TOKEN` or `data/db.json`; administrator tokens must not be public frontend configuration.

AI answers and virtual practice are learning aids. Actual vehicle work must follow the relevant vehicle's repair procedures and on-site safety requirements. The demo URL uses HTTP; do not enter production secrets there.

## Development and checks

The frontend uses static pages and Three.js; `server.js` is the backend entry. `data.js` and `lessons.js` hold core learning/case data; `models/` and `videos/` contain models and games.

```bash
node --check server.js
```

A syntax check does not validate live accounts, model calls or instructional effectiveness. Verify login, teacher review, progress sync, uploads and model configuration before deployment. `videos/` is a historical compatibility path that also contains engine, game and PWA assets; do not rename it based only on its name.

## Documentation and support

- [Detailed courses, layout, APIs and Windows deployment (Chinese)](docs/readme-reference.zh-CN.md)
- [Report an issue](https://github.com/DrivingGodJ/zhidian-qixiu-erban/issues)

## License and credits

Three.js is MIT-licensed; the original project describes teaching videos/images as team-created. No repository-wide software license is provided. Dependency terms do not automatically license the project code, courses or media; confirm applicable permissions before reuse.
