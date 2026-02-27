import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { UserProfile, MoneyRequest, Transaction } from "../backend";
import { isCanisterStoppedError, SERVICE_UNAVAILABLE_MSG, detectDeviceType } from "../lib/utils";
import { Principal } from "@dfinity/principal";

// ── Auth / Profile ────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(user: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !actorFetching && !!user,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useRegisterUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      displayName: string;
      phoneNumber: string;
      identityAnchor: bigint;
      email: string;
      password: string;
      deviceType: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.registerUserProfile(
        params.displayName,
        params.phoneNumber,
        params.identityAnchor,
        params.email,
        params.password,
        params.deviceType
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      displayName: string;
      phoneNumber: string;
      identityAnchor: bigint;
      email: string;
      password: string;
      emailVerified: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveProfile(
        params.displayName,
        params.phoneNumber,
        params.identityAnchor,
        params.email,
        params.password,
        params.emailVerified
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useLoginWithEmail() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.loginWithEmail(params.email, params.password);
    },
  });
}

export function useRecordLogin() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (deviceType: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordLogin(deviceType);
    },
  });
}

export function useRecordLoginByEmail() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { email: string; deviceType: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordLoginByEmail(params.email, params.deviceType);
    },
  });
}

// ── OTP ───────────────────────────────────────────────────────────────────

export function useGenerateOtp() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.generateOtp(phoneNumber);
    },
  });
}

export function useVerifyOtp() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { phoneNumber: string; code: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.verifyOtp(params.phoneNumber, params.code);
    },
  });
}

// ── Money Requests ────────────────────────────────────────────────────────

export function useGetUserMoneyRequests(user: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MoneyRequest[]>({
    queryKey: ["userMoneyRequests", user],
    queryFn: async () => {
      if (!actor || !user) return [];
      try {
        const principal = Principal.fromText(user);
        return actor.getUserMoneyRequests(principal);
      } catch (err) {
        if (isCanisterStoppedError(err)) {
          throw new Error(SERVICE_UNAVAILABLE_MSG);
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching && !!user,
    retry: false,
  });
}

/**
 * Helper to get the authenticated user's email from sessionStorage.
 * Checks `emailAuth` (stored as JSON string or plain string) and `userSession`.
 * Returns an empty string if no email is found (falls back to II principal).
 */
function getSessionEmail(): string {
  try {
    const emailAuth = sessionStorage.getItem("emailAuth");
    if (emailAuth && emailAuth !== "null" && emailAuth !== "") {
      // emailAuth may be stored as a plain email string or as JSON
      try {
        const parsed = JSON.parse(emailAuth);
        if (typeof parsed === "string" && parsed.includes("@")) return parsed;
        if (parsed && typeof parsed === "object" && parsed.email) return parsed.email;
      } catch {
        // Not JSON — treat as plain email string
        if (emailAuth.includes("@")) return emailAuth;
      }
    }

    const userSession = sessionStorage.getItem("userSession");
    if (userSession && userSession !== "null" && userSession !== "") {
      try {
        const parsed = JSON.parse(userSession);
        if (parsed && typeof parsed === "object" && parsed.email) return parsed.email;
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  return "";
}

export function useRequestMoney() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      reason: string;
      bank: string;
      accountNumber: string;
      accountName: string;
      amountNeeded: bigint;
      email?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");

      // Resolve email: use explicitly passed email, then fall back to sessionStorage
      const email = params.email ?? getSessionEmail();

      return actor.submitMoneyRequest(
        params.reason,
        params.bank,
        params.accountNumber,
        params.accountName,
        params.amountNeeded,
        email
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userMoneyRequests"] });
      queryClient.invalidateQueries({ queryKey: ["adminMoneyRequests"] });
    },
  });
}

// ── Transactions ──────────────────────────────────────────────────────────

export function useGetTransactionHistory(user: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ["transactionHistory", user],
    queryFn: async () => {
      if (!actor || !user) return [];
      try {
        const principal = Principal.fromText(user);
        return actor.getTransactionHistory(principal);
      } catch (err) {
        if (isCanisterStoppedError(err)) {
          throw new Error(SERVICE_UNAVAILABLE_MSG);
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching && !!user,
    retry: false,
  });
}

export function useTransferMoney() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      recipientAccountNumber: string;
      recipientBank: string;
      recipientAccountName: string;
      amount: bigint;
      narration: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.transferMoney(
        params.recipientAccountNumber,
        params.recipientBank,
        params.recipientAccountName,
        params.amount,
        params.narration
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
    },
  });
}

// ── Bank ──────────────────────────────────────────────────────────────────

export function useGetBankList() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["bankList"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBankList();
    },
    enabled: !!actor && !actorFetching,
    staleTime: Infinity,
  });
}

export function useGetBankAccountName() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      email: string;
      bank: string;
      accountNumber: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const rawResponse = await actor.getBankAccountName(
        params.email,
        params.bank,
        params.accountNumber
      );
      // Parse JSON response from Paystack
      try {
        const parsed = JSON.parse(rawResponse);
        if (parsed.status === true && parsed.data?.account_name) {
          return parsed.data.account_name as string;
        }
        const errMsg = parsed.message || "Could not resolve account name";
        throw new Error(errMsg);
      } catch (e) {
        if (e instanceof SyntaxError) {
          // Not JSON, return as-is
          return rawResponse;
        }
        throw e;
      }
    },
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────

export function useAdminLogin() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminLogin(params.email, params.password);
    },
  });
}

export function useAdminGetAllProfiles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ["adminProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return actor.adminGetAllProfiles("ADMIN_SECRET");
      } catch (err) {
        if (isCanisterStoppedError(err)) {
          throw new Error(SERVICE_UNAVAILABLE_MSG);
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useAdminGetAllMoneyRequests() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MoneyRequest[]>({
    queryKey: ["adminMoneyRequests"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return actor.adminGetAllMoneyRequests();
      } catch (err) {
        if (isCanisterStoppedError(err)) {
          throw new Error(SERVICE_UNAVAILABLE_MSG);
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useAdminGetAllTransactions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ["adminTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return actor.adminGetAllTransactions();
      } catch (err) {
        if (isCanisterStoppedError(err)) {
          throw new Error(SERVICE_UNAVAILABLE_MSG);
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useAdminFulfillMoneyRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminFulfillMoneyRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMoneyRequests"] });
      queryClient.invalidateQueries({ queryKey: ["userMoneyRequests"] });
    },
  });
}

export function useAdminSendMoneyOnBehalf() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      recipientBank: string;
      accountNumber: string;
      accountName: string;
      amount: bigint;
      narration: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminSendMoneyOnBehalf(
        params.recipientBank,
        params.accountNumber,
        params.accountName,
        params.amount,
        params.narration
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTransactions"] });
    },
  });
}

// Re-export detectDeviceType for convenience
export { detectDeviceType };
