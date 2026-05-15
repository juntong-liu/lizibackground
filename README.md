# lizibackground

一个黑色全屏粒子背景（HTML + Canvas），带粒子流动、连线、拖尾发光、鼠标扰动和点击脉冲爆发效果。适合做个人主页、落地页、登录页背景。

## 预览

- 本项目是单文件页面：`index.html`
- 直接双击打开即可运行（推荐用本地服务器打开，动画更稳定）

## 本地运行

方式 1：直接打开

- 双击打开 `index.html`

方式 2：本地服务器（推荐）

- VS Code 安装 Live Server 插件，右键 `index.html` -> Open with Live Server
- 或者使用任意静态服务器工具启动当前目录

## 交互说明

- 鼠标移动：扰动粒子流场
- 鼠标按下：吸附/推开更明显
- 鼠标点击：触发脉冲与火花

## 自定义

修改 `index.html` 里这几处最直观：

- 背景样式：`<style>` 里 `html, body { background: ... }`
- 粒子数量：`resize()` 里的 `density` / `count`
- 连线距离：`connectParticles()` 里的 `maxDist`
- 拖尾残影：`animate()` 里 `ctx.fillStyle = "rgba(0, 0, 0, 0.14)"`（数值越小拖尾越长）

## GitHub Pages（可选）

可以直接部署成在线页面：

1. GitHub 仓库 Settings -> Pages
2. Source 选择 `Deploy from a branch`
3. Branch 选择 `main`，文件夹选择 `/ (root)`
4. 保存后等待生成访问链接
