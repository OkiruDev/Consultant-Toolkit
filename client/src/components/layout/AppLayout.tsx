import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background pointer-events-none -z-10" />
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto max-w-6xl relative z-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
