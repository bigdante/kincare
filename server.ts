import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const DB_FILE = './database.json';

  // 初始化 JSON 数据库
  let dbData: any = {
    profiles: [],
    events: [],
    medications: [],
    medicineCabinet: [],
    medicationLogs: [],
    healthRecords: [],
    medicalRecords: [],
    timelinePosts: [],
    interventions: [],
    voiceRecordings: [],
    aiConfig: {
      provider: "deepseek",
      apiKey: "",
      model: "deepseek-chat",
      baseUrl: "https://api.deepseek.com/v1",
      voice: "kore",
      isMock: true
    },
    membership: {
      plan: "free",
      expireAt: null,
      entitlements: {
        maxMembers: 2,
        aiEnabled: true,
        exportEnabled: true,
        cloudBackup: true,
        anomalyAlert: true,
        coManager: false
      },
      coManagers: [],
      status: "active"
    }
  };

  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    dbData = { ...dbData, ...JSON.parse(data) };
  } catch (error) {
    // 如果文件不存在，则创建一个空的
    await fs.writeFile(DB_FILE, JSON.stringify(dbData, null, 2));
  }

  const saveDb = async () => {
    await fs.writeFile(DB_FILE, JSON.stringify(dbData, null, 2));
  };

  // API 路由
  app.get("/api/data", (req, res) => {
    res.json(dbData);
  });

  app.post("/api/updateConfig", async (req, res) => {
    if (req.body.aiConfig) {
      dbData.aiConfig = { ...dbData.aiConfig, ...req.body.aiConfig };
    }
    if (req.body.membership) {
      dbData.membership = { ...dbData.membership, ...req.body.membership };
    }
    await saveDb();
    res.json({ success: true, aiConfig: dbData.aiConfig, membership: dbData.membership });
  });

  const createCrudRoutes = (tableName: string) => {
    if (!dbData[tableName]) {
      dbData[tableName] = [];
    }
    app.post(`/api/${tableName}`, async (req, res) => {
      const index = dbData[tableName].findIndex((item: any) => item.id === req.body.id);
      if (index >= 0) {
        dbData[tableName][index] = req.body;
      } else {
        dbData[tableName].push(req.body);
      }
      await saveDb();
      res.json({ success: true, item: req.body });
    });
    app.put(`/api/${tableName}/:id`, async (req, res) => {
      const index = dbData[tableName].findIndex((item: any) => item.id === req.params.id);
      if (index >= 0) {
        dbData[tableName][index] = { ...dbData[tableName][index], ...req.body };
        await saveDb();
      }
      res.json({ success: true, item: dbData[tableName][index] });
    });
    app.delete(`/api/${tableName}/:id`, async (req, res) => {
      dbData[tableName] = dbData[tableName].filter((item: any) => item.id !== req.params.id);
      await saveDb();
      res.json({ success: true });
    });
  };

  createCrudRoutes('profiles');
  createCrudRoutes('events');
  createCrudRoutes('medications');
  createCrudRoutes('medicineCabinet');
  createCrudRoutes('medicationLogs');
  createCrudRoutes('healthRecords');
  createCrudRoutes('medicalRecords');
  createCrudRoutes('timelinePosts');
  createCrudRoutes('interventions');
  createCrudRoutes('voiceRecordings');

  // Vite 中间件
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
