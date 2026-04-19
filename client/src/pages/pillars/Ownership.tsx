import { useState } from "react";
import { useBbeeStore } from "@/lib/store";
import { calculateOwnershipScore } from "@/lib/calculators/ownership";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
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

export default function Ownership() {
  const { ownership, addShareholder, removeShareholder, updateCompanyValue } = useBbeeStore();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSh, setNewSh] = useState({
    name: '', shares: 0, blackOwnership: 0, blackWomenOwnership: 0, shareValue: 0
  });

  const [companyVal, setCompanyVal] = useState(ownership.companyValue);
  const [debtVal, setDebtVal] = useState(ownership.outstandingDebt);

  // Dynamic Calculation
  const score = calculateOwnershipScore(ownership);

  const chartData = ownership.shareholders.map(sh => ({
    name: sh.name,
    value: sh.shares,
    blackOwnership: sh.blackOwnership
  }));

  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

  const handleAdd = () => {
    if (!newSh.name || newSh.shares <= 0) {
      toast({ title: "Invalid input", description: "Name and shares are required.", variant: "destructive" });
      return;
    }
    
    addShareholder({
      id: uuidv4(),
      name: newSh.name,
      shares: Number(newSh.shares),
      blackOwnership: Number(newSh.blackOwnership) / 100, // convert % to decimal
      blackWomenOwnership: Number(newSh.blackWomenOwnership) / 100,
      shareValue: Number(newSh.shareValue)
    });
    
    setNewSh({ name: '', shares: 0, blackOwnership: 0, blackWomenOwnership: 0, shareValue: 0 });
    setIsAddOpen(false);
    toast({ title: "Shareholder Added", description: `${newSh.name} has been added to the cap table.` });
  };

  const handleUpdateValuation = () => {
    updateCompanyValue(Number(companyVal), Number(debtVal));
    toast({ title: "Valuation Updated", description: "Company value and debt have been saved." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Ownership</h1>
          <p className="text-muted-foreground mt-1">
            Manage your company's shareholding structure and voting rights.
          </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-shareholder">
              <Plus className="h-4 w-4" />
              Add Shareholder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Shareholder</DialogTitle>
              <DialogDescription>
                Enter the details for the new shareholder. Black ownership should be entered as a percentage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={newSh.name} onChange={e => setNewSh({...newSh, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shares" className="text-right">Shares</Label>
                <Input id="shares" type="number" value={newSh.shares} onChange={e => setNewSh({...newSh, shares: Number(e.target.value)})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blackOwnership" className="text-right">Black %</Label>
                <Input id="blackOwnership" type="number" value={newSh.blackOwnership} onChange={e => setNewSh({...newSh, blackOwnership: Number(e.target.value)})} className="col-span-3" placeholder="0-100" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blackWomenOwnership" className="text-right">Black Women %</Label>
                <Input id="blackWomenOwnership" type="number" value={newSh.blackWomenOwnership} onChange={e => setNewSh({...newSh, blackWomenOwnership: Number(e.target.value)})} className="col-span-3" placeholder="0-100" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAdd}>Save Shareholder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Live Calculated Score Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Voting</p>
            <p className="text-2xl font-bold font-mono text-primary">{score.votingRights.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Economic Int.</p>
            <p className="text-2xl font-bold font-mono text-primary">{score.economicInterest.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Net Value</p>
            <p className="text-2xl font-bold font-mono text-primary">{score.netValue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className={score.subMinimumMet ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" : "bg-destructive/10 border-destructive/20"}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Sub-minimum</p>
            <p className={`text-sm font-bold mt-1 ${score.subMinimumMet ? 'text-emerald-600' : 'text-destructive'}`}>
              {score.subMinimumMet ? 'PASSED (≥3.2)' : 'FAILED (<3.2)'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground shadow-md">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-medium uppercase tracking-wider mb-1 opacity-80">Total Score</p>
            <p className="text-3xl font-bold font-mono">{score.total.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel mt-8" data-testid="card-ownership-detailed-scorecard">
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
                {/* Voting Rights */}
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">Voting Rights</td>
                  <td className="px-4 py-3 text-muted-foreground">Exercisable Voting rights in the hands of Black people</td>
                  <td className="px-4 py-3 text-right font-mono">4.00</td>
                  <td className="px-4 py-3 text-right font-mono">25% + 1 vote</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.blackVotingPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{score.votingRights.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-muted-foreground">Exercisable Voting rights in the hands of Black females</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">10%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.blackWomenVotingPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{score.womenBonus.toFixed(2)}</td>
                </tr>
                
                {/* Economic Interest */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium">Economic Interest</td>
                  <td className="px-4 py-3 text-muted-foreground">Economic interest to which Black people are entitled</td>
                  <td className="px-4 py-3 text-right font-mono">4.00</td>
                  <td className="px-4 py-3 text-right font-mono">25%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.economicInterestPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{score.economicInterest.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-muted-foreground">Economic interest to which Black women are entitled</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">10%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.blackWomenVotingPercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min((score.rawStats?.blackWomenVotingPercentage || 0) / 0.10 * 2, 2).toFixed(2)}</td>
                </tr>

                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-muted-foreground">Economic interest of Black New Entrants</td>
                  <td className="px-4 py-3 text-right font-mono">2.00</td>
                  <td className="px-4 py-3 text-right font-mono">2%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">0.00%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">0.00</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-muted-foreground">Economic interest of Black Military Veterans / Broad-Based</td>
                  <td className="px-4 py-3 text-right font-mono">3.00</td>
                  <td className="px-4 py-3 text-right font-mono">3%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">0.00%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">0.00</td>
                </tr>
                
                {/* Realisation Points */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium">Realisation Points</td>
                  <td className="px-4 py-3 text-muted-foreground">Net Value</td>
                  <td className="px-4 py-3 text-right font-mono">8.00</td>
                  <td className="px-4 py-3 text-right font-mono">100%</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{((score.rawStats?.netValuePercentage || 0) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{score.netValue.toFixed(2)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-primary/5 font-bold border-t-2 border-primary/20">
                <tr>
                  <td className="px-4 py-4 text-primary font-medium uppercase tracking-wider" colSpan={2}>Total Ownership Score</td>
                  <td className="px-4 py-4 text-right font-mono">25.00</td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4 text-right font-mono text-lg text-primary">{score.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-panel col-span-2" data-testid="card-shareholders-list">
          <CardHeader>
            <CardTitle>Shareholders</CardTitle>
            <CardDescription>Current cap table and B-BBEE recognition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Entity / Individual</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Shares</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Black %</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Black Women %</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ownership.shareholders.map((sh, idx) => (
                    <tr key={sh.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium" data-testid={`sh-name-${idx}`}>{sh.name}</td>
                      <td className="p-4 text-right">{sh.shares}</td>
                      <td className="p-4 text-right">
                        <Badge variant={sh.blackOwnership > 0 ? "default" : "secondary"}>
                          {(sh.blackOwnership * 100).toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {(sh.blackWomenOwnership * 100).toFixed(1)}%
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeShareholder(sh.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {ownership.shareholders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No shareholders added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel" data-testid="card-company-valuation">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Company Valuation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Company Value (ZAR)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={companyVal} 
                    onChange={e => setCompanyVal(Number(e.target.value))}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Outstanding Debt (ZAR)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={debtVal} 
                    onChange={e => setDebtVal(Number(e.target.value))}
                    className="font-mono"
                  />
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={handleUpdateValuation}>Update Valuation</Button>
              
              <div className="flex justify-between items-center mt-2 text-sm border-t pt-4">
                <span className="text-muted-foreground">Net Value</span>
                <span className="font-medium text-emerald-600">R {((ownership.companyValue - ownership.outstandingDebt) / 1000000).toFixed(1)}M</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel" data-testid="card-ownership-chart">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Share Split</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}`, 'Shares']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}