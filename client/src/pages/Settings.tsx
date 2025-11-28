
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Database, Download, Save, Server, HardDrive, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Settings() {
    const { toast } = useToast();
    const [dbType, setDbType] = useState<"local" | "external">("local");
    const [connectionString, setConnectionString] = useState("");
    const [sqlitePath, setSqlitePath] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/config/db");
            if (res.ok) {
                const data = await res.json();
                setDbType(data.type || "local");
                setConnectionString(data.connectionString || "");
                setSqlitePath(data.sqlitePath || "");
            }
        } catch (error) {
            console.error("Failed to fetch config:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/config/db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: dbType, connectionString, sqlitePath }),
            });

            if (res.ok) {
                toast({
                    title: "Configuration Saved",
                    description: "Database settings have been updated. Please restart the server for changes to take effect.",
                });
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save configuration.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadSchema = () => {
        window.location.href = "/api/config/schema";
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your application configuration.</p>
            </div>

            <div className="grid gap-6">
                <Card className="bg-card/40 backdrop-blur-sm border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            Database Configuration
                        </CardTitle>
                        <CardDescription>
                            Choose how you want to store your application data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <RadioGroup value={dbType} onValueChange={(v: "local" | "external") => setDbType(v)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="local" id="local" className="peer sr-only" />
                                <Label
                                    htmlFor="local"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                >
                                    <HardDrive className="mb-3 h-6 w-6" />
                                    <div className="text-center">
                                        <div className="font-semibold">Local SQLite</div>
                                        <div className="text-xs text-muted-foreground mt-1">Stored on server disk</div>
                                    </div>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="external" id="external" className="peer sr-only" />
                                <Label
                                    htmlFor="external"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                >
                                    <Server className="mb-3 h-6 w-6" />
                                    <div className="text-center">
                                        <div className="font-semibold">External Database</div>
                                        <div className="text-xs text-muted-foreground mt-1">Connect to online DB</div>
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>

                        {dbType === "local" && (
                            <div className="space-y-4 pt-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <Label htmlFor="sqlitePath">Database Path</Label>
                                    <Input
                                        id="sqlitePath"
                                        placeholder="server/sqlite.db"
                                        value={sqlitePath}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSqlitePath(e.target.value)}
                                        className="bg-background/50"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Relative path to the SQLite database file. Default: server/sqlite.db
                                    </p>
                                </div>
                                <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-500">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Restart Required</AlertTitle>
                                    <AlertDescription>
                                        Changing the database path requires a server restart to take effect.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        {dbType === "external" && (
                            <div className="space-y-4 pt-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <Label htmlFor="connection">Connection String</Label>
                                    <Input
                                        id="connection"
                                        placeholder="postgresql://user:password@host:port/dbname"
                                        value={connectionString}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConnectionString(e.target.value)}
                                        className="bg-background/50"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter the full connection URL for your external database (PostgreSQL, MySQL, etc.).
                                    </p>
                                </div>

                                <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-500">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Migration Required</AlertTitle>
                                    <AlertDescription>
                                        When switching to an external database, you must ensure the schema is created.
                                        Download the schema SQL below and run it on your new database.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        <Separator className="bg-white/10" />

                        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-2">
                            <Button variant="outline" onClick={handleDownloadSchema} className="border-white/10 hover:bg-white/5">
                                <Download className="w-4 h-4 mr-2" />
                                Download SQLite Schema (Need convertion to others types of DB)
                            </Button>

                            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Saving..." : "Save Configuration"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
