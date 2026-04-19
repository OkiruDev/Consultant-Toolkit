import { useBbeeStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Target, TrendingUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export function ScorecardSummary() {
  const { scorecard } = useBbeeStore();
  const { total, achievedLevel, discountedLevel, isDiscounted, recognitionLevel, ...pillars } = scorecard;
  
  const getLevelColor = (level: number) => {
    if (level <= 2) return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800";
    if (level <= 4) return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800";
    if (level <= 6) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800";
    return "text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
  };

  const pillarsArray = [
    { name: "Ownership", key: "ownership", color: "bg-chart-1" },
    { name: "Management Control", key: "managementControl", color: "bg-chart-2" },
    { name: "Skills Development", key: "skillsDevelopment", color: "bg-chart-3" },
    { name: "Preferential Procurement", key: "procurement", color: "bg-chart-4" },
    { name: "Enterprise Development", key: "enterpriseDevelopment", color: "bg-chart-4" },
    { name: "Socio-Economic Dev", key: "socioEconomicDevelopment", color: "bg-chart-5" },
    { name: "YES Initiative", key: "yesInitiative", color: "bg-emerald-500" },
  ];

  return (
    <motion.div 
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <Card className="glass-panel overflow-hidden border-t-4 border-t-primary" data-testid="card-total-score">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-heading font-bold">{total.score.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Target: {total.weighting} points
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className={cn("glass-panel overflow-hidden border-t-4", isDiscounted ? "border-t-destructive" : "border-t-primary")} data-testid="card-bee-level">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">B-BBEE Level</CardTitle>
              <Award className={cn("h-4 w-4", isDiscounted ? "text-destructive" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className={cn("text-4xl font-heading font-bold", isDiscounted && "text-destructive")}>
                  Level {isDiscounted ? discountedLevel : achievedLevel}
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", getLevelColor(isDiscounted ? discountedLevel : achievedLevel))}>
                  {recognitionLevel}
                </span>
              </div>
              {isDiscounted ? (
                <p className="text-xs text-destructive font-medium mt-2">
                  Discounted from Level {achievedLevel}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Valid until 2025-03-31
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass-panel" data-testid="card-projection">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">+4.5 pts</div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on planned ESD spend
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass-panel" data-testid="card-compliance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sub-minimum Check</CardTitle>
              {isDiscounted ? (
                 <ShieldCheck className="h-4 w-4 text-destructive" />
              ) : (
                 <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              )}
            </CardHeader>
            <CardContent>
              {isDiscounted ? (
                 <>
                   <div className="text-2xl font-bold text-destructive">Failed</div>
                   <p className="text-xs text-destructive mt-2">
                     Discounting principle applied
                   </p>
                 </>
              ) : (
                 <>
                   <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">Passed</div>
                   <p className="text-xs text-muted-foreground mt-2">
                     All sub-minimums met
                   </p>
                 </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card className="glass-panel" data-testid="card-pillar-breakdown">
          <CardHeader>
            <CardTitle>Scorecard Breakdown</CardTitle>
            <CardDescription>Performance across all elements of the generic scorecard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pillarsArray.map((pillar) => {
              // @ts-ignore - dynamic key access
              const data = pillars[pillar.key];
              if (!data) return null;
              
              const percentage = Math.min(100, (data.score / data.weighting) * 100);
              const failedSubMin = data.subMinimumMet === false;
              
              return (
                <div key={pillar.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pillar.name}</span>
                      {failedSubMin && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400">
                          Sub-minimum Failed
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground font-mono">
                      <span className={cn("font-bold", failedSubMin ? "text-destructive" : "text-foreground")}>
                        {data.score.toFixed(2)}
                      </span> / {data.weighting}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                      className={cn("h-full rounded-full", failedSubMin ? "bg-destructive" : pillar.color)} 
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
