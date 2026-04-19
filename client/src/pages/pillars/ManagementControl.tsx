import { useState } from "react";
import { useBbeeStore } from "@/lib/store";
import { calculateManagementScore } from "@/lib/calculators/management";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter, Trash2 } from "lucide-react";
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

export default function ManagementControl() {
  const { management, addEmployee, removeEmployee } = useBbeeStore();
  const { toast } = useToast();
  const { employees } = management;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({
    name: '',
    gender: 'Female',
    race: 'African',
    designation: 'Senior',
    isDisabled: false
  });

  // Group employees by designation
  const groupedEmployees = employees.reduce((acc, emp) => {
    if (!acc[emp.designation]) {
      acc[emp.designation] = [];
    }
    acc[emp.designation].push(emp);
    return acc;
  }, {} as Record<string, typeof employees>);

  const designations = ['Board', 'Executive', 'Senior', 'Middle', 'Junior'];

  const getRaceColor = (race: string) => {
    switch(race) {
      case 'African': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Coloured': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'Indian': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const handleAdd = () => {
    if (!newEmp.name) {
      toast({ title: "Invalid input", description: "Name is required.", variant: "destructive" });
      return;
    }
    
    addEmployee({
      id: uuidv4(),
      name: newEmp.name,
      gender: newEmp.gender as any,
      race: newEmp.race as any,
      designation: newEmp.designation as any,
      isDisabled: newEmp.isDisabled
    });
    
    setNewEmp({ name: '', gender: 'Female', race: 'African', designation: 'Senior', isDisabled: false });
    setIsAddOpen(false);
    toast({ title: "Employee Added", description: `${newEmp.name} has been added.` });
  };

  const score = calculateManagementScore(management);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Management Control</h1>
          <p className="text-muted-foreground mt-1">
            Track workforce demographics across occupational levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" data-testid="btn-filter-employees">
            <Filter className="h-4 w-4" />
            Filter
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="btn-add-employee">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Employee</DialogTitle>
                <DialogDescription>
                  Enter the details for the new employee to see the impact on demographics.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Level</Label>
                  <Select value={newEmp.designation} onValueChange={(v) => setNewEmp({...newEmp, designation: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Board">Board</SelectItem>
                      <SelectItem value="Executive">Executive</SelectItem>
                      <SelectItem value="Senior">Senior Management</SelectItem>
                      <SelectItem value="Middle">Middle Management</SelectItem>
                      <SelectItem value="Junior">Junior Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Race</Label>
                  <Select value={newEmp.race} onValueChange={(v) => setNewEmp({...newEmp, race: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="African">African</SelectItem>
                      <SelectItem value="Coloured">Coloured</SelectItem>
                      <SelectItem value="Indian">Indian</SelectItem>
                      <SelectItem value="White">White</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Gender</Label>
                  <Select value={newEmp.gender} onValueChange={(v) => setNewEmp({...newEmp, gender: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Disabled</Label>
                  <Select value={newEmp.isDisabled ? "yes" : "no"} onValueChange={(v) => setNewEmp({...newEmp, isDisabled: v === "yes"})}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAdd}>Save Employee</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Board</p>
            <p className="text-2xl font-bold font-mono text-primary">{score.board.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Exec</p>
            <p className="text-2xl font-bold font-mono text-primary">{score.executive.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Senior</p>
            <p className="text-2xl font-bold font-mono text-primary">{score.senior.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Middle</p>
            <p className="text-2xl font-bold font-mono text-primary">{score.middle.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Junior</p>
            <p className="text-2xl font-bold font-mono text-primary">{score.junior.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground shadow-md">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-medium uppercase tracking-wider mb-1 opacity-80">Total Score</p>
            <p className="text-3xl font-bold font-mono">{score.total.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel mt-8 mb-8" data-testid="card-mc-detailed-scorecard">
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
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actual %</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actual Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Board Participation */}
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium" rowSpan={2}>Board Participation</td>
                  <td className="px-4 py-3 text-muted-foreground">Exercisable voting rights of Black board members</td>
                  <td className="px-4 py-3 text-right font-mono">1.00</td>
                  <td className="px-4 py-3 text-right font-mono">50%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.boardBlackVotingPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(1, (score.rawStats?.boardBlackVotingPercentage || 0) / 0.5 * 1).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">Exercisable voting rights of Black female board members</td>
                  <td className="px-4 py-3 text-right font-mono">1.00</td>
                  <td className="px-4 py-3 text-right font-mono">25%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.boardBlackWomenVotingPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(1, (score.rawStats?.boardBlackWomenVotingPercentage || 0) / 0.25 * 1).toFixed(2)}</td>
                </tr>
                
                {/* Other Executive Management */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium" rowSpan={2}>Other Executive Management</td>
                  <td className="px-4 py-3 text-muted-foreground">Black Executive Management as a % of all executives</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">60%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.execBlackVotingPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(2, (score.rawStats?.execBlackVotingPercentage || 0) / 0.6 * 2).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">Black female Executive Management as a % of all executives</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">30%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.execBlackWomenVotingPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(2, (score.rawStats?.execBlackWomenVotingPercentage || 0) / 0.3 * 2).toFixed(2)}</td>
                </tr>
                
                {/* Senior Management */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium" rowSpan={2}>Senior Management</td>
                  <td className="px-4 py-3 text-muted-foreground">Black employees in Senior Management as a % of all senior management</td>
                  <td className="px-4 py-3 text-right font-mono">2.50</td>
                  <td className="px-4 py-3 text-right font-mono">60%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.seniorBlackPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(2.5, (score.rawStats?.seniorBlackPercentage || 0) / 0.6 * 2.5).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">Black female employees in Senior Management</td>
                  <td className="px-4 py-3 text-right font-mono">2.50</td>
                  <td className="px-4 py-3 text-right font-mono">30%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.seniorBlackWomenPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(2.5, (score.rawStats?.seniorBlackWomenPercentage || 0) / 0.3 * 2.5).toFixed(2)}</td>
                </tr>

                {/* Middle Management */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium" rowSpan={2}>Middle Management</td>
                  <td className="px-4 py-3 text-muted-foreground">Black employees in Middle Management</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">75%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.middleBlackPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(2, (score.rawStats?.middleBlackPercentage || 0) / 0.75 * 2).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">Black female employees in Middle Management</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">38%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.middleBlackWomenPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(2, (score.rawStats?.middleBlackWomenPercentage || 0) / 0.38 * 2).toFixed(2)}</td>
                </tr>

                {/* Junior Management */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium" rowSpan={2}>Junior Management</td>
                  <td className="px-4 py-3 text-muted-foreground">Black employees in Junior Management</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">88%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.juniorBlackPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(2, (score.rawStats?.juniorBlackPercentage || 0) / 0.88 * 2).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">Black female employees in Junior Management</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">44%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.juniorBlackWomenPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(2, (score.rawStats?.juniorBlackWomenPercentage || 0) / 0.44 * 2).toFixed(2)}</td>
                </tr>

                {/* Employees with disabilities */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium">Disabled Employees</td>
                  <td className="px-4 py-3 text-muted-foreground">Black employees with disabilities</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">2%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.disabledBlackPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{score.disabled.toFixed(2)}</td>
                </tr>

              </tbody>
              <tfoot className="bg-primary/5 font-bold border-t-2 border-primary/20">
                <tr>
                  <td className="px-4 py-4 text-primary font-medium uppercase tracking-wider" colSpan={2}>Total Management Control Score</td>
                  <td className="px-4 py-4 text-right font-mono">19.00</td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4 text-right font-mono text-lg text-primary">{score.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {designations.map((level) => {
          const levelEmployees = groupedEmployees[level] || [];
          if (levelEmployees.length === 0) return null;

          const total = levelEmployees.length;
          const blackCount = levelEmployees.filter(e => ['African', 'Coloured', 'Indian'].includes(e.race)).length;
          const femaleCount = levelEmployees.filter(e => e.gender === 'Female').length;

          return (
            <Card key={level} className="glass-panel" data-testid={`card-level-${level.toLowerCase()}`}>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {level} Management
                    <Badge variant="secondary" className="ml-2 rounded-full px-2 py-0.5 text-xs font-normal">
                      {total} Total
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div>Black: <span className="font-semibold text-foreground">{(blackCount/total*100).toFixed(0)}%</span></div>
                    <div>Female: <span className="font-semibold text-foreground">{(femaleCount/total*100).toFixed(0)}%</span></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {levelEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center p-3 rounded-lg border bg-card/50 hover:bg-card hover-elevate transition-all group">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3 shrink-0">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{emp.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-sm font-medium", getRaceColor(emp.race))}>
                            {emp.race.charAt(0)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {emp.gender.charAt(0)} {emp.isDisabled ? '• Disabled' : ''}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive shrink-0" onClick={() => removeEmployee(emp.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}