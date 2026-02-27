import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Char "mo:core/Char";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type PhoneNumber = Text;
  public type Email = Text;
  public type Password = Text;
  public type OtpCode = Text;
  public type AccountNumber = Text;
  public type BankName = Text;
  public type BankCode = Text;
  public type Timestamp = Int;
  public type MoneyRequestId = Text;
  public type DeviceType = Text;

  public type TransactionStatus = {
    #pending;
    #completed;
    #failed;
  };

  public type MoneyRequestStatus = {
    #pending;
    #fulfilled;
  };

  public type Transaction = {
    id : Text;
    sender : Principal;
    amount : Int;
    status : TransactionStatus;
    timestamp : Int;
    recipientAccountNumber : AccountNumber;
    recipientBank : BankName;
    recipientAccountName : Text;
    narration : Text;
    paystackReference : Text;
    paystackStatus : Text;
  };

  public type UserProfile = {
    principal : Text;
    displayName : Text;
    phoneNumber : Text;
    phoneVerified : Bool;
    identityAnchor : Nat;
    email : Text;
    password : Text;
    emailVerified : Bool;
    registrationTimestamp : Int;
    lastLoginTimestamp : Int;
    deviceType : Text;
  };

  public type MoneyRequest = {
    id : MoneyRequestId;
    requester : Principal;
    reason : Text;
    bank : BankName;
    accountNumber : AccountNumber;
    accountName : Text;
    timestamp : Timestamp;
    status : MoneyRequestStatus;
    amountNeeded : Nat;
    requesterEmail : ?Text;
  };

  public type OtpEntry = {
    code : Text;
    expiry : Timestamp;
  };

  type Bank = {
    _0 : Text;
    _1 : Text;
    _2 : Text;
  };

  public type BankMapping = {
    name : Text;
    code : BankCode;
    _3 : Text;
    _4 : Text;
  };

  let profiles = Map.empty<Text, UserProfile>();
  let transactionMap = Map.empty<Principal, List.List<Transaction>>();
  let moneyRequests = Map.empty<MoneyRequestId, MoneyRequest>();
  let pendingOtps = Map.empty<Text, OtpEntry>();
  let adminEmail = "adebayoaminahanike@gmail.com";
  let adminPassword = "Anike4402";
  var paystackSecretKey : Text = "sk_live_REPLACE_WITH_YOUR_KEY";
  var adminAuthSecret : Text = "ADMIN_SECRET";

  public shared ({ caller }) func setPaystackSecretKey(secret : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can set Paystack secret key");
    };
    paystackSecretKey := secret;
  };

  public query ({ caller }) func getPaystackSecretKey() : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can get Paystack secret key");
    };
    paystackSecretKey;
  };

  func isValidNigerianPhone(phone : Text) : Bool {
    let len = phone.size();
    if (len == 14) {
      phone.startsWith(#text("+234"));
    } else if (len == 11) {
      let chars = phone.chars().toArray();
      chars.size() >= 1 and chars[0] == Char.fromNat32(48);
    } else {
      false;
    };
  };

  func isValidAccountNumber(accountNumber : Text) : Bool {
    if (accountNumber.size() != 10) return false;
    for (c in accountNumber.chars()) {
      if (c < Char.fromNat32(48) or c > Char.fromNat32(57)) return false;
    };
    true;
  };

  func getBankMappings() : [BankMapping] {
    [
      { name = "access bank"; code = "044"; _3 = ""; _4 = "" },
      { name = "gtbank"; code = "058"; _3 = ""; _4 = "" },
      { name = "first bank"; code = "011"; _3 = ""; _4 = "" },
      { name = "zenith bank"; code = "057"; _3 = ""; _4 = "" },
      { name = "uba"; code = "033"; _3 = ""; _4 = "" },
      { name = "fidelity bank"; code = "070"; _3 = ""; _4 = "" },
      { name = "sterling bank"; code = "232"; _3 = ""; _4 = "" },
      { name = "polaris bank"; code = "076"; _3 = ""; _4 = "" },
      { name = "wema bank"; code = "035"; _3 = ""; _4 = "" },
      { name = "stanbic ibtc"; code = "039"; _3 = ""; _4 = "" },
      { name = "kuda bank"; code = "090267"; _3 = ""; _4 = "" },
      { name = "providus bank"; code = "101"; _3 = ""; _4 = "" },
      { name = "unity bank"; code = "215"; _3 = ""; _4 = "" },
      { name = "keystone bank"; code = "082"; _3 = ""; _4 = "" },
      { name = "heritage bank"; code = "030"; _3 = ""; _4 = "" },
      { name = "suntrust bank"; code = "100"; _3 = ""; _4 = "" },
      { name = "globacom"; code = "120001"; _3 = ""; _4 = "" },
      { name = "ecobank nigeria"; code = "050"; _3 = ""; _4 = "" },
      { name = "jaiz bank"; code = "301"; _3 = ""; _4 = "" },
      { name = "globus bank"; code = "00103"; _3 = ""; _4 = "" },
    ];
  };

  func getBankDisplayNames() : [Text] {
    [
      "Access Bank",
      "GTBank",
      "First Bank",
      "Zenith Bank",
      "UBA",
      "Fidelity Bank",
      "Sterling Bank",
      "Polaris Bank",
      "Wema Bank",
      "Stanbic IBTC",
      "Kuda Bank",
      "Providus Bank",
      "Unity Bank",
      "Keystone Bank",
      "Heritage Bank",
      "SunTrust Bank",
      "Globacom",
      "Ecobank Nigeria",
      "Jaiz Bank",
      "Globus Bank",
    ];
  };

  func getBankCode(bankName : BankName) : ?BankCode {
    let mappings = getBankMappings();
    let normalizedBankName = bankName.toLower();
    for (mapping in mappings.values()) {
      if (mapping.name == normalizedBankName) {
        return ?mapping.code;
      };
    };
    null;
  };

  func generateTxId(_caller : Principal, timestamp : Int) : Text {
    timestamp.toText();
  };

  func generateMoneyRequestId(user : Principal, timestamp : Time.Time) : MoneyRequestId {
    user.toText() # "-request-" # Int.abs(timestamp).toText();
  };

  func getBearerAuthHeader(secretKey : Text) : OutCall.Header {
    {
      name = "Authorization";
      value = "Bearer " # secretKey;
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ── OTP ──────────────────────────────────────────────────────────────────
  // OTP generation is intentionally open to guests/unauthenticated callers
  // because it is required during the registration flow before a user has a role.
  public shared func generateOtp(phoneNumber : PhoneNumber) : async OtpCode {
    if (not isValidNigerianPhone(phoneNumber)) {
      Runtime.trap("Invalid Nigerian phone number");
    };
    let raw = Int.abs(Time.now()) % 1_000_000;
    let rawText = raw.toText();
    let padSize = if (rawText.size() <= 6) { 6 - rawText.size() } else { 0 };
    let pad = if (padSize > 0) {
      var result = "";
      var i = 0;
      while (i < Int.abs(padSize)) {
        result #= "0";
        i += 1;
      };
      result;
    } else { "" };
    let otpCode = pad # rawText;
    let otp : OtpEntry = {
      code = otpCode;
      expiry = Time.now() + 5 * 60 * 1_000_000_000;
    };
    pendingOtps.add(phoneNumber, otp);
    otpCode;
  };

  // OTP verification is also open to guests for the same registration-flow reason.
  public shared ({ caller }) func verifyOtp(phoneNumber : PhoneNumber, code : OtpCode) : async Bool {
    switch (pendingOtps.get(phoneNumber)) {
      case null { false };
      case (?otp) {
        if (otp.code == code and Time.now() < otp.expiry) {
          markPhoneVerified(caller, phoneNumber);
          pendingOtps.remove(phoneNumber);
          true;
        } else {
          false;
        };
      };
    };
  };

  func markPhoneVerified(user : Principal, phoneNumber : PhoneNumber) {
    let base : UserProfile = switch (profiles.get(user.toText())) {
      case null {
        {
          principal = user.toText();
          displayName = "";
          phoneNumber = phoneNumber;
          phoneVerified = false;
          identityAnchor = 0;
          email = "";
          password = "";
          emailVerified = false;
          registrationTimestamp = 0;
          lastLoginTimestamp = 0;
          deviceType = "";
        };
      };
      case (?p) { p };
    };
    profiles.add(
      user.toText(),
      {
        principal = base.principal;
        displayName = base.displayName;
        phoneNumber = phoneNumber;
        phoneVerified = true;
        identityAnchor = base.identityAnchor;
        email = base.email;
        password = base.password;
        emailVerified = base.emailVerified;
        registrationTimestamp = base.registrationTimestamp;
        lastLoginTimestamp = base.lastLoginTimestamp;
        deviceType = base.deviceType;
      },
    );
  };

  // ── Login with Email and Password ────────────────────────────────────────
  // Login must be open to unauthenticated callers.
  public shared func loginWithEmail(email : Text, password : Text) : async ?UserProfile {
    for ((_key, profile) in profiles.entries()) {
      if (profile.email == email and profile.password == password) {
        return ?profile;
      };
    };
    null;
  };

  // ── Bank account lookup ───────────────────────────────────────────────────
  // Requires #user role to prevent unauthenticated abuse of the Paystack HTTP outcall.
  public shared ({ caller }) func getBankAccountName(_email : Text, bank : BankName, accountNumber : AccountNumber) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can look up bank account names");
    };
    if (not isValidAccountNumber(accountNumber)) {
      Runtime.trap("Invalid account number: must be exactly 10 digits");
    };

    let bankCode = switch (getBankCode(bank)) {
      case null {
        Runtime.trap("Bank not yet mapped: " # bank # ". Please contact support to add this bank.");
      };
      case (?code) { code };
    };

    let extraHeaders = [
      getBearerAuthHeader(paystackSecretKey),
      { name = "Content-Type"; value = "application/json" },
    ];

    let url = "https://api.paystack.co/bank/resolve?account_number=" # accountNumber # "&bank_code=" # bankCode;

    let response = await OutCall.httpGetRequest(url, extraHeaders, transform);
    switch (response.size()) {
      case (0) { Runtime.trap("Empty account name response from Paystack") };
      case (_) { response };
    };
  };

  public query func getBankList() : async [Text] {
    getBankDisplayNames();
  };

  // ── Send Money ────────────────────────────────────────────────────────────
  public shared ({ caller }) func transferMoney(
    recipientAccountNumber : AccountNumber,
    recipientBank : BankName,
    recipientAccountName : Text,
    amount : Int,
    narration : Text,
  ) : async Transaction {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can transfer money");
    };
    if (not isValidAccountNumber(recipientAccountNumber)) {
      Runtime.trap("Invalid account number: must be exactly 10 digits");
    };
    if (amount <= 0) {
      Runtime.trap("Amount must be positive");
    };

    let now = Time.now();
    let tx : Transaction = {
      id = generateTxId(caller, now);
      sender = caller;
      amount = amount;
      status = #completed;
      timestamp = now;
      recipientAccountNumber = recipientAccountNumber;
      recipientBank = recipientBank;
      recipientAccountName = recipientAccountName;
      narration = narration;
      paystackReference = "simulated";
      paystackStatus = "mocked";
    };

    let existing = switch (transactionMap.get(caller)) {
      case null { List.empty<Transaction>() };
      case (?lst) { lst };
    };
    existing.add(tx);
    transactionMap.add(caller, existing);
    tx;
  };

  public query ({ caller }) func getTransactionHistory(user : Principal) : async [Transaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view transaction history");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own transaction history");
    };
    let lst = switch (transactionMap.get(user)) {
      case null { List.empty<Transaction>() };
      case (?l) { l };
    };
    lst.toArray();
  };

  // ── User Profile ──────────────────────────────────────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    for ((_key, profile) in profiles.entries()) {
      if (profile.principal == caller.toText()) {
        return ?profile;
      };
    };
    profiles.get(caller.toText());
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let key = if (profile.email.isEmpty()) { caller.toText() } else { profile.email };
    profiles.add(key, { profile with principal = caller.toText() });
  };

  // ── Persisted Save Profile ──────────────
  // Open to all callers including guests because it is used during the
  // registration flow before a role has been assigned.
  public shared ({ caller }) func saveProfile(
    displayName : Text,
    phoneNumber : Text,
    identityAnchor : Nat,
    email : Text,
    password : Text,
    emailVerified : Bool,
  ) : async () {
    let existing = profiles.get(email);
    let verified = switch (existing) {
      case null { false };
      case (?p) { p.phoneVerified };
    };
    let regTs = switch (existing) {
      case null { Time.now() };
      case (?p) {
        if (p.registrationTimestamp == 0) { Time.now() } else { p.registrationTimestamp };
      };
    };
    let lastLogin = switch (existing) {
      case null { 0 };
      case (?p) { p.lastLoginTimestamp };
    };
    let devType = switch (existing) {
      case null { "" };
      case (?p) { p.deviceType };
    };

    profiles.add(
      email,
      {
        principal = caller.toText();
        displayName;
        phoneNumber;
        phoneVerified = verified;
        identityAnchor;
        email;
        password;
        emailVerified;
        registrationTimestamp = regTs;
        lastLoginTimestamp = lastLogin;
        deviceType = devType;
      },
    );
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    for ((_key, profile) in profiles.entries()) {
      if (profile.principal == user.toText()) {
        return ?profile;
      };
    };
    profiles.get(user.toText());
  };

  // ── Any-ID Record Login ─────────────────
  public shared ({ caller }) func recordLogin(deviceType : DeviceType) : async () {
    let now = Time.now();
    var foundKey : ?Text = null;
    var foundProfile : ?UserProfile = null;
    for ((key, profile) in profiles.entries()) {
      if (profile.principal == caller.toText()) {
        foundKey := ?key;
        foundProfile := ?profile;
      };
    };

    switch (foundKey, foundProfile) {
      case (?key, ?profile) {
        profiles.add(
          key,
          {
            principal = profile.principal;
            displayName = profile.displayName;
            phoneNumber = profile.phoneNumber;
            phoneVerified = profile.phoneVerified;
            identityAnchor = profile.identityAnchor;
            email = profile.email;
            password = profile.password;
            emailVerified = profile.emailVerified;
            registrationTimestamp = profile.registrationTimestamp;
            lastLoginTimestamp = now;
            deviceType = deviceType;
          },
        );
      };
      case _ {
        let existing = profiles.get(caller.toText());
        switch (existing) {
          case (null) {
            profiles.add(
              caller.toText(),
              {
                principal = caller.toText();
                displayName = "";
                phoneNumber = "";
                phoneVerified = false;
                identityAnchor = 0;
                email = "";
                password = "";
                emailVerified = false;
                registrationTimestamp = 0;
                lastLoginTimestamp = now;
                deviceType = deviceType;
              },
            );
          };
          case (?profile) {
            profiles.add(
              caller.toText(),
              {
                principal = profile.principal;
                displayName = profile.displayName;
                phoneNumber = profile.phoneNumber;
                phoneVerified = profile.phoneVerified;
                identityAnchor = profile.identityAnchor;
                email = profile.email;
                password = profile.password;
                emailVerified = profile.emailVerified;
                registrationTimestamp = profile.registrationTimestamp;
                lastLoginTimestamp = now;
                deviceType = deviceType;
              },
            );
          };
        };
      };
    };
  };

  // ── Email-Based Record Login ────────────
  // Open to all callers: email/password sessions may be anonymous principals.
  public shared ({ caller }) func recordLoginByEmail(email : Text, deviceType : Text) : async () {
    let now = Time.now();
    let existing = profiles.get(email);

    switch (existing) {
      case (null) {
        profiles.add(
          email,
          {
            principal = caller.toText();
            displayName = "";
            phoneNumber = "";
            phoneVerified = false;
            identityAnchor = 0;
            email = email;
            password = "";
            emailVerified = false;
            registrationTimestamp = 0;
            lastLoginTimestamp = now;
            deviceType = deviceType;
          },
        );
      };
      case (?profile) {
        profiles.add(
          email,
          {
            principal = profile.principal;
            displayName = profile.displayName;
            phoneNumber = profile.phoneNumber;
            phoneVerified = profile.phoneVerified;
            identityAnchor = profile.identityAnchor;
            email = profile.email;
            password = profile.password;
            emailVerified = profile.emailVerified;
            registrationTimestamp = profile.registrationTimestamp;
            lastLoginTimestamp = now;
            deviceType = deviceType;
          },
        );
      };
    };
  };

  // ── Money Request ────────────────────────────────────────────────────────
  //
  // submitMoneyRequest is open to all callers (including guests/anonymous principals)
  // because users authenticated via phone OTP or email/password sessions may not
  // have an Internet Identity principal. The requester is resolved as follows:
  //   1. If the caller is a non-anonymous authenticated II principal, use it directly.
  //   2. Otherwise, if a non-empty email is provided, look up the profile by email
  //      and use that profile's stored principal as the requester.
  //   3. If neither condition is met, trap with a descriptive error.
  public shared ({ caller }) func submitMoneyRequest(
    reason : Text,
    bank : Text,
    accountNumber : Text,
    accountName : Text,
    amountNeeded : Nat,
    email : Text,
  ) : async Text {
    if (not accountNumber.isEmpty() and not isValidAccountNumber(accountNumber)) {
      Runtime.trap("Invalid account number: must be exactly 10 digits");
    };

    // Determine the effective requester principal.
    // An anonymous principal has the text representation "2vxsx-fae".
    let callerIsAnonymous = caller.isAnonymous();

    let requesterPrincipal : Principal = if (not callerIsAnonymous) {
      // Authenticated II caller — use directly.
      caller
    } else if (not email.isEmpty()) {
      // Anonymous caller with an email — look up the stored profile.
      switch (profiles.get(email)) {
        case null {
          Runtime.trap("No profile found for the provided email. Please register first.");
        };
        case (?profile) {
          Principal.fromText(profile.principal);
        };
      };
    } else {
      Runtime.trap("Cannot submit a money request: no authenticated principal and no email provided.");
    };

    let moneyRequestId = Time.now().toText();

    let moneyRequest : MoneyRequest = {
      id = moneyRequestId;
      requester = requesterPrincipal;
      reason;
      bank;
      accountNumber;
      accountName;
      timestamp = Time.now();
      status = #pending;
      amountNeeded;
      requesterEmail = if (email.isEmpty()) { null } else { ?email };
    };

    moneyRequests.add(moneyRequestId, moneyRequest);
    moneyRequestId;
  };

  public query ({ caller }) func getUserMoneyRequests(user : Principal) : async [MoneyRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view money requests");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own money requests");
    };

    moneyRequests.values().toArray().filter(func(request) { request.requester == user });
  };

  public query ({ caller }) func adminGetAllMoneyRequests() : async [MoneyRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can access all money requests");
    };

    moneyRequests.values().toArray();
  };

  public shared ({ caller }) func adminFulfillMoneyRequest(requestId : MoneyRequestId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can fulfill money requests");
    };

    switch (moneyRequests.get(requestId)) {
      case null { Runtime.trap("Money request not found") };
      case (?request) {
        if (request.status == #fulfilled) {
          Runtime.trap("Money request already fulfilled");
        };

        let updatedRequest : MoneyRequest = {
          id = request.id;
          requester = request.requester;
          reason = request.reason;
          bank = request.bank;
          accountNumber = request.accountNumber;
          accountName = request.accountName;
          timestamp = request.timestamp;
          status = #fulfilled;
          amountNeeded = request.amountNeeded;
          requesterEmail = request.requesterEmail;
        };
        moneyRequests.add(requestId, updatedRequest);
      };
    };
    true;
  };

  // ── Admin APIs ────────────────────────────────────────────────────────────

  // adminLogin is intentionally open: it is the authentication entry point.
  public shared func adminLogin(email : Text, password : Text) : async Bool {
    email == adminEmail and password == adminPassword;
  };

  // Token-based admin endpoint: accepts the shared secret 'ADMIN_SECRET'.
  public query func adminGetAllProfiles(token : Text) : async [UserProfile] {
    if (token != adminAuthSecret) {
      Runtime.trap("Unauthorized: Invalid admin token");
    };
    profiles.values().toArray();
  };

  // Caller-principal-based admin endpoint for use when the caller has the admin role.
  public query ({ caller }) func adminGetAllProfilesAsAdmin() : async [UserProfile] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can access all profiles");
    };
    profiles.values().toArray();
  };

  public query ({ caller }) func adminGetAllTransactions() : async [Transaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can access all transactions");
    };
    let allTxs = List.empty<Transaction>();
    for ((_, txList) in transactionMap.entries()) {
      allTxs.addAll(txList.values());
    };
    allTxs.toArray();
  };

  public shared ({ caller }) func adminApproveTransaction(transactionId : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can approve transactions");
    };
    var found = false;
    for ((user, txList) in transactionMap.entries()) {
      let updated = List.empty<Transaction>();
      for (tx in txList.values()) {
        if (tx.id == transactionId) {
          found := true;
          updated.add({
            id = tx.id;
            sender = tx.sender;
            amount = tx.amount;
            status = #completed;
            timestamp = tx.timestamp;
            recipientAccountNumber = tx.recipientAccountNumber;
            recipientBank = tx.recipientBank;
            recipientAccountName = tx.recipientAccountName;
            narration = tx.narration;
            paystackReference = tx.paystackReference;
            paystackStatus = tx.paystackStatus;
          });
        } else {
          updated.add(tx);
        };
      };
      transactionMap.add(user, updated);
    };
    if (not found) {
      Runtime.trap("Transaction not found");
    };
    true;
  };

  public shared ({ caller }) func adminSendMoneyOnBehalf(
    recipientBank : BankName,
    accountNumber : AccountNumber,
    accountName : Text,
    amount : Nat,
    narration : Text,
  ) : async Transaction {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can send money on behalf");
    };
    if (not isValidAccountNumber(accountNumber)) {
      Runtime.trap("Invalid account number: must be exactly 10 digits");
    };
    if (amount == 0) {
      Runtime.trap("Amount must be positive");
    };

    let now = Time.now();
    let tx : Transaction = {
      id = generateTxId(caller, now);
      sender = caller;
      amount = amount;
      status = #completed;
      timestamp = now;
      recipientAccountNumber = accountNumber;
      recipientBank = recipientBank;
      recipientAccountName = accountName;
      narration = narration;
      paystackReference = "simulated";
      paystackStatus = "mocked";
    };

    let existing = switch (transactionMap.get(caller)) {
      case null { List.empty<Transaction>() };
      case (?lst) { lst };
    };
    existing.add(tx);
    transactionMap.add(caller, existing);
    tx;
  };

  // ── Registration ──────────────────────────────────────────────────────────
  // Registration is intentionally open to all callers (including guests)
  // because a new user has no role yet when they first register.
  public shared ({ caller }) func registerUserProfile(
    displayName : Text,
    phoneNumber : Text,
    identityAnchor : Nat,
    email : Text,
    password : Text,
    deviceType : Text,
  ) : async () {
    if (displayName.isEmpty() or email.isEmpty() or password.isEmpty()) {
      Runtime.trap("Missing required fields");
    };
    if (not phoneNumber.isEmpty() and not isValidNigerianPhone(phoneNumber)) {
      Runtime.trap("Invalid phone number");
    };

    let userProfile : UserProfile = {
      principal = caller.toText();
      displayName;
      phoneNumber;
      phoneVerified = (not phoneNumber.isEmpty());
      identityAnchor;
      email;
      password;
      emailVerified = true;
      registrationTimestamp = Time.now();
      lastLoginTimestamp = Time.now();
      deviceType;
    };
    profiles.add(email, userProfile);
  };
};
