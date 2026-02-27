import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type MoneyRequestId = string;
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Transaction {
    id: string;
    status: TransactionStatus;
    recipientAccountNumber: AccountNumber;
    paystackReference: string;
    paystackStatus: string;
    sender: Principal;
    narration: string;
    timestamp: bigint;
    recipientAccountName: string;
    recipientBank: BankName;
    amount: bigint;
}
export type PhoneNumber = string;
export type BankName = string;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface MoneyRequest {
    id: MoneyRequestId;
    status: MoneyRequestStatus;
    requester: Principal;
    bank: BankName;
    accountName: string;
    amountNeeded: bigint;
    timestamp: Timestamp;
    requesterEmail?: string;
    accountNumber: AccountNumber;
    reason: string;
}
export type AccountNumber = string;
export type DeviceType = string;
export interface UserProfile {
    principal: string;
    emailVerified: boolean;
    displayName: string;
    identityAnchor: bigint;
    password: string;
    email: string;
    lastLoginTimestamp: bigint;
    registrationTimestamp: bigint;
    deviceType: string;
    phoneNumber: string;
    phoneVerified: boolean;
}
export type OtpCode = string;
export enum MoneyRequestStatus {
    pending = "pending",
    fulfilled = "fulfilled"
}
export enum TransactionStatus {
    pending = "pending",
    completed = "completed",
    failed = "failed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminApproveTransaction(transactionId: string): Promise<boolean>;
    adminFulfillMoneyRequest(requestId: MoneyRequestId): Promise<boolean>;
    adminGetAllMoneyRequests(): Promise<Array<MoneyRequest>>;
    adminGetAllProfiles(token: string): Promise<Array<UserProfile>>;
    adminGetAllProfilesAsAdmin(): Promise<Array<UserProfile>>;
    adminGetAllTransactions(): Promise<Array<Transaction>>;
    adminLogin(email: string, password: string): Promise<boolean>;
    adminSendMoneyOnBehalf(recipientBank: BankName, accountNumber: AccountNumber, accountName: string, amount: bigint, narration: string): Promise<Transaction>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    generateOtp(phoneNumber: PhoneNumber): Promise<OtpCode>;
    getBankAccountName(_email: string, bank: BankName, accountNumber: AccountNumber): Promise<string>;
    getBankList(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPaystackSecretKey(): Promise<string>;
    getTransactionHistory(user: Principal): Promise<Array<Transaction>>;
    getUserMoneyRequests(user: Principal): Promise<Array<MoneyRequest>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    loginWithEmail(email: string, password: string): Promise<UserProfile | null>;
    recordLogin(deviceType: DeviceType): Promise<void>;
    recordLoginByEmail(email: string, deviceType: string): Promise<void>;
    registerUserProfile(displayName: string, phoneNumber: string, identityAnchor: bigint, email: string, password: string, deviceType: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveProfile(displayName: string, phoneNumber: string, identityAnchor: bigint, email: string, password: string, emailVerified: boolean): Promise<void>;
    setPaystackSecretKey(secret: string): Promise<void>;
    submitMoneyRequest(reason: string, bank: string, accountNumber: string, accountName: string, amountNeeded: bigint, email: string): Promise<string>;
    transferMoney(recipientAccountNumber: AccountNumber, recipientBank: BankName, recipientAccountName: string, amount: bigint, narration: string): Promise<Transaction>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    verifyOtp(phoneNumber: PhoneNumber, code: OtpCode): Promise<boolean>;
}
