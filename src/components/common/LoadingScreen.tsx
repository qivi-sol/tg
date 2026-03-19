import vaultMark from "../../assets/vault-mark.svg";

export const LoadingScreen = ({
  label = "Syncing your vault..."
}: {
  label?: string;
}) => {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center">
      <div className="glass-card flex w-full max-w-[420px] flex-col items-center rounded-[28px] p-8 text-center">
        <img
          src={vaultMark}
          alt="TON Vault"
          className="mb-4 h-16 w-16 animate-vault-pulse"
        />
        <div className="text-xl font-semibold text-white">TON Vault</div>
        <p className="mt-2 text-sm text-soft">{label}</p>
      </div>
    </div>
  );
};
