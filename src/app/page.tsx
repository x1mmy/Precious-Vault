import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            PreciousVault
          </h1>
          <p className="text-muted-foreground">
            Track your gold and silver holdings with real-time pricing in AUD
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to PreciousVault</CardTitle>
            <CardDescription>
              Your personal precious metals portfolio tracker
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Button asChild className="w-full">
                <Link href="/sign-in">
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-up">
                  Create Account
                </Link>
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Features:</p>
              <ul className="mt-2 space-y-1">
                <li>• Real-time gold & silver prices in AUD</li>
                <li>• Portfolio tracking & analytics</li>
                <li>• Secure cloud storage</li>
                <li>• Beautiful dark theme interface</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}