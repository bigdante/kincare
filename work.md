# KinCare 孝心守护 - 手机端 App 部署与打包完整实战指南

本项目是一个基于 **React 18 + TypeScript + Tailwind CSS** 构建的适老化家庭用药与慢病健康管理系统。系统天然支持 **PWA (Progressive Web App)**，并可通过 **Capacitor** 零代码改造一键打包为原生 **Android APK** 或 **iOS App** 安装至手机。

---

## 目录
1. [方案一：极速免打包安装为手机桌面 App (PWA 模式 - 最推荐)](#方案一极速免打包安装为手机桌面-app-pwa-模式---最推荐)
2. [方案二：使用 Capacitor 打包为原生 Android APK / iOS 应用](#方案二使用-capacitor-打包为原生-android-apk--ios-应用)
3. [方案三：服务器/云平台部署（供全家人远程访问）](#方案三服务器云平台部署供全家人远程访问)
4. [到点自动闹钟提醒机制与手机端保活配置](#到点自动闹钟提醒机制与手机端保活配置)
5. [常见问题与排查清单](#常见问题与排查清单)

---

## 方案一：极速免打包安装为手机桌面 App (PWA 模式 - 最推荐)

项目已内置 Web App Manifest 和 Service Worker 支持，支持一键在手机桌面生成独立原生 App 图标，具备独立窗口、离线缓存和无浏览器地址栏的原生体验。

### 1. 运行并访问项目
确保项目已启动并在手机浏览器中打开：
```bash
# 启动本地开发服务
npm run dev
# 或构建生产版本
npm run build && npm start
```

### 2. 手机端一键安装步骤
- **Android 手机（Chrome / 华为浏览器 / 小米浏览器 / Edge）**：
  1. 在手机浏览器中输入部署后的网址。
  2. 点击右上角或底部的菜单图标（`...` 或三道杠）。
  3. 选择 **「添加到主屏幕」** 或 **「安装应用」**。
  4. 手机桌面将自动生成「KinCare 孝心守护」图标，点击即可像原生 App 一样全屏沉浸式打开。

- **苹果 iPhone / iPad（Safari 浏览器）**：
  1. 在 Safari 中打开网页。
  2. 点击底部中间的 **「分享」** 按钮（方框带向上箭头）。
  3. 向下滚动，点击 **「添加到主屏幕」** (Add to Home Screen)。
  4. 点击右上角「添加」，即可在 iOS 桌面生成独立 App。

---

## 方案二：使用 Capacitor 打包为原生 Android APK / iOS 应用

如果需要打包出可在安卓手机上直接安装的 `.apk` 安装包，推荐使用官方的 **Capacitor** 方案。

### 步骤 1：安装 Capacitor 依赖
在项目根目录终端执行：
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/local-notifications
```

### 步骤 2：初始化 Capacitor 配置
```bash
npx cap init "KinCare" "com.kincare.health" --web-dir "dist"
```

### 步骤 3：构建生产 Web 资源
```bash
npm run build
```

### 步骤 4：添加 Android 原生工程
```bash
npx cap add android
```
*(如需打包 iOS 原生应用，可在 Mac 上执行 `npx cap add ios`)*

### 步骤 5：同步代码到原生项目
```bash
npx cap copy
npx cap sync
```

### 步骤 6：生成 APK 安装包
1. 打开 Android Studio：
   ```bash
   npx cap open android
   ```
2. 在 Android Studio 顶部菜单选择 **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**。
3. 构建完成后，在 `android/app/build/outputs/apk/debug/app-debug.apk` 即可找到生成的 `.apk` 文件。
4. 将该 `.apk` 文件通过微信/QQ/数据线传输至长辈或自己的手机，点击安装即可！

---

## 方案三：服务器/云平台部署（供全家人远程访问）

### 选项 A：使用 Docker 容器化一键部署
项目自带生产级 Node 运行时，可使用 Docker 进行封装：
```dockerfile
# Dockerfile 示例
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/package*.json ./
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]
```
构建并运行容器：
```bash
docker build -t kincare-app .
docker run -d -p 3000:3000 --name kincare kincare-app
```

### 选项 B：使用宝塔面板 / Nginx 快速部署
1. 执行 `npm run build` 生成 `dist` 目录。
2. 将 `dist` 目录上传至服务器网站根目录。
3. 配置 Nginx 反向代理支持 SPA 路由：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /www/wwwroot/kincare/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 到点自动闹钟提醒机制与手机端保活配置

系统已集成 **全天候到点声波警报 + 适老化大字全屏唤醒 + 智能语音播报** 三位一体机制：

### 1. 软件内的自动化工作流
- **到点轮询监测**：全局计时器每秒检查当前系统时间与所有成员的用药排程（`scheduleTimes`）。
- **闹钟开关控制**：计划创建时默认开启 `alarmEnabled`。若开启，系统会在到达预设时间的整点和整分自动触发。
- **声光双重提醒**：
  - **连续警报音效**：通过 Web Audio API 动态合成紧急脉冲频率声波（880Hz / 1760Hz 快速交替），穿透力强。
  - **全屏大字弹窗**：显示长辈照片、药品大图、服用剂量、送服方式及医嘱注意事项。
  - **真人语音播报**：自动调用语音引擎朗读：“该吃药啦！张建国请按时服用阿司匹林肠溶片，每次100mg...”。
- **测试闹钟入口**：可在「用药日程」页面顶部点击「测试闹钟」，预览并试听每个药品各个时间点的提醒效果。

### 2. 手机系统级防漏服保活设置
为了防止国产手机（华为、小米、OPPO、vivo等）在锁屏后杀死后台进程，建议在长辈手机上进行如下简单设置：
1. **开启通知权限**：进入手机设置 -> 应用管理 -> 找到本应用 -> 允许所有通知权限（包括横幅、锁屏通知、声音提醒）。
2. **电池优化白名单**：设置 -> 电池 -> 应用耗电管理 -> 找到本应用 -> 设置为 **「允许后台运行」** / **「无限制」**。
3. **自启动与关联启动**：在手机管家/权限设置中允许应用 **「自启动」** 与 **「允许后台弹出界面/悬浮窗」**。
4. **多任务界面加锁**：在手机上划出多任务后台界面，下拉本应用卡片并点击「加锁」图标，防止一键清理。

---

## 常见问题与排查清单

- **Q: 为什么苹果手机锁屏后没有声音？**  
  *A:* iOS Safari 限制锁屏静音状态下的纯 Web 音频播放。建议将网页通过 Safari 的「添加到主屏幕」生成独立 PWA，并在使用前点击一次界面以激活 AudioContext；如需完全穿透锁屏，推荐使用方案二打包为原生 Capacitor 应用并赋予本地通知权限。

- **Q: 数据如何同步到其他家人手机上？**  
  *A:* 将服务端部署在公网云服务器后，全家人打开同一个网页链接或安装同一个 App，即可实时同步所有长辈的健康数据与打卡记录。

---
*KinCare 孝心守护团队 谨制*
