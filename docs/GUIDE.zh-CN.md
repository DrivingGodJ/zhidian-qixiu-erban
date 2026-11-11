**简体中文** | [English](GUIDE.en.md)

# 使用、配置与开发指南

[返回作品展示](../README.md)

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

学生从课程目录进入原理学习、测验与实训，拆解台可单独观察车型与部件。教师通过审核后可创建班级并查看进度。课程进度按账号保存在当前设备。

按 `keys.example.json` 配置所需服务，真实 `keys.json` 优先放在网站根目录的上一级；也可使用服务端环境变量。服务支持 DashScope 视觉识别和 DeepSeek 文字问答。真实 Key、`ADMIN_TOKEN` 和用户库 `data/db.json` 不应提交到 GitHub；管理员令牌不得作为前端公开配置。

平台中的 AI 回答与虚拟实训用于学习，实际车辆操作须遵循相应车型的维修规范与现场安全要求。默认演示地址使用 HTTP，请不要在演示站填写生产密钥。

## 开发与验证

前端为静态页面与 Three.js，后端入口为 `server.js`；课程/案例数据主要在 `data.js`、`lessons.js`，车型与游戏位于 `models/`、`videos/`。

```bash
node --check server.js
```

语法检查不等于真实账号、模型调用和维修教学有效性验收。上线前单独验证登录、教师审核、进度同步、上传和模型配置。`videos/` 是兼容历史路径，也存放引擎、游戏与 PWA 资源，不能只按目录名称重命名。

## 文档与支持

- [完整课程功能、目录、API 与 Windows 部署参考](../docs/readme-reference.zh-CN.md)
- [问题反馈](https://github.com/DrivingGodJ/zhidian-qixiu-erban/issues)

## 许可与致谢

Three.js 遵循 MIT 许可，教学视频和图片按原项目说明为团队自制。当前仓库未提供整仓软件许可证；依赖许可不自动覆盖项目代码、课程与媒体。再使用前请确认相应授权。
