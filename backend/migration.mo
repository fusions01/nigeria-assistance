import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type Timestamp = Int;
  type MoneyRequestId = Text;
  type AccountNumber = Text;
  type BankName = Text;
  type MoneyRequestStatus = { #pending; #fulfilled };

  type OldMoneyRequest = {
    id : MoneyRequestId;
    requester : Principal;
    reason : Text;
    bank : BankName;
    accountNumber : AccountNumber;
    accountName : Text;
    timestamp : Timestamp;
    status : MoneyRequestStatus;
    amountNeeded : Nat;
  };

  type NewMoneyRequest = {
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

  type OldActor = {
    moneyRequests : Map.Map<MoneyRequestId, OldMoneyRequest>;
  };

  type NewActor = {
    moneyRequests : Map.Map<MoneyRequestId, NewMoneyRequest>;
  };

  public func run(old : OldActor) : NewActor {
    let newMoneyRequests = old.moneyRequests.map<MoneyRequestId, OldMoneyRequest, NewMoneyRequest>(
      func(_id, oldRequest) {
        { oldRequest with requesterEmail = null };
      }
    );
    { moneyRequests = newMoneyRequests };
  };
};
