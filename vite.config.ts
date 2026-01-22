import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

// 创建一个插件来添加 API 端点
function fileSavePlugin() {
  return {
    name: 'file-save-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 处理 CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        // API 端点：获取当天的抽奖结果
        if (req.url === '/api/get-result' && req.method === 'GET') {
          const dateStr = new Date().toISOString().slice(0, 10);
          const fileName = `抽奖结果_${dateStr}.txt`;
          const filePath = join(process.cwd(), 'results', fileName);

          if (existsSync(filePath)) {
            const content = readFileSync(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(content);
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
          }
          return;
        }

        // API 端点：保存抽奖结果
        if (req.url === '/api/save-result' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { content } = JSON.parse(body);
              const resultsDir = join(process.cwd(), 'results');

              // 确保目录存在
              if (!existsSync(resultsDir)) {
                mkdirSync(resultsDir, { recursive: true });
              }

              // 只保存一个带日期的文件名（每天一个文件）
              const now = new Date();
              const dateStr = now.toISOString().slice(0, 10);
              const fileName = `抽奖结果_${dateStr}.txt`;
              const filePath = join(resultsDir, fileName);

              // 写入文件（覆盖）
              writeFileSync(filePath, content, 'utf-8');

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                fileName: fileName,
                path: filePath
              }));
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), fileSavePlugin()],
  optimizeDeps: {
    exclude: ['@vue/devtools-kit'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
    },
    deps: {
      interopDefault: true,
    },
    define: {
      __VUE_PROD_DEVTOOLS_HOSTS__: '[]',
      __VUE_PROD_DEVTOOLS__: 'false',
    },
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        url: 'http://localhost:3000',
      },
    },
    sequence: {
      shuffle: false,
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'utils': ['zod', '@vueuse/core'],
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
