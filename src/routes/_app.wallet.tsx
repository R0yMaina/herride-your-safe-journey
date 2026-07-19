import { createFileRoute } from "@tanstack/react-router";
import { WalletScreen } from "@/features/wallet/WalletScreen";

export const Route = createFileRoute("/_app/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet · HeRide" },
      { name: "description", content: "Manage payment methods, promos, and ride credits." },
    ],
  }),
  component: WalletScreen,
});
