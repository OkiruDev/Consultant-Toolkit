import { ScorecardSummary } from "@/components/dashboard/ScorecardSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, PlusCircle, ArrowRight, GitCompare, Database, FileDown } from "lucide-react";
import { useBbeeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/exportExcel";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { scorecard, client } = useBbeeStore();
  const { toast } = useToast();

  const handleExportData = () => {
    const state = useBbeeStore.getState();
    try {
      exportToExcel(state);
      toast({
        title: "Excel Exported",
        description: "Your B-BBEE Scorecard data has been exported to Excel.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while generating the Excel file.",
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Overview of your current B-BBEE status.
          </p>
        </div>
        <Button variant="outline" className="gap-2 rounded-full hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 shadow-sm transition-all" onClick={handleExportData}>
          <FileDown className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
          Export as Excel
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <ScorecardSummary />
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={item}>
          <Card className="glass-panel h-full" data-testid="card-scenario-planning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" />
                Scenario Planning
              </CardTitle>
              <CardDescription>Compare "What-if" interventions against Base</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-card/50 backdrop-blur-sm text-sm overflow-hidden">
                <div className="grid grid-cols-4 font-medium text-muted-foreground border-b bg-muted/30 p-3">
                  <div className="col-span-2">Scenario</div>
                  <div className="text-right">Level</div>
                  <div className="text-right">Points</div>
                </div>
                <div className="grid grid-cols-4 p-3 items-center border-b bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                  <div className="col-span-2 font-medium flex items-center gap-2">
                    Base (Current)
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Active</span>
                  </div>
                  <div className={cn("text-right font-medium", scorecard.isDiscounted && "text-destructive")}>
                    {scorecard.isDiscounted ? `${scorecard.discountedLevel} (Disc)` : scorecard.achievedLevel}
                  </div>
                  <div className="text-right font-mono text-primary flex items-center justify-end gap-1 font-bold">
                    {scorecard.total.score.toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-4 p-3 items-center hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="col-span-2 font-medium text-muted-foreground">Scenario A (Draft)</div>
                  <div className="text-right font-medium text-muted-foreground">--</div>
                  <div className="text-right font-mono text-muted-foreground">--</div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <Button className="w-full gap-2 rounded-full" variant="outline" data-testid="btn-clone-base">
                  <PlusCircle className="h-4 w-4" />
                  Clone Base
                </Button>
                <Button className="w-full bg-primary hover:bg-primary/90 rounded-full shadow-sm" data-testid="btn-compare-scenarios">
                  Side-by-Side Compare
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass-panel h-full bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Recent Toolkits
              </CardTitle>
              <CardDescription>Recently imported Excel toolkits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Q3_Forecast_v2.xlsx", date: "2 days ago", level: 4 },
                  { name: "Final_Audit_2023.xlsx", date: "1 month ago", level: 3 },
                ].map((file) => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={file.name} 
                    className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-background/80 shadow-sm cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{file.date}</p>
                    </div>
                    <div className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      Level {file.level}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
