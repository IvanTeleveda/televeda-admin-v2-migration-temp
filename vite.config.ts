import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";
import svgr from 'vite-plugin-svgr';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
    base: "./",
    server: {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
      proxy: {
        '/televeda_admin_remote': {
          target: 'http://localhost:4201',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/televeda_admin_remote/, ''),
        },
      }
    },
    preview: {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
    },
    define: {
      "process.env.IS_PREACT": JSON.stringify("true"),
    },
    plugins: [
        react(),
        svgr(),
        federation({
            name: 'remote-televeda-admin',
            filename: 'remoteEntry.js',
            exposes: {
                './TelevedaAdmin': './src/remote/RemoteWrapper.tsx',
            },
            shared: {
                'react': {},
                'react-dom': {},
                'react-router-dom': {},
                "@ant-design/icons": {},
                "@ant-design/plots": {},
                "@ckeditor/ckeditor5-react": {},
                "@fullcalendar/common": {},
                "@fullcalendar/core": {},
                "@fullcalendar/daygrid": {},
                "@fullcalendar/interaction": {},
                "@fullcalendar/react": {},
                "@fullcalendar/timegrid": {},
                "@pankod/refine-antd": {},
                "@pankod/refine-core": {},
                "@pankod/refine-nestjsx-crud": {},
                "@pankod/refine-react-router-v6": {},
                "@pankod/refine-simple-rest": {},
                "@refinedev/antd": {},
                "@refinedev/core": {},
                "@refinedev/kbar": {},
                "@refinedev/nestjsx-crud": {},
                "@refinedev/react-router-v6": {},
                "@refinedev/simple-rest": {},
                "@uiw/react-md-editor": {},
                "antd": {},
                "axios": {},
                "ckeditor5": {},
                "craco-less": {},
                "dayjs": {},
                "dompurify": {},
                "html2canvas": {},
                "i18next": {},
                "i18next-browser-languagedetector": {},
                "i18next-xhr-backend": {},
                "jwt-decode": {},
                "moment-timezone": {},
                "parse": {},
                "prismjs": {},
                "react-email-editor": {},
                "react-i18next": {},
                "react-image-crop": {},
                "react-markdown": {},
                "react-qr-code": {},
                "react-simple-code-editor": {},
                "survey-core": {},
                "survey-creator-core": {},
                "survey-creator-react": {},
                "survey-react-ui": {},
                "uuid": {},
                "web-vitals": {}
            }
        })
    ],
    build: {
        modulePreload: false,
        target: "esnext",//"ES2022",
        cssCodeSplit: false,
        minify: false,
        assetsInlineLimit: 4000000, // ~4mb,
        rollupOptions: {
            external: ['react', 'react-dom', "react-router-dom"],
        },
    },
//  resolve: {
//    dedupe: ['react', 'react-dom', "react-router-dom"],
//  },
})