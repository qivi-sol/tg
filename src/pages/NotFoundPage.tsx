import { Link } from "react-router-dom";
import { Card } from "../components/common/Card";
import { PrimaryButton } from "../components/common/PrimaryButton";
import { useI18n } from "../hooks/useI18n";

export const NotFoundPage = () => {
  const { copy } = useI18n();

  return (
    <div className="app-shell mx-auto max-w-[460px]">
      <Card className="mt-10 p-6">
        <div className="text-2xl font-semibold text-white">{copy.notFound.title}</div>
        <p className="mt-3 text-sm leading-6 text-soft">{copy.notFound.body}</p>
        <Link to="/" className="mt-5 block">
          <PrimaryButton>{copy.common.backHome}</PrimaryButton>
        </Link>
      </Card>
    </div>
  );
};
