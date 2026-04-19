import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, ArrowRight, Loader2, LogOut, Hexagon } from "lucide-react";
import { useActiveClient } from "@/lib/client-context";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface ClientItem {
  id: string;
  name: string;
  financialYear: string;
  industrySector: string | null;
}

export default function ClientSelector() {
  const { setActiveClientId } = useActiveClient();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '', financialYear: new Date().getFullYear().toString(),
    industrySector: 'Generic', eapProvince: 'National',
  });

  useEffect(() => {
    api.getClients()
      .then(setClients)
      .catch(() => toast({ title: "Error", description: "Failed to load clients", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newClient.name) {
      toast({ title: "Required", description: "Client name is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const client = await api.createClient(newClient);
      setClients(prev => [...prev, client]);
      setIsCreateOpen(false);
      setActiveClientId(client.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-heading font-bold text-xl">
          <div className="bg-primary p-1.5 rounded-lg shadow-sm">
            <Hexagon className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          Okiru Companion
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.fullName || user?.username}
          </span>
          <Button variant="ghost" size="sm" onClick={logout} data-testid="btn-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-heading font-bold" data-testid="text-select-client">Select a Client</h1>
            <p className="text-muted-foreground">
              Choose a client to work on or create a new one to get started.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <Card
                  key={client.id}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                  onClick={() => setActiveClientId(client.id)}
                  data-testid={`card-client-${client.id}`}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          FY {client.financialYear} {client.industrySector ? `| ${client.industrySector}` : ''}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              ))}

              {clients.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center space-y-4">
                    <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                    <div>
                      <h3 className="font-semibold text-lg">No clients yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create your first client to start tracking B-BBEE compliance.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2" size="lg" data-testid="btn-create-client">
                    <Plus className="h-4 w-4" />
                    Add New Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Client</DialogTitle>
                    <DialogDescription>
                      Set up a new client for B-BBEE compliance tracking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={newClient.name}
                        onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                        placeholder="e.g. Acme Corporation SA"
                        data-testid="input-client-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Financial Year</Label>
                      <Input
                        value={newClient.financialYear}
                        onChange={e => setNewClient({ ...newClient, financialYear: e.target.value })}
                        placeholder="2024"
                        data-testid="input-client-fy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry Sector</Label>
                      <Select value={newClient.industrySector} onValueChange={v => setNewClient({ ...newClient, industrySector: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Generic">Generic / General</SelectItem>
                          <SelectItem value="ICT">ICT Sector</SelectItem>
                          <SelectItem value="Construction">Construction</SelectItem>
                          <SelectItem value="Financial">Financial Sector</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>EAP Province</Label>
                      <Select value={newClient.eapProvince} onValueChange={v => setNewClient({ ...newClient, eapProvince: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="National">National</SelectItem>
                          <SelectItem value="Gauteng">Gauteng</SelectItem>
                          <SelectItem value="Western Cape">Western Cape</SelectItem>
                          <SelectItem value="KZN">KwaZulu-Natal</SelectItem>
                          <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreate} disabled={creating} data-testid="btn-confirm-create">
                      {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Create Client
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
