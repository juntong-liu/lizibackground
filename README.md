# lizibackground

黑色全屏粒子背景（HTML + Canvas），带粒子流动、连线、拖尾发光、鼠标扰动和点击脉冲爆发效果。适合做个人主页、落地页、登录页背景。

## 项目结构

```
lizibackground/
├── index.html              # 演示页（粒子背景 + 可选登录门禁）
├── js/
│   ├── particle-background.js   # 粒子背景核心组件
│   └── auth-gate.js             # 可选登录门禁组件
└── README.md
```

## 预览与运行

- 演示入口：`index.html`
- 直接双击打开即可运行（推荐用本地服务器，动画更稳定）

**方式 1**：双击 `index.html`

**方式 2（推荐）**：VS Code Live Server，或任意静态服务器启动当前目录

## 交互说明

| 操作 | 效果 |
|------|------|
| 鼠标移动 | 扰动粒子流场 |
| 鼠标按下 | 吸附/推开更明显 |
| 鼠标点击 | 触发脉冲与火花 |
| 登录成功 | 解锁完整交互（演示页默认带登录门禁） |

演示页默认账号：`admin`，密码：`123456789`

## 组件用法

### ParticleBackground

```html
<canvas id="scene"></canvas>
<script src="js/particle-background.js"></script>
<script>
  const bg = new ParticleBackground(document.getElementById("scene"), {
    trailAlpha: 0.14,   // 拖尾强度，越小拖尾越长
    maxDist: 120,       // 粒子连线最大距离
    maxParticles: 300,  // 粒子数量上限
    hueMin: 190,        // 粒子色相起点
    hueRange: 45,       // 色相随机范围
  });

  bg.emitPulse(400, 300);           // 手动触发脉冲
  bg.setInteractionEnabled(true);   // 开启/关闭鼠标交互
  bg.pause();                       // 暂停动画
  bg.resume();                      // 恢复动画
  bg.destroy();                     // 销毁实例、解绑事件
</script>
```

**配置项一览**

| 选项 | 默认值 | 说明 |
|------|--------|------|
| `particleCount` | `null` | 固定粒子数；为 `null` 时按屏幕面积自动计算 |
| `densityDivisor` | `9000` | 自动密度除数，越大粒子越少 |
| `minParticles` / `maxParticles` | `120` / `300` | 粒子数量范围 |
| `maxDist` | `120` | 连线最大距离（px） |
| `trailAlpha` | `0.14` | 每帧遮罩透明度（拖尾长度） |
| `pointerRadius` | `220` | 鼠标扰动半径 |
| `pointerRadiusDown` | `340` | 按下时扰动半径 |
| `pauseWhenHidden` | `true` | 标签页隐藏时暂停渲染 |
| `reducedMotion` | `true` | 尊重系统「减少动态效果」偏好 |

### AuthGate（可选）

```html
<script src="js/auth-gate.js"></script>
<script>
  const gate = new AuthGate({
    account: "admin",
    password: "123456789",
    onSuccess() {
      particleBg.setInteractionEnabled(true);
    },
  });
</script>
```

不需要登录门禁时，可只引用 `particle-background.js`，并省略 `auth-gate.js`。

## 自定义样式

- 页面背景：修改 `index.html` 中 `html, body { background: ... }`
- HUD / 登录面板：同文件 `<style>` 区块
- 粒子视觉：通过 `ParticleBackground` 构造参数调整

## GitHub Pages（可选）

1. 仓库 **Settings → Pages**
2. Source 选择 **Deploy from a branch**
3. Branch 选 `main`，文件夹选 **/ (root)**
4. 保存后等待生成访问链接

在线仓库：[juntong-liu/lizibackground](https://github.com/juntong-liu/lizibackground)
