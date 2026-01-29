"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Sidebar } from "~/components/layout/sidebar";
import { Badge } from "~/components/ui/badge";
import { LogOut, User, Bell, Shield, Download, MessageSquare } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: notificationSettings, refetch: refetchNotificationSettings } =
    api.notificationSettings.get.useQuery();
  const updateNotificationSettings = api.notificationSettings.update.useMutation({
    onSuccess: () => void refetchNotificationSettings(),
  });
  const sendTestMessage = api.notificationSettings.sendTestMessage.useMutation();

  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(false);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");

  useEffect(() => {
    if (notificationSettings) {
      setDailyDigestEnabled(notificationSettings.dailyDigestEnabled ?? false);
      setDiscordWebhookUrl(notificationSettings.discordWebhookUrl ?? "");
    }
  }, [notificationSettings]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const user = session?.user;
  const loading = status === "loading";

  const handleExportData = async () => {
    alert("Export functionality will be implemented soon!");
  };

  const handleSaveDailyDigest = () => {
    updateNotificationSettings.mutate({
      dailyDigestEnabled,
      discordWebhookUrl: discordWebhookUrl.trim() || "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const settingsContent = (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Account Status
              </label>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-emerald-500">
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily digest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Daily Digest
          </CardTitle>
          <CardDescription>
            Get a daily message with gold and silver spot prices and your total portfolio value via Discord
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Send daily summary</p>
              <p className="text-sm text-muted-foreground">
                Receive gold/silver prices and your portfolio value once per day
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={dailyDigestEnabled}
              onClick={() => setDailyDigestEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                dailyDigestEnabled ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-primary-foreground shadow ring-0 transition-transform ${
                  dailyDigestEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          {dailyDigestEnabled && (
            <div className="space-y-2">
              <Label htmlFor="discord-webhook">Discord webhook URL</Label>
              <Input
                id="discord-webhook"
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Create a webhook in Discord: Server → Channel → Integrations → Webhooks → New Webhook, then paste the URL here.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sendTestMessage.mutate()}
                disabled={sendTestMessage.isPending || !discordWebhookUrl.trim()}
              >
                {sendTestMessage.isPending ? "Sending..." : "Send test message"}
              </Button>
              {sendTestMessage.isSuccess && (
                <p className="text-xs text-green-600 dark:text-green-400">Test message sent. Check your Discord channel.</p>
              )}
              {sendTestMessage.isError && (
                <p className="text-xs text-destructive">{sendTestMessage.error.message}</p>
              )}
            </div>
          )}
          <Button
            onClick={handleSaveDailyDigest}
            disabled={updateNotificationSettings.isPending}
          >
            {updateNotificationSettings.isPending ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your application experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Theme</p>
              <p className="text-sm text-muted-foreground">
                Application is currently using dark theme
              </p>
            </div>
            <Badge variant="default">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Currency Display</p>
              <p className="text-sm text-muted-foreground">
                All prices displayed in Australian Dollars (AUD)
              </p>
            </div>
            <Badge variant="outline">AUD</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export your portfolio data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Portfolio Data</p>
              <p className="text-sm text-muted-foreground">
                Download your holdings data as a CSV file
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Button variant="outline">
              Change Password
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on this device
              </p>
            </div>
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle>Application Information</CardTitle>
          <CardDescription>
            About PreciousVault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Version
              </label>
              <p className="text-sm">1.0.0</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Build
              </label>
              <p className="text-sm">Development</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              PreciousVault is a modern portfolio tracker for precious metals investors. 
              Built with Next.js, TypeScript, and PostgreSQL for secure, real-time portfolio management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Sidebar>
      {settingsContent}
    </Sidebar>
  );
}
