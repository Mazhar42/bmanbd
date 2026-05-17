import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authApi } from "../services/api";
import useStore from "../store/useStore";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, logout, setCsrfToken } = useStore();

  useEffect(() => {
    let mounted = true;

    const finishOAuth = async () => {
      const status = searchParams.get("status");
      const message = searchParams.get("message");

      if (status !== "success") {
        toast.error(message || "OAuth sign-in failed");
        navigate("/account", { replace: true });
        return;
      }

      try {
        const csrfResponse = await authApi.getCsrfToken();
        setCsrfToken(csrfResponse.data.csrfToken);
        const { data } = await authApi.refresh();
        if (!mounted) return;

        setUser(data.user, data.token);
        toast.success(message || "Account connected successfully");
        if (data.user?.role === "admin" || data.user?.role === "staff") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/account", { replace: true });
        }
      } catch {
        if (!mounted) return;
        logout();
        toast.error("Could not restore your session after OAuth sign-in");
        navigate("/account", { replace: true });
      }
    };

    finishOAuth();

    return () => {
      mounted = false;
    };
  }, [logout, navigate, searchParams, setCsrfToken, setUser]);

  return (
    <div className="container-custom py-24 text-center">
      <LoadingSpinner className="justify-center" />
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Finalizing your sign-in...
      </p>
    </div>
  );
}
