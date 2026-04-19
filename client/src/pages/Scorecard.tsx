import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBbeeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Scorecard() {
  const { scorecard } = useBbeeStore();

  const elements = [
    { name: "Ownership", ...scorecard.ownership },
    { name: "Management Control", ...scorecard.managementControl },
    { name: "Skills Development", ...scorecard.skillsDevelopment },
    { name: "Enterprise & Supplier Dev", score: scorecard.procurement.score + scorecard.enterpriseDevelopment.score, target: scorecard.procurement.target + scorecard.enterpriseDevelopment.target, weighting: scorecard.procurement.weighting + scorecard.enterpriseDevelopment.weighting, subMinimumMet: scorecard.procurement.subMinimumMet },
    { name: "Socio-Economic Dev", ...scorecard.socioEconomicDevelopment },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Full Scorecard</h1>
        <p className="text-muted-foreground mt-1">
          Detailed view of your current B-BBEE scorecard calculations.
        </p>
      </div>

      <Card className="glass-panel overflow-hidden">
        <CardHeader className="bg-muted/20 border-b">
          <CardTitle>Generic Scorecard Translation</CardTitle>
          <CardDescription>Direct translation of Excel formulas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b">Element</th>
                  <th className="px-6 py-4 border-b text-right">Target</th>
                  <th className="px-6 py-4 border-b text-right">Weighting</th>
                  <th className="px-6 py-4 border-b text-right">Score</th>
                  <th className="px-6 py-4 border-b text-center">Sub-minimum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {elements.map((el) => (
                  <tr key={el.name} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{el.name}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground font-mono">{el.target}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground font-mono">{el.weighting}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">{el.score.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      {'subMinimumMet' in el && el.subMinimumMet === false ? (
                         <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-1 rounded border border-destructive/20 font-bold uppercase">Failed</span>
                      ) : 'subMinimumMet' in el && el.subMinimumMet === true ? (
                         <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded border border-emerald-200 font-bold uppercase">Passed</span>
                      ) : (
                         <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-primary/5 font-bold border-t-2 border-primary/20">
                <tr>
                  <td className="px-6 py-4 text-primary">Total Score</td>
                  <td className="px-6 py-4 text-right text-muted-foreground font-mono">{scorecard.total.target}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground font-mono">{scorecard.total.weighting}</td>
                  <td className="px-6 py-4 text-right font-mono text-lg text-primary">{scorecard.total.score.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    {scorecard.isDiscounted && (
                      <span className="text-[10px] bg-destructive text-destructive-foreground px-2 py-1 rounded font-bold uppercase shadow-sm">Discounted</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}