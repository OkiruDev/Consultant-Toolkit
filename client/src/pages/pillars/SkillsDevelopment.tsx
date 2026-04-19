import { useState } from "react";
import { useBbeeStore } from "@/lib/store";
import { calculateSkillsScore } from "@/lib/calculators/skills";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GraduationCap, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function SkillsDevelopment() {
  const { skills, addTrainingProgram, removeTrainingProgram } = useBbeeStore();
  const { leviableAmount, trainingPrograms } = skills;
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProg, setNewProg] = useState({
    name: '',
    category: 'short course',
    cost: 0,
    isEmployed: true,
    isBlack: true
  });

  const targetSpend = leviableAmount * 0.035; 
  const bursaryTarget = leviableAmount * 0.025; 
  
  const totalSpend = trainingPrograms.reduce((acc, prog) => acc + prog.cost, 0);
  const bursarySpend = trainingPrograms
    .filter(p => p.category === 'bursary')
    .reduce((acc, prog) => acc + prog.cost, 0);

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'bursary': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/50';
      case 'learnership': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/50';
      case 'apprenticeship': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800/50';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700/50';
    }
  };

  const formatCurrency = (val: number) => `R ${(val / 1000).toFixed(1)}k`;

  const handleAdd = () => {
    if (!newProg.name || newProg.cost <= 0) {
      toast({ title: "Invalid input", description: "Name and cost are required.", variant: "destructive" });
      return;
    }
    
    addTrainingProgram({
      id: uuidv4(),
      name: newProg.name,
      category: newProg.category as any,
      cost: Number(newProg.cost),
      isEmployed: newProg.isEmployed,
      isBlack: newProg.isBlack
    });
    
    setNewProg({ name: '', category: 'short course', cost: 0, isEmployed: true, isBlack: true });
    setIsAddOpen(false);
    toast({ title: "Program Added", description: `${newProg.name} has been added to skills spend.` });
  };

  const score = calculateSkillsScore(skills);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Skills Development</h1>
          <p className="text-muted-foreground mt-1">
            Manage training programs, bursaries, and learnerships.
          </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-training">
              <Plus className="h-4 w-4" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Training Program</DialogTitle>
              <DialogDescription>Record a new skills development initiative.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={newProg.name} onChange={e => setNewProg({...newProg, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Category</Label>
                <Select value={newProg.category} onValueChange={(v) => setNewProg({...newProg, category: v})}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bursary">Bursary</SelectItem>
                    <SelectItem value="learnership">Learnership</SelectItem>
                    <SelectItem value="apprenticeship">Apprenticeship</SelectItem>
                    <SelectItem value="short course">Short Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">Cost (R)</Label>
                <Input id="cost" type="number" value={newProg.cost} onChange={e => setNewProg({...newProg, cost: Number(e.target.value)})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Employment</Label>
                <Select value={newProg.isEmployed ? "yes" : "no"} onValueChange={(v) => setNewProg({...newProg, isEmployed: v === "yes"})}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Employed</SelectItem>
                    <SelectItem value="no">Unemployed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Demographic</Label>
                <Select value={newProg.isBlack ? "yes" : "no"} onValueChange={(v) => setNewProg({...newProg, isBlack: v === "yes"})}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Black Individual</SelectItem>
                    <SelectItem value="no">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAdd}>Save Program</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-panel" data-testid="card-leviable-amount">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leviable Amount (Payroll)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              R {(leviableAmount / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">Base for all skills targets</p>
          </CardContent>
        </Card>

        <Card className="glass-panel" data-testid="card-general-spend">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">General Skills Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold font-heading">{formatCurrency(totalSpend)}</div>
              <div className="text-sm text-muted-foreground mb-1">/ {formatCurrency(targetSpend)}</div>
            </div>
            <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-chart-3 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (totalSpend / targetSpend) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel" data-testid="card-bursary-spend">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bursary Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold font-heading">{formatCurrency(bursarySpend)}</div>
              <div className="text-sm text-muted-foreground mb-1">/ {formatCurrency(bursaryTarget)}</div>
            </div>
            <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-chart-1 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (bursarySpend / bursaryTarget) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel mt-8 mb-8" data-testid="card-skills-detailed-scorecard">
        <CardHeader>
          <CardTitle>Detailed Scorecard Breakdown</CardTitle>
          <CardDescription>Direct translation of GP Excel toolkit calculations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <div className="bg-muted/30 px-4 py-3 border-b text-sm text-muted-foreground flex justify-between items-center">
              <span>data as at <strong className="text-foreground">24 February 2026</strong></span>
            </div>
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Indicator</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Criteria</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Target Points</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Target %</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actual Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Skills Expenditure */}
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium" rowSpan={2}>Skills Expenditure</td>
                  <td className="px-4 py-3 text-muted-foreground">Skills development expenditure on black people</td>
                  <td className="px-4 py-3 text-right font-mono">8.00</td>
                  <td className="px-4 py-3 text-right font-mono">6%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(8, (score.rawStats?.blackSpend || 0) / (leviableAmount * 0.06) * 8).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">Skills development expenditure on black women</td>
                  <td className="px-4 py-3 text-right font-mono">4.00</td>
                  <td className="px-4 py-3 text-right font-mono">3%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(4, (score.rawStats?.blackWomenSpend || 0) / (leviableAmount * 0.03) * 4).toFixed(2)}</td>
                </tr>
                
                {/* Bursaries */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium">Bursaries</td>
                  <td className="px-4 py-3 text-muted-foreground">Bursaries or scholarships for black people</td>
                  <td className="px-4 py-3 text-right font-mono">4.00</td>
                  <td className="px-4 py-3 text-right font-mono">2.5%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{score.bursaries.toFixed(2)}</td>
                </tr>

                {/* Disabled */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium">Disabled</td>
                  <td className="px-4 py-3 text-muted-foreground">Skills development expenditure on black disabled employees</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">0.3%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(2, (score.rawStats?.disabledSpend || 0) / (leviableAmount * 0.003) * 2).toFixed(2)}</td>
                </tr>

                {/* Absorption */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium">Absorption (Bonus)</td>
                  <td className="px-4 py-3 text-muted-foreground">Number of black people absorbed</td>
                  <td className="px-4 py-3 text-right font-mono">5.00</td>
                  <td className="px-4 py-3 text-right font-mono">100%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(5, (score.rawStats?.absorbedCount || 0) / 1 * 5).toFixed(2)}</td>
                </tr>

              </tbody>
              <tfoot className="bg-primary/5 font-bold border-t-2 border-primary/20">
                <tr>
                  <td className="px-4 py-4 text-primary font-medium uppercase tracking-wider" colSpan={2}>Total Skills Development Score</td>
                  <td className="px-4 py-4 text-right font-mono">23.00</td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4 text-right font-mono text-lg text-primary">{score.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel" data-testid="card-training-programs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Training Programs
          </CardTitle>
          <CardDescription>All recognized skills development initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Program Name</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Category</th>
                  <th className="h-10 px-4 text-center font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Cost</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {trainingPrograms.map((prog, idx) => (
                  <tr key={prog.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="p-4 font-medium" data-testid={`prog-name-${idx}`}>{prog.name}</td>
                    <td className="p-4">
                      <span className={cn("text-xs px-2 py-1 rounded-md border capitalize", getCategoryColor(prog.category))}>
                        {prog.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        {prog.isBlack && <Badge variant="outline" className="text-[10px]">Black</Badge>}
                        {prog.isEmployed ? (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">Employed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">Unemployed</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono font-medium">
                      R {prog.cost.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => removeTrainingProgram(prog.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}