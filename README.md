**简体中文** | [English](README.en.md)

# 智电汽修二班

面向燃油车技师“油转电”和新能源汽车维修入门的 Web 教学平台，结合 3D 拆解、维修实训游戏与 AI 故障带教。

[在线演示](http://47.101.135.218/) · [完整功能、架构与部署参考](docs/readme-reference.zh-CN.md)

本项目为“智电汽修二班”教学团队参赛作品，面向大学生 AI 创新创业组 / OPC 创新创业 AI Agent 赛道。

## 功能特性

- **四类车型**：BEV、PHEV、EREV、FCEV 的整车模型、部件课程和随堂测验。
- **实训与考核**：3D 维修小游戏、新手体系课、老师傅进阶通道和考证练习。
- **AI 故障带教**：文字、图片和视频输入，结合故障码知识库与案例，使用视觉/文字模型提供教学回答。
- **学习看板**：学习进度、游戏成绩、错题和备考记录。
- **教师端**：教师申请审核、班级码与班级学习进度管理。

## 快速开始

需要 **Node.js 18+**；后端仅使用内置模块，无需 `npm install`。在仓库根目录运行：

```bash
node server.js
```

默认监听 80 端口，学生端为 `http://localhost/`，教师端为 `http://localhost/teacher.html`。可通过 `PORT` 环境变量改端口，例如在 PowerShell 中：

```powershell
$env:PORT = '8080'
node server.js
```

此时打开 `http://localhost:8080/`。未配置密钥也可启动；AI 与教师审核功能不可用。

## 使用说明

学生从车型和部件课程进入知识学习、测验与实训；教师通过审核后创建班级并查看进度。登录后可将学习记录同步到服务端。

按 `keys.example.json` 配置所需服务，真实 `keys.json` 优先放在网站根目录的上一级；也可使用服务端环境变量。服务支持 DashScope 视觉识别和 DeepSeek 文字问答。真实 Key、`ADMIN_TOKEN` 和用户库 `data/db.json` 不应提交到 GitHub；管理员令牌不得作为前端公开配置。

平台中的 AI 回答与虚拟实训用于学习，实际车辆操作须遵循相应车型的维修规范与现场安全要求。默认演示地址使用 HTTP，请不要在演示站填写生产密钥。

## 开发与验证

前端为静态页面与 Three.js，后端入口为 `server.js`；课程/案例数据主要在 `data.js`、`lessons.js`，车型与游戏位于 `models/`、`videos/`。

```bash
node --check server.js
```

语法检查不等于真实账号、模型调用和维修教学有效性验收。上线前单独验证登录、教师审核、进度同步、上传和模型配置。`videos/` 是兼容历史路径，也存放引擎、游戏与 PWA 资源，不能只按目录名称重命名。

## 文档与支持

- [完整课程功能、目录、API 与 Windows 部署参考](docs/readme-reference.zh-CN.md)
- [问题反馈](https://github.com/DrivingGodJ/zhidian-qixiu-erban/issues)

## 许可与致谢

Three.js 遵循 MIT 许可，教学视频和图片按原项目说明为团队自制。当前仓库未提供整仓软件许可证；依赖许可不自动覆盖项目代码、课程与媒体。再使用前请确认相应授权。
