module.exports = [
"[project]/packages/console/src/lib/auth-client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authClient",
    ()=>authClient,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut,
    "signUp",
    ()=>signUp,
    "useSession",
    ()=>useSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$better$2d$auth$40$1$2e$5$2e$0_$40$prisma$2b$client$40$7$2e$4$2e$2_prisma$40$7$2e$4$2e$2_$40$types$2b$react$40$19$2e$2$2e$14_react$2d$dom$40$19$2e$2_d49a2ca6640c075047bec5b67ba8bb35$2f$node_modules$2f$better$2d$auth$2f$dist$2f$client$2f$react$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/better-auth@1.5.0_@prisma+client@7.4.2_prisma@7.4.2_@types+react@19.2.14_react-dom@19.2_d49a2ca6640c075047bec5b67ba8bb35/node_modules/better-auth/dist/client/react/index.mjs [app-ssr] (ecmascript) <locals>");
;
const authClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$better$2d$auth$40$1$2e$5$2e$0_$40$prisma$2b$client$40$7$2e$4$2e$2_prisma$40$7$2e$4$2e$2_$40$types$2b$react$40$19$2e$2$2e$14_react$2d$dom$40$19$2e$2_d49a2ca6640c075047bec5b67ba8bb35$2f$node_modules$2f$better$2d$auth$2f$dist$2f$client$2f$react$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createAuthClient"])({
    baseURL: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : ("TURBOPACK compile-time value", "http://localhost:7353") || 'http://localhost:3000'
});
const { signIn, signUp, signOut, useSession } = authClient;
}),
"[project]/packages/console/src/app/(dashboard)/layout.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_babel-plugin-react-compiler@1.0.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_babel-plugin-react-compiler@1.0.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_babel-plugin-react-compiler@1.0.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$config$2d$provider$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__$3c$export__default__as__ConfigProvider$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/antd@6.3.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/antd/es/config-provider/index.js [app-ssr] (ecmascript) <locals> <export default as ConfigProvider>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$layout$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layout$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/antd@6.3.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/antd/es/layout/index.js [app-ssr] (ecmascript) <export default as Layout>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$menu$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/antd@6.3.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/antd/es/menu/index.js [app-ssr] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$button$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__$3c$export__default__as__Button$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/antd@6.3.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/antd/es/button/index.js [app-ssr] (ecmascript) <locals> <export default as Button>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$typography$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/antd@6.3.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/antd/es/typography/index.js [app-ssr] (ecmascript) <export default as Typography>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$dropdown$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Dropdown$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/antd@6.3.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/antd/es/dropdown/index.js [app-ssr] (ecmascript) <export default as Dropdown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$avatar$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Avatar$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/antd@6.3.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/antd/es/avatar/index.js [app-ssr] (ecmascript) <export default as Avatar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$theme$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__theme$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/antd@6.3.1_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/antd/es/theme/index.js [app-ssr] (ecmascript) <export default as theme>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$DashboardOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DashboardOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/DashboardOutlined.js [app-ssr] (ecmascript) <export default as DashboardOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$TeamOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TeamOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/TeamOutlined.js [app-ssr] (ecmascript) <export default as TeamOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$ProjectOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ProjectOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/ProjectOutlined.js [app-ssr] (ecmascript) <export default as ProjectOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$FileTextOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileTextOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/FileTextOutlined.js [app-ssr] (ecmascript) <export default as FileTextOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$BookOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/BookOutlined.js [app-ssr] (ecmascript) <export default as BookOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$ExperimentOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ExperimentOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/ExperimentOutlined.js [app-ssr] (ecmascript) <export default as ExperimentOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$MenuFoldOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuFoldOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/MenuFoldOutlined.js [app-ssr] (ecmascript) <export default as MenuFoldOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$MenuUnfoldOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuUnfoldOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/MenuUnfoldOutlined.js [app-ssr] (ecmascript) <export default as MenuUnfoldOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$SettingOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__SettingOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/SettingOutlined.js [app-ssr] (ecmascript) <export default as SettingOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$SunOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__SunOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/SunOutlined.js [app-ssr] (ecmascript) <export default as SunOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$MoonOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MoonOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/MoonOutlined.js [app-ssr] (ecmascript) <export default as MoonOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$LogoutOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogoutOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/LogoutOutlined.js [app-ssr] (ecmascript) <export default as LogoutOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$UserOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserOutlined$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@ant-design+icons@6.1.0_react-dom@19.2.3_react@19.2.3__react@19.2.3/node_modules/@ant-design/icons/es/icons/UserOutlined.js [app-ssr] (ecmascript) <export default as UserOutlined>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$console$2f$src$2f$lib$2f$auth$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/console/src/lib/auth-client.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const { Sider, Content, Header } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$layout$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layout$3e$__["Layout"];
const { Text } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$typography$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__["Typography"];
function DashboardLayout({ children }) {
    const [collapsed, setCollapsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [themeMode, setThemeMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('light');
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const { data: session, isPending } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$console$2f$src$2f$lib$2f$auth$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSession"])();
    if (isPending) return null;
    if (!session?.user) {
        router.push('/login');
        return null;
    }
    const menuItems = [
        {
            key: '/dashboard',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$DashboardOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__DashboardOutlined$3e$__["DashboardOutlined"], {}, void 0, false, {
                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                lineNumber: 43,
                columnNumber: 36
            }, this),
            label: 'Dashboard'
        },
        {
            key: '/dashboard/teams',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$TeamOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TeamOutlined$3e$__["TeamOutlined"], {}, void 0, false, {
                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                lineNumber: 44,
                columnNumber: 42
            }, this),
            label: 'Teams'
        },
        {
            key: '/dashboard/projects',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$ProjectOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ProjectOutlined$3e$__["ProjectOutlined"], {}, void 0, false, {
                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                lineNumber: 45,
                columnNumber: 45
            }, this),
            label: 'Projects'
        },
        {
            key: '/dashboard/notes',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$FileTextOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__FileTextOutlined$3e$__["FileTextOutlined"], {}, void 0, false, {
                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                lineNumber: 46,
                columnNumber: 42
            }, this),
            label: 'Notes'
        },
        {
            key: '/dashboard/stories',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$BookOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__BookOutlined$3e$__["BookOutlined"], {}, void 0, false, {
                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                lineNumber: 47,
                columnNumber: 44
            }, this),
            label: 'Stories'
        },
        {
            key: '/dashboard/tests',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$ExperimentOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ExperimentOutlined$3e$__["ExperimentOutlined"], {}, void 0, false, {
                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                lineNumber: 48,
                columnNumber: 42
            }, this),
            label: 'Tests'
        }
    ];
    const handleLogout = async ()=>{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$console$2f$src$2f$lib$2f$auth$2d$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signOut"])();
        router.push('/login');
    };
    const userMenuItems = [
        {
            key: 'profile',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$UserOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserOutlined$3e$__["UserOutlined"], {}, void 0, false, {
                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                lineNumber: 59,
                columnNumber: 19
            }, this),
            label: session.user.name || session.user.email,
            disabled: true
        },
        {
            type: 'divider'
        },
        {
            key: 'logout',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$LogoutOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__LogoutOutlined$3e$__["LogoutOutlined"], {}, void 0, false, {
                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                lineNumber: 66,
                columnNumber: 19
            }, this),
            label: '退出登录',
            danger: true,
            onClick: handleLogout
        }
    ];
    const antdTheme = {
        algorithm: themeMode === 'dark' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$theme$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__theme$3e$__["theme"].darkAlgorithm : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$theme$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__theme$3e$__["theme"].defaultAlgorithm,
        token: {
            borderRadius: 8,
            colorPrimary: '#1677ff',
            fontFamily: 'var(--font-sans)'
        },
        cssVar: {
            prefix: 'ockham'
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$config$2d$provider$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__$3c$export__default__as__ConfigProvider$3e$__["ConfigProvider"], {
        theme: antdTheme,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$layout$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layout$3e$__["Layout"], {
            style: {
                minHeight: '100vh'
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Sider, {
                    collapsible: true,
                    collapsed: collapsed,
                    onCollapse: setCollapsed,
                    trigger: null,
                    width: 220,
                    style: {
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 100,
                        overflow: 'auto'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                height: 56,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                padding: collapsed ? 0 : '0 24px',
                                fontWeight: 700,
                                fontSize: collapsed ? 16 : 20,
                                letterSpacing: -0.5,
                                userSelect: 'none'
                            },
                            children: collapsed ? 'O' : 'Ockham'
                        }, void 0, false, {
                            fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                            lineNumber: 101,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$menu$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                            mode: "inline",
                            selectedKeys: [
                                pathname
                            ],
                            items: menuItems,
                            onClick: ({ key })=>router.push(key),
                            style: {
                                borderRight: 0
                            }
                        }, void 0, false, {
                            fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                            lineNumber: 116,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                position: 'absolute',
                                bottom: 16,
                                left: 0,
                                right: 0,
                                padding: collapsed ? '0 8px' : '0 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$button$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__$3c$export__default__as__Button$3e$__["Button"], {
                                    type: "text",
                                    icon: themeMode === 'dark' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$SunOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__SunOutlined$3e$__["SunOutlined"], {}, void 0, false, {
                                        fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                        lineNumber: 137,
                                        columnNumber: 58
                                    }, void 0) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$MoonOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MoonOutlined$3e$__["MoonOutlined"], {}, void 0, false, {
                                        fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                        lineNumber: 137,
                                        columnNumber: 76
                                    }, void 0),
                                    block: true,
                                    style: {
                                        textAlign: 'left'
                                    },
                                    onClick: ()=>setThemeMode(themeMode === 'dark' ? 'light' : 'dark'),
                                    children: !collapsed && (themeMode === 'dark' ? 'Light' : 'Dark')
                                }, void 0, false, {
                                    fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                    lineNumber: 135,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$button$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__$3c$export__default__as__Button$3e$__["Button"], {
                                    type: "text",
                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$SettingOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__SettingOutlined$3e$__["SettingOutlined"], {}, void 0, false, {
                                        fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                        lineNumber: 146,
                                        columnNumber: 35
                                    }, void 0),
                                    block: true,
                                    style: {
                                        textAlign: 'left'
                                    },
                                    children: !collapsed && 'Settings'
                                }, void 0, false, {
                                    fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                    lineNumber: 144,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                            lineNumber: 123,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                    lineNumber: 86,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$layout$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Layout$3e$__["Layout"], {
                    style: {
                        marginLeft: collapsed ? 80 : 220,
                        transition: 'margin-left 0.2s',
                        minHeight: '100vh'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Header, {
                            style: {
                                padding: '0 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                height: 56,
                                lineHeight: '56px',
                                flexShrink: 0
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$button$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__$3c$export__default__as__Button$3e$__["Button"], {
                                    type: "text",
                                    icon: collapsed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$MenuUnfoldOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuUnfoldOutlined$3e$__["MenuUnfoldOutlined"], {}, void 0, false, {
                                        fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                        lineNumber: 174,
                                        columnNumber: 47
                                    }, void 0) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$MenuFoldOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuFoldOutlined$3e$__["MenuFoldOutlined"], {}, void 0, false, {
                                        fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                        lineNumber: 174,
                                        columnNumber: 72
                                    }, void 0),
                                    onClick: ()=>setCollapsed(!collapsed)
                                }, void 0, false, {
                                    fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                    lineNumber: 172,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$dropdown$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Dropdown$3e$__["Dropdown"], {
                                    menu: {
                                        items: userMenuItems
                                    },
                                    trigger: [
                                        'click'
                                    ],
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$antd$40$6$2e$3$2e$1_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$antd$2f$es$2f$avatar$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Avatar$3e$__["Avatar"], {
                                                size: "small",
                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$ant$2d$design$2b$icons$40$6$2e$1$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f40$ant$2d$design$2f$icons$2f$es$2f$icons$2f$UserOutlined$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__UserOutlined$3e$__["UserOutlined"], {}, void 0, false, {
                                                    fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                                    lineNumber: 179,
                                                    columnNumber: 60
                                                }, void 0)
                                            }, void 0, false, {
                                                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                                lineNumber: 179,
                                                columnNumber: 33
                                            }, this),
                                            !collapsed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Text, {
                                                style: {
                                                    fontSize: 13
                                                },
                                                children: session.user.name
                                            }, void 0, false, {
                                                fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                                lineNumber: 181,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                        lineNumber: 178,
                                        columnNumber: 29
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                                    lineNumber: 177,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                            lineNumber: 161,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_babel$2d$plugin$2d$react$2d$compiler$40$1$2e$0$2e$0_react$2d$dom$40$19$2e$2$2e$3_react$40$19$2e$2$2e$3_$5f$react$40$19$2e$2$2e$3$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Content, {
                            style: {
                                padding: 24,
                                overflow: 'auto'
                            },
                            children: children
                        }, void 0, false, {
                            fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                            lineNumber: 186,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
                    lineNumber: 154,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
            lineNumber: 85,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/packages/console/src/app/(dashboard)/layout.tsx",
        lineNumber: 84,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=packages_console_src_7dd0a88f._.js.map