import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useBbeeStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { client, updateSettings } = useBbeeStore();
  const { toast } = useToast();
  
  const [province, setProvince] = useState(client.eapProvince);
  const [industry, setIndustry] = useState(client.industrySector);

  const handleSave = () => {
    updateSettings(province, industry);
    toast({
      title: "Settings Saved",
      description: "Platform configuration and calculations updated.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure EAP profiles and industry norms for calculations.
        </p>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            System Configuration
          </CardTitle>
          <CardDescription>Values that affect overall scorecard calculations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid gap-2">
            <Label>Economically Active Population (EAP) Province</Label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Select Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="National">National</SelectItem>
                <SelectItem value="Gauteng">Gauteng</SelectItem>
                <SelectItem value="Western Cape">Western Cape</SelectItem>
                <SelectItem value="KZN">KwaZulu-Natal</SelectItem>
                <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Changes the racial and gender demographic targets for Management Control and Skills Development.</p>
          </div>

          <div className="grid gap-2">
            <Label>Industry Sector</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Select Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Generic">Generic / General</SelectItem>
                <SelectItem value="ICT">ICT Sector</SelectItem>
                <SelectItem value="Construction">Construction Sector</SelectItem>
                <SelectItem value="Financial">Financial Sector</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Affects industry norm comparisons and specific element weightings.</p>
          </div>
          
          <div className="grid gap-2 pt-4 border-t">
            <Label>Measurement Period</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input type="date" placeholder="Start Date" />
              <Input type="date" placeholder="End Date" />
            </div>
          </div>

          <Button className="w-full gap-2 mt-4" onClick={handleSave}>
            <Save className="h-4 w-4" /> Save Configuration
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}