import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Presentation, Loader2 } from "lucide-react";
import { useBbeeStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/exportExcel";
import { exportToPdf } from "@/lib/exportPdf";
import { exportToPptx } from "@/lib/exportPptx";
import { useState } from "react";

export default function Reports() {
  const { toast } = useToast();
  const state = useBbeeStore();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (type: 'pdf' | 'excel' | 'pptx') => {
    setIsExporting(type);
    
    try {
      if (type === 'pdf') {
        exportToPdf(state);
      } else if (type === 'excel') {
        exportToExcel(state);
      } else if (type === 'pptx') {
        await exportToPptx(state);
      }
      
      toast({
        title: "Export Successful",
        description: `Your ${type.toUpperCase()} file has been generated.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Reports & Exports</h1>
        <p className="text-muted-foreground mt-1">
          Generate professional scorecards, evidence packs, and presentation decks.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-panel flex flex-col border-t-4 border-t-red-500 shadow-md">
          <CardHeader>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-red-200">
              <FileText className="h-6 w-6" />
            </div>
            <CardTitle>Official Scorecard</CardTitle>
            <CardDescription>Generate a PDF certificate mockup for preview and verification.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-6">
            <Button 
              className="w-full gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors" 
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
            >
              {isExporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting === 'pdf' ? 'Generating PDF...' : 'Export PDF'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel flex flex-col border-t-4 border-t-emerald-500 shadow-md">
          <CardHeader>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-emerald-200">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <CardTitle>Evidence Calculator</CardTitle>
            <CardDescription>Export all calculations and underlying data to Excel format.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-6">
            <Button 
              className="w-full gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors" 
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={isExporting !== null}
            >
              {isExporting === 'excel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting === 'excel' ? 'Generating Excel...' : 'Export Excel'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel flex flex-col border-t-4 border-t-orange-500 shadow-md">
          <CardHeader>
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-orange-200">
              <Presentation className="h-6 w-6" />
            </div>
            <CardTitle>Board Presentation</CardTitle>
            <CardDescription>Generate a PowerPoint deck summarizing current compliance status.</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-6">
            <Button 
              className="w-full gap-2 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-colors" 
              variant="outline"
              onClick={() => handleExport('pptx')}
              disabled={isExporting !== null}
            >
              {isExporting === 'pptx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting === 'pptx' ? 'Generating PPTX...' : 'Export PPTX'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
          <CardDescription>History of generated reports for this client.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-card/50 shadow-sm overflow-hidden">
            <div className="grid grid-cols-4 p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-b bg-muted/50">
              <div className="col-span-2">Report Name</div>
              <div>Type</div>
              <div className="text-right">Date</div>
            </div>
            <div className="grid grid-cols-4 p-4 items-center text-sm border-b hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="col-span-2 font-medium flex items-center gap-3">
                <div className="bg-red-50 dark:bg-red-900/30 p-1.5 rounded-lg border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400">
                  <FileText className="h-4 w-4" />
                </div>
                {state.client.name.replace(/\s+/g, '_')}_BBBEE_Certificate.pdf
              </div>
              <div className="text-muted-foreground">PDF Report</div>
              <div className="text-right text-muted-foreground font-mono text-xs">Today, 10:24 AM</div>
            </div>
            <div className="grid grid-cols-4 p-4 items-center text-sm border-b hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="col-span-2 font-medium flex items-center gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                {state.client.name.replace(/\s+/g, '_')}_BBBEE_Export.xlsx
              </div>
              <div className="text-muted-foreground">Excel Data</div>
              <div className="text-right text-muted-foreground font-mono text-xs">Yesterday</div>
            </div>
            <div className="grid grid-cols-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="col-span-2 font-medium flex items-center gap-3">
                <div className="bg-orange-50 dark:bg-orange-900/30 p-1.5 rounded-lg border border-orange-100 dark:border-orange-900 text-orange-600 dark:text-orange-400">
                  <Presentation className="h-4 w-4" />
                </div>
                {state.client.name.replace(/\s+/g, '_')}_BBBEE_Presentation.pptx
              </div>
              <div className="text-muted-foreground">PowerPoint</div>
              <div className="text-right text-muted-foreground font-mono text-xs">Last Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}