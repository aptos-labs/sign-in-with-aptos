import ConnectButton from "@/components/ConnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import useLogout from "@/hooks/useLogout";
import { useUser } from "@/hooks/useUser";
import { saveProfile } from "@/lib/user";
import { truncateAddress } from "@aptos-labs/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";

import { useState } from "react";

export default function SignInPage() {
  const { user, isLoggedIn } = useUser();
  const queryClient = useQueryClient();
  const { mutate: logout } = useLogout();

  const [name, setName] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile(name, color);
    await queryClient.invalidateQueries({ queryKey: ["user"] });
    setSubmitted(true);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="px-6 py-4">
        <h1 className="text-lg">Hello 👋</h1>
        <h1 className="font-mono">
          {truncateAddress(user?.address?.toString() ?? "")}
        </h1>
      </div>
      <Separator className="mb-4" />
      <CardContent>
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                defaultValue={user?.name ?? undefined}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Favorite Color</Label>
              <Select
                defaultValue={user?.favoriteColor ?? undefined}
                value={color}
                onValueChange={setColor}
                required
              >
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Button type="submit" className="w-full">
                Submit
              </Button>
              <Button
                variant="secondary"
                type="submit"
                className="w-full"
                onClick={() => {
                  logout();
                  setColor(undefined);
                  setName(undefined);
                  setSubmitted(false);
                }}
              >
                Log Out
              </Button>
            </div>
            {submitted && (
              <div className="flex items-center justify-center">
                <span className="text-green-500 text-sm italic">
                  {" "}
                  Saved your information!
                </span>
              </div>
            )}
          </form>
        ) : (
          <div className="flex mt-8 items-center justify-center">
            <ConnectButton walletName="Continue with Google" />
          </div>
        )}
      </CardContent>
      <Separator />
      <div className="px-6 py-6 italic text-sm font-light">
        This form demonstrates the usage of backend information connected to
        your decentralized identity leveraging{" "}
        <span className="font-bold">Sign in with Aptos</span> .
      </div>
    </Card>
  );
}
