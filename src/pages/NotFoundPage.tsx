import { Link } from "react-router-dom";
import { Card } from "../components/common/Card";
import { PrimaryButton } from "../components/common/PrimaryButton";

export const NotFoundPage = () => {
  return (
    <div className="app-shell mx-auto max-w-[460px]">
      <Card className="mt-10 p-6">
        <div className="text-2xl font-semibold text-white">Vault route not found</div>
        <p className="mt-3 text-sm leading-6 text-soft">
          This screen does not exist yet. Jump back to the main dashboard and keep
          raiding.
        </p>
        <Link to="/" className="mt-5 block">
          <PrimaryButton>Back Home</PrimaryButton>
        </Link>
      </Card>
    </div>
  );
};
