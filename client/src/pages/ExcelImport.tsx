import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileCheck, Loader2, ArrowRight, UploadCloud, FileType, FileText, CheckCircle2, AlertCircle, X, ShieldAlert, XCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useBbeeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface ImportLog {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

interface ImportResult {
  success: boolean;
  client: any;
  shareholders: any[];
  employees: any[];
  suppliers: any[];
  esdContributions: any[];
  sedContributions: any[];
  sheetsFound: string[];
  sheetsMatched: { sheetName: string; matchedTo: string; confidence: number }[];
  errors: string[];
  warnings: string[];
  logs: ImportLog[];
  stats: {
    totalSheets: number;
    matchedSheets: number;
    entitiesExtracted: number;
    confidence: number;
  };
}

export default function ExcelImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);

  const recentImports = [
    { name: "Chengetai_Group_Scorecard_v3.xlsx", date: "Today, 09:41", status: "Success", entities: 1 },
    { name: "Supplier_List_Feb2026.csv", date: "Yesterday, 14:22", status: "Partial", entities: 42 },
    { name: "Q3_Forecast_Draft.xlsx", date: "20 Feb 2026", status: "Success", entities: 1 },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const removeFile = (name: string) => {
    setFiles(files.filter(f => f.name !== name));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv']
    },
    maxSize: 50 * 1024 * 1024
  });

  const startImport = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProgress(10);
    setLogs([{ message: 'Uploading files to server...', type: 'info', timestamp: new Date().toISOString() }]);
    setResult(null);

    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    setProgress(30);
    setLogs(prev => [...prev, { message: 'Parsing worksheets and detecting entities...', type: 'info', timestamp: new Date().toISOString() }]);

    try {
      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      const data: ImportResult = await response.json();
      
      // Merge server logs with our upload logs
      setLogs(prev => [...prev, ...data.logs]);
      setProgress(100);
      setResult(data);

      if (data.success) {
        toast({
          title: "Import Complete",
          description: `Extracted ${data.stats.entitiesExtracted} entities from ${data.stats.matchedSheets} sheets.`,
        });
      } else {
        toast({
          title: "Import Issue",
          description: data.errors[0] || "Could not extract B-BBEE data from the uploaded file.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setProgress(100);
      const errorLog: ImportLog = { message: `Network error: ${error.message}`, type: 'error', timestamp: new Date().toISOString() };
      setLogs(prev => [...prev, errorLog]);
      setResult({
        success: false,
        client: {},
        shareholders: [],
        employees: [],
        suppliers: [],
        esdContributions: [],
        sedContributions: [],
        sheetsFound: [],
        sheetsMatched: [],
        errors: ['Connection failed. Please try again.'],
        warnings: [],
        logs: [errorLog],
        stats: { totalSheets: 0, matchedSheets: 0, entitiesExtracted: 0, confidence: 0 },
      });
      toast({
        title: "Import Failed",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyAndContinue = () => {
    if (!result || !result.success) return;

    const store = useBbeeStore.getState();

    // Apply extracted financials
    if (result.client.revenue || result.client.npat || result.client.leviableAmount) {
      store.updateFinancials(
        result.client.revenue || store.client.revenue,
        result.client.npat !== undefined ? result.client.npat : store.client.npat,
        result.client.leviableAmount || store.client.leviableAmount
      );
    }
    if (result.client.industrySector) {
      store.updateSettings(store.client.eapProvince, result.client.industrySector);
    }

    // Apply shareholders
    if (result.shareholders.length > 0) {
      for (const sh of result.shareholders) {
        store.addShareholder({
          id: `imp-sh-${Math.random().toString(36).slice(2, 8)}`,
          name: sh.name,
          blackOwnership: sh.blackOwnership,
          blackWomenOwnership: sh.blackWomenOwnership,
          shares: sh.shares || 0,
          shareValue: sh.shareValue || 0,
        });
      }
    }

    // Apply employees
    if (result.employees.length > 0) {
      for (const emp of result.employees) {
        store.addEmployee({
          id: `imp-emp-${Math.random().toString(36).slice(2, 8)}`,
          name: emp.name,
          gender: emp.gender as any,
          race: emp.race as any,
          designation: emp.designation as any,
          isDisabled: emp.isDisabled,
        });
      }
    }

    // Apply suppliers
    if (result.suppliers.length > 0) {
      for (const sup of result.suppliers) {
        store.addSupplier({
          id: `imp-sup-${Math.random().toString(36).slice(2, 8)}`,
          name: sup.name,
          beeLevel: sup.beeLevel as any,
          blackOwnership: sup.blackOwnership,
          spend: sup.spend,
        });
      }
    }

    toast({
      title: "Scorecard Updated",
      description: "Imported data has been applied. Viewing live scorecard now.",
    });
    setLocation("/");
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setLogs([]);
    setProgress(0);
    setIsProcessing(false);
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024;

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    if (name.endsWith('.csv')) return <FileType className="h-6 w-6 text-blue-500" />;
    return <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />;
  };

  const hasResult = result !== null;
  const showDropzone = !isProcessing && !hasResult;

  return (
    <motion.div 
      className="space-y-8 max-w-6xl mx-auto pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Import Data</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Upload your Excel Toolkit, supplier CSVs, or supporting PDFs.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
            .xlsx, .xls
          </span>
          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20">
            .csv
          </span>
          <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-900/30 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20">
            .pdf
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2 space-y-6">
          {showDropzone && (
            <>
              <Card className="glass-panel overflow-hidden border-2 border-dashed hover:border-primary/50 transition-colors duration-300">
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "flex flex-col items-center justify-center py-24 px-6 text-center cursor-pointer transition-all",
                    isDragActive ? "bg-primary/5 border-primary" : "hover:bg-muted/30"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className={cn(
                    "p-4 rounded-full mb-4 transition-colors",
                    isDragActive ? "bg-primary/20" : "bg-primary/10"
                  )}>
                    <UploadCloud className={cn("h-10 w-10", isDragActive ? "text-primary" : "text-primary/70")} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Drag & drop files here</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Best results with standard B-BBEE Toolkit templates. The system will auto-detect sheets like Ownership, Management Control, Procurement, ESD, SED, and more.
                  </p>
                  <Button variant="outline" className="rounded-full shadow-sm">
                    Browse Files
                  </Button>
                </div>
              </Card>

              {files.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Selected Files ({files.length})</h3>
                    <span className="text-sm text-muted-foreground">{totalSize.toFixed(2)} MB total</span>
                  </div>
                  
                  <div className="space-y-3">
                    <AnimatePresence>
                      {files.map((f, i) => (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          key={`${f.name}-${i}`} 
                          className="flex items-center justify-between p-3 rounded-xl border bg-card/50 shadow-sm"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-muted rounded-lg shrink-0">
                              {getFileIcon(f.name)}
                            </div>
                            <div className="truncate">
                              <p className="font-medium text-sm truncate">{f.name}</p>
                              <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0 rounded-full" onClick={() => removeFile(f.name)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <Button 
                    onClick={startImport} 
                    className="w-full h-12 text-base font-semibold shadow-md rounded-full mt-4 bg-primary hover:bg-primary/90 transition-all gap-2"
                    data-testid="btn-start-import"
                  >
                    <UploadCloud className="h-5 w-5" />
                    Start Import Process
                  </Button>
                </motion.div>
              )}
            </>
          )}

          {(isProcessing || hasResult) && (
            <Card className={cn("glass-panel border-t-4", result?.success === false ? "border-t-destructive" : "border-t-primary")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isProcessing && <><Loader2 className="h-5 w-5 animate-spin text-primary" /> Processing Data...</>}
                  {result?.success && <><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" /> Import Complete</>}
                  {result?.success === false && <><XCircle className="h-5 w-5 text-destructive" /> Import Issue</>}
                </CardTitle>
                <CardDescription>
                  {isProcessing && "Uploading and parsing your files..."}
                  {result?.success && `${result.stats.matchedSheets}/${result.stats.totalSheets} sheets recognized, ${result.stats.entitiesExtracted} entities extracted`}
                  {result?.success === false && (result.errors[0] || "No B-BBEE data could be extracted.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2.5 bg-muted [&>div]:bg-primary" />
                  </div>
                )}

                {/* Sheets matched summary */}
                {result && result.sheetsMatched?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Sheets Detected</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.sheetsMatched.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
                          <CheckCircle2 className="h-3 w-3" />
                          {s.matchedTo} ({(s.confidence * 100).toFixed(0)}%)
                        </span>
                      ))}
                      {(result.sheetsFound || []).filter(s => !result.sheetsMatched.some(m => m.sheetName === s)).map((s, i) => (
                        <span key={`u-${i}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                          <AlertTriangle className="h-3 w-3" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {result && (result.warnings?.length ?? 0) > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Warnings ({result.warnings.length})
                    </h4>
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-700 dark:text-amber-500">• {w}</p>
                    ))}
                  </div>
                )}

                {/* Errors */}
                {result && (result.errors?.length ?? 0) > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-400 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Errors
                    </h4>
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-700 dark:text-red-500">• {e}</p>
                    ))}
                  </div>
                )}

                {/* Live log output */}
                <div className="bg-muted/30 rounded-xl p-4 font-mono text-xs space-y-2 max-h-64 overflow-y-auto border border-border">
                  <AnimatePresence>
                    {logs.map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className={cn(
                          "flex items-start gap-2",
                          log.type === 'success' && "text-emerald-600 dark:text-emerald-400",
                          log.type === 'warning' && "text-amber-600 dark:text-amber-400",
                          log.type === 'error' && "text-red-600 dark:text-red-400",
                          log.type === 'info' && "text-foreground"
                        )}
                      >
                        <span className="opacity-50 shrink-0 mt-0.5">
                          {log.type === 'success' && '✓'}
                          {log.type === 'warning' && '⚠'}
                          {log.type === 'error' && '✗'}
                          {log.type === 'info' && '›'}
                        </span>
                        <span className="break-words">{log.message}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Extracted data summary */}
                {result?.success && result.stats.entitiesExtracted > 0 && (
                  <div className="rounded-xl border bg-card/50 overflow-hidden">
                    <div className="grid grid-cols-4 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground border-b bg-muted/50 py-3">
                      <div>Shareholders</div>
                      <div>Employees</div>
                      <div>Suppliers</div>
                      <div>Contributions</div>
                    </div>
                    <div className="grid grid-cols-4 text-center py-4">
                      <div className="text-2xl font-bold text-primary">{result.shareholders.length}</div>
                      <div className="text-2xl font-bold text-primary">{result.employees.length}</div>
                      <div className="text-2xl font-bold text-primary">{result.suppliers.length}</div>
                      <div className="text-2xl font-bold text-primary">{result.esdContributions.length + result.sedContributions.length}</div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {result && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row gap-3 pt-2"
                  >
                    {result.success && (
                      <Button onClick={handleApplyAndContinue} className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-md" data-testid="btn-accept-import">
                        Accept & Update Scorecard
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleReset} className="w-full sm:flex-1 rounded-full" data-testid="btn-discard-import">
                      {result.success ? 'Discard & Upload New' : 'Try Another File'}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <Card className="glass-panel bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Imports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentImports.map((imp, i) => (
                <div key={i} className="flex items-start justify-between group cursor-pointer p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                  <div className="space-y-1 overflow-hidden pr-2">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{imp.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{imp.date}</span>
                      <span>•</span>
                      <span>{imp.entities} entity</span>
                    </div>
                  </div>
                  {imp.status === "Success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel border-amber-200/50 bg-amber-50/30 dark:bg-amber-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-500">
                <AlertCircle className="h-4 w-4" /> How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-800/80 dark:text-amber-500/80 space-y-2">
              <p>• <strong>Smart Detection:</strong> Sheet names are matched using fuzzy search (BM25-style scoring).</p>
              <p>• <strong>Entity Extraction:</strong> Columns are auto-detected using NER-style pattern recognition for financial values, percentages, B-BBEE levels, race, and gender.</p>
              <p>• <strong>Validation:</strong> Missing data or unrecognised sheets are flagged with clear warnings.</p>
              <p>• <strong>Any file works:</strong> Upload any Excel — if no B-BBEE data is found, you will be told exactly what was missing.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
