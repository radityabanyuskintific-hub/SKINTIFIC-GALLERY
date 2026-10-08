import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Gallery } from "../src/components/gallery";
import "../src/app/globals.css";

const router = {bfcacheId:"test",back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push(url: string) {window.location.href=url;}, replace(url: string) {window.location.href=url;}, prefetch() {}};
const guest = new URLSearchParams(window.location.search).has("guest");
createRoot(document.getElementById("root")!).render(<AppRouterContext.Provider value={router}><Gallery userId={guest ? null : "a1111111-1111-4111-8111-111111111111"} email={guest ? null : "test-member@example.invalid"} canManage={!guest} /></AppRouterContext.Provider>);
