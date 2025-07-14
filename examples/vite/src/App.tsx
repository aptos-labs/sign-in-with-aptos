import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router";
import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "./lib/utils";
import SignInErrorPage from "./pages/SignInErrorPage";
import SignInPage from "./pages/SignInPage";
import WalletAdapterProvider from "./providers/WalletAdapterProvider";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletAdapterProvider>
        <SidebarProvider className={cn("dark")}>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
              </div>
            </header>
            <Routes>
              <Route path="/" element={<SignInPage />} />
              <Route path="/error" element={<SignInErrorPage />} />
            </Routes>
            <Toaster richColors />
          </SidebarInset>
        </SidebarProvider>
      </WalletAdapterProvider>
    </QueryClientProvider>
  );
}

export default App;
