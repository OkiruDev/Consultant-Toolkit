import { useState } from "react";
import { useBbeeStore } from "@/lib/store";
import { calculateProcurementScore } from "@/lib/calculators/procurement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingCart, Truck, Trash2 } from "lucide-react";
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

export default function ESD() {
  const { procurement, esd, addSupplier, removeSupplier, addEsdContribution, removeEsdContribution } = useBbeeStore();
  const { tmps, suppliers } = procurement;
  const { contributions } = esd;
  const { toast } = useToast();

  const [isSupOpen, setIsSupOpen] = useState(false);
  const [newSup, setNewSup] = useState({ name: '', beeLevel: 4, blackOwnership: 0, spend: 0 });

  const [isEsdOpen, setIsEsdOpen] = useState(false);
  const [newEsd, setNewEsd] = useState({ beneficiary: '', type: 'grant', amount: 0, category: 'supplier_development' });

  const getBeeLevelColor = (level: number) => {
    if (level === 1) return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (level <= 3) return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
    if (level <= 6) return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300";
    if (level <= 8) return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300";
  };

  const getRecognitionPercentage = (level: number) => {
    const table: Record<number, number> = { 1: 135, 2: 125, 3: 110, 4: 100, 5: 80, 6: 60, 7: 50, 8: 10, 0: 0 };
    return table[level] || 0;
  };

  const totalRecognisedSpend = suppliers.reduce((acc, sup) => acc + (sup.spend * (getRecognitionPercentage(sup.beeLevel) / 100)), 0);

  const handleAddSupplier = () => {
    if (!newSup.name || newSup.spend <= 0) {
      toast({ title: "Invalid", description: "Name and spend are required.", variant: "destructive" });
      return;
    }
    addSupplier({ id: uuidv4(), name: newSup.name, beeLevel: Number(newSup.beeLevel) as any, blackOwnership: Number(newSup.blackOwnership) / 100, spend: Number(newSup.spend) });
    setNewSup({ name: '', beeLevel: 4, blackOwnership: 0, spend: 0 });
    setIsSupOpen(false);
    toast({ title: "Supplier Added", description: `${newSup.name} added to procurement.` });
  };

  const handleAddEsd = () => {
    if (!newEsd.beneficiary || newEsd.amount <= 0) {
      toast({ title: "Invalid", description: "Beneficiary and amount are required.", variant: "destructive" });
      return;
    }
    addEsdContribution({ id: uuidv4(), beneficiary: newEsd.beneficiary, type: newEsd.type as any, amount: Number(newEsd.amount), category: newEsd.category as any });
    setNewEsd({ beneficiary: '', type: 'grant', amount: 0, category: 'supplier_development' });
    setIsEsdOpen(false);
    toast({ title: "Contribution Added", description: `Added ESD contribution to ${newEsd.beneficiary}.` });
  };

  const score = calculateProcurementScore(procurement);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Enterprise & Supplier Dev</h1>
          <p className="text-muted-foreground mt-1">Manage Preferential Procurement and ESD Contributions.</p>
        </div>
        <div className="flex gap-2">
          
          <Dialog open={isSupOpen} onOpenChange={setIsSupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="btn-add-supplier">
                <ShoppingCart className="h-4 w-4" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Name</Label><Input value={newSup.name} onChange={e => setNewSup({...newSup, name: e.target.value})} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Spend (R)</Label><Input type="number" value={newSup.spend} onChange={e => setNewSup({...newSup, spend: Number(e.target.value)})} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">B-BBEE Level</Label><Input type="number" min="0" max="8" value={newSup.beeLevel} onChange={e => setNewSup({...newSup, beeLevel: Number(e.target.value)})} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Black %</Label><Input type="number" value={newSup.blackOwnership} onChange={e => setNewSup({...newSup, blackOwnership: Number(e.target.value)})} className="col-span-3" /></div>
              </div>
              <DialogFooter><Button onClick={handleAddSupplier}>Save Supplier</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEsdOpen} onOpenChange={setIsEsdOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="btn-add-contribution">
                <Plus className="h-4 w-4" /> Add Contribution
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add ESD Contribution</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Beneficiary</Label><Input value={newEsd.beneficiary} onChange={e => setNewEsd({...newEsd, beneficiary: e.target.value})} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Amount (R)</Label><Input type="number" value={newEsd.amount} onChange={e => setNewEsd({...newEsd, amount: Number(e.target.value)})} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Category</Label>
                  <Select value={newEsd.category} onValueChange={v => setNewEsd({...newEsd, category: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier_development">Supplier Development</SelectItem>
                      <SelectItem value="enterprise_development">Enterprise Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Type</Label>
                  <Select value={newEsd.type} onValueChange={v => setNewEsd({...newEsd, type: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grant">Grant</SelectItem>
                      <SelectItem value="interest_free_loan">Interest-Free Loan</SelectItem>
                      <SelectItem value="professional_services">Professional Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAddEsd}>Save Contribution</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel" data-testid="card-procurement-summary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Measured Procurement Spend (TMPS)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">
              R {(tmps / 1000000).toFixed(2)}M
            </div>
            <div className="flex justify-between items-center mt-4 text-sm border-t pt-2">
              <span className="text-muted-foreground">Recognised Spend</span>
              <span className="font-medium text-emerald-600">R {(totalRecognisedSpend / 1000000).toFixed(2)}M</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel" data-testid="card-esd-contributions-summary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">
              R {(contributions.reduce((acc, c) => acc + c.amount, 0) / 1000000).toFixed(2)}M
            </div>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-chart-4"></div>
                Supplier Dev: {contributions.filter(c => c.category === 'supplier_development').length}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-chart-2"></div>
                Enterprise Dev: {contributions.filter(c => c.category === 'enterprise_development').length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel mt-8 mb-8" data-testid="card-procurement-detailed-scorecard">
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
                {/* General Procurement */}
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium" rowSpan={4}>Preferential Procurement</td>
                  <td className="px-4 py-3 text-muted-foreground">B-BBEE Procurement Spend from all Empowering Suppliers</td>
                  <td className="px-4 py-3 text-right font-mono">5.00</td>
                  <td className="px-4 py-3 text-right font-mono">80%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(5, (score.rawStats?.spendAllBlackOwned || 0) / (tmps * 0.8) * 5).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">B-BBEE Procurement Spend from all Empowering Suppliers that are QSEs</td>
                  <td className="px-4 py-3 text-right font-mono">3.00</td>
                  <td className="px-4 py-3 text-right font-mono">15%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(3, (score.rawStats?.spendQSE || 0) / (tmps * 0.15) * 3).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">B-BBEE Procurement Spend from all Empowering Suppliers that are EMEs</td>
                  <td className="px-4 py-3 text-right font-mono">4.00</td>
                  <td className="px-4 py-3 text-right font-mono">15%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(4, (score.rawStats?.spendEME || 0) / (tmps * 0.15) * 4).toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">B-BBEE Procurement Spend from all Empowering Suppliers that are at least 51% black owned</td>
                  <td className="px-4 py-3 text-right font-mono">11.00</td>
                  <td className="px-4 py-3 text-right font-mono">50%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(11, (score.rawStats?.spendAllBlackOwned || 0) / (tmps * 0.5) * 11).toFixed(2)}</td>
                </tr>
                
                {/* Supplier Development */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium">Supplier Development</td>
                  <td className="px-4 py-3 text-muted-foreground">Annual value of all Supplier Development Contributions</td>
                  <td className="px-4 py-3 text-right font-mono">10.00</td>
                  <td className="px-4 py-3 text-right font-mono">2%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(10, contributions.filter(c => c.category === 'supplier_development').reduce((acc, c) => acc + c.amount, 0) / (tmps * 0.02) * 10).toFixed(2)}</td>
                </tr>

                {/* Enterprise Development */}
                <tr className="hover:bg-muted/30 border-t-2">
                  <td className="px-4 py-3 font-medium">Enterprise Development</td>
                  <td className="px-4 py-3 text-muted-foreground">Annual value of Enterprise Development Contributions and Sector Specific Programmes</td>
                  <td className="px-4 py-3 text-right font-mono">5.00</td>
                  <td className="px-4 py-3 text-right font-mono">1%</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">{Math.min(5, contributions.filter(c => c.category === 'enterprise_development').reduce((acc, c) => acc + c.amount, 0) / (tmps * 0.01) * 5).toFixed(2)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-primary/5 font-bold border-t-2 border-primary/20">
                <tr>
                  <td className="px-4 py-4 text-primary font-medium uppercase tracking-wider" colSpan={2}>Total ESD Score</td>
                  <td className="px-4 py-4 text-right font-mono">29.00</td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4 text-right font-mono text-lg text-primary">{score.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-panel" data-testid="card-top-suppliers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Supplier</th>
                    <th className="h-10 px-4 text-center font-medium text-muted-foreground">Lvl</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Spend</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Rec.</th>
                    <th className="h-10 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((sup) => {
                    const recognition = getRecognitionPercentage(sup.beeLevel);
                    const recognisedValue = sup.spend * (recognition / 100);
                    return (
                      <tr key={sup.id} className="border-b last:border-0 hover:bg-muted/30 group">
                        <td className="p-4 font-medium">{sup.name}</td>
                        <td className="p-4 text-center">
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border", getBeeLevelColor(sup.beeLevel))}>
                            L{sup.beeLevel}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono">{(sup.spend / 1000).toFixed(0)}k</td>
                        <td className="p-4 text-right font-medium font-mono text-emerald-600">{(recognisedValue / 1000).toFixed(0)}k</td>
                        <td className="p-2 text-right">
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => removeSupplier(sup.id)}><Trash2 className="h-3 w-3" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel" data-testid="card-esd-ledger">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              ESD Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Beneficiary</th>
                    <th className="h-10 px-4 text-center font-medium text-muted-foreground">Type</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="h-10 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 group">
                      <td className="p-4 font-medium">{c.beneficiary}</td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="text-[10px] capitalize">{c.category.split('_')[0]}</Badge>
                      </td>
                      <td className="p-4 text-right font-mono font-medium">R {c.amount.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => removeEsdContribution(c.id)}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}