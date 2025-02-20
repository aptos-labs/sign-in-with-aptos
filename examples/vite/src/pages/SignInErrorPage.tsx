import ConnectButton from "@/components/ConnectButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import useLogout from "@/hooks/useLogout";
import { useUser } from "@/hooks/useUser";
import { truncateAddress } from "@aptos-labs/wallet-adapter-react";

export default function SignInPage() {
  const { user, isLoggedIn } = useUser();
  const { mutate: logout } = useLogout();

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
          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            Your account has been phished! 😱
            <Button onClick={() => logout()} className="w-1/2">
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex mt-8 items-center justify-center">
            <ConnectButton siwaVariant="error" variant="destructive" />
          </div>
        )}
      </CardContent>
      <Separator />
      <div className="px-6 py-6 italic text-sm font-light">
        This form demonstrates the malicious usage of{" "}
        <span className="font-bold">Sign in with Aptos</span>. The wallet will
        warn the user from signing the message as it can lead to compromised
        accounts.
      </div>
    </Card>
  );
}
